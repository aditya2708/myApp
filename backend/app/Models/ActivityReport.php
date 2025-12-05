<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityReport extends Model
{
    use HasFactory;

    public const REVIEW_STATUS_CLEAN = 'clean';
    public const REVIEW_STATUS_NEEDS_REVIEW = 'needs_review';
    public const REVIEW_STATUS_DISMISSED = 'dismissed';

    protected $table = 'activity_reports';
    protected $primaryKey = 'id_activity_report';

    protected $fillable = [
        'id_aktivitas',
        'company_id',
        'foto_1',
        'foto_2',
        'foto_3',
        'latitude',
        'longitude',
        'location_accuracy',
        'location_recorded_at',
        'auto_flag',
        'auto_flag_payload',
        'review_status',
        'reviewed_at',
        'reviewed_by',
        'review_notes'
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'location_accuracy' => 'decimal:2',
        'location_recorded_at' => 'datetime',
        'auto_flag_payload' => 'array',
        'reviewed_at' => 'datetime',
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
     * Reviewer relation for flagged reports.
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by', 'id_users');
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
