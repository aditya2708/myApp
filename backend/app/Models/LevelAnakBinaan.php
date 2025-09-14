<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LevelAnakBinaan extends Model
{
    use HasFactory;

    protected $table = 'level_as_anak_binaan';

    protected $primaryKey = 'id_level_anak_binaan';

    protected $fillable = [
        'nama_level_binaan'
    ];

  // Relationships
    public function kelompok(): HasMany
    {
        return $this->hasMany(Kelompok::class, 'id_level_anak_binaan', 'id_level_anak_binaan');
    }

  
}
