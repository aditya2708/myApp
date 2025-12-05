<?php

namespace App\Http\Requests\SuperAdmin;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class UpdateUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'level' => ['sometimes', Rule::in(User::manageableRoles())],
            'roles' => ['sometimes', 'array'],
            'roles.*.slug' => ['required_with:roles', Rule::in(User::manageableRoles())],
            'roles.*.scope_type' => ['sometimes', 'nullable', 'string', 'max:50'],
            'roles.*.scope_id' => ['sometimes', 'nullable', 'integer'],
            'status' => ['sometimes', 'string', Rule::in(['Aktif', 'Tidak Aktif'])],
            'profile' => ['sometimes', 'array'],
            'profile.nama_lengkap' => ['sometimes', 'nullable', 'string', 'max:255'],
            'profile.alamat' => ['sometimes', 'nullable', 'string', 'max:500'],
            'profile.no_hp' => ['sometimes', 'nullable', 'string', 'max:20'],
            'profile.id_kacab' => ['sometimes', 'nullable', 'integer', 'exists:kacab,id_kacab'],
            'profile.id_wilbin' => ['sometimes', 'nullable', 'integer', 'exists:wilbin,id_wilbin'],
            'profile.id_shelter' => ['sometimes', 'nullable', 'integer', 'exists:shelter,id_shelter'],
        ];
    }

    public function validated($key = null, $default = null)
    {
        $data = parent::validated($key, $default);

        if (isset($data['status'])) {
            $data['status'] = $data['status'] === 'Aktif' ? 'Aktif' : 'Tidak Aktif';
        }

        return $data;
    }

    public function rolesData(): array
    {
        $roles = $this->validated()['roles'] ?? [];

        if (!is_array($roles)) {
            return [];
        }

        $normalized = [];

        foreach ($roles as $role) {
            $slug = $role['slug'] ?? null;

            if (!$slug) {
                continue;
            }

            $normalized[] = [
                'slug' => $slug,
                'scope_type' => $role['scope_type'] ?? null,
                'scope_id' => $role['scope_id'] ?? null,
            ];
        }

        return $normalized;
    }

    public function profileData(): array
    {
        $profile = Arr::get($this->validated(), 'profile', []);

        if (!is_array($profile)) {
            return [];
        }

        return Arr::only($profile, [
            'nama_lengkap',
            'alamat',
            'no_hp',
            'id_kacab',
            'id_wilbin',
            'id_shelter',
        ]);
    }
}
