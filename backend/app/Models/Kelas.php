<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Kelas extends Model
{
    protected $table = 'kelas';
    protected $primaryKey = 'id_kelas';
    
    protected $fillable = [
        'id_jenjang',
        'id_kacab',
        'nama_kelas',
        'tingkat',
        'jenis_kelas',
        'is_custom',
        'urutan',
        'deskripsi',
        'is_active',
        'is_global',
        'target_jenjang',
        'kelas_gabungan'
    ];

    protected $casts = [
        'tingkat' => 'integer',
        'urutan' => 'integer',
        'is_custom' => 'boolean',
        'is_active' => 'boolean',
        'is_global' => 'boolean',
        'target_jenjang' => 'array',
        'kelas_gabungan' => 'array'
    ];

    // Relationships
    public function jenjang(): BelongsTo
    {
        return $this->belongsTo(Jenjang::class, 'id_jenjang', 'id_jenjang');
    }

    public function kacab(): BelongsTo
    {
        return $this->belongsTo(Kacab::class, 'id_kacab', 'id_kacab');
    }

    public function templateMateri(): HasMany
    {
        return $this->hasMany(TemplateMateri::class, 'id_kelas', 'id_kelas');
    }

    public function materi(): HasMany
    {
        return $this->hasMany(Materi::class, 'id_kelas', 'id_kelas');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeStandard($query)
    {
        return $query->where('jenis_kelas', 'standard');
    }

    public function scopeCustom($query)
    {
        return $query->where('jenis_kelas', 'custom');
    }

    public function scopeGlobal($query)
    {
        return $query->where('is_global', true);
    }
}