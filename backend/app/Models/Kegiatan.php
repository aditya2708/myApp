<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kegiatan extends Model
{
    use HasFactory;

    protected $table = 'kegiatan'; 

    protected $primaryKey = 'id_kegiatan';

    protected $fillable = [
        'nama_kegiatan'
    ];

    public function aktivitas(): HasMany
    {
        return $this->hasMany(Aktivitas::class, 'id_kegiatan', 'id_kegiatan');
    }
}
