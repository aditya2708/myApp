<?php

namespace App\Services\Attendance;

use App\Models\Absen;
use App\Models\Anak;
use App\Models\Aktivitas;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class StudentAttendanceProcessor extends BaseAttendanceProcessor
{
    public function __construct(
        CompanyContextResolver $companyContextResolver,
        AbsenUserFactory $absenUserFactory,
        GpsMetadataService $gpsMetadataService,
        AttendanceFlagger $attendanceFlagger,
        AttendanceWriter $attendanceWriter,
        protected \App\Services\VerificationService $verificationService,
    ) {
        parent::__construct(
            $companyContextResolver,
            $absenUserFactory,
            $gpsMetadataService,
            $attendanceFlagger,
            $attendanceWriter
        );
    }

    public function recordByQr($idAnak, $idAktivitas, $status, $token, $arrivalTime, $gpsData): array
    {
        $companyId = null;

        try {
            return $this->runInTransaction(function () use ($idAnak, $idAktivitas, $status, $token, $arrivalTime, $gpsData, &$companyId) {
                $existingRecord = $this->checkExistingAttendance($idAnak, $idAktivitas, 'id_anak');

                if ($existingRecord) {
                    return [
                        'success' => false,
                        'message' => 'Attendance record already exists for this student in this activity',
                        'duplicate' => true,
                        'absen' => $existingRecord
                    ];
                }

                $anak = Anak::findOrFail($idAnak);
                $aktivitas = Aktivitas::findOrFail($idAktivitas);
                $companyId = $this->companyContextResolver->resolve($anak, $aktivitas);

                $absenUser = $this->absenUserFactory->forAnak($idAnak, $companyId);
                $timeArrived = $this->resolveArrivalTime($arrivalTime);
                $flagBag = [];

                $attendanceStatus = $this->attendanceFlagger->determineStatus($aktivitas, $timeArrived, $status);
                $this->attendanceFlagger->appendLateFlag($flagBag, $attendanceStatus, $timeArrived, $aktivitas);

                $gpsAnalysis = $this->analyzeGps($aktivitas, $gpsData);
                $flagBag = array_merge($flagBag, $gpsAnalysis['flags']);

                $attendancePayload = $this->buildAttendancePayload(
                    $absenUser,
                    $idAktivitas,
                    $timeArrived,
                    $attendanceStatus,
                    $gpsAnalysis['payload'],
                    $flagBag,
                    false,
                    Absen::VERIFICATION_PENDING,
                    $companyId
                );

                $absen = $this->attendanceWriter->createAttendance($attendancePayload);

                $verificationResult = $this->verificationService->verifyByQrCode(
                    $absen->id_absen,
                    $token,
                    'QR code verification via mobile app'
                );

                if ($verificationResult['success']) {
                    $this->attendanceWriter->markVerified($absen);
                }

                return [
                    'success' => true,
                    'absen' => $absen->refresh(),
                    'verification' => $verificationResult,
                    'flags' => $flagBag,
                ];
            });
        } catch (\Exception $e) {
            Log::error('Attendance QR record failed', [
                'error' => $e->getMessage(),
                'id_anak' => $idAnak,
                'id_aktivitas' => $idAktivitas,
                'user_id' => Auth::id(),
                'company_id' => $companyId ?? null,
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    public function recordManually($idAnak, $idAktivitas, $status, $notes, $arrivalTime, $gpsData): array
    {
        $companyId = null;

        try {
            return $this->runInTransaction(function () use ($idAnak, $idAktivitas, $status, $notes, $arrivalTime, $gpsData, &$companyId) {
                $existingRecord = $this->checkExistingAttendance($idAnak, $idAktivitas, 'id_anak');

                if ($existingRecord) {
                    return [
                        'success' => false,
                        'message' => 'Attendance record already exists for this student in this activity',
                        'duplicate' => true,
                        'absen' => $existingRecord
                    ];
                }

                $anak = Anak::findOrFail($idAnak);
                $aktivitas = Aktivitas::findOrFail($idAktivitas);
                $companyId = $this->companyContextResolver->resolve($anak, $aktivitas);

                $absenUser = $this->absenUserFactory->forAnak($idAnak, $companyId);
                $timeArrived = $this->resolveArrivalTime($arrivalTime);
                $flagBag = [];

                $attendanceStatus = $this->attendanceFlagger->determineStatus($aktivitas, $timeArrived, $status);
                $this->attendanceFlagger->appendLateFlag($flagBag, $attendanceStatus, $timeArrived, $aktivitas);

                $gpsAnalysis = $this->analyzeGps($aktivitas, $gpsData);
                $flagBag = array_merge($flagBag, $gpsAnalysis['flags']);

                $attendancePayload = $this->buildAttendancePayload(
                    $absenUser,
                    $idAktivitas,
                    $timeArrived,
                    $attendanceStatus,
                    $gpsAnalysis['payload'],
                    $flagBag,
                    true,
                    Absen::VERIFICATION_MANUAL,
                    $companyId
                );

                $absen = $this->attendanceWriter->createAttendance($attendancePayload);

                $verification = $this->attendanceWriter->createManualVerification(
                    $absen,
                    $notes ?: 'Manual verification by admin',
                    null,
                    $companyId
                );

                return [
                    'success' => true,
                    'absen' => $absen->refresh(),
                    'verification' => $verification,
                    'flags' => $flagBag,
                ];
            });
        } catch (\Exception $e) {
            Log::error('Manual attendance failed', [
                'error' => $e->getMessage(),
                'id_anak' => $idAnak,
                'id_aktivitas' => $idAktivitas,
                'user_id' => Auth::id(),
                'company_id' => $companyId ?? null,
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }
}
