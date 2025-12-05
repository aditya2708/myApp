<?php

namespace App\Services\Attendance;

use App\Models\Absen;
use App\Models\Aktivitas;
use App\Models\Tutor;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TutorAttendanceProcessor extends BaseAttendanceProcessor
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

    public function recordByQr($idTutor, $idAktivitas, $status, $token, $arrivalTime, $gpsData): array
    {
        $companyId = null;

        try {
            return $this->runInTransaction(function () use ($idTutor, $idAktivitas, $status, $token, $arrivalTime, $gpsData, &$companyId) {
                $existingRecord = $this->checkExistingAttendance($idTutor, $idAktivitas, 'id_tutor');

                if ($existingRecord) {
                    return [
                        'success' => false,
                        'message' => 'Attendance record already exists for this tutor in this activity',
                        'duplicate' => true,
                        'absen' => $existingRecord
                    ];
                }

                $tutor = Tutor::findOrFail($idTutor);
                $aktivitas = Aktivitas::findOrFail($idAktivitas);
                $companyId = $this->companyContextResolver->resolve(null, $aktivitas, $tutor);

                if ($aktivitas->id_tutor != $idTutor) {
                    return [
                        'success' => false,
                        'message' => 'Tutor is not assigned to this activity'
                    ];
                }

                $absenUser = $this->absenUserFactory->forTutor($idTutor, $companyId);
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

                $verificationResult = $this->verificationService->verifyTutorByQrCode(
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
            Log::error('Tutor attendance QR failed', [
                'error' => $e->getMessage(),
                'id_tutor' => $idTutor,
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

    public function recordManually($idTutor, $idAktivitas, $status, $notes, $arrivalTime, $gpsData): array
    {
        $companyId = null;

        try {
            return $this->runInTransaction(function () use ($idTutor, $idAktivitas, $status, $notes, $arrivalTime, $gpsData, &$companyId) {
                $existingRecord = $this->checkExistingAttendance($idTutor, $idAktivitas, 'id_tutor');

                if ($existingRecord) {
                    return [
                        'success' => false,
                        'message' => 'Attendance record already exists for this tutor in this activity',
                        'duplicate' => true,
                        'absen' => $existingRecord
                    ];
                }

                $tutor = Tutor::findOrFail($idTutor);
                $aktivitas = Aktivitas::findOrFail($idAktivitas);
                $companyId = $this->companyContextResolver->resolve(null, $aktivitas, $tutor);

                if ($aktivitas->id_tutor != $idTutor) {
                    return [
                        'success' => false,
                        'message' => 'Tutor is not assigned to this activity'
                    ];
                }

                $absenUser = $this->absenUserFactory->forTutor($idTutor, $companyId);
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
                    $notes ?: 'Manual tutor verification by admin',
                    'tutor',
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
            Log::error('Tutor attendance manual failed', [
                'error' => $e->getMessage(),
                'id_tutor' => $idTutor,
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
