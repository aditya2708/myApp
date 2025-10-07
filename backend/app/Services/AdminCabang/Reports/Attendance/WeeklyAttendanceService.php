<?php

namespace App\Services\AdminCabang\Reports\Attendance;

use App\Models\Absen;
use App\Models\Aktivitas;
use Carbon\Carbon;

class WeeklyAttendanceService
{
    public function build($adminCabang, array $filters = []): array
    {
        $start = $this->resolveDate($filters['start_date'] ?? Carbon::now()->startOfMonth(), true);
        $end = $this->resolveDate($filters['end_date'] ?? Carbon::now()->endOfMonth(), false)->endOfDay();

        $kacab = $adminCabang->loadMissing('kacab')->kacab;
        $shelters = $kacab ? $kacab->shelters()->select('id_shelter')->get() : collect();
        $shelterIds = $shelters->pluck('id_shelter')->all();

        $weeks = $this->initialWeeks($start, $end);

        $overall = [
            'present' => 0,
            'late' => 0,
            'absent' => 0,
            'total_sessions' => 0,
            'total_activities' => 0,
            'verification' => [
                'pending' => 0,
                'verified' => 0,
                'rejected' => 0,
                'manual' => 0,
            ],
            '_child_ids' => [],
        ];

        if (!empty($shelterIds)) {
            $activities = Aktivitas::query()
                ->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
                ->whereIn('id_shelter', $shelterIds)
                ->with(['absen.absenUser'])
                ->get();

            foreach ($activities as $activity) {
                $overall['total_activities']++;

                $activityDate = $activity->tanggal instanceof Carbon
                    ? $activity->tanggal->copy()
                    : Carbon::parse($activity->tanggal);

                $weekKey = $this->formatWeekKey($activityDate);

                if (!isset($weeks[$weekKey])) {
                    $weeks[$weekKey] = $this->initialWeekPayload($activityDate->copy()->startOfWeek(Carbon::MONDAY), $start, $end);
                }

                $weeks[$weekKey]['metrics']['total_activities']++;

                $attendanceRecords = $activity->absen ?? collect();
                $sessionCount = $attendanceRecords->count();
                $weeks[$weekKey]['metrics']['total_sessions'] += $sessionCount;
                $overall['total_sessions'] += $sessionCount;

                foreach ($attendanceRecords as $attendance) {
                    $status = $attendance->absen;
                    $normalizedStatus = $status ? strtolower($status) : null;

                    if ($normalizedStatus === strtolower(Absen::TEXT_YA)) {
                        $weeks[$weekKey]['metrics']['present_count']++;
                        $overall['present']++;
                    } elseif ($normalizedStatus === strtolower(Absen::TEXT_TERLAMBAT)) {
                        $weeks[$weekKey]['metrics']['late_count']++;
                        $overall['late']++;
                    } elseif ($normalizedStatus === strtolower(Absen::TEXT_TIDAK)) {
                        $weeks[$weekKey]['metrics']['absent_count']++;
                        $overall['absent']++;
                    }

                    $childId = $attendance->absenUser->id_anak ?? null;
                    if ($childId) {
                        $weeks[$weekKey]['_child_ids'][$childId] = true;
                        $overall['_child_ids'][$childId] = true;
                    }

                    $verification = $this->normalizeVerificationStatus($attendance->verification_status ?? null);
                    $weeks[$weekKey]['metrics']['verification'][$verification]++;
                    $overall['verification'][$verification]++;
                }
            }
        }

        foreach ($weeks as &$week) {
            $week['metrics']['unique_children'] = count($week['_child_ids']);

            $totalSessions = $week['metrics']['total_sessions'];
            $attendanceCount = $week['metrics']['present_count'] + $week['metrics']['late_count'];

            $week['metrics']['attendance_rate'] = $totalSessions > 0
                ? ($attendanceCount / $totalSessions) * 100
                : 0.0;

            $week['metrics']['late_rate'] = $totalSessions > 0
                ? ($week['metrics']['late_count'] / $totalSessions) * 100
                : 0.0;

            unset($week['_child_ids']);
        }
        unset($week);

        ksort($weeks);

        $totalSessions = $overall['total_sessions'];
        $overallAttendanceCount = $overall['present'] + $overall['late'];

        return [
            'filters' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'shelter_ids' => $shelterIds,
            ],
            'metadata' => [
                'shelter_count' => count($shelterIds),
                'total_activities' => $overall['total_activities'],
                'total_sessions' => $totalSessions,
                'present_count' => $overall['present'],
                'late_count' => $overall['late'],
                'absent_count' => $overall['absent'],
                'attendance_rate' => $totalSessions > 0 ? ($overallAttendanceCount / $totalSessions) * 100 : 0.0,
                'late_rate' => $totalSessions > 0 ? ($overall['late'] / $totalSessions) * 100 : 0.0,
                'unique_children' => count($overall['_child_ids']),
                'verification' => $overall['verification'],
            ],
            'weeks' => array_values($weeks),
            'generated_at' => Carbon::now()->toIso8601String(),
        ];
    }

    protected function resolveDate($value, bool $startOfDay = false): Carbon
    {
        $date = $value instanceof Carbon ? $value->copy() : Carbon::parse($value);

        return $startOfDay ? $date->startOfDay() : $date;
    }

    protected function initialWeeks(Carbon $start, Carbon $end): array
    {
        $weeks = [];

        $cursor = $start->copy()->startOfWeek(Carbon::MONDAY);
        $lastWeek = $end->copy()->endOfWeek(Carbon::SUNDAY);

        while ($cursor->lte($lastWeek)) {
            $weeks[$this->formatWeekKey($cursor)] = $this->initialWeekPayload($cursor->copy(), $start, $end);
            $cursor->addWeek();
        }

        return $weeks;
    }

    protected function initialWeekPayload(Carbon $weekStart, Carbon $rangeStart, Carbon $rangeEnd): array
    {
        $startDate = $weekStart->copy();
        $endDate = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        if ($startDate->lt($rangeStart)) {
            $startDate = $rangeStart->copy();
        }

        if ($endDate->gt($rangeEnd)) {
            $endDate = $rangeEnd->copy();
        }

        return [
            'week' => $this->formatWeekKey($weekStart),
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'metrics' => [
                'present_count' => 0,
                'late_count' => 0,
                'absent_count' => 0,
                'attendance_rate' => 0.0,
                'late_rate' => 0.0,
                'total_activities' => 0,
                'total_sessions' => 0,
                'unique_children' => 0,
                'verification' => [
                    'pending' => 0,
                    'verified' => 0,
                    'rejected' => 0,
                    'manual' => 0,
                ],
            ],
            '_child_ids' => [],
        ];
    }

    protected function formatWeekKey(Carbon $date): string
    {
        return sprintf('%d-W%02d', $date->isoWeekYear(), $date->isoWeek());
    }

    protected function normalizeVerificationStatus(?string $status): string
    {
        $normalized = strtolower($status ?? '');

        return match ($normalized) {
            strtolower(Absen::VERIFICATION_VERIFIED) => 'verified',
            strtolower(Absen::VERIFICATION_REJECTED) => 'rejected',
            strtolower(Absen::VERIFICATION_MANUAL) => 'manual',
            default => 'pending',
        };
    }
}
