<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Absen extends Model
{
    use HasFactory;

    protected $table = 'absen'; // Nama tabel
    protected $primaryKey = 'id_absen'; // Primary key
    protected $fillable = [
        'absen',          // Kolom untuk status absen (Ya/Tidak/Terlambat)
        'id_absen_user',  // Relasi dengan AbsenUser
        'id_aktivitas',   // Relasi dengan Aktivitas
        'id_donatur',     // Relasi dengan Donatur
        'is_read',        // Kolom status baca
        'is_verified',    // New field - verification status
        'verification_status', // New field - details on verification status
        'time_arrived',   // Time when attendance was recorded
        'latitude',       // GPS latitude
        'longitude',      // GPS longitude
        'gps_accuracy',   // GPS accuracy in meters
        'gps_recorded_at', // When GPS was captured
        'distance_from_activity', // Distance from activity location
        'gps_valid',      // Whether GPS validation passed
        'location_name',  // Human-readable location name
        'gps_validation_notes', // Notes about GPS validation
        'auto_flag',
        'auto_flag_payload',
        'review_status',
        'reviewed_at',
        'reviewed_by',
        'review_notes',
        'company_id',
        'created_at',     // Waktu pembuatan
        'updated_at',     // Waktu pembaruan
    ]; // Kolom yang bisa diisi

    protected $casts = [
        'is_verified' => 'boolean',
        'time_arrived' => 'datetime',
        'gps_recorded_at' => 'datetime',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'gps_accuracy' => 'decimal:2',
        'distance_from_activity' => 'decimal:2',
        'gps_valid' => 'boolean',
        'auto_flag_payload' => 'array',
        'reviewed_at' => 'datetime'
    ];

    const TEXT_YA = "Ya";
    const TEXT_TIDAK = "Tidak";
    const TEXT_TERLAMBAT = "Terlambat";
    const TYPE_YA = 1;
    const TYPE_TIDAK = 2;
    const TYPE_TERLAMBAT = 3;

    // Verification status constants
    const VERIFICATION_PENDING = 'pending';
    const VERIFICATION_VERIFIED = 'verified';
    const VERIFICATION_REJECTED = 'rejected';
    const VERIFICATION_MANUAL = 'manual';

    const REVIEW_STATUS_CLEAN = 'clean';
    const REVIEW_STATUS_NEEDS_REVIEW = 'needs_review';
    const REVIEW_STATUS_DISMISSED = 'dismissed';
    const REVIEW_STATUS_CONFIRMED = 'confirmed';

    // Relasi dengan AbsenUser
    public function absenUser() {
        return $this->belongsTo(AbsenUser::class, 'id_absen_user');
    }

    // Relasi dengan Aktivitas
    public function aktivitas()
    {
        return $this->belongsTo(Aktivitas::class, 'id_aktivitas');
    }

    // Relasi dengan Donatur
    public function donatur()
    {
        return $this->belongsTo(Donatur::class, 'id_donatur');
    }

    /**
     * Reviewer relation for flagged attendance.
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by', 'id_users');
    }

    // New relation with AttendanceVerification
    public function verifications()
    {
        return $this->hasMany(AttendanceVerification::class, 'id_absen');
    }

    /**
     * Scope a query to only include verified attendance records
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope a query to only include pending verification records
     */
    public function scopePending($query)
    {
        return $query->where('verification_status', self::VERIFICATION_PENDING);
    }

    /**
     * Scope a query to only include late attendance records
     */
    public function scopeLate($query)
    {
        return $query->where('absen', self::TEXT_TERLAMBAT);
    }

    /**
     * Get the latest verification record
     */
    public function latestVerification()
    {
        return $this->verifications()->latest()->first();
    }

    /**
     * Check if attendance is late
     */
    public function isLate()
    {
        return $this->absen === self::TEXT_TERLAMBAT;
    }

    /**
     * Check if attendance is present (including late)
     */
    public function isPresent()
    {
        return $this->absen === self::TEXT_YA || $this->absen === self::TEXT_TERLAMBAT;
    }
}
