<?php

namespace App\Http\Middleware;

use App\Models\SsoCompany;
use App\Models\SsoCompanyUser;
use App\Models\User;
use App\Services\SsoUserInfoClient;
use App\Support\SsoContext;
use Closure;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthenticateViaSSO
{
    public function __construct(
        private readonly SsoUserInfoClient $client
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractToken($request);

        if (!$token) {
            throw new UnauthorizedHttpException('Bearer', 'Authorization header missing.');
        }

        $payload = $this->client->fetch($token);
        $payload = $this->assertAppAccess($payload);
        $preselectedCompany = $this->preselectCompany($payload);
        $user = $this->resolveLocalUser($payload, $preselectedCompany);
        [$company, $role] = $this->resolveCompanyContext($user, $payload);

        // Ensure downstream code using Auth::user() gets the resolved user
        Auth::setUser($user);

        app()->instance(SsoContext::class, new SsoContext($payload, $user, $token, $company, $role));
        $request->setUserResolver(fn () => $user);
        $request->attributes->set('sso_payload', $payload);
        $request->attributes->set('sso_access_token', $token);
        $request->attributes->set('current_company', $company);
        $request->attributes->set('current_role', $role);

        return $next($request);
    }

    protected function extractToken(Request $request): ?string
    {
        $authorization = $request->header('Authorization', '');

        if (preg_match('/Bearer\s+(.*)$/i', $authorization, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    protected function resolveCompanyContext(User $user, array $payload): array
    {
        $claims = $payload['companies_allowed'] ?? [];
        $isMultiCompany = config('sso.multi_company', true);
        $defaultCompanySlug = config('sso.default_company_slug');
        $autoprovision = config('sso.company_autoprovision', false);
        $autoprovisionCompany = config('sso.company_autoprovision_company', false);
        $defaultRole = config('sso.company_default_role', User::DEFAULT_ROLE);
        $appSlug = config('sso.app_slug');
        $claimCount = is_array($claims) ? count($claims) : 0;

        if (!$isMultiCompany && $claimCount > 1) {
            $this->forbidden('company_multiple_claims', 'Multiple companies in SSO payload are not allowed for this tenant.');
        }

        if ($isMultiCompany && empty($claims)) {
            $this->forbidden('company_required', 'Company claim is required for this tenant.');
        }

        if (!$isMultiCompany && empty($claims)) {
            if (!$defaultCompanySlug) {
                $this->forbidden('company_context_missing', 'Default company is not configured.');
            }

            $company = SsoCompany::where('slug', $defaultCompanySlug)->first();

            if (!$company || !$company->is_active) {
                $this->forbidden('company_context_missing', 'Default company is missing or inactive.');
            }

            $mapping = $this->findMapping($user, $company);
            if (!$mapping) {
                if ($autoprovision) {
                    $mapping = $this->autoProvisionMapping($user, $company, $defaultRole);
                } else {
                    $this->forbidden('company_user_missing', 'User is not mapped to the default company.');
                }
            }

            if ($mapping && $this->isMappingInactive($mapping)) {
                $this->forbidden('company_user_inactive', 'User mapping to company is inactive.');
            }

            return [$company, $mapping?->role ?? $defaultRole];
        }

        $lastError = null;

        foreach ($claims as $claim) {
            $company = $this->resolveOrProvisionCompany($claim, $autoprovisionCompany);

            if (!$company) {
                $lastError = ['company_unknown', 'Company not recognized for this tenant.'];
                continue;
            }

            if (!$company->is_active) {
                $lastError = ['company_inactive', 'Company is inactive for this tenant.'];
                continue;
            }

            if (!$this->isCompanyAllowedForApp($company, $appSlug)) {
                $lastError = ['company_not_allowed_for_app', 'Company is not allowed for this application.'];
                continue;
            }

            $mapping = $this->findMapping($user, $company);
            if (!$mapping) {
                if ($autoprovision) {
                    $mapping = $this->autoProvisionMapping($user, $company, $defaultRole);
                } else {
                    $this->forbidden('company_user_missing', 'User is not mapped to the selected company.');
                }
            }

            if ($mapping && $this->isMappingInactive($mapping)) {
                $this->forbidden('company_user_inactive', 'User mapping to company is inactive.');
            }

            return [$company, $mapping?->role ?? $defaultRole];
        }

        if ($lastError) {
            [$code, $message] = $lastError;
            $this->forbidden($code, $message);
        }

        if ($isMultiCompany) {
            $this->forbidden('company_unknown', 'Company not recognized for this tenant.');
        }

        return [null, null];
    }

    protected function findCompanyFromClaim(array|string $claim): ?SsoCompany
    {
        $slug = null;
        $uuid = null;

        if (is_array($claim)) {
            $slug = $claim['slug'] ?? null;
            $uuid = $claim['uuid'] ?? null;
        } elseif (is_string($claim)) {
            $slug = $claim;
        }

        $query = SsoCompany::query();

        if ($slug) {
            $query->where('slug', $slug);
        }

        if ($uuid) {
            $query->orWhere('idp_uuid', $uuid);
        }

        return $query->first();
    }

    /**
     * Temukan atau buat company lokal berdasarkan klaim SSO (slug/uuid/name).
     */
    protected function resolveOrProvisionCompany(array|string $claim, bool $autoprovision): ?SsoCompany
    {
        $company = $this->findCompanyFromClaim($claim);

        if ($company || !$autoprovision) {
            return $company;
        }

        $slug = null;
        $uuid = null;
        $name = null;

        if (is_array($claim)) {
            $slug = $claim['slug'] ?? null;
            $uuid = $claim['uuid'] ?? null;
            $name = $claim['name'] ?? $slug;
        } elseif (is_string($claim)) {
            $slug = $claim;
            $name = $claim;
        }

        if (!$slug && !$uuid) {
            return null;
        }

        $company = SsoCompany::firstOrCreate(
            array_filter([
                'slug' => $slug,
                'idp_uuid' => $uuid,
            ]),
            [
                'slug' => $slug ?? $uuid,
                'idp_uuid' => $uuid ?? $slug,
                'name' => $name ?? $slug ?? $uuid,
                'is_active' => true,
            ]
        );

        return $company;
    }

    protected function findMapping(User $user, SsoCompany $company): ?SsoCompanyUser
    {
        return SsoCompanyUser::where('user_id', $user->getKey())
            ->where('company_id', $company->id)
            ->first();
    }

    protected function autoProvisionMapping(User $user, SsoCompany $company, string $role): ?SsoCompanyUser
    {
        try {
            $mapping = SsoCompanyUser::firstOrCreate(
                [
                    'user_id' => $user->getKey(),
                    'company_id' => $company->id,
                ],
                [
                    'role' => $role,
                    'status' => 'active',
                ]
            );

            $changes = [];

            if (!$mapping->role) {
                $changes['role'] = $role;
            }

            if ($mapping->status === null) {
                $changes['status'] = 'active';
            }

            if ($changes) {
                $mapping->fill($changes)->save();
            }

            return $mapping;
        } catch (\Throwable $exception) {
            $existing = $this->findMapping($user, $company) ?? $this->findAnyMappingByUser($user);

            if ($existing && (!$existing->company_id || $existing->company_id !== $company->id)) {
                $existing->company_id = $company->id;
                $existing->role = $existing->role ?: $role;
                $existing->status = $existing->status ?: 'active';

                try {
                    $existing->save();
                } catch (\Throwable $inner) {
                    // ignore and continue to forbidden below
                }
            }

            if ($existing) {
                return $existing;
            }

            Log::warning('SSO company auto-provision failed', [
                'user_id' => $user->getKey(),
                'company_id' => $company->id,
                'company_slug' => $company->slug,
                'role' => $role,
                'error' => $exception->getMessage(),
            ]);

            $this->forbidden('company_autoprovision_failed', 'Auto-provisioning company mapping failed.');
        }
    }

    protected function findAnyMappingByUser(User $user): ?SsoCompanyUser
    {
        return SsoCompanyUser::where('user_id', $user->getKey())->first();
    }

    protected function isMappingInactive(?SsoCompanyUser $mapping): bool
    {
        if (!$mapping) {
            return false;
        }

        if ($mapping->status === null) {
            return false;
        }

        return strtolower((string) $mapping->status) !== 'active';
    }

    protected function isCompanyAllowedForApp(SsoCompany $company, ?string $appSlug): bool
    {
        // Placeholder for app-company binding if needed.
        return true;
    }

    protected function forbidden(string $code, string $message): never
    {
        throw new HttpResponseException(
            response()->json(['error' => $code, 'message' => $message], Response::HTTP_FORBIDDEN)
        );
    }

    protected function resolveLocalUser(array $payload, ?SsoCompany $preferredCompany = null): User
    {
        /** @var User $user */
        $attributes = [
            'username' => $payload['name'] ?? $payload['email'] ?? 'sso-user-'.$payload['sub'],
            'email' => $payload['email'] ?? 'sso-user-'.$payload['sub'].'@example.com',
            'password' => Hash::make(Str::random(32)),
            'level' => User::DEFAULT_ROLE,
            'status' => 'Aktif',
            'token' => null,
        ];

        if ($preferredCompany && Schema::hasColumn('users', 'company_id')) {
            $attributes['company_id'] = $preferredCompany->id;
        }

        $user = User::firstOrCreate(
            ['token_api' => (string) $payload['sub']],
            $attributes
        );

        $updates = [];

        if (isset($payload['email']) && $payload['email'] !== $user->email) {
            $updates['email'] = $payload['email'];
        }

        if (isset($payload['name']) && $payload['name'] !== $user->username) {
            $updates['username'] = $payload['name'];
        }

        if ($preferredCompany && Schema::hasColumn('users', 'company_id') && !$user->company_id) {
            $updates['company_id'] = $preferredCompany->id;
        }

        if ($updates) {
            $user->fill($updates)->save();
        }

        return $user;
    }

    protected function preselectCompany(array $payload): ?SsoCompany
    {
        $claims = $payload['companies_allowed'] ?? [];
        $isMultiCompany = config('sso.multi_company', true);
        $defaultCompanySlug = config('sso.default_company_slug');
        $appSlug = config('sso.app_slug');

        if (!$isMultiCompany && empty($claims) && $defaultCompanySlug) {
            $company = SsoCompany::where('slug', $defaultCompanySlug)->first();
            return $company && $company->is_active ? $company : null;
        }

        foreach ($claims as $claim) {
            $company = $this->findCompanyFromClaim($claim);

            if (!$company) {
                continue;
            }

            if (!$company->is_active) {
                continue;
            }

            if (!$this->isCompanyAllowedForApp($company, $appSlug)) {
                continue;
            }

            return $company;
        }

        return null;
    }

    /**
     * Ensure the SSO payload allows this tenant application.
     */
    protected function assertAppAccess(array $payload): array
    {
        $appSlug = config('sso.app_slug');

        if (!$appSlug) {
            return $payload;
        }

        $appsAllowed = $payload['apps_allowed'] ?? null;

        if (!is_array($appsAllowed)) {
            throw new UnauthorizedHttpException('Bearer', 'apps_allowed missing from SSO payload.');
        }

        if (!in_array($appSlug, $appsAllowed, true)) {
            throw new UnauthorizedHttpException('Bearer', 'This account is not allowed to access this app.');
        }

        return $payload;
    }
}
