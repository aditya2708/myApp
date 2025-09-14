<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Raport extends Model
{
    use HasFactory;

    protected $table = 'raport';
    protected $primaryKey = 'id_raport';
    
    protected $fillable = [
        'id_anak',
        'id_semester',
        'total_kehadiran',
        'persentase_kehadiran',
        'ranking',
        'catatan_wali_kelas',
        'tanggal_terbit',
        'status'
    ];

    protected $casts = [
        'persentase_kehadiran' => 'decimal:2',
        'tanggal_terbit' => 'date'
    ];

    const STATUS_DRAFT = 'draft';
    const STATUS_PUBLISHED = 'published';
    const STATUS_ARCHIVED = 'archived';

    // Relations
    public function anak()
    {
        return $this->belongsTo(Anak::class, 'id_anak');
    }

    public function semester()
    {
        return $this->belongsTo(Semester::class, 'id_semester');
    }

    public function raportDetail()
    {
        return $this->hasMany(RaportDetail::class, 'id_raport');
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    // Methods
    public function publish()
    {
        $this->update([
            'status' => self::STATUS_PUBLISHED,
            'tanggal_terbit' => now()
        ]);
    }

    public function archive()
    {
        $this->update(['status' => self::STATUS_ARCHIVED]);
    }

    public function getNilaiRataRataAttribute()
    {
        return $this->raportDetail()->avg('nilai_akhir');
    }

    public function generateFromPenilaian()
    {
        $penilaianData = Penilaian::where('id_anak', $this->id_anak)
            ->where('id_semester', $this->id_semester)
            ->with(['materi.mataPelajaran', 'jenisPenilaian'])
            ->get()
            ->groupBy(function($penilaian) {
                return $penilaian->materi && $penilaian->materi->mataPelajaran 
                    ? $penilaian->materi->mataPelajaran->id_mata_pelajaran 
                    : 'unknown';
            });

        foreach ($penilaianData as $mataPelajaranId => $penilaianGroup) {
            if ($mataPelajaranId === 'unknown') continue;
            
            $nilaiAkhir = 0;
            $mataPelajaran = $penilaianGroup->first()->materi->mataPelajaran;
            
            foreach ($penilaianGroup as $penilaian) {
                $bobot = $penilaian->jenisPenilaian->bobot_persen > 0
                    ? ($penilaian->jenisPenilaian->bobot_persen / 100)
                    : $penilaian->jenisPenilaian->bobot_decimal;
                    
                $nilaiAkhir += $penilaian->nilai * $bobot;
            }
            
            $this->raportDetail()->updateOrCreate(
                [
                    'id_mata_pelajaran' => $mataPelajaranId,
                    'mata_pelajaran' => $mataPelajaran->nama_mata_pelajaran
                ],
                [
                    'nilai_akhir' => $nilaiAkhir,
                    'nilai_huruf' => $this->convertToHuruf($nilaiAkhir),
                    'kkm' => 70,
                    'keterangan' => $nilaiAkhir >= 70 ? 'Tuntas' : 'Belum Tuntas'
                ]
            );
        }
    }

    private function convertToHuruf($nilai)
    {
        if ($nilai >= 90) return 'A';
        if ($nilai >= 80) return 'B';
        if ($nilai >= 70) return 'C';
        if ($nilai >= 60) return 'D';
        return 'E';
    }
}
