<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TutorKelompok extends Model
{
    protected $table = 'tutor_kelompok';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id_tutor',
        'id_kelompok',
        'mata_pelajaran',
        'is_active',
        'assigned_by',
        'assigned_at'
    ];

    protected $casts = [
        'mata_pelajaran' => 'array',
        'is_active' => 'boolean',
        'assigned_at' => 'timestamp'
    ];

    // Relationships
    public function tutor(): BelongsTo
    {
        return $this->belongsTo(Tutor::class, 'id_tutor', 'id_tutor');
    }

    public function kelompok(): BelongsTo
    {
        return $this->belongsTo(Kelompok::class, 'id_kelompok', 'id_kelompok');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(AdminShelter::class, 'assigned_by', 'id_admin_shelter');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByTutor($query, $tutorId)
    {
        return $query->where('id_tutor', $tutorId);
    }

    public function scopeByKelompok($query, $kelompokId)
    {
        return $query->where('id_kelompok', $kelompokId);
    }

    // Helper methods
    public function hasMataPelajaran($mataPelajaranId)
    {
        return collect($this->mata_pelajaran)->contains('id_mata_pelajaran', $mataPelajaranId);
    }
}