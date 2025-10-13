<?php

namespace App\Services;

use App\Models\Absen;
use App\Models\AbsenUser;
use App\Models\Anak;
use App\Models\Aktivitas;
use App\Models\Tutor;
use App\Models\Kelompok;
use App\Models\AttendanceVerification;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class AttendanceService
{
    protected $verificationService;
    protected $locationService;
    
    public function __construct(VerificationService $verificationService, LocationService $locationService)
    {
        $this->verificationService = $verificationService;
        $this->locationService = $locationService;
    }
    
    protected function checkExistingAttendance($id_anak, $id_aktivitas)
    {
        $absenUser = AbsenUser::where('id_anak', $id_anak)->first();
        
        if (!$absenUser) {
            return false;
        }
        
        $existingRecord = Absen::where('id_absen_user', $absenUser->id_absen_user)
                               ->where('id_aktivitas', $id_aktivitas)
                               ->first();
        
        return $existingRecord ?: false;
    }
    
    protected function determineAttendanceStatus($aktivitas, $arrivalTime, $manualStatus = null)
    {
        if ($manualStatus) {
            switch ($manualStatus) {
                case 'present':
                    return Absen::TEXT_YA;
                case 'absent':
                    return Absen::TEXT_TIDAK;
                case 'late':
                    return Absen::TEXT_TERLAMBAT;
            }
        }
        
        $activityDate = Carbon::parse($aktivitas->tanggal)->startOfDay();
        $currentDate = Carbon::now()->startOfDay();
        
        if ($activityDate->gt($currentDate)) {
            throw new \Exception('Activity has not started yet. Please wait until the activity date.');
        }
        
        if ($activityDate->lt($currentDate)) {
            return Absen::TEXT_TIDAK;
        }
        
        if (!$aktivitas->start_time) {
            return Absen::TEXT_YA;
        }
        
        // Check for early attendance (before allowed time)
        if ($this->isTooEarly($aktivitas, $arrivalTime)) {
            throw new \Exception('Too early to attend. Please wait until 15 minutes before activity start time.');
        }
        
        $comparisonTime = $arrivalTime;
        
        if ($aktivitas->end_time && $aktivitas->isAbsent($comparisonTime)) {
            return Absen::TEXT_TIDAK;
        }
        
        if ($aktivitas->isLate($comparisonTime)) {
            return Absen::TEXT_TERLAMBAT;
        }
        
        return Absen::TEXT_YA;
    }
    
    /**
     * Check if attendance is too early (before allowed time window)
     */
    protected function isTooEarly($aktivitas, $arrivalTime)
    {
        if (!$aktivitas->start_time) {
            return false;
        }
        
        $activityDate = Carbon::parse($aktivitas->tanggal);
        $arrivalDateTime = Carbon::parse($arrivalTime);
        
        // Handle both time-only (HH:MM:SS) and full datetime formats
        if (str_contains($aktivitas->start_time, ' ')) {
            // Full datetime format
            $startTime = Carbon::parse($aktivitas->start_time);
        } else {
            // Time-only format
            $startTime = Carbon::parse($activityDate->format('Y-m-d') . ' ' . $aktivitas->start_time);
        }
        
        // Allow attendance 15 minutes before start_time
        $earliestAllowedTime = $startTime->copy()->subMinutes(15);
        
        return $arrivalDateTime->lt($earliestAllowedTime);
    }
    
    public function recordAttendanceByQr($id_anak, $id_aktivitas, $status = null, $token, $arrivalTime = null, $gpsData = null)
    {
        DB::beginTransaction();
        
        try {
            $existingRecord = $this->checkExistingAttendance($id_anak, $id_aktivitas);
            
            if ($existingRecord) {
                DB::rollback();
                return [
                    'success' => false,
                    'message' => 'Attendance record already exists for this student in this activity',
                    'duplicate' => true,
                    'absen' => $existingRecord
                ];
            }
            
            $anak = Anak::findOrFail($id_anak);
            $aktivitas = Aktivitas::findOrFail($id_aktivitas);
            
            // GPS validation using shelter configuration
            $shelter = $aktivitas->shelter;
            $isBimbelActivity = $aktivitas->jenis_kegiatan === 'Bimbel';
            $isGpsRequired = ($shelter && $shelter->require_gps) || ($isBimbelActivity && $shelter && $shelter->latitude && $shelter->longitude);
            
            if ($gpsData && $isGpsRequired) {
                $gpsValidation = $this->validateGpsLocationFromShelter($shelter, $gpsData);
                if (!$gpsValidation['valid']) {
                    DB::rollback();
                    return [
                        'success' => false,
                        'message' => $gpsValidation['reason'],
                        'gps_validation' => $gpsValidation
                    ];
                }
            }
            $absenUser = AbsenUser::firstOrCreate(['id_anak' => $id_anak]);
            
            $now = Carbon::now();
            $timeArrived = $arrivalTime ? Carbon::parse($arrivalTime) : $now;
            
            $attendanceStatus = $this->determineAttendanceStatus($aktivitas, $timeArrived, $status);
            
            // Prepare attendance data
            $attendanceData = [
                'absen' => $attendanceStatus,
                'id_absen_user' => $absenUser->id_absen_user,
                'id_aktivitas' => $id_aktivitas,
                'is_read' => false,
                'is_verified' => false,
                'verification_status' => Absen::VERIFICATION_PENDING,
                'time_arrived' => $timeArrived
            ];
            
            // Add GPS data if provided
            if ($gpsData) {
                $attendanceData = array_merge($attendanceData, [
                    'latitude' => $gpsData['latitude'] ?? null,
                    'longitude' => $gpsData['longitude'] ?? null,
                    'gps_accuracy' => $gpsData['gps_accuracy'] ?? null,
                    'gps_recorded_at' => isset($gpsData['gps_recorded_at']) ? Carbon::parse($gpsData['gps_recorded_at']) : null,
                    'distance_from_activity' => $gpsData['distance_from_activity'] ?? null,
                    'gps_valid' => $gpsData['gps_valid'] ?? true,
                    'location_name' => $gpsData['location_name'] ?? null,
                    'gps_validation_notes' => $gpsData['gps_validation_notes'] ?? null,
                ]);
            }
            
            $absen = Absen::create($attendanceData);
            
            $verificationResult = $this->verificationService->verifyByQrCode(
                $absen->id_absen,
                $token,
                'QR code verification via mobile app'
            );
            
            if ($verificationResult['success']) {
                $absen->is_verified = true;
                $absen->verification_status = Absen::VERIFICATION_VERIFIED;
                $absen->save();
            }
            
            DB::commit();
            
            return [
                'success' => true,
                'absen' => $absen->refresh(),
                'verification' => $verificationResult
            ];
            
        } catch (\Exception $e) {
            DB::rollback();
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    
    public function recordAttendanceManually($id_anak, $id_aktivitas, $status = null, $notes = '', $arrivalTime = null, $gpsData = null)
    {
        DB::beginTransaction();

        try {
            $existingRecord = $this->checkExistingAttendance($id_anak, $id_aktivitas);
            
            if ($existingRecord) {
                DB::rollback();
                return [
                    'success' => false,
                    'message' => 'Attendance record already exists for this student in this activity',
                    'duplicate' => true,
                    'absen' => $existingRecord
                ];
            }
            
            $anak = Anak::findOrFail($id_anak);
            $aktivitas = Aktivitas::findOrFail($id_aktivitas);
            $absenUser = AbsenUser::firstOrCreate(['id_anak' => $id_anak]);
            
            $now = Carbon::now();
            $timeArrived = $arrivalTime ? Carbon::parse($arrivalTime) : $now;
            
            $attendanceStatus = $this->determineAttendanceStatus($aktivitas, $timeArrived, $status);
            
            // Prepare attendance data
            $attendanceData = [
                'absen' => $attendanceStatus,
                'id_absen_user' => $absenUser->id_absen_user,
                'id_aktivitas' => $id_aktivitas,
                'is_read' => false,
                'is_verified' => true,
                'verification_status' => Absen::VERIFICATION_MANUAL,
                'time_arrived' => $timeArrived
            ];
            
            // Add GPS data if provided
            if ($gpsData) {
                $attendanceData = array_merge($attendanceData, [
                    'latitude' => $gpsData['latitude'] ?? null,
                    'longitude' => $gpsData['longitude'] ?? null,
                    'gps_accuracy' => $gpsData['gps_accuracy'] ?? null,
                    'gps_recorded_at' => isset($gpsData['gps_recorded_at']) ? Carbon::parse($gpsData['gps_recorded_at']) : null,
                    'distance_from_activity' => $gpsData['distance_from_activity'] ?? null,
                    'gps_valid' => $gpsData['gps_valid'] ?? true,
                    'location_name' => $gpsData['location_name'] ?? null,
                    'gps_validation_notes' => $gpsData['gps_validation_notes'] ?? null,
                ]);
            }
            
            $absen = Absen::create($attendanceData);
            
            $verification = AttendanceVerification::create([
                'id_absen' => $absen->id_absen,
                'verification_method' => AttendanceVerification::METHOD_MANUAL,
                'is_verified' => true,
                'verification_notes' => $notes ?: 'Manual verification by admin',
                'verified_by' => Auth::user()->name ?? 'System',
                'verified_at' => Carbon::now()
            ]);
            
            DB::commit();
            
            return [
                'success' => true,
                'absen' => $absen->refresh(),
                'verification' => $verification
            ];
            
        } catch (\Exception $e) {
            DB::rollback();
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function generateAbsencesForCompletedActivity(Aktivitas $activity, bool $force = false)
    {
        $summary = [
            'success' => false,
            'activity_id' => $activity->id_aktivitas,
            'total_members' => 0,
            'already_marked' => 0,
            'created_count' => 0,
            'created_ids' => [],
            'message' => null,
        ];

        if (!$force && $activity->status !== 'completed' && !$activity->isCompleted()) {
            $summary['message'] = 'Activity has not ended yet.';
            return $summary;
        }

        $kelompok = null;

        if (!empty($activity->id_kelompok)) {
            $kelompok = Kelompok::with('anak')->find($activity->id_kelompok);
        }

        if (!$kelompok && !empty($activity->nama_kelompok)) {
            $kelompok = Kelompok::with('anak')
                ->where('nama_kelompok', $activity->nama_kelompok)
                ->when($activity->id_shelter, function ($query) use ($activity) {
                    $query->where('id_shelter', $activity->id_shelter);
                })
                ->first();
        }

        if (!$kelompok) {
            $summary['message'] = 'Kelompok not found for activity.';
            return $summary;
        }

        $members = $kelompok->anak ?? collect();
        $summary['total_members'] = $members->count();

        if ($summary['total_members'] === 0) {
            $summary['success'] = true;
            $summary['message'] = 'No members enrolled in kelompok.';
            return $summary;
        }

        return DB::transaction(function () use ($members, $activity, $summary) {
            $alreadyMarked = 0;
            $createdCount = 0;
            $createdIds = [];

            foreach ($members as $member) {
                if (!$member) {
                    continue;
                }

                $existingAttendance = $this->checkExistingAttendance($member->id_anak, $activity->id_aktivitas);

                if ($existingAttendance) {
                    $alreadyMarked++;
                    continue;
                }

                $absenUser = AbsenUser::firstOrCreate(['id_anak' => $member->id_anak]);

                $absen = Absen::create([
                    'id_absen_user' => $absenUser->id_absen_user,
                    'id_aktivitas' => $activity->id_aktivitas,
                    'absen' => Absen::TEXT_TIDAK,
                    'is_read' => false,
                    'is_verified' => true,
                    'verification_status' => Absen::VERIFICATION_VERIFIED,
                    'time_arrived' => null,
                ]);

                $createdIds[] = $absen->id_absen;
                $createdCount++;
            }

            $summary['success'] = true;
            $summary['already_marked'] = $alreadyMarked;
            $summary['created_count'] = $createdCount;
            $summary['created_ids'] = $createdIds;
            $summary['message'] = 'Absence generation completed.';

            return $summary;
        });
    }

    public function finalizeActivityCompletion(Aktivitas $activity, ?string $notes = null, bool $force = false): array
    {
        $summary = $this->generateAbsencesForCompletedActivity($activity, $force);

        if ($notes !== null) {
            $summary['notes'] = $notes;
        }

        return $summary;
    }

    public function getAttendanceByActivity($id_aktivitas, $filters = [])
    {
        $query = Absen::where('id_aktivitas', $id_aktivitas)
                     ->with([
                         'absenUser.anak',
                         'absenUser.tutor',
                         'aktivitas',
                         'verifications'
                     ]);
        
        if (isset($filters['is_verified'])) {
            $query->where('is_verified', $filters['is_verified']);
        }
        
        if (isset($filters['verification_status'])) {
            $query->where('verification_status', $filters['verification_status']);
        }
        
        if (isset($filters['status'])) {
            if ($filters['status'] === 'present') {
                $query->where('absen', Absen::TEXT_YA);
            } else if ($filters['status'] === 'absent') {
                $query->where('absen', Absen::TEXT_TIDAK);
            } else if ($filters['status'] === 'late') {
                $query->where('absen', Absen::TEXT_TERLAMBAT);
            }
        }
        
        return $query->get();
    }
    
    public function getAttendanceByStudent($id_anak, $filters = [])
    {
        $absenUser = AbsenUser::where('id_anak', $id_anak)->first();
        
        if (!$absenUser) {
            return collect();
        }
        
        $query = Absen::where('id_absen_user', $absenUser->id_absen_user)
                     ->with([
                         'absenUser.anak',
                         'absenUser.tutor',
                         'aktivitas',
                         'verifications'
                     ]);
        
        if (isset($filters['is_verified'])) {
            $query->where('is_verified', $filters['is_verified']);
        }
        
        if (isset($filters['verification_status'])) {
            $query->where('verification_status', $filters['verification_status']);
        }
        
        if (isset($filters['status'])) {
            if ($filters['status'] === 'present') {
                $query->where('absen', Absen::TEXT_YA);
            } else if ($filters['status'] === 'absent') {
                $query->where('absen', Absen::TEXT_TIDAK);
            } else if ($filters['status'] === 'late') {
                $query->where('absen', Absen::TEXT_TERLAMBAT);
            }
        }
        
        if (isset($filters['date_from'])) {
            $query->whereHas('aktivitas', function ($q) use ($filters) {
                $q->where('tanggal', '>=', $filters['date_from']);
            });
        }
        
        if (isset($filters['date_to'])) {
            $query->whereHas('aktivitas', function ($q) use ($filters) {
                $q->where('tanggal', '<=', $filters['date_to']);
            });
        }
        
        return $query->get();
    }
    
    public function generateAttendanceStats($startDate, $endDate, $id_shelter = null)
    {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();
        
        $aktivitasQuery = Aktivitas::whereBetween('tanggal', [$start, $end]);
        
        if ($id_shelter) {
            $aktivitasQuery->where('id_shelter', $id_shelter);
        }
        
        $aktivitasIds = $aktivitasQuery->pluck('id_aktivitas');
        
        $attendanceRecords = Absen::whereIn('id_aktivitas', $aktivitasIds)
                               ->with(['aktivitas', 'absenUser.anak'])
                               ->get();
        
        $totalRecords = $attendanceRecords->count();
        $present = $attendanceRecords->where('absen', Absen::TEXT_YA)->count();
        $late = $attendanceRecords->where('absen', Absen::TEXT_TERLAMBAT)->count();
        $absent = $totalRecords - $present - $late;
        $verified = $attendanceRecords->where('is_verified', true)->count();
        $unverified = $totalRecords - $verified;
        
        $verificationMethods = AttendanceVerification::whereIn('id_absen', $attendanceRecords->pluck('id_absen'))
                                                  ->get()
                                                  ->groupBy('verification_method')
                                                  ->map(function ($group) {
                                                      return $group->count();
                                                  });
        
        return [
            'date_range' => [
                'start' => $start->format('Y-m-d'),
                'end' => $end->format('Y-m-d'),
            ],
            'total_records' => $totalRecords,
            'verification_status' => [
                'verified' => $verified,
                'unverified' => $unverified,
                'verification_rate' => $totalRecords > 0 ? round(($verified / $totalRecords) * 100, 2) : 0,
            ],
            'attendance_status' => [
                'present' => $present,
                'late' => $late,
                'absent' => $absent,
                'present_rate' => $totalRecords > 0 ? round(($present / $totalRecords) * 100, 2) : 0,
                'late_rate' => $totalRecords > 0 ? round(($late / $totalRecords) * 100, 2) : 0,
                'attendance_rate' => $totalRecords > 0 ? round((($present + $late) / $totalRecords) * 100, 2) : 0,
            ],
            'verification_methods' => $verificationMethods,
        ];
    }

    public function recordTutorAttendanceByQr($id_tutor, $id_aktivitas, $status = null, $token, $arrivalTime = null, $gpsData = null)
    {
        DB::beginTransaction();
        
        try {
            $existingRecord = $this->checkExistingTutorAttendance($id_tutor, $id_aktivitas);
            
            if ($existingRecord) {
                DB::rollback();
                return [
                    'success' => false,
                    'message' => 'Attendance record already exists for this tutor in this activity',
                    'duplicate' => true,
                    'absen' => $existingRecord
                ];
            }
            
            $tutor = Tutor::findOrFail($id_tutor);
            $aktivitas = Aktivitas::findOrFail($id_aktivitas);
            
            if ($aktivitas->id_tutor != $id_tutor) {
                return [
                    'success' => false,
                    'message' => 'Tutor is not assigned to this activity'
                ];
            }
            
            // GPS validation using shelter configuration for tutors
            $shelter = $aktivitas->shelter;
            $isBimbelActivity = $aktivitas->jenis_kegiatan === 'Bimbel';
            $isGpsRequired = ($shelter && $shelter->require_gps) || ($isBimbelActivity && $shelter && $shelter->latitude && $shelter->longitude);
            
            if ($gpsData && $isGpsRequired) {
                $gpsValidation = $this->validateGpsLocationFromShelter($shelter, $gpsData);
                if (!$gpsValidation['valid']) {
                    DB::rollback();
                    return [
                        'success' => false,
                        'message' => $gpsValidation['reason'],
                        'gps_validation' => $gpsValidation
                    ];
                }
            }
            
            $absenUser = AbsenUser::firstOrCreate(['id_tutor' => $id_tutor]);
            
            $now = Carbon::now();
            $timeArrived = $arrivalTime ? Carbon::parse($arrivalTime) : $now;
            
            $attendanceStatus = $this->determineAttendanceStatus($aktivitas, $timeArrived, $status);
            
            // Prepare attendance data
            $attendanceData = [
                'absen' => $attendanceStatus,
                'id_absen_user' => $absenUser->id_absen_user,
                'id_aktivitas' => $id_aktivitas,
                'is_read' => false,
                'is_verified' => false,
                'verification_status' => Absen::VERIFICATION_PENDING,
                'time_arrived' => $timeArrived
            ];
            
            // Add GPS data if provided
            if ($gpsData) {
                $attendanceData = array_merge($attendanceData, [
                    'latitude' => $gpsData['latitude'] ?? null,
                    'longitude' => $gpsData['longitude'] ?? null,
                    'gps_accuracy' => $gpsData['gps_accuracy'] ?? null,
                    'gps_recorded_at' => isset($gpsData['gps_recorded_at']) ? Carbon::parse($gpsData['gps_recorded_at']) : null,
                    'distance_from_activity' => $gpsData['distance_from_activity'] ?? null,
                    'gps_valid' => $gpsData['gps_valid'] ?? true,
                    'location_name' => $gpsData['location_name'] ?? null,
                    'gps_validation_notes' => $gpsData['gps_validation_notes'] ?? null,
                ]);
            }
            
            $absen = Absen::create($attendanceData);
            
            $verificationResult = $this->verificationService->verifyTutorByQrCode(
                $absen->id_absen,
                $token,
                'QR code verification via mobile app'
            );
            
            if ($verificationResult['success']) {
                $absen->is_verified = true;
                $absen->verification_status = Absen::VERIFICATION_VERIFIED;
                $absen->save();
            }
            
            DB::commit();
            
            return [
                'success' => true,
                'absen' => $absen->refresh(),
                'verification' => $verificationResult
            ];
            
        } catch (\Exception $e) {
            DB::rollback();
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function recordTutorAttendanceManually($id_tutor, $id_aktivitas, $status = null, $notes = '', $arrivalTime = null, $gpsData = null)
    {
        DB::beginTransaction();
        
        try {
            $existingRecord = $this->checkExistingTutorAttendance($id_tutor, $id_aktivitas);
            
            if ($existingRecord) {
                DB::rollback();
                return [
                    'success' => false,
                    'message' => 'Attendance record already exists for this tutor in this activity',
                    'duplicate' => true,
                    'absen' => $existingRecord
                ];
            }
            
            $tutor = Tutor::findOrFail($id_tutor);
            $aktivitas = Aktivitas::findOrFail($id_aktivitas);
            
            if ($aktivitas->id_tutor != $id_tutor) {
                return [
                    'success' => false,
                    'message' => 'Tutor is not assigned to this activity'
                ];
            }
            
            // GPS validation using shelter configuration for manual tutor attendance
            $shelter = $aktivitas->shelter;
            $isBimbelActivity = $aktivitas->jenis_kegiatan === 'Bimbel';
            $isGpsRequired = ($shelter && $shelter->require_gps) || ($isBimbelActivity && $shelter && $shelter->latitude && $shelter->longitude);
            
            if ($gpsData && $isGpsRequired) {
                $gpsValidation = $this->validateGpsLocationFromShelter($shelter, $gpsData);
                if (!$gpsValidation['valid']) {
                    DB::rollback();
                    return [
                        'success' => false,
                        'message' => $gpsValidation['reason'],
                        'gps_validation' => $gpsValidation
                    ];
                }
            }
            
            $absenUser = AbsenUser::firstOrCreate(['id_tutor' => $id_tutor]);
            
            $now = Carbon::now();
            $timeArrived = $arrivalTime ? Carbon::parse($arrivalTime) : $now;
            
            $attendanceStatus = $this->determineAttendanceStatus($aktivitas, $timeArrived, $status);
            
            // Prepare attendance data
            $attendanceData = [
                'absen' => $attendanceStatus,
                'id_absen_user' => $absenUser->id_absen_user,
                'id_aktivitas' => $id_aktivitas,
                'is_read' => false,
                'is_verified' => true,
                'verification_status' => Absen::VERIFICATION_MANUAL,
                'time_arrived' => $timeArrived
            ];
            
            // Add GPS data if provided
            if ($gpsData) {
                $attendanceData = array_merge($attendanceData, [
                    'latitude' => $gpsData['latitude'] ?? null,
                    'longitude' => $gpsData['longitude'] ?? null,
                    'gps_accuracy' => $gpsData['gps_accuracy'] ?? null,
                    'gps_recorded_at' => isset($gpsData['gps_recorded_at']) ? Carbon::parse($gpsData['gps_recorded_at']) : null,
                    'distance_from_activity' => $gpsData['distance_from_activity'] ?? null,
                    'gps_valid' => $gpsData['gps_valid'] ?? true,
                    'location_name' => $gpsData['location_name'] ?? null,
                    'gps_validation_notes' => $gpsData['gps_validation_notes'] ?? null,
                ]);
            }
            
            $absen = Absen::create($attendanceData);
            
            $verification = AttendanceVerification::create([
                'id_absen' => $absen->id_absen,
                'verification_method' => AttendanceVerification::METHOD_MANUAL,
                'is_verified' => true,
                'verification_notes' => $notes ?: 'Manual tutor verification by admin',
                'verified_by' => Auth::user()->name ?? 'System',
                'verified_at' => Carbon::now(),
                'metadata' => [
                    'type' => 'tutor'
                ]
            ]);
            
            DB::commit();
            
            return [
                'success' => true,
                'absen' => $absen->refresh(),
                'verification' => $verification
            ];
            
        } catch (\Exception $e) {
            DB::rollback();
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function getTutorAttendanceByActivity($id_aktivitas)
    {
        $aktivitas = Aktivitas::findOrFail($id_aktivitas);
        
        if (!$aktivitas->id_tutor) {
            return null;
        }
        
        $absenUser = AbsenUser::where('id_tutor', $aktivitas->id_tutor)->first();
        
        if (!$absenUser) {
            return null;
        }
        
        return Absen::where('id_absen_user', $absenUser->id_absen_user)
                    ->where('id_aktivitas', $id_aktivitas)
                    ->with([
                        'absenUser.tutor',
                        'aktivitas',
                        'verifications'
                    ])
                    ->first();
    }

    public function getTutorAttendanceByTutor($id_tutor, $filters = [])
    {
        $absenUser = AbsenUser::where('id_tutor', $id_tutor)->first();
        
        if (!$absenUser) {
            return collect();
        }
        
        $query = Absen::where('id_absen_user', $absenUser->id_absen_user)
                     ->with([
                         'absenUser.tutor',
                         'aktivitas',
                         'verifications'
                     ]);
        
        if (isset($filters['is_verified'])) {
            $query->where('is_verified', $filters['is_verified']);
        }
        
        if (isset($filters['verification_status'])) {
            $query->where('verification_status', $filters['verification_status']);
        }
        
        if (isset($filters['status'])) {
            if ($filters['status'] === 'present') {
                $query->where('absen', Absen::TEXT_YA);
            } else if ($filters['status'] === 'absent') {
                $query->where('absen', Absen::TEXT_TIDAK);
            } else if ($filters['status'] === 'late') {
                $query->where('absen', Absen::TEXT_TERLAMBAT);
            }
        }
        
        if (isset($filters['date_from'])) {
            $query->whereHas('aktivitas', function ($q) use ($filters) {
                $q->where('tanggal', '>=', $filters['date_from']);
            });
        }
        
        if (isset($filters['date_to'])) {
            $query->whereHas('aktivitas', function ($q) use ($filters) {
                $q->where('tanggal', '<=', $filters['date_to']);
            });
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }

    protected function checkExistingTutorAttendance($id_tutor, $id_aktivitas)
    {
        $absenUser = AbsenUser::where('id_tutor', $id_tutor)->first();
        
        if (!$absenUser) {
            return false;
        }
        
        $existingRecord = Absen::where('id_absen_user', $absenUser->id_absen_user)
                               ->where('id_aktivitas', $id_aktivitas)
                               ->first();
        
        return $existingRecord ?: false;
    }

    public function getTutorActivitiesForHonor($id_tutor, $month, $year)
    {
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = Carbon::create($year, $month, 1)->endOfMonth();

        return Aktivitas::where('id_tutor', $id_tutor)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->whereHas('absen.absenUser', function($query) use ($id_tutor) {
                $query->where('id_tutor', $id_tutor)
                      ->whereHas('absen', function($subQuery) {
                          $subQuery->whereIn('absen', ['Ya', 'Terlambat']);
                      });
            })
            ->with(['absen.absenUser'])
            ->get();
    }

    public function getStudentAttendanceCount($id_aktivitas)
    {
        return Absen::where('id_aktivitas', $id_aktivitas)
            ->whereIn('absen', ['Ya', 'Terlambat'])
            ->whereHas('absenUser', function($query) {
                $query->whereNotNull('id_anak');
            })
            ->count();
    }

    public function getTutorAttendanceStats($id_tutor, $startDate, $endDate)
    {
        $absenUser = AbsenUser::where('id_tutor', $id_tutor)->first();
        
        if (!$absenUser) {
            return [
                'total_activities' => 0,
                'attended_activities' => 0,
                'attendance_rate' => 0
            ];
        }

        $totalActivities = Aktivitas::where('id_tutor', $id_tutor)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->count();

        $attendedActivities = Absen::where('id_absen_user', $absenUser->id_absen_user)
            ->whereIn('absen', ['Ya', 'Terlambat'])
            ->whereHas('aktivitas', function($query) use ($startDate, $endDate) {
                $query->whereBetween('tanggal', [$startDate, $endDate]);
            })
            ->count();

        return [
            'total_activities' => $totalActivities,
            'attended_activities' => $attendedActivities,
            'attendance_rate' => $totalActivities > 0 ? round(($attendedActivities / $totalActivities) * 100, 2) : 0
        ];
    }

    // Unified type-aware methods
    public function recordByQr($targetId, $idAktivitas, $status, $token, $arrivalTime, $type = 'student')
    {
        if ($type === 'tutor') {
            return $this->recordTutorAttendanceByQr($targetId, $idAktivitas, $status, $token, $arrivalTime);
        }
        
        return $this->recordAttendanceByQr($targetId, $idAktivitas, $status, $token, $arrivalTime);
    }

    public function recordManually($targetId, $idAktivitas, $status, $notes, $arrivalTime, $type = 'student')
    {
        if ($type === 'tutor') {
            return $this->recordTutorAttendanceManually($targetId, $idAktivitas, $status, $notes, $arrivalTime);
        }
        
        return $this->recordAttendanceManually($targetId, $idAktivitas, $status, $notes, $arrivalTime);
    }

    public function getAttendanceByTarget($targetId, $filters, $type = 'student')
    {
        if ($type === 'tutor') {
            return $this->getTutorAttendanceByTutor($targetId, $filters);
        }
        
        return $this->getAttendanceByStudent($targetId, $filters);
    }

    protected function getOrCreateAbsenUser($targetId, $type)
    {
        if ($type === 'tutor') {
            return AbsenUser::firstOrCreate(['id_tutor' => $targetId]);
        }
        
        return AbsenUser::firstOrCreate(['id_anak' => $targetId]);
    }

    protected function checkExistingAttendanceByType($targetId, $idAktivitas, $type)
    {
        if ($type === 'tutor') {
            return $this->checkExistingTutorAttendance($targetId, $idAktivitas);
        }
        
        return $this->checkExistingAttendance($targetId, $idAktivitas);
    }
    
    /**
     * Validate GPS location for attendance using shelter configuration
     */
    protected function validateGpsLocationFromShelter($shelter, $gpsData)
    {
        // Note: This method is called when GPS validation is required
        // Caller should determine if GPS is required before calling this method
        
        // Check if shelter has GPS coordinates set
        if (!$shelter->latitude || !$shelter->longitude) {
            return [
                'valid' => false,
                'reason' => 'Shelter location not configured. Please contact administrator.',
                'error_type' => 'missing_shelter_location'
            ];
        }
        
        // Validate GPS data format
        if (!isset($gpsData['latitude']) || !isset($gpsData['longitude'])) {
            return [
                'valid' => false,
                'reason' => 'Invalid GPS data format. Location coordinates required.',
                'error_type' => 'invalid_gps_format'
            ];
        }
        
        // Check GPS accuracy if provided
        if (isset($gpsData['accuracy'])) {
            $requiredAccuracy = $shelter->gps_accuracy_required ?: 25;
            if (!$this->locationService->isAccuracyAcceptable($gpsData['accuracy'], $requiredAccuracy)) {
                return [
                    'valid' => false,
                    'reason' => "GPS accuracy ({$gpsData['accuracy']}m) is too low. Please try again with better signal.",
                    'error_type' => 'low_accuracy',
                    'required_accuracy' => $requiredAccuracy,
                    'current_accuracy' => $gpsData['accuracy']
                ];
            }
        }
        
        // Validate location within allowed radius
        $attendanceLocation = [
            'latitude' => $gpsData['latitude'],
            'longitude' => $gpsData['longitude']
        ];
        
        $shelterLocation = [
            'latitude' => $shelter->latitude,
            'longitude' => $shelter->longitude
        ];
        
        $maxDistance = $shelter->max_distance_meters ?: 100; // Default 100m if not set
        
        $validation = $this->locationService->validateAttendanceLocation(
            $attendanceLocation,
            $shelterLocation,
            $maxDistance
        );
        
        if (!$validation['valid']) {
            return [
                'valid' => false,
                'reason' => $validation['reason'],
                'error_type' => 'location_out_of_range',
                'distance' => $validation['distance'],
                'max_distance' => $validation['max_distance']
            ];
        }
        
        return [
            'valid' => true,
            'distance' => $validation['distance'],
            'max_distance' => $validation['max_distance']
        ];
    }

    /**
     * Validate GPS location for attendance (legacy method for aktivitas-based GPS - kept for backward compatibility)
     */
    protected function validateGpsLocation($aktivitas, $gpsData)
    {
        // If shelter has GPS config, use that instead
        $shelter = $aktivitas->shelter;
        if ($shelter && $shelter->require_gps) {
            return $this->validateGpsLocationFromShelter($shelter, $gpsData);
        }

        // Fallback to aktivitas-based GPS (legacy)
        if (!$aktivitas->require_gps) {
            return ['valid' => true, 'reason' => null];
        }
        
        // Check if activity has GPS coordinates set
        if (!$aktivitas->latitude || !$aktivitas->longitude) {
            return [
                'valid' => false,
                'reason' => 'Activity location not configured. Please contact administrator.',
                'error_type' => 'missing_activity_location'
            ];
        }
        
        // Validate GPS data format
        if (!isset($gpsData['latitude']) || !isset($gpsData['longitude'])) {
            return [
                'valid' => false,
                'reason' => 'Invalid GPS data format. Location coordinates required.',
                'error_type' => 'invalid_gps_format'
            ];
        }
        
        // Check GPS accuracy if provided
        if (isset($gpsData['accuracy'])) {
            $maxAccuracy = $this->locationService->getSuggestedAccuracy('default');
            if (!$this->locationService->isAccuracyAcceptable($gpsData['accuracy'], $maxAccuracy)) {
                return [
                    'valid' => false,
                    'reason' => "GPS accuracy ({$gpsData['accuracy']}m) is too low. Please try again with better signal.",
                    'error_type' => 'low_accuracy',
                    'required_accuracy' => $maxAccuracy,
                    'current_accuracy' => $gpsData['accuracy']
                ];
            }
        }
        
        // Validate location within allowed radius
        $attendanceLocation = [
            'latitude' => $gpsData['latitude'],
            'longitude' => $gpsData['longitude']
        ];
        
        $activityLocation = [
            'latitude' => $aktivitas->latitude,
            'longitude' => $aktivitas->longitude
        ];
        
        $maxDistance = $aktivitas->max_distance_meters ?: 100; // Default 100m if not set
        
        $validation = $this->locationService->validateAttendanceLocation(
            $attendanceLocation,
            $activityLocation,
            $maxDistance
        );
        
        if (!$validation['valid']) {
            return [
                'valid' => false,
                'reason' => $validation['reason'],
                'error_type' => 'location_out_of_range',
                'distance' => $validation['distance'],
                'max_distance' => $validation['max_distance']
            ];
        }
        
        return [
            'valid' => true,
            'distance' => $validation['distance'],
            'max_distance' => $validation['max_distance']
        ];
    }
    
    /**
     * Enhanced QR attendance with GPS support
     */
    public function recordAttendanceByQrWithGPS($id_anak, $id_aktivitas, $status = null, $token, $arrivalTime = null, $gpsData = null)
    {
        return $this->recordAttendanceByQr($id_anak, $id_aktivitas, $status, $token, $arrivalTime, $gpsData);
    }
    
    /**
     * Enhanced manual attendance with GPS support
     */
    public function recordAttendanceManuallyWithGPS($id_anak, $id_aktivitas, $status = null, $notes = '', $arrivalTime = null, $gpsData = null)
    {
        return $this->recordAttendanceManually($id_anak, $id_aktivitas, $status, $notes, $arrivalTime, $gpsData);
    }
    
    /**
     * Enhanced tutor QR attendance with GPS support
     */
    public function recordTutorAttendanceByQrWithGPS($id_tutor, $id_aktivitas, $status = null, $token, $arrivalTime = null, $gpsData = null)
    {
        return $this->recordTutorAttendanceByQr($id_tutor, $id_aktivitas, $status, $token, $arrivalTime, $gpsData);
    }
    
    /**
     * Check if GPS is required for activity
     */
    public function isGpsRequired($id_aktivitas)
    {
        $aktivitas = Aktivitas::with('shelter')->find($id_aktivitas);
        if (!$aktivitas) {
            return false;
        }
        
        $shelter = $aktivitas->shelter;
        $isBimbelActivity = $aktivitas->jenis_kegiatan === 'Bimbel';
        
        // For Bimbel activities, GPS is required if shelter has GPS config
        if ($isBimbelActivity && $shelter && $shelter->latitude && $shelter->longitude) {
            return true;
        }
        
        // For other activities, check shelter or activity GPS requirements
        return ($shelter && $shelter->require_gps) || $aktivitas->require_gps;
    }
    
    /**
     * Get GPS configuration for activity
     */
    public function getGpsConfig($id_aktivitas)
    {
        $aktivitas = Aktivitas::with('shelter')->find($id_aktivitas);
        
        if (!$aktivitas) {
            return null;
        }

        $shelter = $aktivitas->shelter;
        $isBimbelActivity = $aktivitas->jenis_kegiatan === 'Bimbel';
        
        // For Bimbel activities, GPS is always required if shelter has GPS config
        if ($isBimbelActivity && $shelter && $shelter->latitude && $shelter->longitude) {
            return [
                'required' => true,
                'require_gps' => true,
                'latitude' => $shelter->latitude,
                'longitude' => $shelter->longitude,
                'max_distance' => $shelter->max_distance_meters ?: 50,
                'max_distance_meters' => $shelter->max_distance_meters ?: 50,
                'gps_accuracy_required' => $shelter->gps_accuracy_required ?: 25,
                'location_name' => $shelter->location_name ?: $shelter->nama_shelter,
                'shelter_name' => $shelter->nama_shelter,
                'source' => 'shelter_bimbel',
                'suggested_accuracy' => $shelter->gps_accuracy_required ?: 25
            ];
        }
        
        // Prioritize shelter GPS config over activity GPS config for other activities
        if ($shelter && $shelter->require_gps) {
            return [
                'required' => true,
                'require_gps' => true,
                'latitude' => $shelter->latitude,
                'longitude' => $shelter->longitude,
                'max_distance' => $shelter->max_distance_meters ?: 100,
                'max_distance_meters' => $shelter->max_distance_meters ?: 100,
                'gps_accuracy_required' => $shelter->gps_accuracy_required ?: 25,
                'location_name' => $shelter->location_name ?: $shelter->nama_shelter,
                'shelter_name' => $shelter->nama_shelter,
                'source' => 'shelter',
                'suggested_accuracy' => $shelter->gps_accuracy_required ?: 25
            ];
        }
        
        // Fallback to activity GPS config (legacy support)
        if ($aktivitas->require_gps) {
            return [
                'required' => true,
                'require_gps' => true,
                'latitude' => $aktivitas->latitude,
                'longitude' => $aktivitas->longitude,
                'max_distance' => $aktivitas->max_distance_meters ?: 100,
                'max_distance_meters' => $aktivitas->max_distance_meters ?: 100,
                'location_name' => $aktivitas->location_name,
                'source' => 'activity',
                'suggested_accuracy' => $this->locationService->getSuggestedAccuracy('default')
            ];
        }
        
        // GPS not required
        return [
            'required' => false,
            'require_gps' => false,
            'source' => 'none'
        ];
    }
}