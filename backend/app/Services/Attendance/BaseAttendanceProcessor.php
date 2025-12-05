<?php

namespace App\Services\Attendance;

use App\Models\Absen;
use App\Models\AbsenUser;
use App\Models\Aktivitas;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

abstract class BaseAttendanceProcessor
{
    public function __construct(
        protected CompanyContextResolver $companyContextResolver,
        protected AbsenUserFactory $absenUserFactory,
        protected GpsMetadataService $gpsMetadataService,
        protected AttendanceFlagger $attendanceFlagger,
        protected AttendanceWriter $attendanceWriter,
    ) {
    }

    protected function resolveArrivalTime($arrivalTime): Carbon
    {
        return $arrivalTime ? Carbon::parse($arrivalTime) : Carbon::now();
    }

    protected function analyzeGps(Aktivitas $aktivitas, ?array $gpsData): array
    {
        $shelter = $aktivitas->shelter;
        $isBimbelActivity = $aktivitas->jenis_kegiatan === 'Bimbel';
        $isGpsRequired = ($shelter && $shelter->require_gps) || ($isBimbelActivity && $shelter && $shelter->latitude && $shelter->longitude);

        return $this->gpsMetadataService->compile($gpsData, $shelter, $isGpsRequired);
    }

    protected function buildAttendancePayload(
        AbsenUser $absenUser,
        int $idAktivitas,
        Carbon $timeArrived,
        string $attendanceStatus,
        array $gpsPayload,
        array $flagBag,
        bool $isVerified,
        string $verificationStatus,
        ?int $companyId
    ): array {
        $attendanceData = [
            'absen' => $attendanceStatus,
            'id_absen_user' => $absenUser->id_absen_user,
            'id_aktivitas' => $idAktivitas,
            'is_read' => false,
            'is_verified' => $isVerified,
            'verification_status' => $verificationStatus,
            'time_arrived' => $timeArrived
        ];

        if (!empty($gpsPayload)) {
            $attendanceData = array_merge($attendanceData, $gpsPayload);
        }

        $this->attendanceFlagger->applyFlags($attendanceData, $flagBag);

        return $this->attendanceWriter->applyCompanyContext($attendanceData, $companyId);
    }

    protected function checkExistingAttendance(int $targetId, int $idAktivitas, string $column): Absen|false
    {
        $absenUser = AbsenUser::where($column, $targetId)->first();

        if (!$absenUser) {
            return false;
        }

        $existingRecord = Absen::where('id_absen_user', $absenUser->id_absen_user)
            ->where('id_aktivitas', $idAktivitas)
            ->first();

        return $existingRecord ?: false;
    }

    protected function runInTransaction(callable $callback)
    {
        DB::beginTransaction();

        try {
            $result = $callback();
            DB::commit();

            return $result;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
