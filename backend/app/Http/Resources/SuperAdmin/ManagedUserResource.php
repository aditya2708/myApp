<?php

namespace App\Http\Resources\SuperAdmin;

use App\Models\User;
use Illuminate\Http\Resources\Json\JsonResource;

class ManagedUserResource extends JsonResource
{
    public static $wrap = null;

    public function toArray($request): array
    {
        return [
            'id_users' => $this->id_users,
            'username' => $this->username,
            'email' => $this->email,
            'level' => $this->level,
            'status' => $this->status,
            'token_api' => $this->token_api,
            'roles' => $this->whenLoaded('roles', function () {
                return $this->roles->map(function ($role) {
                    return [
                        'slug' => $role->slug,
                        'name' => $role->name,
                        'scope_type' => $role->pivot?->scope_type,
                        'scope_id' => $role->pivot?->scope_id,
                    ];
                });
            }),
            'profile' => $this->resolveProfilePayload(),
            'role_profiles' => [
                User::ROLE_ADMIN_PUSAT => $this->whenLoaded('adminPusat', fn () => $this->adminPusat?->toArray()),
                User::ROLE_ADMIN_CABANG => $this->whenLoaded('adminCabang', fn () => $this->adminCabang?->toArray()),
                User::ROLE_ADMIN_SHELTER => $this->whenLoaded('adminShelter', fn () => $this->adminShelter?->toArray()),
            ],
            'created_at' => optional($this->created_at)->toIso8601String(),
            'updated_at' => optional($this->updated_at)->toIso8601String(),
        ];
    }

    protected function resolveProfilePayload(): ?array
    {
        return match ($this->level) {
            User::ROLE_SUPER_ADMIN => [
                'display_name' => $this->username,
                'email' => $this->email,
                'scope' => User::ROLE_SUPER_ADMIN,
            ],
            User::ROLE_ADMIN_PUSAT => $this->whenLoaded('adminPusat', fn () => $this->adminPusat?->toArray()),
            User::ROLE_ADMIN_CABANG => $this->whenLoaded('adminCabang', fn () => $this->adminCabang?->toArray()),
            User::ROLE_ADMIN_SHELTER => $this->whenLoaded('adminShelter', fn () => $this->adminShelter?->toArray()),
            User::ROLE_DONATUR => $this->whenLoaded('donatur', fn () => $this->donatur?->toArray()),
            default => null,
        };
    }
}
