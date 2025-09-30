<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kurikulum extends Model
{
    use HasFactory;

    protected $table = 'kurikulum';
    protected $primaryKey = 'id_kurikulum';

    protected $fillable = [
        'nama_kurikulum',
        'kode_kurikulum',
        'jenis',
        'tahun_berlaku',
        'id_jenjang',
        'deskripsi',
        'tujuan',
        'tanggal_mulai',
        'tanggal_selesai',
        'is_active',
        'status',
        'id_kacab'
    ];

    protected $casts = [
        'id_kurikulum' => 'integer',
        'tahun_berlaku' => 'integer',
        'jenis' => 'string',
        'id_jenjang' => 'integer',
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'is_active' => 'boolean',
        'id_kacab' => 'integer'
    ];

    // Relations - FIXED: KantorCabang → Kacab
    public function kacab()
    {
        return $this->belongsTo(Kacab::class, 'id_kacab', 'id_kacab');
    }

    public function jenjang()
    {
        return $this->belongsTo(Jenjang::class, 'id_jenjang', 'id_jenjang');
    }

    public function mataPelajaran()
    {
        return $this->belongsToMany(
            MataPelajaran::class,
            'kurikulum_materi',
            'id_kurikulum',
            'id_mata_pelajaran'
        )->distinct();
    }

    public function kurikulumMateri()
    {
        return $this->hasMany(KurikulumMateri::class, 'id_kurikulum', 'id_kurikulum');
    }

    public function semester()
    {
        return $this->hasMany(Semester::class, 'kurikulum_id', 'id_kurikulum');
    }

    public function materi()
    {
        return $this->belongsToMany(
            Materi::class,
            'kurikulum_materi',
            'id_kurikulum',
            'id_materi'
        )->withPivot(['id_mata_pelajaran', 'urutan'])->withTimestamps();
    }

    public function allMataPelajaran()
    {
        return $this->belongsToMany(
            MataPelajaran::class,
            'kurikulum_materi',
            'id_kurikulum',
            'id_mata_pelajaran'
        )->withPivot(['id_materi', 'urutan'])->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeByKacab($query, $kacabId)
    {
        return $query->where('id_kacab', $kacabId);
    }

    public function scopeByTahun($query, $tahun)
    {
        return $query->where('tahun_berlaku', $tahun);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeWithRelations($query)
    {
        return $query->with(['kacab', 'kurikulumMateri', 'semester']);
    }

    public function scopeWithCounts($query)
    {
        return $query
            ->withCount(['kurikulumMateri', 'semester', 'materi'])
            ->addSelect([
                'mata_pelajaran_count' => KurikulumMateri::selectRaw('COUNT(DISTINCT id_mata_pelajaran)')
                    ->whereColumn('kurikulum_materi.id_kurikulum', 'kurikulum.id_kurikulum'),
            ]);
    }

    // Accessors
    public function getFullNameAttribute()
    {
        return $this->nama_kurikulum . ' (' . $this->tahun_berlaku . ')';
    }

    public function getDisplayNameAttribute()
    {
        return $this->nama_kurikulum;
    }

    public function getStatusTextAttribute()
    {
        if ($this->status) {
            return ucfirst($this->status);
        }
        return $this->is_active ? 'Aktif' : 'Tidak Aktif';
    }

    public function getStatusColorAttribute()
    {
        if ($this->status === 'aktif' || $this->is_active) {
            return '#27ae60';
        }
        if ($this->status === 'draft') {
            return '#f39c12';
        }
        return '#95a5a6';
    }

    public function getKacabNameAttribute()
    {
        return $this->kacab ? $this->kacab->nama_kacab : 'N/A';
    }

    public function getYearDisplayAttribute()
    {
        return 'Tahun ' . $this->tahun_berlaku;
    }

    // Methods
    public function getTotalMateri()
    {
        return $this->materi()->count();
    }

    public function getTotalMataPelajaran()
    {
        return $this->kurikulumMateri()
            ->distinct('id_mata_pelajaran')
            ->count('id_mata_pelajaran');
    }

    public function getKurikulumStats()
    {
        return [
            'total_materi' => $this->getTotalMateri(),
            'total_mata_pelajaran' => $this->getTotalMataPelajaran(),
            'total_semester' => $this->semester()->count(),
            'status' => $this->status_text
        ];
    }

    // Boot method for auto-deactivation
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($kurikulum) {
            // If setting as active, deactivate others in same kacab
            if ($kurikulum->is_active || $kurikulum->status === 'aktif') {
                static::byKacab($kurikulum->id_kacab)
                    ->where(function($q) {
                        $q->where('is_active', true)
                          ->orWhere('status', 'aktif');
                    })
                    ->update(['is_active' => false, 'status' => 'nonaktif']);
            }
        });

        static::updating(function ($kurikulum) {
            // If setting as active, deactivate others in same kacab
            if (($kurikulum->is_active || $kurikulum->status === 'aktif') &&
                ($kurikulum->isDirty('is_active') || $kurikulum->isDirty('status'))) {
                static::byKacab($kurikulum->id_kacab)
                    ->where('id_kurikulum', '!=', $kurikulum->id_kurikulum)
                    ->where(function($q) {
                        $q->where('is_active', true)
                          ->orWhere('status', 'aktif');
                    })
                    ->update(['is_active' => false, 'status' => 'nonaktif']);
            }
        });

        static::saving(function ($kurikulum) {
            $status = $kurikulum->status !== null ? strtolower($kurikulum->status) : null;
            $isActive = (bool) $kurikulum->is_active;

            if ($kurikulum->isDirty('status') && !$kurikulum->isDirty('is_active')) {
                if (in_array($status, ['inactive', 'non-active'], true)) {
                    $kurikulum->status = 'nonaktif';
                    $status = 'nonaktif';
                } elseif ($status === null || $status === '') {
                    $kurikulum->status = 'nonaktif';
                    $status = 'nonaktif';
                }

                if ($status === 'aktif') {
                    $kurikulum->is_active = true;
                } elseif ($status === 'draft') {
                    $kurikulum->is_active = false;
                } else {
                    $kurikulum->is_active = false;
                }

                return;
            }

            if ($kurikulum->isDirty('is_active') && !$kurikulum->isDirty('status')) {
                if ($isActive) {
                    $kurikulum->status = 'aktif';
                } else {
                    if ($status === 'draft') {
                        $kurikulum->status = 'draft';
                    } else {
                        $kurikulum->status = 'nonaktif';
                    }
                }

                return;
            }

            if ($status === 'aktif' || $isActive) {
                $kurikulum->status = 'aktif';
                $kurikulum->is_active = true;
                return;
            }

            if (in_array($status, ['inactive', 'non-active'], true)) {
                $kurikulum->status = 'nonaktif';
            } elseif ($status === null || $status === '') {
                $kurikulum->status = 'nonaktif';
            }

            if ($kurikulum->status !== 'draft') {
                $kurikulum->is_active = false;
            }
        });
    }
}
