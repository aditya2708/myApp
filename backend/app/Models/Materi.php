<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Materi extends Model
{
    use HasFactory;

    protected $table = 'materi';
    protected $primaryKey = 'id_materi';

    protected $fillable = [
        'id_mata_pelajaran',
        'id_kelas',
        'id_kacab',
        'template_source_id',
        'nama_materi',
        'deskripsi',
        'kategori',
        'urutan',
        'file_path',
        'file_name',
        'file_size',
        'is_from_template',
        'is_customized',
        'metadata',
        'company_id'
    ];

    protected $casts = [
        'urutan' => 'integer',
        'file_size' => 'integer',
        'is_from_template' => 'boolean',
        'is_customized' => 'boolean',
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

    public function kacab(): BelongsTo
    {
        return $this->belongsTo(Kacab::class, 'id_kacab', 'id_kacab');
    }

    public function templateSource(): BelongsTo
    {
        return $this->belongsTo(TemplateMateri::class, 'template_source_id', 'id_template_materi');
    }

    public function aktivitas(): HasMany
    {
        return $this->hasMany(Aktivitas::class, 'id_materi', 'id_materi');
    }

    public function templateAdoption(): HasMany
    {
        return $this->hasMany(TemplateAdoption::class, 'id_materi_hasil', 'id_materi');
    }

    // Scopes
    public function scopeByKacab($query, $kacabId)
    {
        return $query->where('id_kacab', $kacabId);
    }

    public function scopeFromTemplate($query)
    {
        return $query->where('is_from_template', true);
    }

    public function scopeCustom($query)
    {
        return $query->where('is_from_template', false);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('urutan');
    }
}
