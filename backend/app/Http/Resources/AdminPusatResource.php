<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * Single-file resources to keep API responses consistent
 * while minimizing file count for ChatGPT project context.
 */

/**
 * Base user representation
 */
class UserBaseResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id_users' => $this->id_users,
            'username' => $this->username,
            'email'    => $this->email,
            'level'    => $this->level,
            'status'   => $this->status,
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }
}

/**
 * Profile resources per role (kept lightweight, no DB calls)
 */
class AdminPusatProfileResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this) return null;
        return [
            'id_admin_pusat' => $this->id_admin_pusat,
            'id_users'       => $this->id_users,
            'nama_lengkap'   => $this->nama_lengkap,
            'alamat'         => $this->alamat,
            'no_hp'          => $this->no_hp,
            'foto'           => $this->foto,
            'created_at'     => optional($this->created_at)->toISOString(),
            'updated_at'     => optional($this->updated_at)->toISOString(),
        ];
    }
}

class AdminCabangProfileResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this) return null;
        return [
            'id_admin_cabang' => $this->id_admin_cabang,
            'user_id'         => $this->user_id,
            'id_kacab'        => $this->id_kacab,
            'nama_lengkap'    => $this->nama_lengkap,
            'alamat'          => $this->alamat,
            'no_hp'           => $this->no_hp,
            'foto'            => $this->foto,
            'created_at'      => optional($this->created_at)->toISOString(),
            'updated_at'      => optional($this->updated_at)->toISOString(),
        ];
    }
}

class AdminShelterProfileResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this) return null;
        return [
            'id_admin_shelter' => $this->id_admin_shelter,
            'user_id'          => $this->user_id,
            'id_kacab'         => $this->id_kacab,
            'id_wilbin'        => $this->id_wilbin,
            'id_shelter'       => $this->id_shelter,
            'nama_lengkap'     => $this->nama_lengkap,
            'alamat_adm'       => $this->alamat_adm,
            'no_hp'            => $this->no_hp,
            'foto'             => $this->foto,
            'created_at'       => optional($this->created_at)->toISOString(),
            'updated_at'       => optional($this->updated_at)->toISOString(),
        ];
    }
}

class DonaturProfileResource extends JsonResource
{
    public function toArray($request)
    {
        if (!$this) return null;
        return [
            'id_donatur'    => $this->id_donatur ?? null,
            'user_id'       => $this->user_id,
            'nama_lengkap'  => $this->nama_lengkap,
            'alamat'        => $this->alamat,
            'no_hp'         => $this->no_hp,
            'foto'          => $this->foto ?? null,
            'created_at'    => optional($this->created_at)->toISOString(),
            'updated_at'    => optional($this->updated_at)->toISOString(),
        ];
    }
}

/**
 * Wrapper for user + profile pair (for list & detail)
 */
class UserWithProfileResource extends JsonResource
{
    public function toArray($request)
    {
        $user = $this['user'] ?? $this->resource['user'] ?? null;
        $profile = $this['profile'] ?? $this->resource['profile'] ?? null;
        $level = $user->level ?? null;

        // pick profile resource by level (no DB calls)
        $profileResource = null;
        if ($level === 'admin_pusat')   $profileResource = new AdminPusatProfileResource($profile);
        if ($level === 'admin_cabang')  $profileResource = new AdminCabangProfileResource($profile);
        if ($level === 'admin_shelter') $profileResource = new AdminShelterProfileResource($profile);
        if ($level === 'donatur')       $profileResource = new DonaturProfileResource($profile);

        return [
            'user'    => new UserBaseResource($user),
            'profile' => $profileResource,
        ];
    }
}

/**
 * Collection for list users (already filtered & ordered in controller)
 */
class UserWithProfileCollection extends ResourceCollection
{
    public $collects = UserWithProfileResource::class;

    public function toArray($request)
    {
        return [
            'status' => true,
            'data'   => $this->collection,
        ];
    }
}

/**
 * Login response resource
 * expects: ['user' => User, 'token' => string]
 */
class LoginResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'message' => 'Login successful',
            'user'    => new UserBaseResource($this['user']),
            'token'   => $this['token'] ?? null,
        ];
    }
}

/**
 * Create user response resource
 * expects: ['user' => User, 'profile' => Model]
 */
class CreateUserResource extends JsonResource
{
    public function toArray($request)
    {
        $user = $this['user'] ?? null;
        $profile = $this['profile'] ?? null;
        $level = $user->level ?? null;

        $profileResource = null;
        if ($level === 'admin_pusat')   $profileResource = new AdminPusatProfileResource($profile);
        if ($level === 'admin_cabang')  $profileResource = new AdminCabangProfileResource($profile);
        if ($level === 'admin_shelter') $profileResource = new AdminShelterProfileResource($profile);
        if ($level === 'donatur')       $profileResource = new DonaturProfileResource($profile);

        return [
            'status'  => true,
            'message' => 'User & profil berhasil dibuat',
            'data'    => [
                'user'    => new UserBaseResource($user),
                'profile' => $profileResource,
            ],
        ];
    }
}

/**
 * Dashboard response resource
 * expects: ['admin_pusat' => AdminPusat]
 */
class DashboardResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'message' => 'Admin Pusat Dashboard',
            'data' => [
                'admin_pusat' => new AdminPusatProfileResource($this['admin_pusat'] ?? null),
            ]
        ];
    }
}

/**
 * Generic profile response (detail)
 * expects: ['user' => User, 'profile' => Model]
 */
class ProfileResource extends JsonResource
{
    public function toArray($request)
    {
        $user = $this['user'] ?? null;
        $profile = $this['profile'] ?? null;
        $level = $user->level ?? null;

        $profileResource = null;
        if ($level === 'admin_pusat')   $profileResource = new AdminPusatProfileResource($profile);
        if ($level === 'admin_cabang')  $profileResource = new AdminCabangProfileResource($profile);
        if ($level === 'admin_shelter') $profileResource = new AdminShelterProfileResource($profile);
        if ($level === 'donatur')       $profileResource = new DonaturProfileResource($profile);

        return [
            'status' => true,
            'data'   => [
                'user'    => new UserBaseResource($user),
                'profile' => $profileResource,
            ],
        ];
    }
}

/**
 * Helper wrapper for consistent envelope when needed quickly
 * Usage in controller:
 *   return response()->json(ApiEnvelope::success('message', $payload));
 */
class ApiEnvelope
{
    public static function success(string $message, $data = null, int $status = 200)
    {
        return response()->json([
            'status'  => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    public static function error($message, int $status = 400, $errors = null)
    {
        return response()->json([
            'status'  => false,
            'message' => $message,
            'errors'  => $errors,
        ], $status);
    }
}
