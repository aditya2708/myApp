<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tutor extends Model
{
    use HasFactory;

    protected $table = 'tutor';
    protected $primaryKey = 'id_tutor';
    
    protected $fillable = [
        'nama', 
        'pendidikan', 
        'alamat', 
        'email', 
        'no_hp', 
        'id_kacab', 
        'id_wilbin', 
        'id_shelter', 
        'maple', 
        'jenis_tutor',
        'foto',
        'is_active',
        'company_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['foto_url', 'full_name'];

    public function getFotoUrlAttribute()
    {
        if ($this->foto) {
            return url("storage/Tutor/{$this->id_tutor}/{$this->foto}");
        }

        return url('images/default.png');
    }

    public function getFullNameAttribute(): ?string
    {
        return $this->nama;
    }

    public function kacab() {
        return $this->belongsTo(Kacab::class, 'id_kacab');
    }

    public function wilbin() {
        return $this->belongsTo(Wilbin::class, 'id_wilbin');
    }

    public function shelter() {
        return $this->belongsTo(Shelter::class, 'id_shelter');
    }

    public function absenUser()
    {
        return $this->hasMany(AbsenUser::class, 'id_tutor');
    }

    public function competencies()
    {
        return $this->hasMany(TutorCompetency::class, 'id_tutor');
    }

    // Relationships
    public function tutorKelompok(): HasMany
    {
        return $this->hasMany(TutorKelompok::class, 'id_tutor', 'id_tutor');
    }

    public function aktivitas(): HasMany
    {
        return $this->hasMany(Aktivitas::class, 'id_tutor', 'id_tutor');
    }

    /**
     * Scope a query to only include active tutors.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
