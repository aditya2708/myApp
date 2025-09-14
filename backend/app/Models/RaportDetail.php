<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RaportDetail extends Model
{
    use HasFactory;

    protected $table = 'raport_detail';
    protected $primaryKey = 'id_raport_detail';
    
    protected $fillable = [
        'id_raport',
        'id_mata_pelajaran',
        'id_materi',
        'mata_pelajaran', // Keep for backward compatibility
        'nilai_akhir',
        'nilai_huruf',
        'kkm',
        'keterangan'
    ];

    protected $casts = [
        'nilai_akhir' => 'decimal:2',
        'kkm' => 'decimal:2'
    ];

    // Relations
    public function raport()
    {
        return $this->belongsTo(Raport::class, 'id_raport');
    }

    public function mataPelajaran()
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mata_pelajaran', 'id_mata_pelajaran');
    }

    public function materi()
    {
        return $this->belongsTo(Materi::class, 'id_materi', 'id_materi');
    }

    // Methods
    public function isTuntas()
    {
        return $this->nilai_akhir >= $this->kkm;
    }

    public function getStatusAttribute()
    {
        return $this->isTuntas() ? 'Tuntas' : 'Belum Tuntas';
    }

    public function getSelisihKkmAttribute()
    {
        return $this->nilai_akhir - $this->kkm;
    }
}