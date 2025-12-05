<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SsoCompany extends Model
{
    use HasFactory;

    protected $table = 'companies';

    protected $fillable = [
        'slug',
        'idp_uuid',
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'company_user', 'company_id', 'user_id', 'id', 'id_users')
            ->using(SsoCompanyUser::class)
            ->withPivot(['role', 'status'])
            ->withTimestamps();
    }
}
