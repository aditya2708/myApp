<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\UpdateUserRoleRequest;
use App\Http\Resources\SuperAdmin\ManagedUserResource;
use App\Models\Kacab;
use App\Models\Role;
use App\Models\Shelter;
use App\Models\User;
use App\Models\Wilbin;
use App\Services\UserRoleAssignmentService;
use App\Support\SsoContext;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class UserManagementController extends Controller
{
    public function __construct(
        private readonly UserRoleAssignmentService $roleAssignment
    ) {
    }

    public function index(Request $request, SsoContext $sso)
    {
        $query = User::query()
            ->with(['roles', 'adminPusat', 'adminCabang', 'adminShelter', 'donatur'])
            ->whereNotNull('token_api');

        if ($company = $sso->company()) {
            $query->whereHas('companyUsers', function ($q) use ($company) {
                $q->where('company_id', $company->id);
            });
        }

        if ($search = trim((string) $request->get('search'))) {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('token_api', 'like', "%{$search}%");
            });
        }

        if ($level = $request->get('level')) {
            $query->where('level', $level);
        }

        $perPage = (int) $request->get('per_page', 15);
        $perPage = max(5, min(50, $perPage));

        $users = $query
            ->orderByDesc('updated_at')
            ->paginate($perPage);

        return ManagedUserResource::collection($users);
    }

    public function show(User $user, SsoContext $sso)
    {
        if ($sso->company() && !$user->companyUsers()->where('company_id', $sso->company()->id)->exists()) {
            return response()->json(['message' => 'User not found in this company.'], 404);
        }

        $user->loadMissing(['adminPusat', 'adminCabang', 'adminShelter', 'donatur', 'roles']);

        return ManagedUserResource::make($user);
    }

    public function update(UpdateUserRoleRequest $request, User $user)
    {
        if ($request->user()?->is($user)) {
            return response()->json([
                'message' => 'You cannot change your own role or status.',
            ], 422);
        }

        $companyId = app()->bound(SsoContext::class) ? app(SsoContext::class)->company()?->id : null;

        if (!$companyId) {
            return response()->json([
                'message' => 'Company context is required to assign roles.',
            ], 422);
        }

        $payload = $request->validated();
        $rolesPayload = $request->rolesData();
        $profileData = $request->profileData();
        $primaryRole = $this->resolvePrimaryRole($payload, $rolesPayload, $user);
        $targetLevel = $primaryRole ?? Arr::get($payload, 'level', $user->level);

        if (!$targetLevel) {
            return response()->json([
                'message' => 'Minimal satu role wajib dipilih.',
            ], 422);
        }

        $user->loadMissing(['adminPusat', 'adminCabang', 'adminShelter', 'donatur']);

        if ($rolesPayload) {
            $preserveOtherRoles = count($rolesPayload) > 1;

            foreach ($rolesPayload as $entry) {
                $slug = $entry['slug'] ?? null;

                if (!$slug || !$this->requiresProfileSync($slug)) {
                    continue;
                }

                $this->roleAssignment->ensureRequiredProfileData($user, $slug, $profileData);
                $this->roleAssignment->syncProfile($user, $slug, $profileData, [
                    'preserve_other_roles' => $preserveOtherRoles,
                ]);
            }

            $this->syncRoles($user, $rolesPayload, $targetLevel, $companyId);
            $user->level = $targetLevel ?? $user->level ?? ($rolesPayload[0]['slug'] ?? $user->level);
        } elseif (isset($payload['level'])) {
            if ($this->requiresProfileSync($targetLevel)) {
                $this->roleAssignment->ensureRequiredProfileData($user, $targetLevel, $profileData);
                $this->roleAssignment->syncProfile($user, $targetLevel, $profileData);
            }

            $user->level = $payload['level'];
        }

        if (isset($payload['status'])) {
            $user->status = $payload['status'];
        }

        $user->save();
        $this->syncCompanyMapping($user, $companyId, $targetLevel, $payload['status'] ?? null);

        $user->refresh()->load(['adminPusat', 'adminCabang', 'adminShelter', 'donatur', 'roles']);

        return ManagedUserResource::make($user)->additional([
            'message' => 'User updated successfully.',
        ]);
    }

    public function listKacab()
    {
        $kacabs = Kacab::query()
            ->select(['id_kacab', 'nama_kacab'])
            ->orderBy('nama_kacab')
            ->get()
            ->map(fn ($item) => [
                'id_kacab' => $item->id_kacab,
                'nama_kacab' => $item->nama_kacab,
            ]);

        return response()->json([
            'data' => $kacabs,
        ]);
    }

    public function listWilbinByKacab(Kacab $kacab)
    {
        $wilbins = Wilbin::query()
            ->where('id_kacab', $kacab->id_kacab)
            ->select(['id_wilbin', 'id_kacab', 'nama_wilbin'])
            ->orderBy('nama_wilbin')
            ->get();

        return response()->json([
            'data' => $wilbins,
        ]);
    }

    public function listShelterByWilbin(Wilbin $wilbin)
    {
        $shelters = Shelter::query()
            ->where('id_wilbin', $wilbin->id_wilbin)
            ->select(['id_shelter', 'id_wilbin', 'nama_shelter'])
            ->orderBy('nama_shelter')
            ->get();

        return response()->json([
            'data' => $shelters,
        ]);
    }

    protected function resolvePrimaryRole(array $payload, array $rolesPayload, User $user): ?string
    {
        $explicitLevel = Arr::get($payload, 'level');

        if ($explicitLevel) {
            return $explicitLevel;
        }

        $slugs = collect($rolesPayload)
            ->pluck('slug')
            ->filter()
            ->values();

        if ($slugs->count() === 1) {
            return $slugs->first();
        }

        if ($user->level && $slugs->contains($user->level)) {
            return $user->level;
        }

        return null;
    }

    protected function syncRoles(User $user, array $rolesPayload, string $fallbackLevel, ?int $companyId = null): void
    {
        $slugs = collect($rolesPayload)
            ->pluck('slug')
            ->filter()
            ->unique()
            ->values()
            ->all();

        if (empty($slugs)) {
            return;
        }

        $roleMap = Role::query()
            ->whereIn('slug', $slugs)
            ->get()
            ->keyBy('slug');

        $pivotData = [];

        foreach ($rolesPayload as $entry) {
            $slug = $entry['slug'] ?? null;
            $role = $slug ? $roleMap->get($slug) : null;

            if (!$role) {
                continue;
            }

            $pivotData[$role->id] = [
                'scope_type' => $entry['scope_type'] ?? null,
                'scope_id' => $entry['scope_id'] ?? null,
                'company_id' => $companyId,
            ];
        }

        if (!empty($pivotData)) {
            $user->roles()->sync($pivotData);
        }

        if ($user->level !== $fallbackLevel && in_array($fallbackLevel, $slugs, true)) {
            $user->level = $fallbackLevel;
        }
    }

    protected function requiresProfileSync(string $level): bool
    {
        return in_array($level, [
            User::ROLE_ADMIN_PUSAT,
            User::ROLE_ADMIN_CABANG,
            User::ROLE_ADMIN_SHELTER,
        ], true);
    }

    protected function syncCompanyMapping(User $user, ?int $companyId, ?string $role, ?string $status = null): void
    {
        if (!$companyId || !$role) {
            return;
        }

        $mappedStatus = $this->normalizeCompanyStatus($status);

        $mapping = $user->companyUsers()->firstOrCreate(
            [
                'company_id' => $companyId,
                'user_id' => $user->getKey(),
            ],
            [
                'role' => $role,
                'status' => $mappedStatus ?? 'active',
            ]
        );

        $changes = [];

        if ($mapping->role !== $role) {
            $changes['role'] = $role;
        }

        if ($mappedStatus && $mapping->status !== $mappedStatus) {
            $changes['status'] = $mappedStatus;
        }

        if ($changes) {
            $mapping->fill($changes)->save();
        }
    }

    protected function normalizeCompanyStatus(?string $status): ?string
    {
        if (!$status) {
            return null;
        }

        $lower = strtolower($status);

        return match ($lower) {
            'aktif', 'active' => 'active',
            'tidak aktif', 'inactive', 'nonactive' => 'inactive',
            default => null,
        };
    }
}
