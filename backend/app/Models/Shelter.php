<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

class Shelter extends Model
{
    use HasFactory;

    protected $table = 'shelter'; // Nama tabel
    protected $primaryKey = 'id_shelter'; 

    protected $fillable = [
        'nama_shelter', 'nama_koordinator', 'no_telpon', 'alamat', 'id_wilbin',
        'require_gps', 'latitude', 'longitude', 'max_distance_meters', 
        'gps_accuracy_required', 'location_name', 'gps_approval_status',
        'gps_approval_data', 'gps_submitted_at', 'gps_approved_at',
        'gps_approved_by', 'gps_rejection_reason', 'gps_change_history'
    ]; // Kolom yang bisa diisi

    protected $casts = [
        'require_gps' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'max_distance_meters' => 'integer',
        'gps_accuracy_required' => 'integer',
        'gps_approval_data' => 'array',
        'gps_change_history' => 'array',
        'gps_submitted_at' => 'datetime',
        'gps_approved_at' => 'datetime'
    ];

    /**
     * Relasi ke tabel wilbin.
     */
    public function wilbin()
    {
        return $this->belongsTo(Wilbin::class, 'id_wilbin', 'id_wilbin');
    }

    public function tutors()
    {
        return $this->hasMany(Tutor::class, 'id_shelter');
    }

     public function kelompok(): HasMany
    {
        return $this->hasMany(Kelompok::class, 'id_shelter', 'id_shelter');
    }

    public function anak()
    {
        return $this->hasMany(Anak::class, 'id_shelter', 'id_shelter');
    }

    // Relasi ke aktivitas
  public function aktivitas(): HasMany
    {
        return $this->hasMany(Aktivitas::class, 'id_shelter', 'id_shelter');
    }

    public function donatur()
    {
        return $this->hasMany(Donatur::class, 'id_shelter', 'id_shelter');
    }

       // Relationships
    // Kacab relationship is accessed through wilbin: $shelter->wilbin->kacab

     public function semesters(): HasMany
    {
        return $this->hasMany(Semester::class, 'id_shelter', 'id_shelter');
    }

    /**
     * Relation to admin cabang who approved GPS
     */
    public function gpsApprovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'gps_approved_by', 'id_users');
    }

    /**
     * Relation to kacab (through wilbin)
     */
    public function kacab()
    {
        return $this->hasOneThrough(Kacab::class, Wilbin::class, 'id_wilbin', 'id_kacab', 'id_wilbin', 'id_kacab');
    }

    /**
     * Relation to admin shelters
     */
    public function adminShelters(): HasMany
    {
        return $this->hasMany(AdminShelter::class, 'id_shelter', 'id_shelter');
    }
}
