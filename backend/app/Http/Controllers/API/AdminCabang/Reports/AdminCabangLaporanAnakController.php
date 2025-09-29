<?php

namespace App\Http\Controllers\API\AdminCabang\Reports;

use App\Http\Controllers\Controller;
use App\Models\Absen;
use App\Models\Aktivitas;
use App\Models\Anak;
use App\Models\Shelter;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;

class AdminCabangLaporanAnakController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $adminCabang = $user->adminCabang;

        if (!$adminCabang || !$adminCabang->kacab) {
            return response()->json([
                'message' => 'Admin cabang tidak ditemukan',
            ], 404);
        }

        $shelters = $adminCabang->kacab->shelters()->with('wilbin')->get();

        if ($shelters->isEmpty()) {
            return response()->json([
                'message' => 'Laporan anak binaan berhasil diambil',
                'data' => [
                    'children' => [],
                    'summary' => [
                        'total_children' => 0,
                        'total_activities' => 0,
                        'total_attended' => 0,
                        'average_attendance' => 0,
                        'highest_attendance' => 0,
                        'lowest_attendance' => 0,
                        'date_range' => null,
                        'by_shelter' => [],
                        'by_wilbin' => [],
                    ],
                    'pagination' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => (int) ($request->input('per_page', 15)),
                        'total' => 0,
                    ],
                    'filter_options' => $this->buildFilterOptions($shelters, null, null, null, null),
                ],
            ]);
        }

        $allowedShelterIds = $shelters->pluck('id_shelter');
        $allowedWilbinIds = $shelters->pluck('wilbin')->filter()->pluck('id_wilbin')->unique();

        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'jenis_kegiatan' => 'nullable|string',
            'search' => 'nullable|string',
            'shelter_id' => 'nullable|integer',
            'wilbin_id' => 'nullable|integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $perPage = (int) ($validated['per_page'] ?? 15);
        $jenisKegiatan = $validated['jenis_kegiatan'] ?? null;
        $search = $validated['search'] ?? null;
        $shelterFilter = $validated['shelter_id'] ?? null;
        $wilbinFilter = $validated['wilbin_id'] ?? null;

        try {
            $startDate = isset($validated['start_date'])
                ? Carbon::parse($validated['start_date'])->startOfDay()
                : now()->copy()->startOfYear();
            $endDate = isset($validated['end_date'])
                ? Carbon::parse($validated['end_date'])->endOfDay()
                : now()->copy()->endOfYear();
        } catch (\Exception $exception) {
            return response()->json([
                'message' => 'Format tanggal tidak valid',
                'errors' => [
                    'date' => [$exception->getMessage()],
                ],
            ], 422);
        }

        if ($startDate->gt($endDate)) {
            return response()->json([
                'message' => 'Rentang tanggal tidak valid',
                'errors' => [
                    'start_date' => ['Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir.'],
                ],
            ], 422);
        }

        if ($wilbinFilter && !$allowedWilbinIds->contains($wilbinFilter)) {
            return response()->json([
                'message' => 'Wilayah binaan tidak ditemukan',
            ], 422);
        }

        $filteredShelterIds = $allowedShelterIds->toArray();

        if ($wilbinFilter) {
            $filteredShelterIds = $shelters
                ->where('id_wilbin', $wilbinFilter)
                ->pluck('id_shelter')
                ->toArray();
        }

        if ($shelterFilter) {
            if (!in_array($shelterFilter, $filteredShelterIds, true)) {
                return response()->json([
                    'message' => 'Shelter tidak ditemukan',
                ], 422);
            }
            $filteredShelterIds = [$shelterFilter];
        }

        if (empty($filteredShelterIds)) {
            return response()->json([
                'message' => 'Laporan anak binaan berhasil diambil',
                'data' => [
                    'children' => [],
                    'summary' => [
                        'total_children' => 0,
                        'total_activities' => 0,
                        'total_attended' => 0,
                        'average_attendance' => 0,
                        'highest_attendance' => 0,
                        'lowest_attendance' => 0,
                        'date_range' => [
                            'start_date' => $startDate->format('Y-m-d'),
                            'end_date' => $endDate->format('Y-m-d'),
                        ],
                        'by_shelter' => [],
                        'by_wilbin' => [],
                    ],
                    'pagination' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => $perPage,
                        'total' => 0,
                    ],
                    'filter_options' => $this->buildFilterOptions($shelters, $startDate, $endDate, $jenisKegiatan, $filteredShelterIds, $wilbinFilter, $shelterFilter),
                ],
            ]);
        }

        $childrenBaseQuery = Anak::query()
            ->whereIn('id_shelter', $filteredShelterIds)
            ->whereIn('status_validasi', Anak::STATUS_AKTIF);

        if ($search) {
            $childrenBaseQuery->where(function ($query) use ($search) {
                $query->where('full_name', 'like', "%{$search}%")
                    ->orWhere('nick_name', 'like', "%{$search}%");
            });
        }

        $childrenQuery = (clone $childrenBaseQuery)
            ->with(['shelter.wilbin'])
            ->select('id_anak', 'id_shelter', 'full_name', 'nick_name', 'foto')
            ->orderBy('full_name');

        $children = $childrenQuery->paginate($perPage);

        $monthsInRange = $this->getMonthsInRange($startDate, $endDate);
        $childIds = $children->pluck('id_anak')->all();
        $childShelterIds = $children->pluck('id_shelter')->unique()->all();

        $activitiesPerShelterPerMonth = $this->getActivitiesPerShelterPerMonth($childShelterIds, $startDate, $endDate, $jenisKegiatan);
        $totalActivitiesByShelter = $this->getTotalActivitiesByShelter($childShelterIds, $startDate, $endDate, $jenisKegiatan);
        $attendancePerChildPerMonth = $this->getAttendancePerChildPerMonth($childIds, $startDate, $endDate, $jenisKegiatan);
        $totalAttendanceByChild = $this->getTotalAttendanceByChild($childIds, $startDate, $endDate, $jenisKegiatan);
        $attendanceOpportunitiesPerChildPerMonth = $this->getAttendanceOpportunitiesPerChildPerMonth($childIds, $startDate, $endDate, $jenisKegiatan);
        $totalAttendanceOpportunitiesByChild = $this->getTotalAttendanceOpportunitiesByChild($childIds, $startDate, $endDate, $jenisKegiatan);

        $childrenData = [];
        foreach ($children as $child) {
            $childMonthly = [];
            foreach ($monthsInRange as $month) {
                $activityKey = $child->id_shelter . '-' . $month['year'] . '-' . $month['month'];
                $attendanceKey = $child->id_anak . '-' . $month['year'] . '-' . $month['month'];
                $opportunityKey = $attendanceKey;

                $activitiesCount = $activitiesPerShelterPerMonth[$activityKey] ?? 0;
                $attendedCount = $attendancePerChildPerMonth[$attendanceKey] ?? 0;
                $opportunitiesCount = $attendanceOpportunitiesPerChildPerMonth[$opportunityKey] ?? 0;
                $percentage = $opportunitiesCount > 0 ? round(($attendedCount / $opportunitiesCount) * 100, 1) : 0;

                $childMonthly[$month['key']] = [
                    'month_name' => $month['name'],
                    'month_number' => $month['month'],
                    'year' => $month['year'],
                    'activities_count' => $activitiesCount,
                    'attended_count' => $attendedCount,
                    'attendance_opportunities_count' => $opportunitiesCount,
                    'percentage' => $percentage,
                ];
            }

            $totalActivities = $totalActivitiesByShelter[$child->id_shelter] ?? 0;
            $totalAttended = $totalAttendanceByChild[$child->id_anak] ?? 0;
            $totalOpportunities = $totalAttendanceOpportunitiesByChild[$child->id_anak] ?? 0;
            $overallPercentage = $totalOpportunities > 0 ? round(($totalAttended / $totalOpportunities) * 100, 1) : 0;

            $childrenData[] = [
                'id_anak' => $child->id_anak,
                'full_name' => $child->full_name,
                'nick_name' => $child->nick_name,
                'foto_url' => $child->foto_url,
                'shelter' => $child->shelter ? [
                    'id' => $child->shelter->id_shelter,
                    'name' => $child->shelter->nama_shelter,
                    'wilbin' => $child->shelter->wilbin ? [
                        'id' => $child->shelter->wilbin->id_wilbin,
                        'name' => $child->shelter->wilbin->nama_wilbin,
                    ] : null,
                ] : null,
                'monthly_data' => $childMonthly,
                'total_activities' => $totalActivities,
                'total_attended' => $totalAttended,
                'total_attendance_opportunities' => $totalOpportunities,
                'overall_percentage' => $overallPercentage,
            ];
        }

        $allChildren = (clone $childrenBaseQuery)->select('id_anak', 'id_shelter')->get();
        $allChildIds = $allChildren->pluck('id_anak')->all();
        $allShelterIds = $allChildren->pluck('id_shelter')->unique()->all();

        $activityTotalsAllShelters = $this->getTotalActivitiesByShelter($allShelterIds, $startDate, $endDate, $jenisKegiatan);
        $attendanceByChildAll = $this->getTotalAttendanceByChild($allChildIds, $startDate, $endDate, $jenisKegiatan, $search, $filteredShelterIds);
        $attendanceByShelterAll = $this->getAttendanceByShelter($allShelterIds, $startDate, $endDate, $jenisKegiatan, $search);
        $attendanceOpportunitiesByChildAll = $this->getTotalAttendanceOpportunitiesByChild($allChildIds, $startDate, $endDate, $jenisKegiatan, $search, $filteredShelterIds);
        $attendanceOpportunitiesByShelterAll = $this->getAttendanceOpportunitiesByShelter($allShelterIds, $startDate, $endDate, $jenisKegiatan, $search);

        $childShelterCounts = $allChildren
            ->groupBy('id_shelter')
            ->map(fn (Collection $group) => $group->count());

        $shelterMeta = $shelters->keyBy('id_shelter');
        $shelterSummary = [];
        $wilbinSummary = [];
        $childPercentages = [];

        foreach ($allChildren as $childRecord) {
            $totalActivities = $activityTotalsAllShelters[$childRecord->id_shelter] ?? 0;
            $totalAttended = $attendanceByChildAll[$childRecord->id_anak] ?? 0;
            $totalOpportunities = $attendanceOpportunitiesByChildAll[$childRecord->id_anak] ?? 0;
            $percentage = $totalOpportunities > 0 ? round(($totalAttended / $totalOpportunities) * 100, 1) : 0;
            $childPercentages[] = $percentage;
        }

        foreach ($allShelterIds as $shelterId) {
            $meta = $shelterMeta->get($shelterId);
            $childCount = $childShelterCounts->get($shelterId, 0);
            $activityCount = $activityTotalsAllShelters[$shelterId] ?? 0;
            $attendedCount = $attendanceByShelterAll[$shelterId] ?? 0;
            $opportunities = $attendanceOpportunitiesByShelterAll[$shelterId] ?? 0;
            $percentage = $opportunities > 0 ? round(($attendedCount / $opportunities) * 100, 1) : 0;

            $wilbinData = null;
            if ($meta && $meta->wilbin) {
                $wilbinData = [
                    'id' => $meta->wilbin->id_wilbin,
                    'name' => $meta->wilbin->nama_wilbin,
                ];
            }

            $shelterSummary[] = [
                'id_shelter' => $shelterId,
                'nama_shelter' => $meta?->nama_shelter,
                'wilbin' => $wilbinData,
                'total_children' => $childCount,
                'total_activities' => $activityCount,
                'total_attended' => $attendedCount,
                'total_attendance_opportunities' => $opportunities,
                'attendance_percentage' => $percentage,
            ];

            if ($wilbinData) {
                $wilbinId = $wilbinData['id'];
                if (!isset($wilbinSummary[$wilbinId])) {
                    $wilbinSummary[$wilbinId] = [
                        'id_wilbin' => $wilbinId,
                        'nama_wilbin' => $wilbinData['name'],
                        'total_children' => 0,
                        'total_activities' => 0,
                        'total_attended' => 0,
                        'total_attendance_opportunities' => 0,
                    ];
                }

                $wilbinSummary[$wilbinId]['total_children'] += $childCount;
                $wilbinSummary[$wilbinId]['total_activities'] += $activityCount;
                $wilbinSummary[$wilbinId]['total_attended'] += $attendedCount;
                $wilbinSummary[$wilbinId]['total_attendance_opportunities'] += $opportunities;
            }
        }

        foreach ($wilbinSummary as $wilbinId => $data) {
            $opportunities = $data['total_attendance_opportunities'];
            $wilbinSummary[$wilbinId]['attendance_percentage'] = $opportunities > 0
                ? round(($data['total_attended'] / $opportunities) * 100, 1)
                : 0;
        }

        $totalChildren = $allChildren->count();
        $totalActivities = array_sum($activityTotalsAllShelters);
        $totalAttended = array_sum($attendanceByShelterAll);
        $totalOpportunities = array_sum($attendanceOpportunitiesByShelterAll);
        $averageAttendance = !empty($childPercentages)
            ? round(array_sum($childPercentages) / count($childPercentages), 1)
            : 0;
        $highestAttendance = !empty($childPercentages) ? max($childPercentages) : 0;
        $lowestAttendance = !empty($childPercentages) ? min($childPercentages) : 0;

        $summary = [
            'total_children' => $totalChildren,
            'total_activities' => $totalActivities,
            'total_attended' => $totalAttended,
            'total_attendance_opportunities' => $totalOpportunities,
            'average_attendance' => $averageAttendance,
            'highest_attendance' => $highestAttendance,
            'lowest_attendance' => $lowestAttendance,
            'date_range' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'by_shelter' => $shelterSummary,
            'by_wilbin' => array_values($wilbinSummary),
        ];

        return response()->json([
            'message' => 'Laporan anak binaan berhasil diambil',
            'data' => [
                'children' => $childrenData,
                'summary' => $summary,
                'pagination' => [
                    'current_page' => $children->currentPage(),
                    'last_page' => $children->lastPage(),
                    'per_page' => $children->perPage(),
                    'total' => $children->total(),
                ],
                'filter_options' => $this->buildFilterOptions(
                    $shelters,
                    $startDate,
                    $endDate,
                    $jenisKegiatan,
                    $filteredShelterIds,
                    $wilbinFilter,
                    $shelterFilter
                ),
            ],
        ]);
    }

    public function showChild(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 401);
        }

        $adminCabang = $user->adminCabang;

        if (!$adminCabang || !$adminCabang->kacab) {
            return response()->json([
                'message' => 'Admin cabang tidak ditemukan',
            ], 404);
        }

        $shelters = $adminCabang->kacab->shelters()->with('wilbin')->get();
        $allowedShelterIds = $shelters->pluck('id_shelter');

        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'jenis_kegiatan' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $jenisKegiatan = $validated['jenis_kegiatan'] ?? null;

        try {
            $startDate = isset($validated['start_date'])
                ? Carbon::parse($validated['start_date'])->startOfDay()
                : now()->copy()->startOfYear();
            $endDate = isset($validated['end_date'])
                ? Carbon::parse($validated['end_date'])->endOfDay()
                : now()->copy()->endOfYear();
        } catch (\Exception $exception) {
            return response()->json([
                'message' => 'Format tanggal tidak valid',
                'errors' => [
                    'date' => [$exception->getMessage()],
                ],
            ], 422);
        }

        if ($startDate->gt($endDate)) {
            return response()->json([
                'message' => 'Rentang tanggal tidak valid',
                'errors' => [
                    'start_date' => ['Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir.'],
                ],
            ], 422);
        }

        $child = Anak::with(['shelter.wilbin'])
            ->where('id_anak', $id)
            ->whereIn('status_validasi', Anak::STATUS_AKTIF)
            ->whereIn('id_shelter', $allowedShelterIds)
            ->first();

        if (!$child) {
            return response()->json([
                'message' => 'Anak binaan tidak ditemukan',
            ], 404);
        }

        $monthsInRange = $this->getMonthsInRange($startDate, $endDate);
        $activitiesPerMonth = $this->getActivitiesPerShelterPerMonth([$child->id_shelter], $startDate, $endDate, $jenisKegiatan);
        $attendancePerMonth = $this->getAttendancePerChildPerMonth([$child->id_anak], $startDate, $endDate, $jenisKegiatan);
        $totalActivitiesByShelter = $this->getTotalActivitiesByShelter([$child->id_shelter], $startDate, $endDate, $jenisKegiatan);
        $totalAttendanceByChild = $this->getTotalAttendanceByChild([$child->id_anak], $startDate, $endDate, $jenisKegiatan);
        $attendanceOpportunitiesPerMonth = $this->getAttendanceOpportunitiesPerChildPerMonth([$child->id_anak], $startDate, $endDate, $jenisKegiatan);
        $totalAttendanceOpportunitiesByChild = $this->getTotalAttendanceOpportunitiesByChild([$child->id_anak], $startDate, $endDate, $jenisKegiatan);

        $monthlyData = [];
        foreach ($monthsInRange as $month) {
            $activityKey = $child->id_shelter . '-' . $month['year'] . '-' . $month['month'];
            $attendanceKey = $child->id_anak . '-' . $month['year'] . '-' . $month['month'];
            $opportunityKey = $attendanceKey;

            $activitiesCount = $activitiesPerMonth[$activityKey] ?? 0;
            $attendedCount = $attendancePerMonth[$attendanceKey] ?? 0;
            $opportunitiesCount = $attendanceOpportunitiesPerMonth[$opportunityKey] ?? 0;
            $percentage = $opportunitiesCount > 0 ? round(($attendedCount / $opportunitiesCount) * 100, 1) : 0;

            $monthlyData[$month['key']] = [
                'month_name' => $month['name'],
                'month_number' => $month['month'],
                'year' => $month['year'],
                'activities_count' => $activitiesCount,
                'attended_count' => $attendedCount,
                'attendance_opportunities_count' => $opportunitiesCount,
                'percentage' => $percentage,
            ];
        }

        $totalActivities = $totalActivitiesByShelter[$child->id_shelter] ?? 0;
        $totalAttended = $totalAttendanceByChild[$child->id_anak] ?? 0;
        $totalOpportunities = $totalAttendanceOpportunitiesByChild[$child->id_anak] ?? 0;
        $overallPercentage = $totalOpportunities > 0 ? round(($totalAttended / $totalOpportunities) * 100, 1) : 0;

        return response()->json([
            'message' => 'Detail laporan anak binaan berhasil diambil',
            'data' => [
                'child' => [
                    'id_anak' => $child->id_anak,
                    'full_name' => $child->full_name,
                    'nick_name' => $child->nick_name,
                    'foto_url' => $child->foto_url,
                    'shelter' => $child->shelter ? [
                        'id' => $child->shelter->id_shelter,
                        'name' => $child->shelter->nama_shelter,
                        'wilbin' => $child->shelter->wilbin ? [
                            'id' => $child->shelter->wilbin->id_wilbin,
                            'name' => $child->shelter->wilbin->nama_wilbin,
                        ] : null,
                    ] : null,
                    'monthly_data' => $monthlyData,
                    'total_activities' => $totalActivities,
                    'total_attended' => $totalAttended,
                    'total_attendance_opportunities' => $totalOpportunities,
                    'overall_percentage' => $overallPercentage,
                ],
                'filter_options' => $this->buildFilterOptions(
                    $shelters,
                    $startDate,
                    $endDate,
                    $jenisKegiatan,
                    [$child->id_shelter],
                    $child->shelter?->wilbin?->id_wilbin,
                    $child->id_shelter
                ),
            ],
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    protected function getMonthsInRange(Carbon $start, Carbon $end): array
    {
        $months = [];
        $current = $start->copy()->startOfMonth();

        while ($current->lte($end)) {
            $months[] = [
                'key' => $current->format('Y-m'),
                'name' => $current->translatedFormat('F Y'),
                'month' => (int) $current->format('m'),
                'year' => (int) $current->format('Y'),
            ];

            $current->addMonth();
        }

        return $months;
    }

    /**
     * @param  array<int, int>  $shelterIds
     * @return array<string, int>
     */
    protected function getActivitiesPerShelterPerMonth(array $shelterIds, Carbon $start, Carbon $end, ?string $jenisKegiatan): array
    {
        if (empty($shelterIds)) {
            return [];
        }

        return Aktivitas::query()
            ->selectRaw('id_shelter, YEAR(tanggal) as year, MONTH(tanggal) as month, COUNT(*) as total')
            ->whereIn('id_shelter', $shelterIds)
            ->whereBetween('tanggal', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->when($jenisKegiatan, fn ($query) => $query->where('jenis_kegiatan', $jenisKegiatan))
            ->groupBy('id_shelter', 'year', 'month')
            ->get()
            ->mapWithKeys(function ($item) {
                $key = $item->id_shelter . '-' . $item->year . '-' . $item->month;
                return [$key => (int) $item->total];
            })
            ->all();
    }

    /**
     * @param  array<int, int>  $shelterIds
     * @return array<int, int>
     */
    protected function getTotalActivitiesByShelter(array $shelterIds, Carbon $start, Carbon $end, ?string $jenisKegiatan): array
    {
        if (empty($shelterIds)) {
            return [];
        }

        return Aktivitas::query()
            ->selectRaw('id_shelter, COUNT(*) as total')
            ->whereIn('id_shelter', $shelterIds)
            ->whereBetween('tanggal', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->when($jenisKegiatan, fn ($query) => $query->where('jenis_kegiatan', $jenisKegiatan))
            ->groupBy('id_shelter')
            ->pluck('total', 'id_shelter')
            ->map(fn ($value) => (int) $value)
            ->all();
    }

    /**
     * @param  array<int, int>  $childIds
     * @return array<string, int>
     */
    protected function getAttendancePerChildPerMonth(array $childIds, Carbon $start, Carbon $end, ?string $jenisKegiatan): array
    {
        if (empty($childIds)) {
            return [];
        }

        return Absen::query()
            ->selectRaw('absen_user.id_anak as child_id, YEAR(aktivitas.tanggal) as year, MONTH(aktivitas.tanggal) as month, COUNT(*) as total')
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->whereIn('absen_user.id_anak', $childIds)
            ->whereBetween('aktivitas.tanggal', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->whereIn('absen.absen', [Absen::TEXT_YA, Absen::TEXT_TERLAMBAT])
            ->when($jenisKegiatan, fn ($query) => $query->where('aktivitas.jenis_kegiatan', $jenisKegiatan))
            ->groupBy('child_id', 'year', 'month')
            ->get()
            ->mapWithKeys(function ($item) {
                $key = $item->child_id . '-' . $item->year . '-' . $item->month;
                return [$key => (int) $item->total];
            })
            ->all();
    }

    /**
     * @param  array<int, int>  $childIds
     * @return array<int, int>
     */
    protected function getTotalAttendanceByChild(array $childIds, Carbon $start, Carbon $end, ?string $jenisKegiatan, ?string $search = null, ?array $shelterFilter = null): array
    {
        if (empty($childIds)) {
            return [];
        }

        $query = Absen::query()
            ->selectRaw('absen_user.id_anak as child_id, COUNT(*) as total')
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
            ->whereIn('absen_user.id_anak', $childIds)
            ->whereBetween('aktivitas.tanggal', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->whereIn('absen.absen', [Absen::TEXT_YA, Absen::TEXT_TERLAMBAT])
            ->when($jenisKegiatan, fn ($builder) => $builder->where('aktivitas.jenis_kegiatan', $jenisKegiatan));

        if ($search) {
            $query->where(function ($builder) use ($search) {
                $builder->where('anak.full_name', 'like', "%{$search}%")
                    ->orWhere('anak.nick_name', 'like', "%{$search}%");
            });
        }

        if ($shelterFilter) {
            $query->whereIn('anak.id_shelter', $shelterFilter);
        }

        return $query
            ->groupBy('child_id')
            ->pluck('total', 'child_id')
            ->map(fn ($value) => (int) $value)
            ->all();
    }

    /**
     * @param  array<int, int>  $childIds
     * @return array<string, int>
     */
    protected function getAttendanceOpportunitiesPerChildPerMonth(array $childIds, Carbon $start, Carbon $end, ?string $jenisKegiatan): array
    {
        if (empty($childIds)) {
            return [];
        }

        return Absen::query()
            ->selectRaw('absen_user.id_anak as child_id, YEAR(aktivitas.tanggal) as year, MONTH(aktivitas.tanggal) as month, COUNT(*) as total')
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->whereIn('absen_user.id_anak', $childIds)
            ->whereBetween('aktivitas.tanggal', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->when($jenisKegiatan, fn ($query) => $query->where('aktivitas.jenis_kegiatan', $jenisKegiatan))
            ->groupBy('child_id', 'year', 'month')
            ->get()
            ->mapWithKeys(function ($item) {
                $key = $item->child_id . '-' . $item->year . '-' . $item->month;
                return [$key => (int) $item->total];
            })
            ->all();
    }

    /**
     * @param  array<int, int>  $childIds
     * @return array<int, int>
     */
    protected function getTotalAttendanceOpportunitiesByChild(array $childIds, Carbon $start, Carbon $end, ?string $jenisKegiatan, ?string $search = null, ?array $shelterFilter = null): array
    {
        if (empty($childIds)) {
            return [];
        }

        $query = Absen::query()
            ->selectRaw('absen_user.id_anak as child_id, COUNT(*) as total')
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
            ->whereIn('absen_user.id_anak', $childIds)
            ->whereBetween('aktivitas.tanggal', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->when($jenisKegiatan, fn ($builder) => $builder->where('aktivitas.jenis_kegiatan', $jenisKegiatan));

        if ($search) {
            $query->where(function ($builder) use ($search) {
                $builder->where('anak.full_name', 'like', "%{$search}%")
                    ->orWhere('anak.nick_name', 'like', "%{$search}%");
            });
        }

        if ($shelterFilter) {
            $query->whereIn('anak.id_shelter', $shelterFilter);
        }

        return $query
            ->groupBy('child_id')
            ->pluck('total', 'child_id')
            ->map(fn ($value) => (int) $value)
            ->all();
    }

    /**
     * @param  array<int, int>  $shelterIds
     * @return array<int, int>
     */
    protected function getAttendanceOpportunitiesByShelter(array $shelterIds, Carbon $start, Carbon $end, ?string $jenisKegiatan, ?string $search = null): array
    {
        if (empty($shelterIds)) {
            return [];
        }

        $query = Absen::query()
            ->selectRaw('anak.id_shelter, COUNT(*) as total')
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->whereIn('anak.id_shelter', $shelterIds)
            ->whereBetween('aktivitas.tanggal', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->when($jenisKegiatan, fn ($builder) => $builder->where('aktivitas.jenis_kegiatan', $jenisKegiatan));

        if ($search) {
            $query->where(function ($builder) use ($search) {
                $builder->where('anak.full_name', 'like', "%{$search}%")
                    ->orWhere('anak.nick_name', 'like', "%{$search}%");
            });
        }

        return $query
            ->groupBy('anak.id_shelter')
            ->pluck('total', 'anak.id_shelter')
            ->map(fn ($value) => (int) $value)
            ->all();
    }

    /**
     * @param  array<int, int>  $shelterIds
     * @return array<int, int>
     */
    protected function getAttendanceByShelter(array $shelterIds, Carbon $start, Carbon $end, ?string $jenisKegiatan, ?string $search = null): array
    {
        if (empty($shelterIds)) {
            return [];
        }

        $query = Absen::query()
            ->selectRaw('anak.id_shelter, COUNT(*) as total')
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->whereIn('anak.id_shelter', $shelterIds)
            ->whereBetween('aktivitas.tanggal', [$start->copy()->startOfDay(), $end->copy()->endOfDay()])
            ->whereIn('absen.absen', [Absen::TEXT_YA, Absen::TEXT_TERLAMBAT])
            ->when($jenisKegiatan, fn ($builder) => $builder->where('aktivitas.jenis_kegiatan', $jenisKegiatan));

        if ($search) {
            $query->where(function ($builder) use ($search) {
                $builder->where('anak.full_name', 'like', "%{$search}%")
                    ->orWhere('anak.nick_name', 'like', "%{$search}%");
            });
        }

        return $query
            ->groupBy('anak.id_shelter')
            ->pluck('total', 'anak.id_shelter')
            ->map(fn ($value) => (int) $value)
            ->all();
    }

    protected function buildFilterOptions(
        Collection $shelters,
        ?Carbon $start,
        ?Carbon $end,
        ?string $jenisKegiatan,
        ?array $filteredShelterIds,
        ?int $wilbinFilter = null,
        ?int $shelterFilter = null
    ): array {
        $targetShelterIds = $filteredShelterIds ?? $shelters->pluck('id_shelter')->all();

        $availableYears = Aktivitas::query()
            ->when($targetShelterIds, fn ($query) => $query->whereIn('id_shelter', $targetShelterIds))
            ->selectRaw('YEAR(tanggal) as year')
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->map(fn ($value) => (int) $value)
            ->all();

        $availableActivityTypes = Aktivitas::query()
            ->when($targetShelterIds, fn ($query) => $query->whereIn('id_shelter', $targetShelterIds))
            ->select('jenis_kegiatan')
            ->whereNotNull('jenis_kegiatan')
            ->distinct()
            ->orderBy('jenis_kegiatan')
            ->pluck('jenis_kegiatan')
            ->all();

        $shelterOptions = $shelters->map(function (Shelter $shelter) {
            return [
                'id' => $shelter->id_shelter,
                'name' => $shelter->nama_shelter,
                'wilbin' => $shelter->wilbin ? [
                    'id' => $shelter->wilbin->id_wilbin,
                    'name' => $shelter->wilbin->nama_wilbin,
                ] : null,
            ];
        })->values()->all();

        $wilbinOptions = $shelters
            ->pluck('wilbin')
            ->filter()
            ->unique('id_wilbin')
            ->map(function ($wilbin) {
                return [
                    'id' => $wilbin->id_wilbin,
                    'name' => $wilbin->nama_wilbin,
                ];
            })
            ->values()
            ->all();

        return [
            'available_years' => $availableYears,
            'available_activity_types' => $availableActivityTypes,
            'shelters' => $shelterOptions,
            'wilbins' => $wilbinOptions,
            'current_start_date' => $start?->format('Y-m-d'),
            'current_end_date' => $end?->format('Y-m-d'),
            'current_activity_type' => $jenisKegiatan,
            'current_wilbin_id' => $wilbinFilter,
            'current_shelter_id' => $shelterFilter,
        ];
    }
}
