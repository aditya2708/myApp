<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Aktivitas extends Model
{
    use HasFactory;

    protected $table = 'aktivitas';
    protected $primaryKey = 'id_aktivitas';

    protected $fillable = [
        'id_shelter',
        'id_tutor',
        'jenis_kegiatan',
        'id_kegiatan',
        'nama_kelompok',
        'materi',
        'id_materi',
        'pakai_materi_manual',
        'mata_pelajaran_manual',
        'materi_manual',
        'tanggal',
        'start_time',
        'end_time',
        'late_threshold',
        'late_minutes_threshold',
        'latitude',
        'longitude',
        'require_gps',
        'max_distance_meters',
        'gps_accuracy',
        'gps_recorded_at',
        'location_name',
        'status',
    ];

    protected $attributes = [
        'nama_kelompok' => '',
        'late_minutes_threshold' => 15,
        'pakai_materi_manual' => false,
        'mata_pelajaran_manual' => null,
        'materi_manual' => null,
    ];

    protected $casts = [
        'tanggal' => 'date',
        'late_minutes_threshold' => 'integer',
        'id_kegiatan' => 'integer',
        'pakai_materi_manual' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'require_gps' => 'boolean',
        'max_distance_meters' => 'integer',
        'gps_accuracy' => 'decimal:2',
        'gps_recorded_at' => 'datetime',
    ];

    public function shelter(): BelongsTo
    {
        return $this->belongsTo(Shelter::class, 'id_shelter', 'id_shelter');
    }

    public function anak()
    {
        return $this->belongsTo(Anak::class, 'id_anak', 'id_anak');
    }

    public function materi(): BelongsTo
    {
        return $this->belongsTo(Materi::class, 'id_materi', 'id_materi');
    }

    public function kegiatan(): BelongsTo
    {
        return $this->belongsTo(Kegiatan::class, 'id_kegiatan', 'id_kegiatan');
    }

    public function absen()
    {
        return $this->hasMany(Absen::class, 'id_aktivitas');
    }

    public function tutor(): BelongsTo
    {
        return $this->belongsTo(Tutor::class, 'id_tutor', 'id_tutor');
    }

    // Level attribute removed - can be derived from kelompok->kelas_gabungan or materi->kelas->jenjang

    public function setNamaKelompokAttribute($value)
    {
        $this->attributes['nama_kelompok'] = $value ?? '';
    }

    public function getLateThresholdTime()
    {
        if (!$this->start_time) {
            return null;
        }

        if ($this->late_threshold) {
            return $this->late_threshold;
        }

        $minutes = $this->late_minutes_threshold ?? 15;
        return \Carbon\Carbon::parse($this->start_time)->addMinutes($minutes)->format('H:i:s');
    }

    public function isLate($arrivalTime)
    {
        if (!$this->start_time) {
            return false;
        }

        $activityDate = $this->tanggal->format('Y-m-d');
        $arrivalDate = $arrivalTime->format('Y-m-d');
        
        if ($activityDate !== $arrivalDate) {
            return $activityDate < $arrivalDate;
        }

        // Handle both time-only (HH:MM:SS) and full datetime formats
        if (str_contains($this->start_time, ' ')) {
            // Full datetime format
            $startTime = \Carbon\Carbon::parse($this->start_time);
        } else {
            // Time-only format
            $startTime = \Carbon\Carbon::parse($activityDate . ' ' . $this->start_time);
        }
        
        if ($this->late_threshold) {
            // Handle both time-only and full datetime formats
            if (str_contains($this->late_threshold, ' ')) {
                $lateThreshold = \Carbon\Carbon::parse($this->late_threshold);
            } else {
                $lateThreshold = \Carbon\Carbon::parse($activityDate . ' ' . $this->late_threshold);
            }
        } else {
            $lateThreshold = $startTime->copy()->addMinutes($this->late_minutes_threshold ?? 15);
        }

        return $arrivalTime->gt($lateThreshold);
    }

    public function isAbsent($arrivalTime)
    {
        if (!$this->end_time) {
            return false;
        }

        $activityDate = $this->tanggal->format('Y-m-d');
        $arrivalDate = $arrivalTime->format('Y-m-d');
        
        if ($activityDate !== $arrivalDate) {
            return $activityDate < $arrivalDate;
        }

        // Handle both time-only (HH:MM:SS) and full datetime formats
        if (str_contains($this->end_time, ' ')) {
            // Full datetime format
            $endTime = \Carbon\Carbon::parse($this->end_time);
        } else {
            // Time-only format
            $endTime = \Carbon\Carbon::parse($activityDate . ' ' . $this->end_time);
        }
        return $arrivalTime->gt($endTime);
    }

    public function canRecordAttendance(\Carbon\Carbon $currentTime = null)
    {
        $currentTime = $currentTime ?? \Carbon\Carbon::now();
        $activityDate = $this->tanggal->startOfDay();
        $currentDate = $currentTime->startOfDay();
        
        if ($activityDate->gt($currentDate)) {
            return [
                'allowed' => false,
                'reason' => 'Activity has not started yet'
            ];
        }
        
        return [
            'allowed' => true,
            'reason' => null
        ];
    }

    public function isActivityExpired(\Carbon\Carbon $currentTime = null)
    {
        $currentTime = $currentTime ?? \Carbon\Carbon::now();
        $activityDate = $this->tanggal->startOfDay();
        $currentDate = $currentTime->startOfDay();
        
        return $activityDate->lt($currentDate);
    }

    public function isActivityToday(\Carbon\Carbon $currentTime = null)
    {
        $currentTime = $currentTime ?? \Carbon\Carbon::now();
        $activityDate = $this->tanggal->startOfDay();
        $currentDate = $currentTime->startOfDay();
        
        return $activityDate->eq($currentDate);
    }

    public function isActivityFuture(\Carbon\Carbon $currentTime = null)
    {
        $currentTime = $currentTime ?? \Carbon\Carbon::now();
        $activityDate = $this->tanggal->startOfDay();
        $currentDate = $currentTime->startOfDay();
        
        return $activityDate->gt($currentDate);
    }

    public function kelompok()
    {
        return Kelompok::where('nama_kelompok', $this->nama_kelompok)
                      ->where('id_shelter', $this->id_shelter)
                      ->first();
    }

    // Scopes
    public function scopeByDate($query, $date)
    {
        return $query->whereDate('tanggal', $date);
    }

    public function scopeByShelter($query, $shelterId)
    {
        return $query->where('id_shelter', $shelterId);
    }

    public function scopeByTutor($query, $tutorId)
    {
        return $query->where('id_tutor', $tutorId);
    }

    /**
     * Relationship with ActivityReport
     */
    public function activityReport()
    {
        return $this->hasOne(ActivityReport::class, 'id_aktivitas', 'id_aktivitas');
    }

    /**
     * Check if activity is completed based on end_time
     */
    public function isCompleted()
    {
        if (!$this->end_time) return false;
        
        $now = \Carbon\Carbon::now();
        $activityDate = \Carbon\Carbon::parse($this->tanggal);
        $endDateTime = $activityDate->copy();
        
        // Parse end_time and set it to activity date
        $endTime = \Carbon\Carbon::parse($this->end_time);
        $endDateTime->setTime($endTime->hour, $endTime->minute, $endTime->second);
        
        return $now->greaterThan($endDateTime);
    }

    /**
     * Check if activity has started based on start_time
     */
    public function isStarted()
    {
        if (!$this->start_time) return false;
        
        $now = \Carbon\Carbon::now();
        $activityDate = \Carbon\Carbon::parse($this->tanggal);
        $startDateTime = $activityDate->copy();
        
        // Parse start_time and set it to activity date
        $startTime = \Carbon\Carbon::parse($this->start_time);
        $startDateTime->setTime($startTime->hour, $startTime->minute, $startTime->second);
        
        return $now->greaterThanOrEqualTo($startDateTime);
    }

    /**
     * Auto-update status based on time
     */
    public function updateStatusByTime()
    {
        // Update draft to ongoing if activity has started
        if ($this->isStarted() && $this->status === 'draft') {
            $this->update(['status' => 'ongoing']);
        }
        
        // Update ongoing to completed if activity has ended
        if ($this->isCompleted() && $this->status === 'ongoing') {
            $this->update(['status' => 'completed']);
        }
    }
}
