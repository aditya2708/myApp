<?php

namespace App\Services\Attendance;

use App\Models\Absen;
use App\Models\Aktivitas;
use Carbon\Carbon;

class AttendanceFlagger
{
    public function determineStatus(Aktivitas $aktivitas, Carbon $arrivalTime, ?string $manualStatus = null): string
    {
        if ($manualStatus) {
            $mapped = $this->mapManualStatus($manualStatus);
            if ($mapped !== null) {
                return $mapped;
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

    public function appendLateFlag(array &$flagBag, string $attendanceStatus, Carbon $timeArrived, Aktivitas $aktivitas): void
    {
        if ($attendanceStatus !== Absen::TEXT_TERLAMBAT) {
            return;
        }

        $flagBag[] = [
            'code' => 'LATE_ARRIVAL',
            'message' => 'Attendance marked as late automatically.',
            'severity' => 'info',
            'details' => [
                'time_arrived' => $timeArrived->toDateTimeString(),
                'activity_start' => $aktivitas->start_time,
            ],
        ];
    }

    public function applyFlags(array &$attendanceData, array $flagBag): void
    {
        if (empty($flagBag)) {
            $attendanceData['review_status'] = Absen::REVIEW_STATUS_CLEAN;
            $attendanceData['auto_flag'] = null;
            $attendanceData['auto_flag_payload'] = null;
            return;
        }

        $attendanceData['review_status'] = Absen::REVIEW_STATUS_NEEDS_REVIEW;
        $attendanceData['auto_flag'] = implode(',', array_map(
            static fn ($flag) => $flag['code'],
            $flagBag
        ));
        $attendanceData['auto_flag_payload'] = array_values($flagBag);
    }

    protected function isTooEarly(Aktivitas $aktivitas, Carbon $arrivalTime): bool
    {
        if (!$aktivitas->start_time) {
            return false;
        }

        $activityDate = Carbon::parse($aktivitas->tanggal);

        $startTime = str_contains($aktivitas->start_time, ' ')
            ? Carbon::parse($aktivitas->start_time)
            : Carbon::parse($activityDate->format('Y-m-d') . ' ' . $aktivitas->start_time);

        $earliestAllowedTime = $startTime->copy()->subMinutes(15);

        return $arrivalTime->lt($earliestAllowedTime);
    }

    protected function mapManualStatus(string $manualStatus): ?string
    {
        return match ($manualStatus) {
            'present' => Absen::TEXT_YA,
            'absent' => Absen::TEXT_TIDAK,
            'late' => Absen::TEXT_TERLAMBAT,
            default => null,
        };
    }
}
