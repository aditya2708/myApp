<?php

namespace App\Services\Attendance;

use App\Models\Absen;
use App\Models\AttendanceVerification;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

class AttendanceWriter
{
    public function createAttendance(array $attendanceData, ?int $companyId = null): Absen
    {
        $attendanceData = $this->applyCompanyContext($attendanceData, $companyId);

        return Absen::create($attendanceData);
    }

    public function markVerified(Absen $absen): void
    {
        $absen->is_verified = true;
        $absen->verification_status = Absen::VERIFICATION_VERIFIED;
        $absen->save();
    }

    public function createManualVerification(Absen $absen, string $notes, ?string $type, ?int $companyId): AttendanceVerification
    {
        $payload = [
            'id_absen' => $absen->id_absen,
            'verification_method' => AttendanceVerification::METHOD_MANUAL,
            'is_verified' => true,
            'verification_notes' => $notes ?: 'Manual verification by admin',
            'verified_by' => Auth::user()->name ?? 'System',
            'verified_at' => Carbon::now(),
        ];

        if ($type) {
            $payload['metadata'] = ['type' => $type];
        }

        if ($companyId && Schema::hasColumn('attendance_verifications', 'company_id')) {
            $payload['company_id'] = $companyId;
        }

        return AttendanceVerification::create($payload);
    }

    public function applyCompanyContext(array $attendanceData, ?int $companyId): array
    {
        if ($companyId && Schema::hasColumn('absen', 'company_id')) {
            $attendanceData['company_id'] = $companyId;
        }

        return $attendanceData;
    }
}
