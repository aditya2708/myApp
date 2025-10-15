<?php

namespace App\Services\AdminCabang\Reports\ChildAttendance;

use App\Models\Absen;
use App\Models\AbsenUser;
use App\Models\AdminCabang;
use App\Models\Anak;
use App\Models\Kelompok;
use App\Models\Shelter;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Carbon\CarbonPeriod;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ChildAttendanceReportService
{
    /**
     * Build the list + summary payload for the admin cabang child attendance report.
     */
    public function getSummaryAndList(AdminCabang $adminCabang, array $filters = []): array
    {
        [$start, $end] = $this->resolvePeriod($filters);

        $attendanceBandFilter = $this->normalizeAttendanceBand($filters['attendance_band'] ?? null);
        $search = trim((string) ($filters['search'] ?? ''));
        $perPage = $this->resolvePerPage($filters['per_page'] ?? null);
        $page = $this->resolvePage($filters['page'] ?? null);

        $accessibleShelters = $this->getAccessibleShelters($adminCabang);
        $shelterIds = array_keys($accessibleShelters);

        if (empty($shelterIds)) {
            return $this->emptyPayload($start, $end, $filters, [], [], $perPage, $page);
        }

        $groups = $this->getAccessibleGroups($shelterIds);
        $groupIds = array_keys($groups);

        $selectedShelterId = $this->normalizeIdFilter($filters['shelter_id'] ?? null, $shelterIds);
        $selectedGroupId = $this->normalizeIdFilter($filters['group_id'] ?? null, $groupIds);

        $childrenQuery = Anak::query()
            ->whereIn('status_validasi', Anak::STATUS_AKTIF)
            ->whereIn('id_shelter', $shelterIds);

        if ($selectedShelterId) {
            $childrenQuery->where('id_shelter', $selectedShelterId);
        }

        if ($selectedGroupId) {
            $childrenQuery->where('id_kelompok', $selectedGroupId);
        }

        if ($search !== '') {
            $childrenQuery->where(function ($query) use ($search) {
                $query->where('full_name', 'like', "%{$search}%")
                    ->orWhere('nick_name', 'like', "%{$search}%");
            });
        }

        $childrenRecords = (clone $childrenQuery)
            ->select([
                'id_anak',
                'id_shelter',
                'id_kelompok',
                'full_name',
                'nick_name',
                'jenis_kelamin',
                'tanggal_lahir',
                'foto',
            ])
            ->orderBy('full_name')
            ->get();

        if ($childrenRecords->isEmpty()) {
            return $this->emptyPayload(
                $start,
                $end,
                $filters,
                $accessibleShelters,
                $groups,
                $perPage,
                $page
            );
        }

        $childShelterMap = $childrenRecords
            ->pluck('id_shelter', 'id_anak')
            ->map(fn ($value) => (int) $value)
            ->all();

        $childGroupMap = $childrenRecords
            ->pluck('id_kelompok', 'id_anak')
            ->map(fn ($value) => $value ? (int) $value : null)
            ->all();

        $childIds = array_keys($childShelterMap);

        $attendanceRows = $this->loadAttendanceRows($childIds, $shelterIds, $start, $end);
        $attendanceAggregates = $this->aggregateAttendance($attendanceRows, $start, $end);

        if ($attendanceBandFilter) {
            $childrenRecords = $childrenRecords->filter(function (Anak $child) use ($attendanceAggregates, $attendanceBandFilter) {
                $stats = $attendanceAggregates['children'][$child->id_anak] ?? null;

                if (!$stats) {
                    return $attendanceBandFilter === 'low';
                }

                return ($stats['attendance_band'] ?? null) === $attendanceBandFilter;
            })->values();
        }

        $childIds = $childrenRecords->pluck('id_anak')->map(fn ($value) => (int) $value)->all();

        if (empty($childIds)) {
            return $this->emptyPayload(
                $start,
                $end,
                $filters,
                $accessibleShelters,
                $groups,
                $perPage,
                $page,
                $attendanceBandFilter
            );
        }

        $periodLength = $start->diffInDays($end) + 1;
        $previousStart = $start->copy()->subDays($periodLength)->startOfDay();
        $previousEnd = $start->copy()->subDay()->endOfDay();

        $previousRows = $this->loadAttendanceRows($childIds, $shelterIds, $previousStart, $previousEnd);
        $previousAggregates = $this->aggregateAttendance($previousRows, $previousStart, $previousEnd, false);

        $paginated = $this->paginateChildren($childrenRecords, $perPage, $page);

        $childrenPayload = $paginated->getCollection()->map(function (Anak $child) use ($attendanceAggregates, $start, $end, $accessibleShelters, $groups) {
            $stats = $attendanceAggregates['children'][$child->id_anak] ?? $this->emptyChildStats();
            $monthly = $stats['monthly_breakdown'] ?? [];

            $months = $this->buildMonthsRange($start, $end);
            $monthlyPayload = collect($months)->map(function (CarbonImmutable $monthStart) use ($monthly) {
                $key = $monthStart->format('Y-m');
                $payload = $monthly[$key] ?? [
                    'total_activities' => 0,
                    'hadir_count' => 0,
                    'tidak_hadir_count' => 0,
                ];

                $attendancePercentage = $payload['total_activities'] > 0
                    ? (($payload['hadir_count'] ?? 0) / $payload['total_activities']) * 100
                    : 0.0;

                return [
                    'month' => $key,
                    'label' => $monthStart->translatedFormat('M Y'),
                    'total_activities' => (int) ($payload['total_activities'] ?? 0),
                    'hadir_count' => (int) ($payload['hadir_count'] ?? 0),
                    'tidak_hadir_count' => (int) ($payload['tidak_hadir_count'] ?? 0),
                    'attendance_percentage' => $attendancePercentage,
                ];
            })->values()->all();

            $lastActivity = $stats['last_activity'] ?? null;

            if ($lastActivity) {
                $lastActivity['date'] = $lastActivity['date']?->toDateString();
                $lastActivity['verified_at'] = $lastActivity['verified_at']?->toIso8601String();
            }

            $streaks = $stats['streaks'] ?? [
                'current_present_streak' => 0,
                'longest_present_streak' => 0,
                'last_absent_on' => null,
            ];

            if (!empty($streaks['last_absent_on']) && $streaks['last_absent_on'] instanceof CarbonInterface) {
                $streaks['last_absent_on'] = $streaks['last_absent_on']->toDateString();
            }

            $shelter = $accessibleShelters[$child->id_shelter] ?? ['id' => $child->id_shelter, 'name' => null];
            $group = $groups[$child->id_kelompok] ?? ['id' => $child->id_kelompok, 'name' => null, 'shelter_id' => $child->id_shelter];

            return [
                'id' => $child->id_anak,
                'full_name' => $child->full_name,
                'nick_name' => $child->nick_name,
                'photo_url' => $child->foto ? Storage::url($child->foto) : null,
                'gender' => $child->jenis_kelamin,
                'date_of_birth' => $child->tanggal_lahir ? Carbon::parse($child->tanggal_lahir)->toDateString() : null,
                'shelter' => [
                    'id' => $shelter['id'] ?? $child->id_shelter,
                    'name' => $shelter['name'] ?? null,
                ],
                'group' => [
                    'id' => $group['id'] ?? $child->id_kelompok,
                    'name' => $group['name'] ?? null,
                ],
                'attendance' => [
                    'hadir_count' => (int) ($stats['hadir_count'] ?? 0),
                    'tidak_hadir_count' => (int) ($stats['tidak_hadir_count'] ?? 0),
                    'total_activities' => (int) ($stats['total_activities'] ?? 0),
                    'attendance_percentage' => (float) ($stats['attendance_percentage'] ?? 0),
                    'attendance_band' => $stats['attendance_band'] ?? 'low',
                ],
                'monthly_breakdown' => $monthlyPayload,
                'last_activity' => $lastActivity,
                'streaks' => $streaks,
                'flags' => $stats['flags'] ?? [],
            ];
        })->values()->all();

        $childStats = Arr::only($attendanceAggregates['children'], $childIds);

        $summary = $this->buildSummary($childIds, $childStats, $childShelterMap, $childGroupMap);
        $shelterBreakdown = $this->buildShelterBreakdown(
            $childIds,
            $childShelterMap,
            $childStats,
            $accessibleShelters,
            $previousAggregates['children'] ?? []
        );

        $bandDistribution = $this->buildBandDistribution($childStats);

        $filtersPayload = [
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'attendance_band' => $attendanceBandFilter,
            'search' => $search !== '' ? $search : null,
            'shelter_id' => $selectedShelterId,
            'group_id' => $selectedGroupId,
            'page' => $page,
            'per_page' => $perPage,
        ];

        $availableFilters = [
            'shelters' => array_values($accessibleShelters),
            'groups' => array_values($groups),
            'attendance_bands' => [
                ['value' => 'high', 'label' => 'Baik (≥85%)'],
                ['value' => 'medium', 'label' => 'Cukup (75-84%)'],
                ['value' => 'low', 'label' => 'Rendah (<75%)'],
            ],
        ];

        return [
            'period' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'summary' => $summary,
            'shelter_breakdown' => $shelterBreakdown,
            'shelter_attendance_chart' => array_values(array_map(function ($breakdown) {
                return [
                    'shelter_id' => $breakdown['id'],
                    'label' => $breakdown['name'],
                    'attendance_percentage' => $breakdown['attendance_percentage'],
                ];
            }, $shelterBreakdown)),
            'attendance_band_distribution' => $bandDistribution,
            'children' => $childrenPayload,
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
            'filters' => $filtersPayload,
            'available_filters' => $availableFilters,
            'meta' => [
                'generated_at' => Carbon::now()->toIso8601String(),
                'last_refreshed_at' => Carbon::now()->toIso8601String(),
            ],
        ];
    }

    /**
     * Build the detail payload for a single child.
     */
    public function getChildDetail(AdminCabang $adminCabang, Anak $child, array $filters = []): array
    {
        [$start, $end] = $this->resolvePeriod($filters);

        $accessibleShelters = $this->getAccessibleShelters($adminCabang);
        $shelterIds = array_keys($accessibleShelters);

        if (!in_array($child->id_shelter, $shelterIds, true)) {
            abort(403, __('Anda tidak memiliki akses ke anak ini.'));
        }

        $jenisKegiatan = isset($filters['jenis_kegiatan']) && $filters['jenis_kegiatan'] !== ''
            ? (string) $filters['jenis_kegiatan']
            : null;

        $groups = $this->getAccessibleGroups($shelterIds);

        $attendanceRows = $this->loadAttendanceRows([$child->id_anak], $shelterIds, $start, $end, $jenisKegiatan);
        $aggregates = $this->aggregateAttendance($attendanceRows, $start, $end);

        $stats = $aggregates['children'][$child->id_anak] ?? $this->emptyChildStats();

        $monthly = $stats['monthly_breakdown'] ?? [];
        $months = $this->buildMonthsRange($start, $end);

        $monthlyPayload = collect($months)->map(function (CarbonImmutable $monthStart) use ($monthly) {
            $key = $monthStart->format('Y-m');
            $payload = $monthly[$key] ?? [
                'total_activities' => 0,
                'hadir_count' => 0,
                'tidak_hadir_count' => 0,
            ];

            $attendancePercentage = $payload['total_activities'] > 0
                ? (($payload['hadir_count'] ?? 0) / $payload['total_activities']) * 100
                : 0.0;

            return [
                'month' => $key,
                'label' => $monthStart->translatedFormat('F Y'),
                'total_activities' => (int) ($payload['total_activities'] ?? 0),
                'hadir_count' => (int) ($payload['hadir_count'] ?? 0),
                'tidak_hadir_count' => (int) ($payload['tidak_hadir_count'] ?? 0),
                'attendance_percentage' => $attendancePercentage,
            ];
        })->values()->all();

        $timeline = $aggregates['timelines'][$child->id_anak] ?? [];
        $timelinePayload = collect($timeline)
            ->sortByDesc(fn ($entry) => $entry['date'])
            ->map(function ($entry) {
                return [
                    'activity_id' => $entry['activity_id'],
                    'date' => $entry['date']->toDateString(),
                    'activity_name' => $entry['activity_name'],
                    'jenis_kegiatan' => $entry['jenis_kegiatan'],
                    'shelter_id' => $entry['shelter_id'],
                    'group_id' => $entry['group_id'],
                    'status' => $entry['status'],
                    'time_arrived' => $entry['time_arrived']?->format('H:i'),
                    'is_verified' => (bool) $entry['is_verified'],
                    'tutor' => $entry['tutor'],
                    'material' => $entry['material'],
                    'start_time' => $entry['start_time'],
                    'end_time' => $entry['end_time'],
                    'notes' => $entry['notes'],
                ];
            })
            ->values()
            ->all();

        $verification = $stats['verification_summary'] ?? [
            'pending' => 0,
            'verified' => 0,
            'rejected' => 0,
            'manual' => 0,
        ];

        $streaks = $stats['streaks'] ?? [
            'current_present_streak' => 0,
            'longest_present_streak' => 0,
            'last_absent_on' => null,
        ];

        if (!empty($streaks['last_absent_on']) && $streaks['last_absent_on'] instanceof CarbonInterface) {
            $streaks['last_absent_on'] = $streaks['last_absent_on']->toDateString();
        }

        $shelter = $accessibleShelters[$child->id_shelter] ?? ['id' => $child->id_shelter, 'name' => null];

        $group = null;

        if ($child->id_kelompok) {
            $group = $groups[$child->id_kelompok] ?? null;

            if (!$group) {
                $childGroup = $child->relationLoaded('kelompok')
                    ? $child->kelompok
                    : $child->loadMissing('kelompok')->kelompok;

                if ($childGroup) {
                    $group = [
                        'id' => (int) $childGroup->id_kelompok,
                        'name' => $childGroup->nama_kelompok,
                        'shelter_id' => (int) $childGroup->id_shelter,
                    ];
                }
            }

            if (!$group) {
                $group = [
                    'id' => (int) $child->id_kelompok,
                    'name' => null,
                    'shelter_id' => (int) $child->id_shelter,
                ];
            }
        }

        return [
            'period' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'child' => [
                'id' => $child->id_anak,
                'full_name' => $child->full_name,
                'nick_name' => $child->nick_name,
                'gender' => $child->jenis_kelamin,
                'date_of_birth' => $child->tanggal_lahir ? Carbon::parse($child->tanggal_lahir)->toDateString() : null,
                'photo_url' => $child->foto ? Storage::url($child->foto) : null,
                'shelter' => [
                    'id' => $shelter['id'] ?? $child->id_shelter,
                    'name' => $shelter['name'] ?? null,
                ],
                'group' => $group,
                'guardian_contact' => null,
            ],
            'summary' => [
                'total_activities' => (int) ($stats['total_activities'] ?? 0),
                'hadir_count' => (int) ($stats['hadir_count'] ?? 0),
                'tidak_hadir_count' => (int) ($stats['tidak_hadir_count'] ?? 0),
                'attendance_percentage' => (float) ($stats['attendance_percentage'] ?? 0),
                'attendance_band' => $stats['attendance_band'] ?? 'low',
                'last_present_on' => $stats['last_present_on']?->toDateString(),
                'consecutive_absent' => (int) ($stats['consecutive_absent'] ?? 0),
            ],
            'verification_summary' => $verification,
            'monthly_breakdown' => $monthlyPayload,
            'attendance_timeline' => $timelinePayload,
            'streaks' => [
                'present' => [
                    'current' => (int) ($streaks['current_present_streak'] ?? 0),
                    'longest' => (int) ($streaks['longest_present_streak'] ?? 0),
                ],
                'absent' => [
                    'current' => (int) ($stats['consecutive_absent'] ?? 0),
                    'longest' => (int) ($stats['longest_absent_streak'] ?? 0),
                ],
            ],
            'filters' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'jenis_kegiatan' => $jenisKegiatan,
            ],
            'meta' => [
                'generated_at' => Carbon::now()->toIso8601String(),
                'export_available' => false,
            ],
        ];
    }

    protected function resolvePeriod(array $filters): array
    {
        $start = isset($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : Carbon::now()->startOfQuarter();

        $end = isset($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : Carbon::now()->endOfDay();

        if ($start->greaterThan($end)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        return [$start, $end];
    }

    protected function normalizeAttendanceBand(?string $band): ?string
    {
        if (!$band) {
            return null;
        }

        $normalized = strtolower(trim($band));

        return in_array($normalized, ['high', 'medium', 'low'], true) ? $normalized : null;
    }

    protected function resolvePerPage($value): int
    {
        $perPage = (int) ($value ?? 20);

        if ($perPage < 1) {
            $perPage = 20;
        }

        return min($perPage, 100);
    }

    protected function resolvePage($value): int
    {
        $page = (int) ($value ?? 1);

        return $page > 0 ? $page : 1;
    }

    protected function normalizeIdFilter($value, array $allowed): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $id = (int) $value;

        return in_array($id, $allowed, true) ? $id : null;
    }

    protected function getAccessibleShelters(AdminCabang $adminCabang): array
    {
        $kacab = $adminCabang->loadMissing('kacab')->kacab;

        if (!$kacab) {
            return [];
        }

        return $kacab->shelters()
            ->select('shelter.id_shelter', 'shelter.nama_shelter')
            ->get()
            ->map(function (Shelter $shelter) {
                return [
                    'id' => (int) $shelter->id_shelter,
                    'name' => $shelter->nama_shelter,
                ];
            })
            ->keyBy('id')
            ->map(fn ($payload) => $payload)
            ->all();
    }

    protected function getAccessibleGroups(array $shelterIds): array
    {
        if (empty($shelterIds)) {
            return [];
        }

        return Kelompok::query()
            ->whereIn('id_shelter', $shelterIds)
            ->select('id_kelompok', 'id_shelter', 'nama_kelompok')
            ->get()
            ->map(function (Kelompok $group) {
                return [
                    'id' => (int) $group->id_kelompok,
                    'name' => $group->nama_kelompok,
                    'shelter_id' => (int) $group->id_shelter,
                ];
            })
            ->keyBy('id')
            ->all();
    }

    protected function loadAttendanceRows(array $childIds, array $shelterIds, Carbon $start, Carbon $end, ?string $jenisKegiatan = null): Collection
    {
        if (empty($childIds) || empty($shelterIds)) {
            return collect();
        }

        $query = Absen::query()
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->whereIn('absen_user.id_anak', $childIds)
            ->whereBetween('aktivitas.tanggal', [$start->toDateString(), $end->toDateString()])
            ->whereIn('aktivitas.id_shelter', $shelterIds)
            ->select([
                'absen_user.id_anak as child_id',
                'absen.id_absen as attendance_id',
                'absen.absen as attendance_status',
                'absen.is_verified',
                'absen.verification_status',
                'absen.time_arrived',
                'absen.created_at as attendance_created_at',
                'absen.updated_at as attendance_updated_at',
                'aktivitas.id_aktivitas as activity_id',
                'aktivitas.tanggal as activity_date',
                'aktivitas.jenis_kegiatan',
                'aktivitas.nama_kelompok',
                'aktivitas.id_shelter as shelter_id',
                'aktivitas.start_time',
                'aktivitas.end_time',
                'aktivitas.materi',
                'aktivitas.id_tutor',
            ])
            ->orderBy('aktivitas.tanggal');

        if ($jenisKegiatan) {
            $query->where('aktivitas.jenis_kegiatan', $jenisKegiatan);
        }

        return $query->get();
    }

    protected function aggregateAttendance(Collection $rows, Carbon $start, Carbon $end, bool $withTimeline = true): array
    {
        $children = [];
        $timelines = [];

        $monthKeys = $this->buildMonthsRange($start, $end)
            ->map(fn (CarbonImmutable $monthStart) => $monthStart->format('Y-m'))
            ->values()
            ->all();

        foreach ($rows as $row) {
            $childId = (int) $row->child_id;

            if (!isset($children[$childId])) {
                $children[$childId] = $this->emptyChildStats();
                foreach ($monthKeys as $key) {
                    $children[$childId]['monthly_breakdown'][$key] = [
                        'total_activities' => 0,
                        'hadir_count' => 0,
                        'tidak_hadir_count' => 0,
                    ];
                }
            }

            $activityDate = Carbon::parse($row->activity_date)->startOfDay();
            $status = strtolower((string) $row->attendance_status);

            $children[$childId]['total_activities']++;

            if (in_array($status, [strtolower(Absen::TEXT_YA), strtolower(Absen::TEXT_TERLAMBAT)], true)) {
                $children[$childId]['hadir_count']++;
                $children[$childId]['last_present_on'] = $activityDate;
            } elseif ($status === strtolower(Absen::TEXT_TIDAK)) {
                $children[$childId]['tidak_hadir_count']++;
                $children[$childId]['last_absent_on'] = $activityDate;
            }

            $monthKey = $activityDate->format('Y-m');

            if (!isset($children[$childId]['monthly_breakdown'][$monthKey])) {
                $children[$childId]['monthly_breakdown'][$monthKey] = [
                    'total_activities' => 0,
                    'hadir_count' => 0,
                    'tidak_hadir_count' => 0,
                ];
            }

            $children[$childId]['monthly_breakdown'][$monthKey]['total_activities']++;

            if (in_array($status, [strtolower(Absen::TEXT_YA), strtolower(Absen::TEXT_TERLAMBAT)], true)) {
                $children[$childId]['monthly_breakdown'][$monthKey]['hadir_count']++;
            }

            if ($status === strtolower(Absen::TEXT_TIDAK)) {
                $children[$childId]['monthly_breakdown'][$monthKey]['tidak_hadir_count']++;
            }

            $verificationStatus = $row->verification_status ?? null;

            if ($verificationStatus === Absen::VERIFICATION_PENDING) {
                $children[$childId]['verification_summary']['pending']++;
            } elseif ($verificationStatus === Absen::VERIFICATION_VERIFIED) {
                $children[$childId]['verification_summary']['verified']++;
            } elseif ($verificationStatus === Absen::VERIFICATION_REJECTED) {
                $children[$childId]['verification_summary']['rejected']++;
            } elseif ($verificationStatus === Absen::VERIFICATION_MANUAL) {
                $children[$childId]['verification_summary']['manual']++;
            }

            if (!isset($children[$childId]['last_activity']) || $activityDate->gt($children[$childId]['last_activity']['date'])) {
                $children[$childId]['last_activity'] = [
                    'activity_id' => (int) $row->activity_id,
                    'date' => $activityDate,
                    'activity_name' => $row->nama_kelompok ?: ($row->materi ?? 'Aktivitas'),
                    'status' => $row->attendance_status,
                    'verified_at' => $row->attendance_updated_at ? Carbon::parse($row->attendance_updated_at) : null,
                ];
            }

            if ($withTimeline) {
                $timelines[$childId][] = [
                    'activity_id' => (int) $row->activity_id,
                    'date' => $activityDate,
                    'activity_name' => $row->nama_kelompok ?: ($row->materi ?? 'Aktivitas'),
                    'jenis_kegiatan' => $row->jenis_kegiatan,
                    'shelter_id' => (int) $row->shelter_id,
                    'group_id' => null,
                    'status' => $row->attendance_status,
                    'time_arrived' => $row->time_arrived ? Carbon::parse($row->time_arrived) : null,
                    'is_verified' => (bool) $row->is_verified,
                    'tutor' => null,
                    'material' => $row->materi,
                    'start_time' => $row->start_time,
                    'end_time' => $row->end_time,
                    'notes' => [],
                ];
            }
        }

        foreach ($children as $childId => &$stats) {
            $totalActivities = $stats['total_activities'];
            $hadirCount = $stats['hadir_count'];

            $stats['attendance_percentage'] = $totalActivities > 0
                ? ($hadirCount / $totalActivities) * 100
                : 0.0;

            $stats['attendance_band'] = $this->determineAttendanceBand($stats['attendance_percentage']);

            if ($stats['attendance_band'] === 'low') {
                $stats['flags'][] = [
                    'type' => 'low_attendance',
                    'label' => __('Perlu tindak lanjut kehadiran rendah'),
                ];
            }

            $monthly = $stats['monthly_breakdown'] ?? [];

            foreach ($monthly as $key => $payload) {
                if (($payload['total_activities'] ?? 0) === 0) {
                    unset($stats['monthly_breakdown'][$key]);
                }
            }

            $timelineEntries = $timelines[$childId] ?? [];

            if (!empty($timelineEntries)) {
                $sorted = collect($timelineEntries)
                    ->sortBy('date')
                    ->values();

                $stats['streaks'] = $this->buildStreaks($sorted);
                $stats['consecutive_absent'] = $stats['streaks']['current_absent_streak'];
                $stats['longest_absent_streak'] = $stats['streaks']['longest_absent_streak'];
            } else {
                $stats['streaks'] = [
                    'current_present_streak' => 0,
                    'longest_present_streak' => 0,
                    'current_absent_streak' => 0,
                    'longest_absent_streak' => 0,
                    'last_absent_on' => null,
                ];
                $stats['consecutive_absent'] = 0;
                $stats['longest_absent_streak'] = 0;
            }
        }
        unset($stats);

        return [
            'children' => $children,
            'timelines' => $timelines,
        ];
    }

    protected function emptyChildStats(): array
    {
        return [
            'hadir_count' => 0,
            'tidak_hadir_count' => 0,
            'total_activities' => 0,
            'attendance_percentage' => 0.0,
            'attendance_band' => 'low',
            'monthly_breakdown' => [],
            'last_activity' => null,
            'verification_summary' => [
                'pending' => 0,
                'verified' => 0,
                'rejected' => 0,
                'manual' => 0,
            ],
            'flags' => [],
            'streaks' => [
                'current_present_streak' => 0,
                'longest_present_streak' => 0,
                'current_absent_streak' => 0,
                'longest_absent_streak' => 0,
                'last_absent_on' => null,
            ],
            'consecutive_absent' => 0,
            'longest_absent_streak' => 0,
            'last_present_on' => null,
            'last_absent_on' => null,
        ];
    }

    protected function buildMonthsRange(Carbon $start, Carbon $end): Collection
    {
        $startMonth = CarbonImmutable::instance($start)->startOfMonth();
        $endMonth = CarbonImmutable::instance($end)->startOfMonth();

        return collect(CarbonPeriod::create($startMonth, '1 month', $endMonth)->toArray())
            ->map(fn ($date) => CarbonImmutable::instance($date));
    }

    protected function paginateChildren(Collection $children, int $perPage, int $page): LengthAwarePaginator
    {
        $offset = ($page - 1) * $perPage;
        $items = $children->slice($offset, $perPage)->values();

        return new LengthAwarePaginator(
            $items,
            $children->count(),
            $perPage,
            $page,
            [
                'path' => LengthAwarePaginator::resolveCurrentPath(),
            ]
        );
    }

    protected function buildSummary(array $childIds, array $childStats, array $childShelterMap, array $childGroupMap): array
    {
        $totalChildren = count($childIds);
        $totalHadir = 0;
        $totalTidakHadir = 0;
        $totalActivities = 0;
        $lowBandChildren = 0;
        $activeChildren = 0;

        foreach ($childIds as $childId) {
            $stats = $childStats[$childId] ?? $this->emptyChildStats();
            $totalHadir += $stats['hadir_count'] ?? 0;
            $totalTidakHadir += $stats['tidak_hadir_count'] ?? 0;

            $childActivities = (int) ($stats['total_activities'] ?? 0);
            $totalActivities += $childActivities;

            if ($childActivities > 0) {
                $activeChildren++;
            }

            if (($stats['attendance_band'] ?? 'low') === 'low') {
                $lowBandChildren++;
            }
        }

        $inactiveChildren = max(0, $totalChildren - $activeChildren);

        $attendancePercentage = $totalActivities > 0
            ? ($totalHadir / $totalActivities) * 100
            : 0.0;

        $uniqueShelters = collect($childIds)
            ->map(fn ($childId) => $childShelterMap[$childId] ?? null)
            ->filter()
            ->unique()
            ->count();

        $uniqueGroups = collect($childIds)
            ->map(fn ($childId) => $childGroupMap[$childId] ?? null)
            ->filter()
            ->unique()
            ->count();

        return [
            'total_shelters' => (int) $uniqueShelters,
            'total_groups' => (int) $uniqueGroups,
            'total_children' => (int) $totalChildren,
            'total_activities' => (int) $totalActivities,
            'hadir_count' => (int) $totalHadir,
            'tidak_hadir_count' => (int) $totalTidakHadir,
            'attendance_percentage' => $attendancePercentage,
            'low_band_children' => (int) $lowBandChildren,
            'active_children' => (int) $activeChildren,
            'inactive_children' => (int) $inactiveChildren,
        ];
    }

    protected function buildShelterBreakdown(
        array $childIds,
        array $childShelterMap,
        array $childStats,
        array $accessibleShelters,
        array $previousStats
    ): array {
        $aggregates = [];

        foreach ($childIds as $childId) {
            $shelterId = $childShelterMap[$childId] ?? null;

            if (!$shelterId) {
                continue;
            }

            if (!isset($aggregates[$shelterId])) {
                $aggregates[$shelterId] = [
                    'id' => $shelterId,
                    'name' => $accessibleShelters[$shelterId]['name'] ?? null,
                    'total_children' => 0,
                    'hadir_count' => 0,
                    'tidak_hadir_count' => 0,
                    'total_activities' => 0,
                    'low_band_children' => 0,
                    'previous_attendance_percentage' => 0.0,
                ];
            }

            $stats = $childStats[$childId] ?? $this->emptyChildStats();

            $aggregates[$shelterId]['total_children']++;
            $aggregates[$shelterId]['hadir_count'] += $stats['hadir_count'] ?? 0;
            $aggregates[$shelterId]['tidak_hadir_count'] += $stats['tidak_hadir_count'] ?? 0;
            $aggregates[$shelterId]['total_activities'] += $stats['total_activities'] ?? 0;

            if (($stats['attendance_band'] ?? 'low') === 'low') {
                $aggregates[$shelterId]['low_band_children']++;
            }

            $previous = $previousStats[$childId] ?? null;

            if ($previous) {
                $previousTotal = ($aggregates[$shelterId]['previous_total_activities'] ?? 0) + ($previous['total_activities'] ?? 0);
                $previousAttended = ($aggregates[$shelterId]['previous_hadir'] ?? 0)
                    + ($previous['hadir_count'] ?? 0);

                $aggregates[$shelterId]['previous_total_activities'] = $previousTotal;
                $aggregates[$shelterId]['previous_hadir'] = $previousAttended;
            }
        }

        foreach ($aggregates as &$aggregate) {
            $currentAttended = $aggregate['hadir_count'];
            $aggregate['attendance_percentage'] = $aggregate['total_activities'] > 0
                ? ($currentAttended / $aggregate['total_activities']) * 100
                : 0.0;

            $aggregate['attendance_band'] = $this->determineAttendanceBand($aggregate['attendance_percentage']);

            $previousSessions = $aggregate['previous_total_activities'] ?? 0;
            $previousAttended = $aggregate['previous_hadir'] ?? 0;
            $previousPercentage = $previousSessions > 0
                ? ($previousAttended / $previousSessions) * 100
                : 0.0;

            $aggregate['previous_attendance_percentage'] = $previousPercentage;
            $aggregate['trend_delta'] = $aggregate['attendance_percentage'] - $previousPercentage;

            unset($aggregate['previous_total_activities'], $aggregate['previous_hadir']);
        }
        unset($aggregate);

        usort($aggregates, function ($a, $b) {
            return strcmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
        });

        return $aggregates;
    }

    protected function buildBandDistribution(array $childStats): array
    {
        $distribution = [
            'high' => 0,
            'medium' => 0,
            'low' => 0,
        ];

        foreach ($childStats as $stats) {
            $band = $stats['attendance_band'] ?? 'low';

            if (!isset($distribution[$band])) {
                $distribution[$band] = 0;
            }

            $distribution[$band]++;
        }

        return $distribution;
    }

    protected function determineAttendanceBand(float $percentage): string
    {
        if ($percentage >= 85.0) {
            return 'high';
        }

        if ($percentage >= 75.0) {
            return 'medium';
        }

        return 'low';
    }

    protected function buildStreaks(Collection $timeline): array
    {
        $currentPresent = 0;
        $longestPresent = 0;
        $currentAbsent = 0;
        $longestAbsent = 0;
        $lastAbsentOn = null;

        $statuses = $timeline->map(function ($entry) {
            return [
                'date' => $entry['date'],
                'status' => strtolower((string) $entry['status']),
            ];
        });

        foreach ($statuses as $entry) {
            $status = $entry['status'];

            if (in_array($status, [strtolower(Absen::TEXT_YA), strtolower(Absen::TEXT_TERLAMBAT)], true)) {
                $currentPresent++;
                $longestPresent = max($longestPresent, $currentPresent);
                $currentAbsent = 0;
            } else {
                $currentPresent = 0;
                $currentAbsent++;
                $longestAbsent = max($longestAbsent, $currentAbsent);
                $lastAbsentOn = $entry['date'];
            }
        }

        $reversed = $statuses->sortByDesc('date');
        $currentPresentStreak = 0;
        $currentAbsentStreak = 0;

        foreach ($reversed as $entry) {
            $status = $entry['status'];

            if (in_array($status, [strtolower(Absen::TEXT_YA), strtolower(Absen::TEXT_TERLAMBAT)], true)) {
                if ($currentAbsentStreak === 0) {
                    $currentPresentStreak++;
                    continue;
                }
                break;
            }

            if ($status === strtolower(Absen::TEXT_TIDAK)) {
                if ($currentPresentStreak === 0) {
                    $currentAbsentStreak++;
                    continue;
                }
                break;
            }
        }

        return [
            'current_present_streak' => $currentPresentStreak,
            'longest_present_streak' => $longestPresent,
            'current_absent_streak' => $currentAbsentStreak,
            'longest_absent_streak' => $longestAbsent,
            'last_absent_on' => $lastAbsentOn,
        ];
    }

    protected function emptyPayload(
        Carbon $start,
        Carbon $end,
        array $filters,
        array $shelters,
        array $groups,
        int $perPage,
        int $page,
        ?string $attendanceBand = null
    ): array {
        return [
            'period' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'summary' => [
                'total_shelters' => 0,
                'total_groups' => 0,
                'total_children' => 0,
                'total_activities' => 0,
                'hadir_count' => 0,
                'tidak_hadir_count' => 0,
                'attendance_percentage' => 0.0,
                'low_band_children' => 0,
                'active_children' => 0,
                'inactive_children' => 0,
            ],
            'shelter_breakdown' => [],
            'shelter_attendance_chart' => [],
            'attendance_band_distribution' => [
                'high' => 0,
                'medium' => 0,
                'low' => 0,
            ],
            'children' => [],
            'pagination' => [
                'total' => 0,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => 0,
            ],
            'filters' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'attendance_band' => $attendanceBand,
                'search' => isset($filters['search']) && trim((string) $filters['search']) !== '' ? trim((string) $filters['search']) : null,
                'shelter_id' => $this->normalizeIdFilter($filters['shelter_id'] ?? null, array_keys($shelters)),
                'group_id' => $this->normalizeIdFilter($filters['group_id'] ?? null, array_keys($groups)),
                'page' => $page,
                'per_page' => $perPage,
            ],
            'available_filters' => [
                'shelters' => array_values($shelters),
                'groups' => array_values($groups),
                'attendance_bands' => [
                    ['value' => 'high', 'label' => 'Baik (≥85%)'],
                    ['value' => 'medium', 'label' => 'Cukup (75-84%)'],
                    ['value' => 'low', 'label' => 'Rendah (<75%)'],
                ],
            ],
            'meta' => [
                'generated_at' => Carbon::now()->toIso8601String(),
                'last_refreshed_at' => Carbon::now()->toIso8601String(),
            ],
        ];
    }
}

