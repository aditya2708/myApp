<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Kelompok extends Model
{
    use HasFactory;

    protected $table = 'kelompok';
    protected $primaryKey = 'id_kelompok';
    
    protected $fillable = [
        'id_shelter',
        'id_level_anak_binaan',
        'nama_kelompok',
        'jumlah_anggota',
        'kelas_gabungan'
    ];

    protected $casts = [
        'jumlah_anggota' => 'integer',
        'kelas_gabungan' => 'array'
    ];

    // Relationships
    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class, 'id_shelter', 'id_shelter');
    }

    public function levelAnakBinaan(): BelongsTo
    {
        return $this->belongsTo(LevelAnakBinaan::class, 'id_level_anak_binaan', 'id_level_anak_binaan');
    }

    public function tutorKelompok(): HasMany
    {
        return $this->hasMany(TutorKelompok::class, 'id_kelompok', 'id_kelompok');
    }

    public function aktivitas(): HasMany
    {
        return $this->hasMany(Aktivitas::class, 'nama_kelompok', 'nama_kelompok');
    }

    public function anak(): HasMany
    {
        return $this->hasMany(Anak::class, 'id_kelompok', 'id_kelompok');
    }

    // Helper methods
    public function isKelasGabungan()
    {
        return !empty($this->kelas_gabungan);
    }


}
