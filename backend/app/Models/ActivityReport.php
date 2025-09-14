<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityReport extends Model
{
    use HasFactory;

    protected $table = 'activity_reports';
    protected $primaryKey = 'id_activity_report';

    protected $fillable = [
        'id_aktivitas',
        'foto_1',
        'foto_2',
        'foto_3'
    ];

    protected $appends = [
        'foto_1_url',
        'foto_2_url', 
        'foto_3_url'
    ];

    /**
     * Relationship with Aktivitas
     */
    public function aktivitas()
    {
        return $this->belongsTo(Aktivitas::class, 'id_aktivitas', 'id_aktivitas');
    }

    /**
     * Get full URL for foto_1
     */
    public function getFoto1UrlAttribute()
    {
        return $this->foto_1 ? url('storage/' . $this->foto_1) : null;
    }

    /**
     * Get full URL for foto_2
     */
    public function getFoto2UrlAttribute()
    {
        return $this->foto_2 ? url('storage/' . $this->foto_2) : null;
    }

    /**
     * Get full URL for foto_3
     */
    public function getFoto3UrlAttribute()
    {
        return $this->foto_3 ? url('storage/' . $this->foto_3) : null;
    }
}