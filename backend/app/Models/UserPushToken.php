<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPushToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'fcm_token',
        'platform',
        'device_info',
        'last_used_at',
        'invalidated_at',
    ];

    protected $casts = [
        'device_info' => 'array',
        'last_used_at' => 'datetime',
        'invalidated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id_users');
    }
}
