<?php

namespace App\Models;

use App\Models\SsoCompany;
use App\Models\SsoCompanyUser;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_ADMIN_PUSAT = 'admin_pusat';
    public const ROLE_ADMIN_CABANG = 'admin_cabang';
    public const ROLE_ADMIN_SHELTER = 'admin_shelter';
    public const ROLE_DONATUR = 'donatur';
    public const ROLE_SISWA = 'siswa';

    public const DEFAULT_ROLE = self::ROLE_SUPER_ADMIN;

    /**
     * Roles that can be assigned manually via the super admin console.
     */
    public const ASSIGNABLE_ROLES = [
        self::ROLE_SUPER_ADMIN,
        self::ROLE_ADMIN_PUSAT,
        self::ROLE_ADMIN_CABANG,
        self::ROLE_ADMIN_SHELTER,
        self::ROLE_DONATUR,
    ];

    protected $primaryKey = 'id_users'; 

    protected $fillable = [
        'username',
        'email',
        'password',
        'level', // Level fleksibel, misalnya 'admin', 'user', dll.
        'status',
        // 'remember_token',
        'token_api',
        'token',
        'company_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    
    /**
     * Relasi ke admin_pusat.
     */
    public function adminPusat()
    {
        return $this->hasOne(AdminPusat::class, 'id_users', 'id_users'); // Relasi dengan id_users
    }

   // Di dalam model User
    public function adminCabang() {
        return $this->hasOne(AdminCabang::class, 'user_id', 'id_users');
    }


    public function adminShelter()
    {
        return $this->hasOne(AdminShelter::class, 'user_id', 'id_users');
    }

    // Di model User.php
    public function donatur()
    {
        return $this->hasOne(Donatur::class, 'id_users', 'id_users');
    }

    public function isActive(): bool
    {
        return strtolower($this->status ?? '') === 'aktif';
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id')
            ->withPivot(['scope_type', 'scope_id'])
            ->withTimestamps();
    }

    public function hasRole(string $roleSlug, ?string $scopeType = null, ?int $scopeId = null): bool
    {
        if ($this->level === $roleSlug) {
            return true;
        }

        $roles = $this->relationLoaded('roles') ? $this->roles : $this->roles()->get();

        return $roles->contains(function (Role $role) use ($roleSlug, $scopeType, $scopeId) {
            if ($role->slug !== $roleSlug) {
                return false;
            }

            $pivotScopeType = $role->pivot?->scope_type;
            $pivotScopeId = $role->pivot?->scope_id;

            if ($scopeType !== null && $pivotScopeType !== $scopeType) {
                return false;
            }

            if ($scopeId !== null && (int) $pivotScopeId !== (int) $scopeId) {
                return false;
            }

            return true;
        });
    }

    public function availableRoles(): array
    {
        $roles = $this->relationLoaded('roles') ? $this->roles : $this->roles()->get();

        return $roles->map(function (Role $role) {
            return [
                'slug' => $role->slug,
                'name' => $role->name,
                'scope_type' => $role->pivot?->scope_type,
                'scope_id' => $role->pivot?->scope_id,
            ];
        })->values()->all();
    }

    public static function manageableRoles(): array
    {
        return self::ASSIGNABLE_ROLES;
    }

    public function ssoCompanies(): BelongsToMany
    {
        return $this->belongsToMany(SsoCompany::class, 'company_user', 'user_id', 'company_id', 'id_users', 'id')
            ->using(SsoCompanyUser::class)
            ->withPivot(['role', 'status'])
            ->withTimestamps();
    }

    public function companyUsers(): HasMany
    {
        return $this->hasMany(SsoCompanyUser::class, 'user_id', 'id_users');
    }
}
