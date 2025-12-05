<?php

namespace App\Services;

use App\Models\User;
use App\Support\SsoContext;
use Illuminate\Validation\ValidationException;

class UserRoleAssignmentService
{
    public function relationsForLevel(string $level): array
    {
        return match ($level) {
            User::ROLE_ADMIN_PUSAT => ['adminPusat'],
            User::ROLE_ADMIN_CABANG => ['adminCabang'],
            User::ROLE_ADMIN_SHELTER => ['adminShelter'],
            default => [],
        };
    }

    public function syncProfile(User $user, string $targetLevel, array $profileData, array $options = []): void
    {
        $preserveOtherRoles = (bool) ($options['preserve_other_roles'] ?? false);

        if ($targetLevel === User::ROLE_ADMIN_PUSAT) {
            $payload = $this->extractProfilePayload($profileData, ['nama_lengkap', 'alamat', 'no_hp']);
            $payload['company_id'] = $this->currentCompanyId();

            $user->adminPusat()->updateOrCreate(
                ['id_users' => $user->id_users],
                $payload
            );

            if (!$preserveOtherRoles && $user->level !== User::ROLE_ADMIN_PUSAT) {
                $user->adminCabang()->delete();
                $user->adminShelter()->delete();
            }

            return;
        }

        if ($targetLevel === User::ROLE_ADMIN_CABANG) {
            $payload = $this->extractProfilePayload($profileData, ['id_kacab', 'nama_lengkap', 'alamat', 'no_hp']);
            $payload['company_id'] = $this->currentCompanyId();

            $user->adminCabang()->updateOrCreate(
                ['user_id' => $user->id_users],
                $payload
            );

            if (!$preserveOtherRoles && $user->level !== User::ROLE_ADMIN_CABANG) {
                $user->adminPusat()->delete();
                $user->adminShelter()->delete();
            }

            return;
        }

        if ($targetLevel === User::ROLE_ADMIN_SHELTER) {
            $payload = $this->extractProfilePayload($profileData, ['id_kacab', 'id_wilbin', 'id_shelter', 'nama_lengkap', 'no_hp']);
            $payload['company_id'] = $this->currentCompanyId();

            if (array_key_exists('alamat', $profileData)) {
                $payload['alamat_adm'] = $profileData['alamat'];
            }

            $user->adminShelter()->updateOrCreate(
                ['user_id' => $user->id_users],
                $payload
            );

            if (!$preserveOtherRoles && $user->level !== User::ROLE_ADMIN_SHELTER) {
                $user->adminPusat()->delete();
                $user->adminCabang()->delete();
            }
        }
    }

    public function ensureRequiredProfileData(
        User $user,
        string $targetLevel,
        array $profileData,
        array $options = []
    ): void {
        $messageOverrides = $options['messages'] ?? [];
        $enforceProfileFields = $options['enforce_profile_fields'] ?? true;

        if ($targetLevel === User::ROLE_ADMIN_PUSAT) {
            $existing = $user->adminPusat;

            $namaLengkap = array_key_exists('nama_lengkap', $profileData)
                ? $profileData['nama_lengkap']
                : $existing?->nama_lengkap;
            $alamat = array_key_exists('alamat', $profileData)
                ? $profileData['alamat']
                : $existing?->alamat;
            $noHp = array_key_exists('no_hp', $profileData)
                ? $profileData['no_hp']
                : $existing?->no_hp;

            $messages = [];

            if ($enforceProfileFields && $this->isBlank($namaLengkap)) {
                $messages['nama_lengkap'] = $messageOverrides['nama_lengkap'] ?? __('Nama lengkap wajib diisi.');
            }

            if ($enforceProfileFields && $this->isBlank($alamat)) {
                $messages['alamat'] = $messageOverrides['alamat'] ?? __('Alamat wajib diisi.');
            }

            if ($enforceProfileFields && $this->isBlank($noHp)) {
                $messages['no_hp'] = $messageOverrides['no_hp'] ?? __('Nomor HP wajib diisi.');
            }

            if (!empty($messages)) {
                throw ValidationException::withMessages($messages);
            }

            return;
        }

        if ($targetLevel === User::ROLE_ADMIN_CABANG) {
            $existing = $user->adminCabang;

            $idKacab = array_key_exists('id_kacab', $profileData)
                ? $profileData['id_kacab']
                : $existing?->id_kacab;
            $namaLengkap = array_key_exists('nama_lengkap', $profileData)
                ? $profileData['nama_lengkap']
                : $existing?->nama_lengkap;
            $alamat = array_key_exists('alamat', $profileData)
                ? $profileData['alamat']
                : $existing?->alamat;
            $noHp = array_key_exists('no_hp', $profileData)
                ? $profileData['no_hp']
                : $existing?->no_hp;

            $messages = [];

            if ($idKacab === null) {
                $messages['id_kacab'] = $messageOverrides['id_kacab'] ?? __('Cabang wajib dipilih.');
            }

            if ($enforceProfileFields && $this->isBlank($namaLengkap)) {
                $messages['nama_lengkap'] = $messageOverrides['nama_lengkap'] ?? __('Nama lengkap wajib diisi.');
            }

            if ($enforceProfileFields && $this->isBlank($alamat)) {
                $messages['alamat'] = $messageOverrides['alamat'] ?? __('Alamat wajib diisi.');
            }

            if ($enforceProfileFields && $this->isBlank($noHp)) {
                $messages['no_hp'] = $messageOverrides['no_hp'] ?? __('Nomor HP wajib diisi.');
            }

            if (!empty($messages)) {
                throw ValidationException::withMessages($messages);
            }

            return;
        }

        if ($targetLevel === User::ROLE_ADMIN_SHELTER) {
            $existing = $user->adminShelter;

            $idKacab = array_key_exists('id_kacab', $profileData)
                ? $profileData['id_kacab']
                : $existing?->id_kacab;
            $idWilbin = array_key_exists('id_wilbin', $profileData)
                ? $profileData['id_wilbin']
                : $existing?->id_wilbin;
            $idShelter = array_key_exists('id_shelter', $profileData)
                ? $profileData['id_shelter']
                : $existing?->id_shelter;
            $namaLengkap = array_key_exists('nama_lengkap', $profileData)
                ? $profileData['nama_lengkap']
                : $existing?->nama_lengkap;
            $alamat = array_key_exists('alamat', $profileData)
                ? $profileData['alamat']
                : $existing?->alamat_adm;
            $noHp = array_key_exists('no_hp', $profileData)
                ? $profileData['no_hp']
                : $existing?->no_hp;

            $messages = [];

            if ($idKacab === null) {
                $messages['id_kacab'] = $messageOverrides['id_kacab'] ?? __('Cabang wajib dipilih.');
            }

            if ($idWilbin === null) {
                $messages['id_wilbin'] = $messageOverrides['id_wilbin'] ?? __('Wilayah binaan wajib dipilih.');
            }

            if ($idShelter === null) {
                $messages['id_shelter'] = $messageOverrides['id_shelter'] ?? __('Shelter wajib dipilih.');
            }

            if ($enforceProfileFields && $this->isBlank($namaLengkap)) {
                $messages['nama_lengkap'] = $messageOverrides['nama_lengkap'] ?? __('Nama lengkap wajib diisi.');
            }

            if ($enforceProfileFields && $this->isBlank($alamat)) {
                $messages['alamat'] = $messageOverrides['alamat'] ?? __('Alamat wajib diisi.');
            }

            if ($enforceProfileFields && $this->isBlank($noHp)) {
                $messages['no_hp'] = $messageOverrides['no_hp'] ?? __('Nomor HP wajib diisi.');
            }

            if (!empty($messages)) {
                throw ValidationException::withMessages($messages);
            }
        }
    }

    private function extractProfilePayload(array $data, array $allowedKeys): array
    {
        $payload = [];

        foreach ($allowedKeys as $key) {
            if (array_key_exists($key, $data)) {
                $payload[$key] = $data[$key];
            }
        }

        return $payload;
    }

    private function currentCompanyId(): ?int
    {
        if (!app()->bound(SsoContext::class)) {
            return null;
        }

        return app(SsoContext::class)->company()?->id;
    }

    private function isBlank($value): bool
    {
        if ($value === null) {
            return true;
        }

        if (is_string($value) && trim($value) === '') {
            return true;
        }

        return false;
    }
}
