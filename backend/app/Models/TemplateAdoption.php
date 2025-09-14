<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateAdoption extends Model
{
    protected $table = 'template_adoptions';
    protected $primaryKey = 'id_adoption';
    
    protected $fillable = [
        'id_template_materi',
        'id_kacab',
        'id_materi_hasil',
        'status',
        'adopted_by',
        'adoption_notes',
        'adopted_at'
    ];

    protected $casts = [
        'adopted_at' => 'timestamp'
    ];

    // Relationships
    public function templateMateri(): BelongsTo
    {
        return $this->belongsTo(TemplateMateri::class, 'id_template_materi', 'id_template_materi');
    }

    public function kacab(): BelongsTo
    {
        return $this->belongsTo(Kacab::class, 'id_kacab', 'id_kacab');
    }

    public function materiHasil(): BelongsTo
    {
        return $this->belongsTo(Materi::class, 'id_materi_hasil', 'id_materi');
    }

    public function adoptedBy(): BelongsTo
    {
        return $this->belongsTo(AdminCabang::class, 'adopted_by', 'id_admin_cabang');
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeAdopted($query)
    {
        return $query->where('status', 'adopted');
    }

    public function scopeCustomized($query)
    {
        return $query->where('status', 'customized');
    }

    public function scopeByKacab($query, $kacabId)
    {
        return $query->where('id_kacab', $kacabId);
    }
}