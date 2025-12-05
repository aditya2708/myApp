<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RoleActivityLog;
use App\Support\SsoContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SsoProfileController extends Controller
{
    public function __invoke(Request $request, SsoContext $context): JsonResponse
    {
        $user = $context->user;
        $user->loadMissing('roles');
        $payload = $context->raw();
        $currentCompany = $context->company();
        $currentCompanyRole = $context->role();
        $currentRole = $this->resolveCurrentRole($request, $user);
        $this->logRoleActivity($request, $user, $currentRole, $currentCompany?->id);

        return response()->json([
            'user' => [
                'id' => $user->id_users,
                'username' => $user->username,
                'email' => $user->email,
                'level' => $user->level,
                'status' => $user->status,
                'roles' => $user->availableRoles(),
                'current_role' => $currentRole,
            ],
            'roles' => $user->availableRoles(),
            'current_role' => $currentRole,
            'sso_profile' => [
                'sub' => $payload['sub'] ?? null,
                'email' => $payload['email'] ?? null,
                'name' => $payload['name'] ?? $user->username,
                'apps_allowed' => $payload['apps_allowed'] ?? [],
                'exp' => $payload['exp'] ?? null,
                'companies_allowed' => $payload['companies_allowed'] ?? [],
            ],
            'current_company' => $currentCompany ? [
                'id' => $currentCompany->id,
                'slug' => $currentCompany->slug,
                'name' => $currentCompany->name,
            ] : null,
            'current_company_role' => $currentCompanyRole,
            'token' => [
                'access_token' => $context->token(),
            ],
        ]);
    }

    protected function resolveCurrentRole(Request $request, User $user): ?array
    {
        $headerRole = $request->header('X-Current-Role');
        $scopeType = $request->header('X-Current-Scope-Type');
        $scopeIdHeader = $request->header('X-Current-Scope-Id');
        $scopeId = is_numeric($scopeIdHeader) ? (int) $scopeIdHeader : null;
        $attributeRole = $request->attributes->get('current_role');
        $availableRoles = $user->availableRoles();

        if (is_array($attributeRole)) {
            return $attributeRole;
        }

        if ($headerRole && $user->hasRole($headerRole, $scopeType, $scopeId)) {
            return [
                'slug' => $headerRole,
                'scope_type' => $scopeType,
                'scope_id' => $scopeId,
            ];
        }

        if (count($availableRoles) === 1) {
            return $availableRoles[0];
        }

        if (empty($availableRoles)) {
            return [
                'slug' => $user->level,
                'scope_type' => null,
                'scope_id' => null,
            ];
        }

        return null;
    }

    protected function logRoleActivity(Request $request, User $user, ?array $currentRole, ?int $companyId): void
    {
        if (!$currentRole) {
            return;
        }

        $slug = $currentRole['slug'] ?? null;

        if (!$slug) {
            return;
        }

        try {
            RoleActivityLog::create([
                'user_id' => $user->id_users,
                'company_id' => $companyId,
                'role_slug' => $slug,
                'scope_type' => $currentRole['scope_type'] ?? null,
                'scope_id' => $currentRole['scope_id'] ?? null,
                'action' => 'switch',
                'ip_address' => $request->ip(),
                'user_agent' => (string) $request->header('User-Agent'),
            ]);
        } catch (\Throwable $exception) {
            Log::debug('RoleActivityLog failed', ['error' => $exception->getMessage()]);
        }
    }
}
