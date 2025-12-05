<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MataPelajaran extends Model
{
    protected $table = 'mata_pelajaran';
    protected $primaryKey = 'id_mata_pelajaran';
    
    protected $fillable = [
        'nama_mata_pelajaran',
        'kode_mata_pelajaran',
        'kategori',
        'deskripsi',
        'status',
        'id_kacab',
        'id_jenjang',
        'is_global',
        'target_jenjang',
        'target_kelas',
        'company_id'
    ];

    protected $casts = [
        'is_global' => 'boolean',
        'target_jenjang' => 'array',
        'target_kelas' => 'array'
    ];

    // Relationships
    public function kacab(): BelongsTo
    {
        return $this->belongsTo(Kacab::class, 'id_kacab', 'id_kacab');
    }

    public function jenjang(): BelongsTo
    {
        return $this->belongsTo(Jenjang::class, 'id_jenjang', 'id_jenjang');
    }

    public function templateMateri(): HasMany
    {
        return $this->hasMany(TemplateMateri::class, 'id_mata_pelajaran', 'id_mata_pelajaran');
    }

    public function materi(): HasMany
    {
        return $this->hasMany(Materi::class, 'id_mata_pelajaran', 'id_mata_pelajaran');
    }

    public function bobotPenilaian(): HasMany
    {
        return $this->hasMany(BobotPenilaian::class, 'id_mata_pelajaran', 'id_mata_pelajaran');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeWajib($query)
    {
        return $query->where('kategori', 'wajib');
    }

    public function scopeGlobal($query)
    {
        return $query->where('is_global', true);
    }

    public function scopeByKacab($query, $kacabId, ?int $companyId = null)
    {
        return $query->where('id_kacab', $kacabId)
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId));
    }
}
