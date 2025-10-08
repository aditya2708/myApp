<?php

namespace App\Services\AdminCabang\Reports\Attendance;

use App\Models\Absen;
use App\Models\Aktivitas;
use App\Models\Anak;
use App\Models\Kelompok;
use App\Models\Shelter;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WeeklyAttendanceService
{
    public function build($adminCabang, array $filters = []): array
    {
        $start = $this->resolveDate($filters['start_date'] ?? Carbon::now()->startOfMonth(), true);
        $end = $this->resolveDate($filters['end_date'] ?? Carbon::now()->endOfMonth(), false)->endOfDay();

        $attendanceBandFilter = isset($filters['attendance_band'])
            ? strtolower((string) $filters['attendance_band'])
            : null;
        if ($attendanceBandFilter && !in_array($attendanceBandFilter, ['high', 'medium', 'low'], true)) {
            $attendanceBandFilter = null;
        }
        $searchFilter = trim((string) ($filters['search'] ?? ''));

        $kacab = $adminCabang->loadMissing('kacab')->kacab;
        $shelterRecords = $kacab
            ? $kacab->shelters()->select('shelter.id_shelter', 'shelter.nama_shelter')->get()
            : collect();
        $shelterIds = $shelterRecords->pluck('id_shelter')->all();

        $groupCounts = !empty($shelterIds)
            ? Kelompok::query()
                ->whereIn('id_shelter', $shelterIds)
                ->select('id_shelter', DB::raw('COUNT(*) as aggregate'))
                ->groupBy('id_shelter')
                ->pluck('aggregate', 'id_shelter')
                ->map(static fn ($value) => (int) $value)
                ->all()
            : [];

        $studentCounts = !empty($shelterIds)
            ? Anak::query()
                ->whereIn('id_shelter', $shelterIds)
                ->whereIn('status_validasi', Anak::STATUS_AKTIF)
                ->select('id_shelter', DB::raw('COUNT(*) as aggregate'))
                ->groupBy('id_shelter')
                ->pluck('aggregate', 'id_shelter')
                ->map(static fn ($value) => (int) $value)
                ->all()
            : [];

        $currentMetrics = $this->collectShelterAttendanceMetrics($shelterIds, $start, $end);

        $periodLength = $start->diffInDays($end) + 1;
        $previousStart = $start->copy()->subDays($periodLength)->startOfDay();
        $previousEnd = $start->copy()->subDay()->endOfDay();
        $previousMetrics = $this->collectShelterAttendanceMetrics($shelterIds, $previousStart, $previousEnd);

        $shelterPayloads = [];

        foreach ($shelterRecords as $shelter) {
            $shelterId = $shelter->id_shelter;
            $present = $currentMetrics[$shelterId]['present'] ?? 0;
            $late = $currentMetrics[$shelterId]['late'] ?? 0;
            $absent = $currentMetrics[$shelterId]['absent'] ?? 0;
            $totalSessions = $present + $late + $absent;
            $attendancePercentage = $totalSessions > 0
                ? (($present + $late) / $totalSessions) * 100
                : 0.0;

            $previousPresent = $previousMetrics[$shelterId]['present'] ?? 0;
            $previousLate = $previousMetrics[$shelterId]['late'] ?? 0;
            $previousAbsent = $previousMetrics[$shelterId]['absent'] ?? 0;
            $previousSessions = $previousPresent + $previousLate + $previousAbsent;
            $previousAttendancePercentage = $previousSessions > 0
                ? (($previousPresent + $previousLate) / $previousSessions) * 100
                : 0.0;

            $shelterPayloads[] = [
                'id' => $shelterId,
                'name' => $shelter->nama_shelter,
                'total_students' => $studentCounts[$shelterId] ?? 0,
                'groups_count' => $groupCounts[$shelterId] ?? 0,
                'present_count' => $present,
                'late_count' => $late,
                'absent_count' => $absent,
                'attendance_percentage' => $attendancePercentage,
                'attendance_band' => $this->determineAttendanceBand($attendancePercentage),
                'trend_delta' => $attendancePercentage - $previousAttendancePercentage,
            ];
        }

        $sheltersCollection = collect($shelterPayloads)->filter(function ($payload) use ($attendanceBandFilter, $searchFilter) {
            if ($attendanceBandFilter && $payload['attendance_band'] !== $attendanceBandFilter) {
                return false;
            }

            if ($searchFilter !== '' && stripos($payload['name'] ?? '', $searchFilter) === false) {
                return false;
            }

            return true;
        })->sortBy(static fn ($payload) => $payload['name'] ?? '')->values();

        $summaryPresent = (int) $sheltersCollection->sum('present_count');
        $summaryLate = (int) $sheltersCollection->sum('late_count');
        $summaryAbsent = (int) $sheltersCollection->sum('absent_count');
        $summarySessions = $summaryPresent + $summaryLate + $summaryAbsent;
        $summaryAttendancePercentage = $summarySessions > 0
            ? (($summaryPresent + $summaryLate) / $summarySessions) * 100
            : 0.0;

        $summary = [
            'total_shelters' => $sheltersCollection->count(),
            'total_groups' => (int) $sheltersCollection->sum('groups_count'),
            'total_students' => (int) $sheltersCollection->sum('total_students'),
            'present_count' => $summaryPresent,
            'late_count' => $summaryLate,
            'absent_count' => $summaryAbsent,
            'attendance_percentage' => $summaryAttendancePercentage,
        ];

        $filtersPayload = [
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'attendance_band' => $attendanceBandFilter,
            'search' => $searchFilter !== '' ? $searchFilter : null,
        ];

        return [
            'period' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'summary' => $summary,
            'shelters' => $sheltersCollection->values()->all(),
            'meta' => [
                'filters' => $filtersPayload,
                'last_refreshed_at' => Carbon::now()->toIso8601String(),
            ],
        ];
    }

    public function buildShelterReport($adminCabang, array $filters = []): array
    {
        $start = $this->resolveDate($filters['start_date'] ?? Carbon::now()->startOfMonth(), true);
        $end = $this->resolveDate($filters['end_date'] ?? Carbon::now()->endOfMonth(), false)->endOfDay();

        $requestedShelterIds = array_values($filters['shelter_ids'] ?? []);

        $kacab = $adminCabang->loadMissing('kacab')->kacab;
        $accessibleShelterIds = $kacab
            ? $kacab->shelters()->select('shelter.id_shelter')->pluck('shelter.id_shelter')->all()
            : [];

        $shelterIds = !empty($requestedShelterIds)
            ? array_values(array_intersect($requestedShelterIds, $accessibleShelterIds))
            : $accessibleShelterIds;

        $shelterSummaries = [];

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
            'unique_children' => [],
        ];

        if (!empty($shelterIds)) {
            $shelters = Shelter::query()
                ->whereIn('id_shelter', $shelterIds)
                ->get(['id_shelter', 'nama_shelter']);

            foreach ($shelters as $shelter) {
                $shelterSummaries[$shelter->id_shelter] = [
                    'id' => $shelter->id_shelter,
                    'name' => $shelter->nama_shelter,
                    'metrics' => [
                        'present_count' => 0,
                        'late_count' => 0,
                        'absent_count' => 0,
                        'attendance_rate' => 0.0,
                        'late_rate' => 0.0,
                        'total_sessions' => 0,
                        'total_activities' => 0,
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

            $activities = Aktivitas::query()
                ->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
                ->whereIn('id_shelter', $shelterIds)
                ->with(['absen.absenUser'])
                ->get();

            foreach ($activities as $activity) {
                $shelterId = $activity->id_shelter;

                if (!isset($shelterSummaries[$shelterId])) {
                    continue;
                }

                $shelterSummaries[$shelterId]['metrics']['total_activities']++;
                $overall['total_activities']++;

                $attendanceRecords = $activity->absen ?? collect();
                $sessionCount = $attendanceRecords->count();

                $shelterSummaries[$shelterId]['metrics']['total_sessions'] += $sessionCount;
                $overall['total_sessions'] += $sessionCount;

                foreach ($attendanceRecords as $attendance) {
                    $status = strtolower($attendance->absen ?? '');

                    if ($status === strtolower(Absen::TEXT_YA)) {
                        $shelterSummaries[$shelterId]['metrics']['present_count']++;
                        $overall['present']++;
                    } elseif ($status === strtolower(Absen::TEXT_TERLAMBAT)) {
                        $shelterSummaries[$shelterId]['metrics']['late_count']++;
                        $overall['late']++;
                    } elseif ($status === strtolower(Absen::TEXT_TIDAK)) {
                        $shelterSummaries[$shelterId]['metrics']['absent_count']++;
                        $overall['absent']++;
                    }

                    $childId = $attendance->absenUser->id_anak ?? null;
                    if ($childId) {
                        $shelterSummaries[$shelterId]['_child_ids'][$childId] = true;
                        $overall['unique_children'][$childId] = true;
                    }

                    $verification = $this->normalizeVerificationStatus($attendance->verification_status ?? null);
                    $shelterSummaries[$shelterId]['metrics']['verification'][$verification]++;
                    $overall['verification'][$verification]++;
                }
            }

            foreach ($shelterSummaries as &$summary) {
                $totalSessions = $summary['metrics']['total_sessions'];
                $attendanceCount = $summary['metrics']['present_count'] + $summary['metrics']['late_count'];

                $summary['metrics']['attendance_rate'] = $totalSessions > 0
                    ? ($attendanceCount / $totalSessions) * 100
                    : 0.0;

                $summary['metrics']['late_rate'] = $totalSessions > 0
                    ? ($summary['metrics']['late_count'] / $totalSessions) * 100
                    : 0.0;

                $summary['metrics']['unique_children'] = count($summary['_child_ids']);

                unset($summary['_child_ids']);
            }
            unset($summary);

            usort($shelterSummaries, static fn ($a, $b) => strcmp($a['name'], $b['name']));
        }

        $totalSessions = $overall['total_sessions'];
        $overallAttendanceCount = $overall['present'] + $overall['late'];

        return [
            'filters' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'shelter_ids' => $shelterIds,
            ],
            'metadata' => [
                'total_shelters' => count($shelterIds),
                'total_activities' => $overall['total_activities'],
                'total_sessions' => $totalSessions,
                'present_count' => $overall['present'],
                'late_count' => $overall['late'],
                'absent_count' => $overall['absent'],
                'attendance_rate' => $totalSessions > 0 ? ($overallAttendanceCount / $totalSessions) * 100 : 0.0,
                'late_rate' => $totalSessions > 0 ? ($overall['late'] / $totalSessions) * 100 : 0.0,
                'unique_children' => count($overall['unique_children']),
                'verification' => $overall['verification'],
            ],
            'shelters' => array_values($shelterSummaries),
            'generated_at' => Carbon::now()->toIso8601String(),
        ];
    }

    public function buildShelterWeeklyDetail($adminCabang, Shelter $shelter, Carbon $start, Carbon $end, array $options = []): array
    {
        $start = $this->resolveDate($start, true);
        $end = $this->resolveDate($end, false)->endOfDay();

        $shelter->loadMissing('wilbin');

        $weekKey = $options['week'] ?? $this->formatWeekKey($start);

        $groups = Kelompok::query()
            ->where('id_shelter', $shelter->id_shelter)
            ->orderBy('nama_kelompok')
            ->get(['id_kelompok', 'nama_kelompok', 'jumlah_anggota']);

        $groupSummaries = [];
        $groupLookup = [];

        foreach ($groups as $group) {
            $key = 'group:' . $group->id_kelompok;

            $groupSummaries[$key] = [
                'id' => $group->id_kelompok,
                'name' => $group->nama_kelompok,
                'member_count' => (int) ($group->jumlah_anggota ?? 0),
                'metrics' => $this->initialMetrics(),
                '_child_ids' => [],
                'activities' => [],
            ];

            $lookupKey = strtolower(trim($group->nama_kelompok ?? ''));
            if ($lookupKey !== '') {
                $groupLookup[$lookupKey] = $key;
            }
        }

        $activities = Aktivitas::query()
            ->where('id_shelter', $shelter->id_shelter)
            ->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
            ->with(['absen.absenUser'])
            ->orderBy('tanggal')
            ->orderBy('id_aktivitas')
            ->get(['id_aktivitas', 'id_shelter', 'nama_kelompok', 'tanggal', 'jenis_kegiatan', 'materi']);

        $overall = $this->initialMetrics();
        $overall['_child_ids'] = [];

        $activityPayloads = [];

        foreach ($activities as $activity) {
            $activityMetrics = $this->initialMetrics();
            $activityMetrics['total_activities'] = 1;

            $attendanceRecords = $activity->absen ?? collect();
            $sessionCount = $attendanceRecords->count();
            $activityMetrics['total_sessions'] = $sessionCount;

            $activityChildIds = [];

            foreach ($attendanceRecords as $attendance) {
                $status = strtolower($attendance->absen ?? '');

                if ($status === strtolower(Absen::TEXT_YA)) {
                    $activityMetrics['present_count']++;
                    $overall['present_count'] = ($overall['present_count'] ?? 0) + 1;
                } elseif ($status === strtolower(Absen::TEXT_TERLAMBAT)) {
                    $activityMetrics['late_count']++;
                    $overall['late_count'] = ($overall['late_count'] ?? 0) + 1;
                } elseif ($status === strtolower(Absen::TEXT_TIDAK)) {
                    $activityMetrics['absent_count']++;
                    $overall['absent_count'] = ($overall['absent_count'] ?? 0) + 1;
                }

                $childId = $attendance->absenUser->id_anak ?? null;
                if ($childId) {
                    $activityChildIds[$childId] = true;
                    $overall['_child_ids'][$childId] = true;
                }

                $verification = $this->normalizeVerificationStatus($attendance->verification_status ?? null);
                $activityMetrics['verification'][$verification]++;
                $overall['verification'][$verification] = ($overall['verification'][$verification] ?? 0) + 1;
            }

            $overall['total_sessions'] = ($overall['total_sessions'] ?? 0) + $sessionCount;
            $overall['total_activities'] = ($overall['total_activities'] ?? 0) + 1;

            $this->finalizeMetrics($activityMetrics, array_keys($activityChildIds));

            $activityDate = $activity->tanggal instanceof Carbon
                ? $activity->tanggal->copy()
                : Carbon::parse($activity->tanggal);

            $activityPayload = [
                'id' => $activity->id_aktivitas,
                'date' => $activityDate->toDateString(),
                'week' => $this->formatWeekKey($activityDate),
                'group_name' => $activity->nama_kelompok ?? null,
                'jenis_kegiatan' => $activity->jenis_kegiatan ?? null,
                'materi' => $activity->materi ?? null,
                'metrics' => $activityMetrics,
            ];

            $activityPayloads[] = $activityPayload;

            $lookupKey = strtolower(trim($activity->nama_kelompok ?? ''));
            $groupKey = $lookupKey !== '' && isset($groupLookup[$lookupKey])
                ? $groupLookup[$lookupKey]
                : 'unmapped:' . ($lookupKey !== '' ? $lookupKey : 'no-name');

            if (!isset($groupSummaries[$groupKey])) {
                $groupSummaries[$groupKey] = [
                    'id' => null,
                    'name' => $lookupKey !== '' ? $activity->nama_kelompok : __('Tanpa Kelompok'),
                    'member_count' => null,
                    'metrics' => $this->initialMetrics(),
                    '_child_ids' => [],
                    'activities' => [],
                ];
            }

            $groupSummaries[$groupKey]['metrics']['total_activities']++;
            $groupSummaries[$groupKey]['metrics']['total_sessions'] += $sessionCount;

            $groupSummaries[$groupKey]['metrics']['present_count'] += $activityMetrics['present_count'];
            $groupSummaries[$groupKey]['metrics']['late_count'] += $activityMetrics['late_count'];
            $groupSummaries[$groupKey]['metrics']['absent_count'] += $activityMetrics['absent_count'];

            foreach ($activityMetrics['verification'] as $verificationKey => $value) {
                $groupSummaries[$groupKey]['metrics']['verification'][$verificationKey] += $value;
            }

            foreach (array_keys($activityChildIds) as $childId) {
                $groupSummaries[$groupKey]['_child_ids'][$childId] = true;
            }

            $groupSummaries[$groupKey]['activities'][] = $activityPayload;
        }

        $overallMetrics = $this->initialMetrics();
        $overallMetrics['present_count'] = (int) ($overall['present_count'] ?? 0);
        $overallMetrics['late_count'] = (int) ($overall['late_count'] ?? 0);
        $overallMetrics['absent_count'] = (int) ($overall['absent_count'] ?? 0);
        $overallMetrics['total_sessions'] = (int) ($overall['total_sessions'] ?? 0);
        $overallMetrics['total_activities'] = (int) ($overall['total_activities'] ?? 0);
        $overallMetrics['verification'] = array_merge($overallMetrics['verification'], array_map('intval', $overall['verification'] ?? []));

        $this->finalizeMetrics($overallMetrics, array_keys($overall['_child_ids'] ?? []));

        foreach ($groupSummaries as &$groupSummary) {
            $this->finalizeMetrics($groupSummary['metrics'], array_keys($groupSummary['_child_ids']));
            unset($groupSummary['_child_ids']);
            $groupSummary['activities'] = array_values($groupSummary['activities']);
        }
        unset($groupSummary);

        uasort($groupSummaries, static function ($a, $b) {
            return strcmp($a['name'] ?? '', $b['name'] ?? '');
        });

        usort($activityPayloads, static function ($a, $b) {
            return strcmp($a['date'] . ($a['id'] ?? ''), $b['date'] . ($b['id'] ?? ''));
        });

        $notes = [];

        if (empty($activityPayloads)) {
            $notes[] = __('Tidak ada aktivitas yang tercatat pada rentang tanggal ini.');
        }

        $unmappedGroups = collect($groupSummaries)
            ->filter(static fn ($group) => empty($group['id']) && !empty($group['activities']))
            ->pluck('name')
            ->unique()
            ->values()
            ->all();

        if (!empty($unmappedGroups)) {
            $notes[] = __('Beberapa aktivitas tidak terhubung dengan kelompok terdaftar: :groups', [
                'groups' => implode(', ', $unmappedGroups),
            ]);
        }

        return [
            'shelter' => [
                'id' => $shelter->id_shelter,
                'name' => $shelter->nama_shelter,
                'wilbin' => $shelter->wilbin?->nama_wilbin,
                'wilbin_id' => $shelter->wilbin?->id_wilbin,
            ],
            'filters' => [
                'week' => $weekKey,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'metrics' => $overallMetrics,
            'groups' => array_values($groupSummaries),
            'activities' => $activityPayloads,
            'notes' => $notes,
            'generated_at' => Carbon::now()->toIso8601String(),
        ];
    }

    protected function collectShelterAttendanceMetrics(array $shelterIds, Carbon $start, Carbon $end): array
    {
        if (empty($shelterIds) || $end->lt($start)) {
            return [];
        }

        $activities = Aktivitas::query()
            ->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
            ->whereIn('id_shelter', $shelterIds)
            ->with(['absen' => function ($query) {
                $query->select('id_absen', 'id_aktivitas', 'absen');
            }])
            ->get(['id_aktivitas', 'id_shelter', 'tanggal']);

        $metrics = [];

        foreach ($activities as $activity) {
            $shelterId = $activity->id_shelter;

            if (!isset($metrics[$shelterId])) {
                $metrics[$shelterId] = [
                    'present' => 0,
                    'late' => 0,
                    'absent' => 0,
                ];
            }

            $attendanceRecords = $activity->absen ?? collect();

            foreach ($attendanceRecords as $attendance) {
                $status = strtolower($attendance->absen ?? '');

                if ($status === strtolower(Absen::TEXT_YA)) {
                    $metrics[$shelterId]['present']++;
                } elseif ($status === strtolower(Absen::TEXT_TERLAMBAT)) {
                    $metrics[$shelterId]['late']++;
                } elseif ($status === strtolower(Absen::TEXT_TIDAK)) {
                    $metrics[$shelterId]['absent']++;
                }
            }
        }

        return $metrics;
    }

    protected function determineAttendanceBand(float $attendancePercentage): string
    {
        if ($attendancePercentage > 85.0) {
            return 'high';
        }

        if ($attendancePercentage >= 75.0) {
            return 'medium';
        }

        return 'low';
    }

    protected function resolveDate($value, bool $startOfDay = false): Carbon
    {
        $date = $value instanceof Carbon ? $value->copy() : Carbon::parse($value);

        return $startOfDay ? $date->startOfDay() : $date;
    }

    protected function initialMetrics(): array
    {
        return [
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
        ];
    }

    protected function finalizeMetrics(array &$metrics, array $childIds): void
    {
        $metrics['unique_children'] = count($childIds);

        $totalSessions = $metrics['total_sessions'];
        $attendanceCount = $metrics['present_count'] + $metrics['late_count'];

        $metrics['attendance_rate'] = $totalSessions > 0
            ? ($attendanceCount / $totalSessions) * 100
            : 0.0;

        $metrics['late_rate'] = $totalSessions > 0
            ? ($metrics['late_count'] / $totalSessions) * 100
            : 0.0;
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
