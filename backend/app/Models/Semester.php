<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Semester extends Model
{
    use HasFactory;

   protected $table = 'semester';
    protected $primaryKey = 'id_semester';
    
    protected $fillable = [
        'nama_semester',
        'tahun_ajaran',
        'periode',
        'tanggal_mulai',
        'tanggal_selesai',
        'kurikulum_id',
        'is_active',
        'id_kacab',
        'id_shelter',
        'status',
        'type',
        'tahun_mulai',
        'tahun_selesai',
        'company_id'
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'is_active' => 'boolean'
    ];

    // Relationships
    public function kacab(): BelongsTo
    {
        return $this->belongsTo(Kacab::class, 'id_kacab', 'id_kacab');
    }

    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class, 'id_shelter', 'id_shelter');
    }

    public function kurikulum(): BelongsTo
    {
        return $this->belongsTo(Kurikulum::class, 'kurikulum_id', 'id_kurikulum');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByKacab($query, $kacabId)
    {
        return $query->where('id_kacab', $kacabId);
    }

    public function scopeGanjil($query)
    {
        return $query->where('periode', 'ganjil');
    }

    public function scopeGenap($query)
    {
        return $query->where('periode', 'genap');
    }

    // Methods
    public function canBeDeleted(): bool
    {
        // Check if semester has any related data that prevents deletion
        // Add your business logic here based on your application needs
        
        // For now, allow deletion if semester is not active
        return !$this->is_active;
    }
}
