<?php

namespace App\Services\AdminCabang\Reports\Attendance;

use App\Models\Absen;
use App\Models\Aktivitas;
use App\Models\Anak;
use App\Models\Kelompok;
use App\Models\Shelter;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

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
        $selectedWeekId = isset($filters['week_id']) && is_string($filters['week_id']) && $filters['week_id'] !== ''
            ? $filters['week_id']
            : null;

        $weeksRangeStart = isset($filters['weeks_range_start'])
            ? $this->resolveDate($filters['weeks_range_start'], true)
            : $start->copy();
        $weeksRangeEnd = isset($filters['weeks_range_end'])
            ? $this->resolveDate($filters['weeks_range_end'], false)->endOfDay()
            : $end->copy();

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

        $weeksCollection = $this->buildWeeksCollection($shelterIds, $weeksRangeStart, $weeksRangeEnd);

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
            'week_id' => $selectedWeekId,
        ];

        return [
            'period' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'summary' => $summary,
            'shelters' => $sheltersCollection->values()->all(),
            'weeks' => $weeksCollection,
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

        $groupLookups = [];
        $allActivities = [];

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

            if ($shelters->isNotEmpty()) {
                $groups = Kelompok::query()
                    ->whereIn('id_shelter', $shelterIds)
                    ->with('levelAnakBinaan')
                    ->get([
                        'id_kelompok',
                        'id_shelter',
                        'nama_kelompok',
                        'jumlah_anggota',
                        'kelas_gabungan',
                        'id_level_anak_binaan',
                    ]);

                foreach ($groups as $group) {
                    $normalizedName = $this->normalizeGroupKey($group->nama_kelompok);

                    $groupLookups[$group->id_shelter][$normalizedName] = [
                        'name' => $group->nama_kelompok,
                        'info' => $this->buildGroupDescription($group),
                    ];
                }
            }

            foreach ($shelters as $shelter) {
                $shelterSummaries[$shelter->id_shelter] = [
                    'id' => $shelter->id_shelter,
                    'name' => $shelter->nama_shelter,
                    'activities' => [],
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
                ->with(['absen.absenUser', 'tutor:id_tutor,nama'])
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

                $presentCount = 0;
                $lateCount = 0;
                $absentCount = 0;
                $verificationCounts = [
                    'pending' => 0,
                    'verified' => 0,
                    'rejected' => 0,
                    'manual' => 0,
                ];

                $shelterSummaries[$shelterId]['metrics']['total_sessions'] += $sessionCount;
                $overall['total_sessions'] += $sessionCount;

                foreach ($attendanceRecords as $attendance) {
                    $status = strtolower($attendance->absen ?? '');

                    if ($status === strtolower(Absen::TEXT_YA)) {
                        $shelterSummaries[$shelterId]['metrics']['present_count']++;
                        $overall['present']++;
                        $presentCount++;
                    } elseif ($status === strtolower(Absen::TEXT_TERLAMBAT)) {
                        $shelterSummaries[$shelterId]['metrics']['late_count']++;
                        $overall['late']++;
                        $lateCount++;
                    } elseif ($status === strtolower(Absen::TEXT_TIDAK)) {
                        $shelterSummaries[$shelterId]['metrics']['absent_count']++;
                        $overall['absent']++;
                        $absentCount++;
                    }

                    $childId = $attendance->absenUser->id_anak ?? null;
                    if ($childId) {
                        $shelterSummaries[$shelterId]['_child_ids'][$childId] = true;
                        $overall['unique_children'][$childId] = true;
                    }

                    $verification = $this->normalizeVerificationStatus($attendance->verification_status ?? null);
                    $shelterSummaries[$shelterId]['metrics']['verification'][$verification]++;
                    $overall['verification'][$verification]++;
                    $verificationCounts[$verification]++;
                }

                $attendanceRate = $sessionCount > 0
                    ? (($presentCount + $lateCount) / $sessionCount) * 100
                    : 0.0;

                $normalizedGroupName = $this->normalizeGroupKey($activity->nama_kelompok ?? '');
                $groupInfo = $groupLookups[$shelterId][$normalizedGroupName] ?? null;

                $activityPayload = [
                    'id' => $activity->id_aktivitas,
                    'name' => $activity->jenis_kegiatan ?? null,
                    'tutor' => $activity->tutor?->full_name ?? $activity->tutor?->nama ?? null,
                    'group' => [
                        'name' => $activity->nama_kelompok !== '' ? $activity->nama_kelompok : ($groupInfo['name'] ?? null),
                        'info' => $groupInfo['info'] ?? null,
                    ],
                    'participant_count' => $sessionCount,
                    'schedules' => [[
                        'date' => $activity->tanggal ? $activity->tanggal->toDateString() : null,
                        'start_time' => $activity->start_time ?? null,
                        'end_time' => $activity->end_time ?? null,
                    ]],
                    'metrics' => [
                        'present_count' => $presentCount,
                        'late_count' => $lateCount,
                        'absent_count' => $absentCount,
                        'attendance_rate' => $attendanceRate,
                        'verification' => $verificationCounts,
                    ],
                ];

                $shelterSummaries[$shelterId]['activities'][] = $activityPayload;

                $allActivities[] = $activityPayload + [
                    'shelter_id' => $shelterSummaries[$shelterId]['id'],
                    'shelter_name' => $shelterSummaries[$shelterId]['name'],
                ];
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

        $activityCount = $overall['total_activities'];

        return [
            'filters' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'shelter_ids' => $shelterIds,
            ],
            'metadata' => [
                'total_shelters' => count($shelterIds),
                'total_activities' => $activityCount,
                'activity_count' => $activityCount,
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
            'activities' => $allActivities,
            'totals' => [
                'sessions' => $totalSessions,
                'activities' => $activityCount,
            ],
            'generated_at' => Carbon::now()->toIso8601String(),
        ];
    }

    public function buildShelterWeeklyDetail($adminCabang, Shelter $shelter, Carbon $start, Carbon $end, array $options = []): array
    {
        $start = $this->resolveDate($start, true);
        $end = $this->resolveDate($end, false)->endOfDay();

        $shelter->loadMissing('wilbin');

        $weekKey = $options['week'] ?? $this->formatWeekKey($start);
        $requestedPeriodFilters = array_filter(
            $options['period_filters'] ?? [],
            static fn ($value) => $value !== null && $value !== ''
        );

        $page = isset($options['page']) ? (int) $options['page'] : 1;
        if ($page < 1) {
            $page = 1;
        }

        $perPage = isset($options['per_page']) ? (int) $options['per_page'] : 15;
        if ($perPage < 1) {
            $perPage = 15;
        } elseif ($perPage > 100) {
            $perPage = 100;
        }

        $searchFilter = trim((string) ($options['search'] ?? ''));
        $searchFilter = $searchFilter !== '' ? $searchFilter : null;

        $activityIdFilter = isset($options['activity_id']) ? (int) $options['activity_id'] : null;
        if ($activityIdFilter !== null && $activityIdFilter <= 0) {
            $activityIdFilter = null;
        }

        $scheduleDateRaw = $options['schedule_date'] ?? null;
        $scheduleDateFilter = null;

        if ($scheduleDateRaw !== null && $scheduleDateRaw !== '') {
            $scheduleDateFilter = Carbon::parse($scheduleDateRaw)->toDateString();
        }

        $groups = Kelompok::query()
            ->where('id_shelter', $shelter->id_shelter)
            ->with('levelAnakBinaan')
            ->orderBy('nama_kelompok')
            ->get(['id_kelompok', 'id_shelter', 'nama_kelompok', 'jumlah_anggota', 'kelas_gabungan', 'id_level_anak_binaan']);

        $groupCards = [];
        $groupLookup = [];

        foreach ($groups as $group) {
            $normalizedName = $this->normalizeGroupKey($group->nama_kelompok);
            $groupInfo = [
                'id' => $group->id_kelompok,
                'name' => $group->nama_kelompok,
                'description' => $this->buildGroupDescription($group),
                'member_count' => $group->jumlah_anggota !== null ? (int) $group->jumlah_anggota : null,
            ];

            $groupLookup[$normalizedName] = $groupInfo;

            $groupCards[$group->id_kelompok] = array_merge($groupInfo, [
                'present_count' => 0,
                'late_count' => 0,
                'absent_count' => 0,
                'attendance_percentage' => 0.0,
            ]);
        }

        $attendanceAggregates = $this->collectGroupAttendanceForShelterWeek(
            (int) $shelter->id_shelter,
            $start,
            $end
        );

        $unmappedGroups = [];
        $overallPresent = 0;
        $overallLate = 0;
        $overallAbsent = 0;

        foreach ($attendanceAggregates as $normalizedName => $aggregate) {
            $present = (int) ($aggregate['present'] ?? 0);
            $late = (int) ($aggregate['late'] ?? 0);
            $absent = (int) ($aggregate['absent'] ?? 0);

            $overallPresent += $present;
            $overallLate += $late;
            $overallAbsent += $absent;

            if (isset($groupLookup[$normalizedName])) {
                $groupId = $groupLookup[$normalizedName]['id'];

                $groupCards[$groupId]['present_count'] += $present;
                $groupCards[$groupId]['late_count'] += $late;
                $groupCards[$groupId]['absent_count'] += $absent;

                $groupCards[$groupId]['attendance_percentage'] = $this->calculateAttendancePercentage(
                    $groupCards[$groupId]['present_count'],
                    $groupCards[$groupId]['late_count'],
                    $groupCards[$groupId]['absent_count']
                );

                continue;
            }

            $unmappedKey = 'unmapped:' . $normalizedName;

            if (!isset($unmappedGroups[$unmappedKey])) {
                $unmappedGroups[$unmappedKey] = [
                    'id' => null,
                    'name' => $aggregate['name'] ?? __('Tanpa Kelompok'),
                    'description' => null,
                    'member_count' => null,
                    'present_count' => 0,
                    'late_count' => 0,
                    'absent_count' => 0,
                    'attendance_percentage' => 0.0,
                ];
            }

            $unmappedGroups[$unmappedKey]['present_count'] += $present;
            $unmappedGroups[$unmappedKey]['late_count'] += $late;
            $unmappedGroups[$unmappedKey]['absent_count'] += $absent;

            $unmappedGroups[$unmappedKey]['attendance_percentage'] = $this->calculateAttendancePercentage(
                $unmappedGroups[$unmappedKey]['present_count'],
                $unmappedGroups[$unmappedKey]['late_count'],
                $unmappedGroups[$unmappedKey]['absent_count']
            );
        }

        foreach ($groupCards as &$groupCard) {
            $groupCard['attendance_percentage'] = $this->calculateAttendancePercentage(
                $groupCard['present_count'],
                $groupCard['late_count'],
                $groupCard['absent_count']
            );
        }
        unset($groupCard);

        $groupCollection = collect($groupCards)
            ->merge($unmappedGroups)
            ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
            ->values();

        $activityQuery = Aktivitas::query()
            ->where('id_shelter', $shelter->id_shelter)
            ->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
            ->with([
                'tutor:id_tutor,nama',
                'absen' => function ($query) {
                    $query->select('id_absen', 'id_absen_user', 'id_aktivitas', 'absen', 'verification_status');
                },
                'absen.absenUser' => function ($query) {
                    $query->select('id_absen_user', 'id_anak', 'id_tutor');
                },
            ])
            ->orderBy('tanggal')
            ->orderBy('start_time')
            ->orderBy('id_aktivitas');

        if ($activityIdFilter !== null) {
            $activityQuery->where('id_aktivitas', $activityIdFilter);
        }

        if ($scheduleDateFilter !== null) {
            $activityQuery->whereDate('tanggal', $scheduleDateFilter);
        }

        if ($searchFilter !== null) {
            $activityQuery->where(function ($query) use ($searchFilter) {
                $query->where('jenis_kegiatan', 'like', "%{$searchFilter}%")
                    ->orWhere('materi', 'like', "%{$searchFilter}%")
                    ->orWhere('nama_kelompok', 'like', "%{$searchFilter}%");
            });
        }

        $totalActivities = (clone $activityQuery)->count();

        $activityModels = (clone $activityQuery)
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get([
                'id_aktivitas',
                'id_shelter',
                'id_tutor',
                'nama_kelompok',
                'jenis_kegiatan',
                'materi',
                'tanggal',
                'start_time',
                'end_time',
            ]);

        $activityPayloads = [];
        $activitiesWithoutAttendance = false;

        foreach ($activityModels as $activity) {
            $attendanceRecords = $activity->absen ?? collect();

            $presentCount = 0;
            $lateCount = 0;
            $absentCount = 0;
            $participantLookup = [];

            $verificationCounts = [
                'pending' => 0,
                'verified' => 0,
                'rejected' => 0,
                'manual' => 0,
            ];

            foreach ($attendanceRecords as $attendance) {
                $status = strtolower($attendance->absen ?? '');

                if ($status === strtolower(Absen::TEXT_YA)) {
                    $presentCount++;
                } elseif ($status === strtolower(Absen::TEXT_TERLAMBAT)) {
                    $lateCount++;
                } elseif ($status === strtolower(Absen::TEXT_TIDAK)) {
                    $absentCount++;
                }

                $verification = $this->normalizeVerificationStatus($attendance->verification_status ?? null);
                $verificationCounts[$verification]++;

                $participantId = $attendance->absenUser?->id_anak;

                if ($participantId) {
                    $participantLookup[$participantId] = true;
                }
            }

            if ($attendanceRecords->isEmpty()) {
                $activitiesWithoutAttendance = true;
            }

            $totalSessions = $presentCount + $lateCount + $absentCount;
            $attendanceRate = $totalSessions > 0
                ? (($presentCount + $lateCount) / $totalSessions) * 100
                : 0.0;

            $normalizedGroupName = $this->normalizeGroupKey($activity->nama_kelompok);
            $groupInfo = $groupLookup[$normalizedGroupName] ?? null;

            $groupDetails = [
                'id' => $groupInfo['id'] ?? null,
                'name' => $activity->nama_kelompok !== ''
                    ? $activity->nama_kelompok
                    : ($groupInfo['name'] ?? ($attendanceAggregates[$normalizedGroupName]['name'] ?? null)),
                'description' => $groupInfo['description'] ?? null,
                'member_count' => $groupInfo['member_count'] ?? null,
            ];

            if ($groupDetails['name'] === null) {
                $groupDetails['name'] = __('Tanpa Kelompok');
            }

            $participantCount = count($participantLookup);
            if ($participantCount === 0) {
                $participantCount = $attendanceRecords->count();
            }

            $activityNotes = [];

            if ($attendanceRecords->isEmpty()) {
                $activityNotes[] = __('Belum ada absensi yang tercatat. Sistem akan otomatis menandai ketidakhadiran.');
            }

            $activityPayloads[] = [
                'id' => $activity->id_aktivitas,
                'name' => $activity->jenis_kegiatan ?? null,
                'material' => $activity->materi ?? null,
                'tutor' => $activity->tutor?->full_name ?? $activity->tutor?->nama ?? null,
                'group' => $groupDetails,
                'participant_count' => $participantCount,
                'schedules' => [[
                    'date' => $activity->tanggal ? $activity->tanggal->toDateString() : null,
                    'start_time' => $activity->start_time ?? null,
                    'end_time' => $activity->end_time ?? null,
                ]],
                'metrics' => [
                    'present_count' => $presentCount,
                    'late_count' => $lateCount,
                    'absent_count' => $absentCount,
                    'attendance_rate' => $attendanceRate,
                    'verification' => $verificationCounts,
                ],
                'notes' => $activityNotes,
            ];
        }

        $paginator = new LengthAwarePaginator(
            collect($activityPayloads),
            $totalActivities,
            $perPage,
            $page,
            [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
            ]
        );

        $totalStudents = Anak::query()
            ->where('id_shelter', $shelter->id_shelter)
            ->aktif()
            ->count();

        $summaryAttendancePercentage = $this->calculateAttendancePercentage(
            $overallPresent,
            $overallLate,
            $overallAbsent
        );

        $totalActivitiesCount = $paginator->total();

        $notes = [];

        if ($totalActivitiesCount === 0) {
            $notes[] = __('Tidak ada aktivitas yang tercatat pada rentang tanggal ini.');
        }

        if (!empty($unmappedGroups)) {
            $notes[] = __('Beberapa aktivitas tidak terhubung dengan kelompok terdaftar: :groups', [
                'groups' => collect($unmappedGroups)
                    ->pluck('name')
                    ->filter()
                    ->unique()
                    ->implode(', '),
            ]);
        }

        if ($totalActivitiesCount > 0 && $activitiesWithoutAttendance) {
            $notes[] = __('Beberapa aktivitas belum memiliki absensi; status otomatis akan menandai ketidakhadiran.');
        }

        return [
            'shelter' => [
                'id' => $shelter->id_shelter,
                'name' => $shelter->nama_shelter,
                'wilbin' => $shelter->wilbin?->nama_wilbin,
                'wilbin_id' => $shelter->wilbin?->id_wilbin,
            ],
            'period' => [
                'week' => $weekKey,
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'filters' => [
                'start_date' => $requestedPeriodFilters['start_date'] ?? null,
                'end_date' => $requestedPeriodFilters['end_date'] ?? null,
                'week' => $weekKey,
                'page' => $page,
                'per_page' => $perPage,
                'search' => $searchFilter,
                'activity_id' => $activityIdFilter,
                'schedule_date' => $scheduleDateFilter,
            ],
            'summary' => [
                'total_students' => (int) $totalStudents,
                'present_count' => $overallPresent,
                'late_count' => $overallLate,
                'absent_count' => $overallAbsent,
                'attendance_percentage' => $summaryAttendancePercentage,
                'attendance_band' => $this->determineAttendanceBand($summaryAttendancePercentage),
            ],
            'groups' => $groupCollection->all(),
            'activities' => array_values($paginator->items()),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'notes' => $notes,
            'generated_at' => Carbon::now()->toIso8601String(),
        ];
    }

    public function buildGroupWeeklyStudents($adminCabang, Kelompok $group, Carbon $start, Carbon $end, array $options = []): array
    {
        $start = $this->resolveDate($start, true);
        $end = $this->resolveDate($end, false)->endOfDay();

        $group->loadMissing('shelter');

        $statusFilter = isset($options['status']) ? strtolower((string) $options['status']) : null;
        if (!in_array($statusFilter, ['present', 'late', 'absent'], true)) {
            $statusFilter = null;
        }

        $searchFilter = trim((string) ($options['search'] ?? ''));

        $perPage = isset($options['per_page']) ? (int) $options['per_page'] : 15;
        if ($perPage < 1) {
            $perPage = 15;
        } elseif ($perPage > 100) {
            $perPage = 100;
        }

        $page = isset($options['page']) ? (int) $options['page'] : 1;
        if ($page < 1) {
            $page = 1;
        }

        $students = Anak::query()
            ->where('id_kelompok', $group->id_kelompok)
            ->whereIn('status_validasi', Anak::STATUS_AKTIF)
            ->orderBy('full_name')
            ->get([
                'id_anak',
                'full_name',
                'nick_name',
                'jenis_kelamin',
                'foto',
            ]);

        if ($searchFilter !== '') {
            $students = $students->filter(function ($student) use ($searchFilter) {
                $name = trim((string) $student->full_name);
                $nickname = trim((string) $student->nick_name);

                return stripos($name, $searchFilter) !== false
                    || ($nickname !== '' && stripos($nickname, $searchFilter) !== false);
            })->values();
        }

        $attendanceRecords = Absen::query()
            ->select([
                'absen_user.id_anak as anak_id',
                'absen.id_absen',
                'absen.absen as status',
                'absen.time_arrived',
                'absen.verification_status',
                'absen.gps_validation_notes',
                'absen.created_at',
                'aktivitas.tanggal as activity_date',
            ])
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->where('aktivitas.id_shelter', $group->id_shelter)
            ->where('aktivitas.nama_kelompok', $group->nama_kelompok)
            ->whereBetween('aktivitas.tanggal', [$start->toDateString(), $end->toDateString()])
            ->orderByDesc('aktivitas.tanggal')
            ->orderByDesc('absen.created_at')
            ->get();

        $attendanceByStudent = [];

        foreach ($attendanceRecords as $record) {
            $anakId = $record->anak_id;

            if (isset($attendanceByStudent[$anakId])) {
                continue;
            }

            $attendanceByStudent[$anakId] = [
                'status' => strtolower((string) $record->status),
                'time_arrived' => $record->time_arrived ? Carbon::parse($record->time_arrived) : null,
                'activity_date' => $record->activity_date ? Carbon::parse($record->activity_date) : null,
                'verification_status' => $record->verification_status ?? null,
                'notes' => $record->gps_validation_notes ?? null,
            ];
        }

        $statusCountsBase = [
            'present' => 0,
            'late' => 0,
            'absent' => 0,
        ];

        $studentsPayload = $students->map(function (Anak $student) use ($attendanceByStudent, &$statusCountsBase) {
            $attendance = $attendanceByStudent[$student->id_anak] ?? null;
            $isRecorded = $attendance !== null;

            $status = $attendance
                ? $this->normalizeAttendanceStatus($attendance['status'])
                : 'absent';

            if (!isset($statusCountsBase[$status])) {
                $statusCountsBase[$status] = 0;
            }

            $statusCountsBase[$status]++;

            $statusMeta = $this->statusMeta($status);

            $arrivalTime = $attendance['time_arrived'] ?? null;
            $activityDate = $attendance['activity_date'] ?? null;

            return [
                'id' => $student->id_anak,
                'name' => $student->full_name,
                'nickname' => $student->nick_name,
                'gender' => $student->jenis_kelamin,
                'avatar_url' => $student->foto ? Storage::url($student->foto) : null,
                'status' => array_merge(['code' => $status], $statusMeta),
                'is_recorded' => $isRecorded,
                'arrival_time' => $arrivalTime?->toIso8601String(),
                'arrival_time_label' => $arrivalTime ? $arrivalTime->format('H:i') : null,
                'activity_date' => $activityDate?->toDateString(),
                'notes' => $attendance['notes'] ?? ($isRecorded ? null : __('Belum ada catatan kehadiran pada rentang ini.')),
                'verification_status' => $attendance['verification_status'] ?? null,
            ];
        });

        $statusCounts = $statusCountsBase;

        if ($statusFilter) {
            $studentsPayload = $studentsPayload
                ->filter(fn ($student) => ($student['status']['code'] ?? null) === $statusFilter)
                ->values();
        }

        $total = $studentsPayload->count();
        $offset = ($page - 1) * $perPage;
        $paginatedItems = $studentsPayload->slice($offset, $perPage)->values();

        $paginator = new LengthAwarePaginator($paginatedItems, $total, $perPage, $page, [
            'path' => LengthAwarePaginator::resolveCurrentPath(),
        ]);

        $statusCountsPayload = [
            'all' => array_merge(['code' => 'all'], $this->statusMeta('all'), ['count' => $students->count()]),
            'present' => array_merge(['code' => 'present'], $this->statusMeta('present'), ['count' => $statusCounts['present'] ?? 0]),
            'late' => array_merge(['code' => 'late'], $this->statusMeta('late'), ['count' => $statusCounts['late'] ?? 0]),
            'absent' => array_merge(['code' => 'absent'], $this->statusMeta('absent'), ['count' => $statusCounts['absent'] ?? 0]),
        ];

        return [
            'group' => [
                'id' => $group->id_kelompok,
                'name' => $group->nama_kelompok,
                'description' => $this->buildGroupDescription($group),
                'shelter' => [
                    'id' => $group->shelter?->id_shelter,
                    'name' => $group->shelter?->nama_shelter,
                ],
            ],
            'period' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'status_counts' => $statusCountsPayload,
            'students' => $paginatedItems->all(),
            'pagination' => [
                'total' => $paginator->total(),
                'per_page' => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
            ],
            'filters' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'status' => $statusFilter,
                'search' => $searchFilter !== '' ? $searchFilter : null,
                'per_page' => $perPage,
                'page' => $page,
            ],
            'generated_at' => Carbon::now()->toIso8601String(),
        ];
    }

    protected function collectGroupAttendanceForShelterWeek(int $shelterId, Carbon $start, Carbon $end): array
    {
        if ($end->lt($start)) {
            return [];
        }

        $activities = Aktivitas::query()
            ->where('id_shelter', $shelterId)
            ->whereBetween('tanggal', [$start->toDateString(), $end->toDateString()])
            ->with(['absen' => function ($query) {
                $query->select('id_absen', 'id_aktivitas', 'absen');
            }])
            ->get(['id_aktivitas', 'nama_kelompok']);

        $aggregates = [];

        foreach ($activities as $activity) {
            $normalizedName = $this->normalizeGroupKey($activity->nama_kelompok);

            if (!isset($aggregates[$normalizedName])) {
                $aggregates[$normalizedName] = [
                    'name' => $activity->nama_kelompok ?? null,
                    'present' => 0,
                    'late' => 0,
                    'absent' => 0,
                ];
            }

            $attendanceRecords = $activity->absen ?? collect();

            foreach ($attendanceRecords as $attendance) {
                $status = strtolower($attendance->absen ?? '');

                if ($status === strtolower(Absen::TEXT_YA)) {
                    $aggregates[$normalizedName]['present']++;
                } elseif ($status === strtolower(Absen::TEXT_TERLAMBAT)) {
                    $aggregates[$normalizedName]['late']++;
                } elseif ($status === strtolower(Absen::TEXT_TIDAK)) {
                    $aggregates[$normalizedName]['absent']++;
                }
            }
        }

        return $aggregates;
    }

    protected function normalizeGroupKey(?string $name): string
    {
        $normalized = trim(mb_strtolower((string) $name));

        if ($normalized === '') {
            return '__no_group__';
        }

        return $normalized;
    }

    protected function buildGroupDescription(Kelompok $group): ?string
    {
        $kelasGabungan = $group->kelas_gabungan;

        if (is_array($kelasGabungan)) {
            $labels = array_values(array_filter(array_map(static function ($value) {
                if (is_array($value)) {
                    return null;
                }

                $stringValue = is_scalar($value) ? (string) $value : null;

                return $stringValue !== null ? trim($stringValue) : null;
            }, $kelasGabungan)));

            if (!empty($labels)) {
                return implode(', ', $labels);
            }
        } elseif (is_string($kelasGabungan) && trim($kelasGabungan) !== '') {
            return trim($kelasGabungan);
        }

        $levelName = $group->levelAnakBinaan?->nama_level_binaan;

        return $levelName ? trim((string) $levelName) : null;
    }

    protected function calculateAttendancePercentage(int $present, int $late, int $absent): float
    {
        $totalSessions = $present + $late + $absent;

        if ($totalSessions === 0) {
            return 0.0;
        }

        return (($present + $late) / $totalSessions) * 100;
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
        if ($attendancePercentage >= 80.0) {
            return 'high';
        }

        if ($attendancePercentage >= 60.0) {
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

    protected function buildWeeksCollection(array $shelterIds, Carbon $rangeStart, Carbon $rangeEnd): array
    {
        if ($rangeEnd->lt($rangeStart)) {
            return [];
        }

        $weeks = $this->initialWeeks($rangeStart, $rangeEnd);

        if (empty($weeks)) {
            return [];
        }

        if (!empty($shelterIds)) {
            $activities = Aktivitas::query()
                ->whereBetween('tanggal', [$rangeStart->toDateString(), $rangeEnd->toDateString()])
                ->whereIn('id_shelter', $shelterIds)
                ->with(['absen.absenUser'])
                ->get(['id_aktivitas', 'tanggal']);

            foreach ($activities as $activity) {
                $activityDate = Carbon::parse($activity->tanggal);
                $weekKey = $this->formatWeekKey($activityDate);

                if (!isset($weeks[$weekKey])) {
                    continue;
                }

                $week = &$weeks[$weekKey];
                $week['metrics']['total_activities']++;

                $attendanceRecords = $activity->absen ?? collect();
                $sessionCount = $attendanceRecords->count();
                $week['metrics']['total_sessions'] += $sessionCount;

                foreach ($attendanceRecords as $attendance) {
                    $status = $this->normalizeAttendanceStatus($attendance->absen ?? null);

                    if ($status === 'present') {
                        $week['metrics']['present_count']++;
                    } elseif ($status === 'late') {
                        $week['metrics']['late_count']++;
                    } else {
                        $week['metrics']['absent_count']++;
                    }

                    $childId = $attendance->absenUser->id_anak ?? null;
                    if ($childId) {
                        $week['_child_ids'][$childId] = true;
                    }

                    $verification = $this->normalizeVerificationStatus($attendance->verification_status ?? null);
                    $week['metrics']['verification'][$verification]++;
                }

                unset($week);
            }
        }

        foreach ($weeks as &$weekPayload) {
            $childIds = array_keys($weekPayload['_child_ids']);
            $this->finalizeMetrics($weekPayload['metrics'], $childIds);
            unset($weekPayload['_child_ids']);
        }
        unset($weekPayload);

        return array_values(array_map(static function ($weekPayload) {
            $startDate = Carbon::parse($weekPayload['start_date']);
            $endDate = Carbon::parse($weekPayload['end_date']);

            return [
                'id' => $weekPayload['week'],
                'label' => sprintf('%s - %s', $startDate->format('d M Y'), $endDate->format('d M Y')),
                'dates' => [
                    'start' => $weekPayload['start_date'],
                    'end' => $weekPayload['end_date'],
                ],
                'metrics' => $weekPayload['metrics'],
            ];
        }, $weeks));
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

    protected function normalizeAttendanceStatus(?string $status): string
    {
        $normalized = strtolower($status ?? '');

        return match ($normalized) {
            strtolower(Absen::TEXT_YA) => 'present',
            strtolower(Absen::TEXT_TERLAMBAT) => 'late',
            strtolower(Absen::TEXT_TIDAK) => 'absent',
            default => 'absent',
        };
    }

    protected function statusMeta(string $status): array
    {
        $map = [
            'all' => ['label' => __('Semua'), 'icon' => 'layers'],
            'present' => ['label' => __('Hadir'), 'icon' => 'check-circle'],
            'late' => ['label' => __('Terlambat'), 'icon' => 'clock'],
            'absent' => ['label' => __('Tidak Hadir'), 'icon' => 'x-circle'],
        ];

        return $map[$status] ?? [
            'label' => ucfirst($status),
            'icon' => 'circle',
        ];
    }
}
