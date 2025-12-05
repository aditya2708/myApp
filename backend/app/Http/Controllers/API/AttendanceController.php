<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\AttendanceRequest;
use Illuminate\Http\Request;
use App\Models\Absen;
use App\Models\Anak;
use App\Models\Tutor;
use App\Models\Semester;
use App\Models\Aktivitas;
use App\Models\AttendanceVerification;
use App\Models\Kelompok;
use App\Services\AttendanceService;
use App\Services\VerificationService;
use App\Services\QrTokenService;
use App\Http\Resources\AttendanceResource;
use App\Support\SsoContext;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class AttendanceController extends Controller
{
    protected $attendanceService;
    protected $verificationService;
    protected $qrTokenService;
    
    public function __construct(
        AttendanceService $attendanceService,
        VerificationService $verificationService,
        QrTokenService $qrTokenService
    ) {
        $this->attendanceService = $attendanceService;
        $this->verificationService = $verificationService;
        $this->qrTokenService = $qrTokenService;
    }
    
    public function recordByQr(AttendanceRequest $request)
    {
        try {
            $adminShelter = $this->adminShelter();
            $companyId = $this->companyId();
            $shelterId = $this->shelterId();

            if (!$adminShelter || !$shelterId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $aktivitas = $this->scopedActivity((int) $request->id_aktivitas);

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found in your shelter scope'
                ], 404);
            }

            $attendanceCheck = $aktivitas->canRecordAttendance();
            
            if (!$attendanceCheck['allowed']) {
                return response()->json([
                    'success' => false,
                    'message' => $attendanceCheck['reason']
                ], 422);
            }
            
            $type = $request->type ?? 'student';
            $targetId = $request->target_id ?? $request->id_anak ?? $request->id_tutor;
            $student = null;
            $tutor = null;

            if ($type === 'student') {
                $student = Anak::where('id_anak', $targetId)
                    ->where('id_shelter', $shelterId)
                    ->when($companyId && Schema::hasColumn('anak', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                    ->first();

                if (!$student) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Child not found in your shelter'
                    ], 404);
                }
            } else {
                $tutorId = $targetId ?: $aktivitas->id_tutor;
                $tutor = Tutor::where('id_tutor', $tutorId)
                    ->where('id_shelter', $shelterId)
                    ->when($companyId && Schema::hasColumn('tutor', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                    ->first();

                if (!$tutor) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tutor not found in your shelter'
                    ], 404);
                }
                $targetId = $tutor->id_tutor;
            }
            
            if ($type === 'student') {
                $result = $this->attendanceService->recordAttendanceByQr(
                    $student->id_anak,
                    $request->id_aktivitas,
                    $request->status,
                    $request->token,
                    $request->arrival_time,
                    $request->gps_data
                );
            } else {
                // For tutor QR, get tutor ID from activity's assigned tutor
                $result = $this->attendanceService->recordTutorAttendanceByQr(
                    $targetId,
                    $request->id_aktivitas,
                    $request->status,
                    $request->token,
                    $request->arrival_time,
                    $request->gps_data
                );
            }
            
            if (!$result['success']) {
                if (isset($result['duplicate']) && $result['duplicate']) {
                    return response()->json([
                        'success' => false,
                        'message' => $result['message'],
                        'data' => new AttendanceResource($result['absen'])
                    ], 409);
                }
                
                // GPS validation error handling
                if (isset($result['gps_validation'])) {
                    return response()->json([
                        'success' => false,
                        'message' => $result['message'],
                        'error_type' => 'gps_validation_failed',
                        'gps_validation' => $result['gps_validation']
                    ], 422);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }
            
            $message = $type === 'student' ? 'Attendance recorded successfully' : 'Tutor attendance recorded successfully';
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => new AttendanceResource($result['absen']),
                'verification' => $result['verification'],
                'flags' => $result['flags'] ?? []
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
    
    public function recordAttendanceByQr(AttendanceRequest $request)
    {
        $request->merge(['type' => 'student', 'target_id' => $request->id_anak]);
        return $this->recordByQr($request);
    }
    
    public function recordManually(AttendanceRequest $request)
    {
        try {
            $adminShelter = $this->adminShelter();
            $companyId = $this->companyId();
            $shelterId = $this->shelterId();

            if (!$adminShelter || !$shelterId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $aktivitas = $this->scopedActivity((int) $request->id_aktivitas);

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found in your shelter scope'
                ], 404);
            }

            $attendanceCheck = $aktivitas->canRecordAttendance();
            
            if (!$attendanceCheck['allowed']) {
                return response()->json([
                    'success' => false,
                    'message' => $attendanceCheck['reason']
                ], 422);
            }
            
            $type = $request->type ?? 'student';
            $targetId = $request->target_id ?? $request->id_anak ?? $request->id_tutor;
            $student = null;
            $tutor = null;

            if ($type === 'student') {
                $student = Anak::where('id_anak', $targetId)
                    ->where('id_shelter', $shelterId)
                    ->when($companyId && Schema::hasColumn('anak', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                    ->first();

                if (!$student) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Child not found in your shelter'
                    ], 404);
                }
            } else {
                $tutorId = $targetId ?: $aktivitas->id_tutor;
                $tutor = Tutor::where('id_tutor', $tutorId)
                    ->where('id_shelter', $shelterId)
                    ->when($companyId && Schema::hasColumn('tutor', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                    ->first();

                if (!$tutor) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Tutor not found in your shelter'
                    ], 404);
                }
                $targetId = $tutor->id_tutor;
            }
            
            if ($type === 'student') {
                $result = $this->attendanceService->recordAttendanceManually(
                    $student->id_anak,
                    $request->id_aktivitas,
                    $request->status,
                    $request->notes,
                    $request->arrival_time,
                    $request->gps_data
                );
            } else {
                // For tutor manual, get tutor ID from target_id or activity's assigned tutor
                $result = $this->attendanceService->recordTutorAttendanceManually(
                    $targetId,
                    $request->id_aktivitas,
                    $request->status,
                    $request->notes,
                    $request->arrival_time,
                    $request->gps_data
                );
            }
            
            if (!$result['success']) {
                if (isset($result['duplicate']) && $result['duplicate']) {
                    return response()->json([
                        'success' => false,
                        'message' => $result['message'],
                        'data' => new AttendanceResource($result['absen'])
                    ], 409);
                }
                
                // GPS validation error handling
                if (isset($result['gps_validation'])) {
                    return response()->json([
                        'success' => false,
                        'message' => $result['message'],
                        'error_type' => 'gps_validation_failed',
                        'gps_validation' => $result['gps_validation']
                    ], 422);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 400);
            }
            
            $message = $type === 'student' ? 'Attendance recorded manually' : 'Tutor attendance recorded manually';
            
            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => new AttendanceResource($result['absen']),
                'verification' => $result['verification'],
                'flags' => $result['flags'] ?? []
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
    
    public function recordAttendanceManually(AttendanceRequest $request)
    {
        $request->merge(['type' => 'student', 'target_id' => $request->id_anak]);
        return $this->recordManually($request);
    }

    /**
     * Quick summary for today's attendance on a specific activity.
     */
    public function getTodaySummary(Request $request)
    {
        $validated = $request->validate([
            'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
        ]);

        $companyId = $this->companyId();
        $aktivitas = $this->scopedActivity((int) $validated['id_aktivitas']);

        if (!$aktivitas) {
            return response()->json([
                'success' => false,
                'message' => 'Activity not found in your shelter scope',
            ], 404);
        }

        $records = Absen::where('id_aktivitas', $aktivitas->id_aktivitas)
            ->when($companyId && Schema::hasColumn('absen', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
            ->with(['absenUser.anak', 'absenUser.tutor'])
            ->orderByDesc('updated_at')
            ->get();

        $summary = [
            'total' => $records->count(),
            'present' => $records->where('absen', Absen::TEXT_YA)->count(),
            'late' => $records->where('absen', Absen::TEXT_TERLAMBAT)->count(),
            'absent' => $records->where('absen', Absen::TEXT_TIDAK)->count(),
            'needs_review' => $records->where('review_status', Absen::REVIEW_STATUS_NEEDS_REVIEW)->count(),
        ];

        $flagged = $records->where('review_status', Absen::REVIEW_STATUS_NEEDS_REVIEW)
            ->take((int) min($request->get('flag_limit', 5), 20))
            ->map(function (Absen $record) {
                $absenUser = $record->absenUser;
                $memberType = $absenUser && $absenUser->id_anak ? 'student' : 'tutor';
                $memberName = null;

                if ($absenUser && $absenUser->anak) {
                    $memberName = $absenUser->anak->full_name
                        ?? $absenUser->anak->nama_lengkap
                        ?? $absenUser->anak->nama_panggilan;
                } elseif ($absenUser && $absenUser->tutor) {
                    $memberName = $absenUser->tutor->nama;
                }

                return [
                    'id_absen' => $record->id_absen,
                    'member' => [
                        'type' => $memberType,
                        'name' => $memberName,
                    ],
                    'status' => $record->absen,
                    'auto_flag' => $record->auto_flag,
                    'auto_flag_payload' => $record->auto_flag_payload,
                    'gps' => [
                        'latitude' => $record->latitude,
                        'longitude' => $record->longitude,
                        'accuracy' => $record->gps_accuracy,
                        'recorded_at' => optional($record->gps_recorded_at)?->toDateTimeString(),
                    ],
                    'updated_at' => optional($record->updated_at)?->toDateTimeString(),
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'flags' => $flagged,
            ],
        ]);
    }
    
    public function getByActivity($id_aktivitas, Request $request)
    {
        $filters = $request->only(['is_verified', 'verification_status', 'status', 'type']);
        $type = $request->get('type', 'all');
        $companyId = $this->companyId();
        $aktivitas = $this->scopedActivity((int) $id_aktivitas);

        if (!$aktivitas) {
            return response()->json([
                'success' => false,
                'message' => 'Activity not found in your shelter scope',
            ], 404);
        }

        try {
            if ($type === 'tutor') {
                $attendanceRecord = $this->attendanceService->getTutorAttendanceByActivity($aktivitas->id_aktivitas, $companyId);
                $data = $attendanceRecord ? [new AttendanceResource($attendanceRecord)] : [];
            } elseif ($type === 'student') {
                $attendanceRecords = $this->attendanceService->getAttendanceByActivity($aktivitas->id_aktivitas, $filters, $companyId);
                $data = AttendanceResource::collection($attendanceRecords);
            } else {
                $studentRecords = $this->attendanceService->getAttendanceByActivity($aktivitas->id_aktivitas, $filters, $companyId);
                $tutorRecord = $this->attendanceService->getTutorAttendanceByActivity($aktivitas->id_aktivitas, $companyId);

                $data = [
                    'students' => AttendanceResource::collection($studentRecords),
                    'tutor' => $tutorRecord ? new AttendanceResource($tutorRecord) : null
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attendance records: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getTutorAttendanceForActivity($id_aktivitas)
    {
        try {
            $aktivitas = $this->scopedActivity((int) $id_aktivitas);

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found in your shelter scope',
                ], 404);
            }

            $companyId = $this->companyId();
            $attendance = $this->attendanceService->getTutorAttendanceByActivity($aktivitas->id_aktivitas, $companyId);

            if ($attendance) {
                $attendance->loadMissing(['absenUser.tutor']);

                return response()->json([
                    'success' => true,
                    'data' => new AttendanceResource($attendance),
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Activity not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tutor attendance: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    public function getByStudent($id_anak, AttendanceRequest $request)
    {
        $filters = $request->only(['is_verified', 'verification_status', 'status', 'date_from', 'date_to']);
        $user = Auth::user();
        $companyId = $this->companyId();
        
        try {
            if (!$user || !$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access',
                ], 403);
            }

            $anak = Anak::where('id_anak', $id_anak)
                ->where('id_shelter', $user->adminShelter->id_shelter)
                ->when($companyId && Schema::hasColumn('anak', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                ->first();

            if (!$anak) {
                return response()->json([
                    'success' => false,
                    'message' => 'Child not found or not in your shelter',
                ], 404);
            }

            $attendanceRecords = $this->attendanceService->getAttendanceByStudent($id_anak, $filters, $companyId);
            
            return response()->json([
                'success' => true,
                'data' => AttendanceResource::collection($attendanceRecords)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attendance records: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get all activity members with their attendance status
     * This includes both students who have attendance records and those who don't
     */
    public function getActivityMembersWithAttendance($id_aktivitas, Request $request)
    {
        try {
            $companyId = $this->companyId();
            $aktivitas = $this->scopedActivity((int) $id_aktivitas);

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found in your shelter scope'
                ], 404);
            }

            // Attempt to resolve the kelompok either by foreign key or by name/id_shelter
            $kelompok = null;

            if (!empty($aktivitas->id_kelompok)) {
                $kelompok = Kelompok::with('anak')
                    ->where('id_kelompok', $aktivitas->id_kelompok)
                    ->when($companyId && Schema::hasColumn('kelompok', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                    ->first();
            }

            if (!$kelompok && !empty($aktivitas->nama_kelompok)) {
                $kelompok = Kelompok::with('anak')
                    ->where('nama_kelompok', $aktivitas->nama_kelompok)
                    ->when($aktivitas->id_shelter, function ($query) use ($aktivitas, $companyId) {
                        $query->where('id_shelter', $aktivitas->id_shelter);

                        if ($companyId && Schema::hasColumn('kelompok', 'company_id')) {
                            $query->where('company_id', $companyId);
                        }
                    })
                    ->first();
            }

            if (!$kelompok) {
                $summary = [
                    'total_members' => 0,
                    'present_count' => 0,
                    'late_count' => 0,
                    'absent_count' => 0,
                    'no_record_count' => 0,
                    'attendance_rate' => 0,
                ];

                return response()->json([
                    'success' => false,
                    'message' => 'Kelompok not found for activity.',
                    'data' => [],
                    'summary' => $summary,
                    'activity' => [
                        'id_aktivitas' => $aktivitas->id_aktivitas,
                        'jenis_kegiatan' => $aktivitas->jenis_kegiatan,
                        'materi' => $aktivitas->materi,
                        'tanggal' => $aktivitas->tanggal,
                        'start_time' => $aktivitas->start_time,
                        'end_time' => $aktivitas->end_time,
                    ],
                    'kelompok' => null,
                ], 404);
            }

            // Get all attendance records for this activity
            $attendanceRecords = \App\Models\Absen::join('absen_user', 'absen.id_absen_user', '=', 'absen_user.id_absen_user')
                ->where('absen.id_aktivitas', $id_aktivitas)
                ->when($companyId && Schema::hasColumn('absen', 'company_id'), fn ($q) => $q->where('absen.company_id', $companyId))
                ->whereNotNull('absen_user.id_anak')
                ->select('absen.*', 'absen_user.id_anak')
                ->get()
                ->keyBy('id_anak');
            
            $members = [];
            
            foreach ($kelompok->anak as $student) {
                $attendanceRecord = $attendanceRecords->get($student->id_anak);
                
                $member = [
                    'id_anak' => $student->id_anak,
                    'full_name' => $student->full_name,
                    'nis' => $student->nis,
                    'has_attendance_record' => !is_null($attendanceRecord),
                    'attendance_status' => $attendanceRecord ? $attendanceRecord->absen : null,
                    'attendance_time' => $attendanceRecord ? $attendanceRecord->arrival_time : null,
                    'tanggal_absen' => $attendanceRecord ? $attendanceRecord->tanggal_absen : null,
                    'is_late' => $attendanceRecord ? ($attendanceRecord->absen === 'Terlambat') : null,
                    'is_present' => $attendanceRecord ? in_array($attendanceRecord->absen, ['Ya', 'Terlambat']) : false,
                    'keterangan' => $attendanceRecord ? $attendanceRecord->keterangan : null,
                    'created_at' => $attendanceRecord ? $attendanceRecord->created_at : null,
                ];
                
                $members[] = $member;
            }
            
            // Sort by attendance status (present first, then late, then absent, then no record)
            usort($members, function ($a, $b) {
                $statusOrder = ['Ya' => 1, 'Terlambat' => 2, 'Tidak' => 3, null => 4];
                return $statusOrder[$a['attendance_status']] <=> $statusOrder[$b['attendance_status']];
            });
            
            // Get summary statistics
            $totalMembers = count($members);
            $presentCount = collect($members)->where('attendance_status', 'Ya')->count();
            $lateCount = collect($members)->where('attendance_status', 'Terlambat')->count();
            $absentCount = collect($members)->where('attendance_status', 'Tidak')->count();
            $noRecordCount = collect($members)->where('attendance_status', null)->count();
            
            return response()->json([
                'success' => true,
                'data' => $members,
                'summary' => [
                    'total_members' => $totalMembers,
                    'present_count' => $presentCount,
                    'late_count' => $lateCount,
                    'absent_count' => $absentCount,
                    'no_record_count' => $noRecordCount,
                    'attendance_rate' => $totalMembers > 0 ? round((($presentCount + $lateCount) / $totalMembers) * 100, 2) : 0
                ],
                'activity' => [
                    'id_aktivitas' => $aktivitas->id_aktivitas,
                    'jenis_kegiatan' => $aktivitas->jenis_kegiatan,
                    'materi' => $aktivitas->materi,
                    'tanggal' => $aktivitas->tanggal,
                    'start_time' => $aktivitas->start_time,
                    'end_time' => $aktivitas->end_time,
                ],
                'kelompok' => [
                    'id_kelompok' => $kelompok->id_kelompok,
                    'nama_kelompok' => $kelompok->nama_kelompok,
                    'jumlah_anggota' => $kelompok->jumlah_anggota
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve activity members: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function manualVerify($id_absen, AttendanceRequest $request)
    {
        $absen = $this->scopedAbsen((int) $id_absen);

        if (!$absen) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance record not found in your scope'
            ], 404);
        }

        $result = $this->verificationService->verifyManually($id_absen, $request->notes);
        
        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Attendance manually verified',
            'data' => $result['verification']
        ]);
    }
    
    public function rejectVerification($id_absen, AttendanceRequest $request)
    {
        $absen = $this->scopedAbsen((int) $id_absen);

        if (!$absen) {
            return response()->json([
                'success' => false,
                'message' => 'Attendance record not found in your scope'
            ], 404);
        }

        $result = $this->verificationService->rejectVerification($id_absen, $request->reason);
        
        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Attendance verification rejected',
            'data' => $result['verification']
        ]);
    }
    
    public function getVerificationHistory($id_absen)
    {
        try {
            $absen = $this->scopedAbsen((int) $id_absen);

            if (!$absen) {
                return response()->json([
                    'success' => false,
                    'message' => 'Attendance record not found in your scope'
                ], 404);
            }

            $verificationHistory = $this->verificationService->getVerificationHistory($id_absen);
            
            return response()->json([
                'success' => true,
                'data' => $verificationHistory
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve verification history: ' . $e->getMessage()
            ], 500);
        }
    }
    
    // Tutor-specific methods (from TutorAttendanceController)
    public function generateTutorToken(Request $request)
    {
        $request->validate([
            'id_tutor' => 'required|exists:tutor,id_tutor',
            'valid_days' => 'nullable|integer|min:1|max:365',
            'expiry_strategy' => 'nullable|in:days,semester'
        ]);

        try {
            $companyId = $this->companyId();
            $shelterId = $this->shelterId();

            $tutor = Tutor::where('id_tutor', $request->id_tutor)
                ->where('id_shelter', $shelterId)
                ->when($companyId && Schema::hasColumn('tutor', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                ->first();

            if (!$tutor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tutor not found in your shelter'
                ], 404);
            }

            $validDays = $request->input('valid_days', 30);
            $expiryStrategy = $request->input('expiry_strategy', 'days');
            $validUntil = null;

            if ($expiryStrategy === 'semester') {
                $semester = $this->findActiveSemesterForEntity($tutor->id_shelter, $this->resolveKacabId($tutor));

                if (!$semester) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Active semester not found for the tutor'
                    ], 404);
                }

                $validUntil = Carbon::parse($semester->tanggal_selesai)->endOfDay();
            }

            $token = $this->qrTokenService->generateTutorToken($tutor->id_tutor, $validDays, $validUntil);

            return response()->json([
                'success' => true,
                'message' => 'QR token generated successfully for tutor',
                'data' => $token->load('tutor')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate tutor token: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function validateTutorToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string'
        ]);
        
        $result = $this->qrTokenService->validateTutorToken($request->token);
        
        if (!$result['valid']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }

        $companyId = $this->companyId();
        $shelterId = $this->shelterId();
        $tutor = $result['tutor'] ?? null;

        if ($tutor) {
            $companyMismatch = $companyId && Schema::hasColumn('tutor', 'company_id') && (int) ($tutor->company_id ?? 0) !== (int) $companyId;
            if ((int) $tutor->id_shelter !== (int) $shelterId || $companyMismatch) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tutor token is not in your shelter scope'
                ], 403);
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'tutor' => $result['tutor'],
                'token' => $result['token']
            ]
        ]);
    }
    
    public function recordTutorAttendanceByQr(AttendanceRequest $request)
    {
        $request->merge(['type' => 'tutor', 'target_id' => $request->id_tutor]);
        return $this->recordByQr($request);
    }
    
    public function recordTutorAttendanceManually(AttendanceRequest $request)
    {
        $request->merge(['type' => 'tutor', 'target_id' => $request->id_tutor]);
        return $this->recordManually($request);
    }
    
    public function getTutorAttendanceByActivity($id_aktivitas)
    {
        try {
            $aktivitas = $this->scopedActivity((int) $id_aktivitas);

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found in your shelter scope'
                ], 404);
            }

            $companyId = $this->companyId();
            $attendanceRecord = $this->attendanceService->getTutorAttendanceByActivity($aktivitas->id_aktivitas, $companyId);
            
            return response()->json([
                'success' => true,
                'data' => $attendanceRecord ? new AttendanceResource($attendanceRecord) : null
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tutor attendance: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function getTutorAttendanceHistory($id_tutor, Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from',
            'status' => 'nullable|in:present,absent,late'
        ]);

        $user = Auth::user();
        $companyId = $this->companyId();

        if (!$user || !$user->adminShelter || !$user->adminShelter->shelter) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $tutor = Tutor::where('id_tutor', $id_tutor)
            ->where('id_shelter', $user->adminShelter->shelter->id_shelter)
            ->when($companyId && Schema::hasColumn('tutor', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
            ->first();

        if (!$tutor) {
            return response()->json([
                'success' => false,
                'message' => 'Tutor not found or not in your company scope'
            ], 404);
        }

        try {
            $filters = $request->only(['date_from', 'date_to', 'status']);
            $attendance = $this->attendanceService->getTutorAttendanceByTutor($id_tutor, $filters, $companyId);

            return response()->json([
                'success' => true,
                'data' => AttendanceResource::collection($attendance)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve attendance history: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getTutorAttendanceSummary(Request $request)
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from',
            'jenis_kegiatan' => 'nullable|string'
        ]);

        $user = Auth::user();

        if (!$user || !$user->adminShelter || !$user->adminShelter->shelter) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $shelterId = $user->adminShelter->shelter->id_shelter;
        $companyId = $this->companyId();

        $filters = collect($validated)
            ->reject(fn($value) => $value === null || $value === '' || $value === 'all')
            ->all();

        try {
            $summaryCollection = $this->attendanceService->getTutorAttendanceSummaryForShelter($shelterId, $filters, $companyId);

            $categoryLabels = [
                'high' => 'Baik',
                'medium' => 'Sedang',
                'low' => 'Rendah',
                'no_data' => 'Tidak Ada Data',
            ];

            $distribution = collect(array_fill_keys(array_keys($categoryLabels), 0));

            $tutors = $summaryCollection->map(function ($record) use (&$distribution, $categoryLabels) {
                $totalActivities = (int) ($record['total_activities'] ?? 0);
                $presentCount = (int) ($record['verified_present_count'] ?? $record['present_count'] ?? 0);
                $lateCount = (int) ($record['verified_late_count'] ?? $record['late_count'] ?? 0);
                $absentCount = (int) ($record['verified_absent_count'] ?? $record['absent_count'] ?? 0);
                $verifiedAttendanceCount = (int) ($record['verified_attendance_count'] ?? ($presentCount + $lateCount + $absentCount));
                $attendedCount = $presentCount + $lateCount;

                if ($totalActivities > 0) {
                    $attendanceRate = round(($attendedCount / $totalActivities) * 100, 2);

                    if ($attendanceRate >= 80) {
                        $categoryKey = 'high';
                    } elseif ($attendanceRate >= 60) {
                        $categoryKey = 'medium';
                    } else {
                        $categoryKey = 'low';
                    }
                } else {
                    $attendanceRate = null;
                    $categoryKey = 'no_data';
                }

                $distribution[$categoryKey] = $distribution[$categoryKey] + 1;

                return array_merge($record, [
                    'present_count' => $presentCount,
                    'late_count' => $lateCount,
                    'absent_count' => $absentCount,
                    'verified_present_count' => $presentCount,
                    'verified_late_count' => $lateCount,
                    'verified_absent_count' => $absentCount,
                    'verified_attendance_count' => $verifiedAttendanceCount,
                    'attended_count' => $attendedCount,
                    'verified_attended_count' => $attendedCount,
                    'attendance_rate' => $attendanceRate,
                    'category' => $categoryKey,
                    'category_label' => $categoryLabels[$categoryKey],
                ]);
            });

            $totalTutors = $tutors->count();
            $rates = $tutors->pluck('attendance_rate')->filter(fn($rate) => $rate !== null);
            $averageRate = $rates->isEmpty() ? null : round($rates->avg(), 2);

            $distributionSummary = $distribution->map(function ($count, $key) use ($totalTutors, $categoryLabels) {
                return [
                    'count' => $count,
                    'percentage' => $totalTutors > 0 ? round(($count / $totalTutors) * 100, 2) : 0,
                    'label' => $categoryLabels[$key],
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $tutors->values(),
                'summary' => [
                    'total_tutors' => $totalTutors,
                    'average_attendance_rate' => $averageRate,
                    'distribution' => $distributionSummary,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tutor attendance summary: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getGpsConfig($id_aktivitas)
    {
        try {
            $aktivitas = $this->scopedActivity((int) $id_aktivitas);

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found in your shelter scope'
                ], 404);
            }

            $config = $this->attendanceService->getGpsConfig($aktivitas->id_aktivitas);
            
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $config
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve GPS configuration: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function checkGpsRequirement($id_aktivitas)
    {
        try {
            $aktivitas = $this->scopedActivity((int) $id_aktivitas);

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found in your shelter scope'
                ], 404);
            }

            $required = $this->attendanceService->isGpsRequired($aktivitas->id_aktivitas);

            return response()->json([
                'success' => true,
                'gps_required' => $required
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check GPS requirement: ' . $e->getMessage()
            ], 500);
        }
    }

    protected function adminShelter()
    {
        return request()->attributes->get('adminShelter') ?? Auth::user()?->adminShelter;
    }

    protected function shelterId(): ?int
    {
        return $this->adminShelter()?->shelter?->id_shelter;
    }

    protected function scopedActivity(int $id): ?Aktivitas
    {
        $companyId = $this->companyId();
        $shelterId = $this->shelterId();

        return Aktivitas::where('id_aktivitas', $id)
            ->when($shelterId, fn ($q) => $q->where('id_shelter', $shelterId))
            ->when($companyId && Schema::hasColumn('aktivitas', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
            ->first();
    }

    protected function scopedAbsen(int $id_absen): ?Absen
    {
        $companyId = $this->companyId();
        $shelterId = $this->shelterId();

        return Absen::where('id_absen', $id_absen)
            ->when($companyId && Schema::hasColumn('absen', 'company_id'), fn ($q) => $q->where('absen.company_id', $companyId))
            ->whereHas('aktivitas', function ($query) use ($shelterId, $companyId) {
                if ($shelterId) {
                    $query->where('id_shelter', $shelterId);
                }

                if ($companyId && Schema::hasColumn('aktivitas', 'company_id')) {
                    $query->where('aktivitas.company_id', $companyId);
                }
            })
            ->first();
    }

    protected function findActiveSemesterForEntity(?int $shelterId, ?int $kacabId)
    {
        if ($shelterId) {
            $semester = $this->buildActiveSemesterQuery()
                ->where('id_shelter', $shelterId)
                ->first();

            if ($semester) {
                return $semester;
            }
        }

        if ($kacabId) {
            return $this->buildActiveSemesterQuery()
                ->where('id_kacab', $kacabId)
                ->first();
        }

        return null;
    }

    protected function buildActiveSemesterQuery()
    {
        $query = Semester::query();

        if (Schema::hasColumn('semester', 'status')) {
            $query->where('status', 'active');
        } else {
            $query->where('is_active', true);
        }

        return $query;
    }

    protected function companyId(): ?int
    {
        return app()->bound(SsoContext::class)
            ? app(SsoContext::class)->company()?->id
            : (Auth::user()?->adminShelter->company_id ?? null);
    }

    protected function resolveKacabId($entity): ?int
    {
        if (!empty($entity->id_kacab)) {
            return $entity->id_kacab;
        }

        if (method_exists($entity, 'wilbin')) {
            $wilbin = $entity->wilbin;
            if ($wilbin) {
                return $wilbin->id_kacab ?? null;
            }
        }

        if (method_exists($entity, 'shelter')) {
            $shelter = $entity->shelter;
            if ($shelter && method_exists($shelter, 'kacab')) {
                $kacab = $shelter->kacab;
                if ($kacab) {
                    return $kacab->id_kacab ?? null;
                }
            }
        }

        return null;
    }
}

