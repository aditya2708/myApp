<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Jenjang Model (SD, SMP, SMA)
 */
class Jenjang extends Model
{
    protected $table = 'jenjang';
    protected $primaryKey = 'id_jenjang';
    
    protected $fillable = [
        'nama_jenjang',
        'kode_jenjang', 
        'urutan',
        'deskripsi',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'urutan' => 'integer'
    ];

    // Relationships
    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class, 'id_jenjang', 'id_jenjang');
    }

    public function mataPelajaran(): HasMany
    {
        return $this->hasMany(MataPelajaran::class, 'id_jenjang', 'id_jenjang');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}