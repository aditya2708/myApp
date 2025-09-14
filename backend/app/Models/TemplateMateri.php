<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateMateri extends Model
{
    protected $table = 'template_materi';
    protected $primaryKey = 'id_template_materi';
    
    protected $fillable = [
        'id_mata_pelajaran',
        'id_kelas',
        'created_by',
        'nama_template',
        'deskripsi',
        'kategori',
        'file_path',
        'file_name',
        'file_size',
        'urutan',
        'version',
        'is_active',
        'metadata'
    ];

    protected $casts = [
        'file_size' => 'integer',
        'urutan' => 'integer',
        'is_active' => 'boolean',
        'metadata' => 'array'
    ];

    // Relationships
    public function mataPelajaran(): BelongsTo
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mata_pelajaran', 'id_mata_pelajaran');
    }

    public function kelas(): BelongsTo
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(AdminPusat::class, 'created_by', 'id_admin_pusat');
    }

    public function templateAdoptions(): HasMany
    {
        return $this->hasMany(TemplateAdoption::class, 'id_template_materi', 'id_template_materi');
    }

    public function materiHasil(): HasMany
    {
        return $this->hasMany(Materi::class, 'template_source_id', 'id_template_materi');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('urutan');
    }
}