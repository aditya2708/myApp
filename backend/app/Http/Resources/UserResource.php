<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * UserResource
 *
 * Catatan:
 * - Model User pada proyek ini menggunakan primary key kustom: id_users
 * - Relasi yang diharapkan: adminPusat, adminCabang, adminShelter (nama method pada Model User)
 * - Resource ini fokus mengembalikan informasi akun + ringkasan profil sesuai level.
 * - Detail entity lain (Kacab/Wilbin/Shelter) akan disediakan oleh resource masing-masing.
 */
class UserResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        $base = [
            'id_users'   => $this->id_users,
            'username'   => $this->username,
            'email'      => $this->email,
            'level'      => $this->level,
            'status'     => $this->status,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];

        $adminPusat = $this->whenLoaded('adminPusat', function () {
            return [
                'id_admin_pusat' => $this->adminPusat->id_admin_pusat ?? null,
                'user_id'        => $this->adminPusat->user_id ?? null,
                'nama_lengkap'   => $this->adminPusat->nama_lengkap ?? null,
                'alamat'         => $this->adminPusat->alamat ?? ($this->adminPusat->alamat_adm ?? null),
                'no_hp'          => $this->adminPusat->no_hp ?? null,
                'foto'           => $this->adminPusat->foto ?? null,
            ];
        });

        $adminCabang = $this->whenLoaded('adminCabang', function () {
            return [
                'id_admin_cabang' => $this->adminCabang->id_admin_cabang ?? null,
                'user_id'         => $this->adminCabang->user_id ?? null,
                'id_kacab'        => $this->adminCabang->id_kacab ?? null,
                'nama_lengkap'    => $this->adminCabang->nama_lengkap ?? null,
                'alamat'          => $this->adminCabang->alamat ?? ($this->adminCabang->alamat_adm ?? null),
                'no_hp'           => $this->adminCabang->no_hp ?? null,
                'foto'            => $this->adminCabang->foto ?? null,
            ];
        });

        $adminShelter = $this->whenLoaded('adminShelter', function () {
            return [
                'id_admin_shelter' => $this->adminShelter->id_admin_shelter ?? null,
                'user_id'          => $this->adminShelter->user_id ?? null,
                'id_kacab'         => $this->adminShelter->id_kacab ?? null,
                'id_wilbin'        => $this->adminShelter->id_wilbin ?? null,
                'id_shelter'       => $this->adminShelter->id_shelter ?? null,
                'nama_lengkap'     => $this->adminShelter->nama_lengkap ?? null,
                'alamat'           => $this->adminShelter->alamat ?? ($this->adminShelter->alamat_adm ?? null),
                'no_hp'            => $this->adminShelter->no_hp ?? null,
                'foto'             => $this->adminShelter->foto ?? null,
            ];
        });

        return array_filter([
            'user'          => $base,
            'admin_pusat'   => $adminPusat,
            'admin_cabang'  => $adminCabang,
            'admin_shelter' => $adminShelter,
        ], function ($v) { return $v !== null && $v !== []; });
    }
}
