<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPushToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'expo_push_token',
        'device_info',
        'last_used_at',
    ];

    protected $casts = [
        'device_info' => 'array',
        'last_used_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id_users');
    }
}
