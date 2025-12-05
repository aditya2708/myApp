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
use Illuminate\Support\Facades\Schema;
use App\Services\Attendance\AbsenUserFactory;
use App\Services\Attendance\CompanyContextResolver;
use App\Services\Attendance\GpsMetadataService;
use App\Services\Attendance\StudentAttendanceProcessor;
use App\Services\Attendance\TutorAttendanceProcessor;

class AttendanceService
{
    protected $locationService;
    protected CompanyContextResolver $companyContextResolver;
    protected AbsenUserFactory $absenUserFactory;
    protected GpsMetadataService $gpsMetadataService;
    protected StudentAttendanceProcessor $studentAttendanceProcessor;
    protected TutorAttendanceProcessor $tutorAttendanceProcessor;

    public function __construct(
        LocationService $locationService,
        CompanyContextResolver $companyContextResolver,
        AbsenUserFactory $absenUserFactory,
        GpsMetadataService $gpsMetadataService,
        StudentAttendanceProcessor $studentAttendanceProcessor,
        TutorAttendanceProcessor $tutorAttendanceProcessor,
    ) {
        $this->locationService = $locationService;
        $this->companyContextResolver = $companyContextResolver;
        $this->absenUserFactory = $absenUserFactory;
        $this->gpsMetadataService = $gpsMetadataService;
        $this->studentAttendanceProcessor = $studentAttendanceProcessor;
        $this->tutorAttendanceProcessor = $tutorAttendanceProcessor;
    }

    /**
     * Resolve company_id from SSO context, admin shelter, anak, tutor, atau aktivitas.
     */
    protected function resolveCompanyId(?Anak $anak = null, ?Aktivitas $aktivitas = null, ?Tutor $tutor = null): ?int
    {
        return $this->companyContextResolver->resolve($anak, $aktivitas, $tutor);
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
    
    
    public function recordAttendanceByQr($id_anak, $id_aktivitas, $status = null, $token, $arrivalTime = null, $gpsData = null)
    {
        return $this->studentAttendanceProcessor->recordByQr($id_anak, $id_aktivitas, $status, $token, $arrivalTime, $gpsData);
    }
    
    public function recordAttendanceManually($id_anak, $id_aktivitas, $status = null, $notes = '', $arrivalTime = null, $gpsData = null)
    {
        return $this->studentAttendanceProcessor->recordManually($id_anak, $id_aktivitas, $status, $notes, $arrivalTime, $gpsData);
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

                $companyId = $this->resolveCompanyId($member, $activity);
                $absenUser = $this->absenUserFactory->forAnak($member->id_anak, $companyId);

                $absenData = [
                    'id_absen_user' => $absenUser->id_absen_user,
                    'id_aktivitas' => $activity->id_aktivitas,
                    'absen' => Absen::TEXT_TIDAK,
                    'is_read' => false,
                    'is_verified' => true,
                    'verification_status' => Absen::VERIFICATION_VERIFIED,
                    'time_arrived' => null,
                ];

                if ($companyId && Schema::hasColumn('absen', 'company_id')) {
                    $absenData['company_id'] = $companyId;
                }

                $absen = Absen::create($absenData);

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

    public function getAttendanceByActivity($id_aktivitas, $filters = [], ?int $companyId = null)
    {
        $query = Absen::where('id_aktivitas', $id_aktivitas)
                     ->with([
                         'absenUser.anak',
                         'absenUser.tutor',
                         'aktivitas',
                         'verifications'
                     ])
                     ->when($companyId && Schema::hasColumn('absen', 'company_id'), function ($q) use ($companyId) {
                         $q->where('company_id', $companyId);
                     });
        
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
    
    public function getAttendanceByStudent($id_anak, $filters = [], $companyId = null)
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
                     ])
                     ->when($companyId && Schema::hasColumn('absen', 'company_id'), function ($q) use ($companyId) {
                         $q->where('company_id', $companyId);
                     });
        
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
        return $this->tutorAttendanceProcessor->recordByQr($id_tutor, $id_aktivitas, $status, $token, $arrivalTime, $gpsData);
    }

    public function recordTutorAttendanceManually($id_tutor, $id_aktivitas, $status = null, $notes = '', $arrivalTime = null, $gpsData = null)
    {
        return $this->tutorAttendanceProcessor->recordManually($id_tutor, $id_aktivitas, $status, $notes, $arrivalTime, $gpsData);
    }

    public function getTutorAttendanceByActivity($id_aktivitas, ?int $companyId = null)
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
                    ->when($companyId && Schema::hasColumn('absen', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                    ->with([
                        'absenUser.tutor',
                        'aktivitas',
                        'verifications'
                    ])
                    ->first();
    }

    public function getTutorAttendanceByTutor($id_tutor, $filters = [], ?int $companyId = null)
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

        if ($companyId && Schema::hasColumn('absen', 'company_id')) {
            $query->where('company_id', $companyId);
        }
        
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
            $query->whereHas('aktivitas', function ($q) use ($filters, $companyId) {
                $q->where('tanggal', '>=', $filters['date_from']);

                if ($companyId && Schema::hasColumn('aktivitas', 'company_id')) {
                    $q->where('aktivitas.company_id', $companyId);
                }
            });
        }
        
        if (isset($filters['date_to'])) {
            $query->whereHas('aktivitas', function ($q) use ($filters, $companyId) {
                $q->where('tanggal', '<=', $filters['date_to']);

                if ($companyId && Schema::hasColumn('aktivitas', 'company_id')) {
                    $q->where('aktivitas.company_id', $companyId);
                }
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
            $tutor = Tutor::find($targetId);
            $companyId = $this->resolveCompanyId(null, null, $tutor);

            return $this->absenUserFactory->forTutor($targetId, $companyId);
        }

        $anak = Anak::find($targetId);
        $companyId = $this->resolveCompanyId($anak, null, null);

        return $this->absenUserFactory->forAnak($targetId, $companyId);
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
        return $this->gpsMetadataService->validateGpsLocationFromShelter($shelter, $gpsData);
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

    public function getTutorAttendanceSummaryForShelter(int $shelterId, array $filters = [], ?int $companyId = null)
    {
        $baseActivityQuery = Aktivitas::query()
            ->where('id_shelter', $shelterId)
            ->when($companyId && Schema::hasColumn('aktivitas', 'company_id'), fn ($q) => $q->where('company_id', $companyId));

        if (!empty($filters['date_from'])) {
            $baseActivityQuery->whereDate('tanggal', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $baseActivityQuery->whereDate('tanggal', '<=', $filters['date_to']);
        }

        if (!empty($filters['jenis_kegiatan'])) {
            $baseActivityQuery->where('jenis_kegiatan', $filters['jenis_kegiatan']);
        }

        $activityStatsQuery = (clone $baseActivityQuery)
            ->select([
                'id_tutor',
                DB::raw('COUNT(DISTINCT id_aktivitas) as total_activities'),
                DB::raw("GROUP_CONCAT(DISTINCT jenis_kegiatan ORDER BY jenis_kegiatan SEPARATOR ',') as activity_types"),
            ])
            ->groupBy('id_tutor');

        $filteredActivitiesForAttendance = (clone $baseActivityQuery)
            ->select([
                'id_aktivitas',
                'id_tutor',
            ]);

        $attendanceStatsQuery = Absen::query()
            ->select([
                'absen_user.id_tutor',
                DB::raw("SUM(CASE WHEN absen.absen = '" . Absen::TEXT_YA . "' THEN 1 ELSE 0 END) as present_count"),
                DB::raw("SUM(CASE WHEN absen.absen = '" . Absen::TEXT_TERLAMBAT . "' THEN 1 ELSE 0 END) as late_count"),
                DB::raw("SUM(CASE WHEN absen.absen = '" . Absen::TEXT_TIDAK . "' THEN 1 ELSE 0 END) as absent_count"),
                DB::raw('COUNT(*) as verified_attendance_count'),
            ])
            ->join('absen_user', function ($join) {
                $join->on('absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->whereNotNull('absen_user.id_tutor');
            })
            ->joinSub($filteredActivitiesForAttendance, 'filtered_activities', function ($join) {
                $join->on('filtered_activities.id_aktivitas', '=', 'absen.id_aktivitas')
                    ->whereColumn('filtered_activities.id_tutor', 'absen_user.id_tutor');
            })
            ->when($companyId && Schema::hasColumn('absen', 'company_id'), fn ($q) => $q->where('absen.company_id', $companyId))
            ->where('absen.is_verified', true)
            ->groupBy('absen_user.id_tutor');

        $tutors = Tutor::query()
            ->where('tutor.id_shelter', $shelterId)
            ->when($companyId && Schema::hasColumn('tutor', 'company_id'), fn ($q) => $q->where('tutor.company_id', $companyId))
            ->leftJoinSub($activityStatsQuery, 'activity_stats', function ($join) {
                $join->on('activity_stats.id_tutor', '=', 'tutor.id_tutor');
            })
            ->leftJoinSub($attendanceStatsQuery, 'attendance_stats', function ($join) {
                $join->on('attendance_stats.id_tutor', '=', 'tutor.id_tutor');
            })
            ->select([
                'tutor.id_tutor',
                'tutor.nama',
                'tutor.email',
                'tutor.no_hp',
                'tutor.foto',
                'tutor.maple',
                DB::raw('COALESCE(activity_stats.total_activities, 0) as total_activities'),
                'activity_stats.activity_types',
                DB::raw('COALESCE(attendance_stats.present_count, 0) as present_count'),
                DB::raw('COALESCE(attendance_stats.late_count, 0) as late_count'),
                DB::raw('COALESCE(attendance_stats.absent_count, 0) as absent_count'),
                DB::raw('COALESCE(attendance_stats.verified_attendance_count, 0) as verified_attendance_count'),
            ])
            ->orderBy('tutor.nama')
            ->get();

        return $tutors->map(function ($tutor) {
            $totalActivities = (int) ($tutor->total_activities ?? 0);
            $presentCount = (int) ($tutor->present_count ?? 0);
            $lateCount = (int) ($tutor->late_count ?? 0);
            $absentCount = (int) ($tutor->absent_count ?? 0);
            $verifiedAttendanceCount = (int) ($tutor->verified_attendance_count ?? 0);
            $totalVerifiedSessions = $presentCount + $lateCount + $absentCount;

            if ($verifiedAttendanceCount === 0) {
                $verifiedAttendanceCount = $totalVerifiedSessions;
            }

            $attendanceRate = null;

            if ($totalActivities > 0) {
                $attendanceRate = $totalVerifiedSessions > 0
                    ? round((($presentCount + $lateCount) / $totalActivities) * 100, 2)
                    : 0;
            }

            $activityTypes = collect(explode(',', (string) ($tutor->activity_types ?? '')))
                ->map(fn ($type) => trim($type))
                ->filter()
                ->unique()
                ->values()
                ->all();

            return [
                'id_tutor' => $tutor->id_tutor,
                'nama' => $tutor->nama,
                'email' => $tutor->email,
                'no_hp' => $tutor->no_hp,
                'foto' => $tutor->foto,
                'foto_url' => method_exists($tutor, 'getFotoUrlAttribute') ? $tutor->foto_url : null,
                'maple' => $tutor->maple,
                'total_activities' => $totalActivities,
                'present_count' => $presentCount,
                'late_count' => $lateCount,
                'absent_count' => $absentCount,
                'verified_attendance_count' => $verifiedAttendanceCount,
                'verified_present_count' => $presentCount,
                'verified_late_count' => $lateCount,
                'verified_absent_count' => $absentCount,
                'attendance_total' => $totalVerifiedSessions,
                'attendance_rate' => $attendanceRate,
                'activity_types' => $activityTypes,
            ];
        });
    }
}
