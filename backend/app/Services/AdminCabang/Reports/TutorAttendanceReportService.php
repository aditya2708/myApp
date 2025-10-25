<?php

namespace App\Services\AdminCabang\Reports;

use App\Models\Absen;
use App\Models\AdminCabang;
use App\Models\Aktivitas;
use App\Models\Tutor;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TutorAttendanceReportService
{
    /**
     * Build tutor attendance summary for a branch administrator.
     */
    public function build(AdminCabang $adminCabang, array $filters = [], int $page = 1, int $perPage = 15): array
    {
        $adminCabang->loadMissing('kacab');
        $kacab = $adminCabang->kacab;

        if (!$kacab) {
            throw new RuntimeException('Admin cabang tidak memiliki data cabang terkait.');
        }

        $wilbins = $kacab->wilbins()
            ->with(['shelters' => function ($query) {
                $query->select('id_shelter', 'nama_shelter', 'id_wilbin');
            }])
            ->orderBy('nama_wilbin')
            ->get(['id_wilbin', 'nama_wilbin', 'id_kacab']);

        $wilbinOptions = $wilbins->map(function ($wilbin) {
            $wilbinId = (int) $wilbin->id_wilbin;
            $wilbinName = $wilbin->nama_wilbin;

            return [
                'id' => $wilbinId,
                'name' => $wilbinName,
                'shelters' => $wilbin->shelters->map(function ($shelter) use ($wilbinId, $wilbinName) {
                    return [
                        'id' => (int) $shelter->id_shelter,
                        'name' => $shelter->nama_shelter,
                        'wilbin_id' => $wilbinId,
                        'wilbin_name' => $wilbinName,
                    ];
                })->values()->all(),
            ];
        })->values();

        $wilbinShelterMap = $wilbinOptions->mapWithKeys(function (array $option) {
            return [
                $option['id'] => collect($option['shelters'])->pluck('id')->map(fn($id) => (int) $id)->values(),
            ];
        });

        $shelterCollection = $wilbinOptions
            ->flatMap(fn(array $option) => $option['shelters'])
            ->map(fn(array $shelter) => $shelter)
            ->unique('id')
            ->values();

        $wilbinList = $wilbinOptions->map(fn(array $option) => [
            'id' => $option['id'],
            'name' => $option['name'],
        ])->values();

        $wilbinShelterEntries = $wilbinOptions->map(fn(array $option) => [
            'wilbin_id' => $option['id'],
            'wilbin_name' => $option['name'],
            'shelters' => $option['shelters'],
        ])->values();

        $shelterIdList = $shelterCollection->pluck('id')->map(fn($id) => (int) $id)->values();
        $wilbinIdList = $wilbinOptions->pluck('id')->map(fn($id) => (int) $id)->values();

        $allowedShelterIds = $shelterIdList->values();

        $wilbinIdFilter = isset($filters['wilbin_id']) ? (int) $filters['wilbin_id'] : null;

        if ($wilbinIdFilter !== null) {
            if (!$wilbinShelterMap->has($wilbinIdFilter)) {
                throw new RuntimeException('Wilayah binaan tidak ditemukan pada cabang ini.');
            }

            $allowedShelterIds = $wilbinShelterMap->get($wilbinIdFilter, collect())->values();
        }

        if (!empty($filters['shelter_id'])) {
            $shelterIdFilter = (int) $filters['shelter_id'];

            if (!$allowedShelterIds->contains($shelterIdFilter)) {
                throw new RuntimeException('Shelter tidak ditemukan pada cabang atau wilayah binaan ini.');
            }

            $allowedShelterIds = collect([$shelterIdFilter]);
        }

        $baseActivityQuery = Aktivitas::query();

        if ($allowedShelterIds->isNotEmpty()) {
            $baseActivityQuery->whereIn('id_shelter', $allowedShelterIds->all());
        } else {
            $baseActivityQuery->whereRaw('1 = 0');
        }

        if (!empty($filters['shelter_id'])) {
            $baseActivityQuery->where('id_shelter', $filters['shelter_id']);
        }

        if (!empty($filters['date_from'])) {
            $baseActivityQuery->whereDate('tanggal', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $baseActivityQuery->whereDate('tanggal', '<=', $filters['date_to']);
        }

        if (!empty($filters['jenis_kegiatan'])) {
            $baseActivityQuery->where('jenis_kegiatan', $filters['jenis_kegiatan']);
        }

        $activityStatsQuery = (clone $baseActivityQuery)
            ->select([
                'id_tutor',
                DB::raw('COUNT(DISTINCT id_aktivitas) as total_activities'),
                DB::raw("GROUP_CONCAT(DISTINCT jenis_kegiatan ORDER BY jenis_kegiatan SEPARATOR ',') as activity_types"),
            ])
            ->groupBy('id_tutor');

        $filteredActivitiesForAttendance = (clone $baseActivityQuery)
            ->select([
                'id_aktivitas',
                'id_tutor',
            ]);

        $attendanceStatsQuery = Absen::query()
            ->select([
                'absen_user.id_tutor',
                DB::raw("SUM(CASE WHEN absen.absen = '" . Absen::TEXT_YA . "' THEN 1 ELSE 0 END) as present_count"),
                DB::raw("SUM(CASE WHEN absen.absen = '" . Absen::TEXT_TERLAMBAT . "' THEN 1 ELSE 0 END) as late_count"),
                DB::raw("SUM(CASE WHEN absen.absen = '" . Absen::TEXT_TIDAK . "' THEN 1 ELSE 0 END) as absent_count"),
                DB::raw('COUNT(*) as verified_attendance_count'),
            ])
            ->join('absen_user', function ($join) {
                $join->on('absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->whereNotNull('absen_user.id_tutor');
            })
            ->joinSub($filteredActivitiesForAttendance, 'filtered_activities', function ($join) {
                $join->on('filtered_activities.id_aktivitas', '=', 'absen.id_aktivitas')
                    ->whereColumn('filtered_activities.id_tutor', 'absen_user.id_tutor');
            })
            ->where('absen.is_verified', true)
            ->groupBy('absen_user.id_tutor');

        $tutorQuery = Tutor::query()
            ->leftJoinSub($activityStatsQuery, 'activity_stats', function ($join) {
                $join->on('activity_stats.id_tutor', '=', 'tutor.id_tutor');
            })
            ->leftJoinSub($attendanceStatsQuery, 'attendance_stats', function ($join) {
                $join->on('attendance_stats.id_tutor', '=', 'tutor.id_tutor');
            })
            ->leftJoin('shelter', 'shelter.id_shelter', '=', 'tutor.id_shelter')
            ->where(function ($query) use ($kacab, $allowedShelterIds) {
                $query->where('tutor.id_kacab', $kacab->id_kacab);

                if ($allowedShelterIds->isNotEmpty()) {
                    $query->orWhereIn('tutor.id_shelter', $allowedShelterIds->all());
                }
            });

        if ($wilbinIdFilter !== null) {
            $tutorQuery->where(function ($query) use ($wilbinIdFilter, $allowedShelterIds) {
                $query->where('tutor.id_wilbin', $wilbinIdFilter);

                if ($allowedShelterIds->isNotEmpty()) {
                    $query->orWhereIn('tutor.id_shelter', $allowedShelterIds->all());
                }
            });
        }

        if (!empty($filters['shelter_id'])) {
            $tutorQuery->where('tutor.id_shelter', $filters['shelter_id']);
        }

        $tutorPaginator = $tutorQuery
            ->select([
                'tutor.id_tutor',
                'tutor.nama',
                'tutor.email',
                'tutor.no_hp',
                'tutor.foto',
                'tutor.maple',
                'tutor.id_shelter',
                DB::raw('COALESCE(activity_stats.total_activities, 0) as total_activities'),
                'activity_stats.activity_types',
                DB::raw('COALESCE(attendance_stats.present_count, 0) as present_count'),
                DB::raw('COALESCE(attendance_stats.late_count, 0) as late_count'),
                DB::raw('COALESCE(attendance_stats.absent_count, 0) as absent_count'),
                DB::raw('COALESCE(attendance_stats.verified_attendance_count, 0) as verified_attendance_count'),
                'shelter.id_shelter as shelter_id',
                'shelter.nama_shelter as shelter_name',
            ])
            ->orderBy('tutor.nama')
            ->paginate($perPage, ['*'], 'page', $page);

        $categoryLabels = [
            'high' => 'Baik',
            'medium' => 'Sedang',
            'low' => 'Rendah',
            'no_data' => 'Tidak Ada Data',
        ];

        $tutorSummaries = $tutorPaginator->getCollection()->map(function (Tutor $tutor) use ($categoryLabels) {
            $totalActivities = (int) ($tutor->total_activities ?? 0);
            $presentCount = (int) ($tutor->present_count ?? 0);
            $lateCount = (int) ($tutor->late_count ?? 0);
            $absentCount = (int) ($tutor->absent_count ?? 0);
            $verifiedAttendanceCount = (int) ($tutor->verified_attendance_count ?? 0);
            $attendanceTotal = $presentCount + $lateCount + $absentCount;

            if ($verifiedAttendanceCount === 0) {
                $verifiedAttendanceCount = $attendanceTotal;
            }

            $attendedCount = $presentCount + $lateCount;

            $activityTypes = collect(explode(',', (string) ($tutor->activity_types ?? '')))
                ->map(fn($type) => trim($type))
                ->filter()
                ->unique()
                ->values()
                ->all();

            if ($totalActivities > 0) {
                $attendanceRate = round(($attendedCount / $totalActivities) * 100, 2);

                if ($attendanceRate >= 80) {
                    $categoryKey = 'high';
                } elseif ($attendanceRate >= 60) {
                    $categoryKey = 'medium';
                } else {
                    $categoryKey = 'low';
                }
            } else {
                $attendanceRate = 0;
                $categoryKey = 'no_data';
            }

            return [
                'id' => $tutor->id_tutor ? (int) $tutor->id_tutor : null,
                'name' => $tutor->nama,
                'email' => $tutor->email,
                'phone' => $tutor->no_hp,
                'subject' => $tutor->maple,
                'photo_url' => method_exists($tutor, 'getFotoUrlAttribute') ? $tutor->foto_url : $tutor->foto,
                'activity_types' => $activityTypes,
                'attendance' => [
                    'totals' => [
                        'activities' => $totalActivities,
                        'records' => $attendanceTotal,
                        'attended' => $attendedCount,
                    ],
                    'breakdown' => [
                        'present' => $presentCount,
                        'late' => $lateCount,
                        'absent' => $absentCount,
                    ],
                    'verified' => [
                        'total' => $verifiedAttendanceCount,
                        'present' => $presentCount,
                        'late' => $lateCount,
                        'absent' => $absentCount,
                        'attended' => $attendedCount,
                    ],
                    'rate' => $attendanceRate,
                ],
                'shelter' => [
                    'id' => $tutor->shelter_id ? (int) $tutor->shelter_id : null,
                    'name' => $tutor->shelter_name,
                ],
                'category' => [
                    'key' => $categoryKey,
                    'label' => $categoryLabels[$categoryKey],
                ],
            ];
        });

        return [
            'tutors' => $tutorSummaries,
            'pagination' => [
                'current' => $tutorPaginator->currentPage(),
                'per_page' => $tutorPaginator->perPage(),
                'total' => $tutorPaginator->total(),
                'last_page' => $tutorPaginator->lastPage(),
                'next_page' => $tutorPaginator->hasMorePages() ? $tutorPaginator->currentPage() + 1 : null,
                'prev_page' => $tutorPaginator->currentPage() > 1 ? $tutorPaginator->currentPage() - 1 : null,
            ],
            'metadata' => [
                'kacab' => [
                    'id' => $kacab->id_kacab,
                    'nama' => $kacab->nama_kacab,
                    'email' => $kacab->email,
                ],
                'wilbins' => $wilbinList->all(),
                'wilbin_shelters' => $wilbinShelterEntries->all(),
                'wilbins_shelters' => $wilbinShelterEntries->all(),
                'shelters' => $shelterCollection->all(),
                'shelter_ids' => $shelterIdList->all(),
                'wilbin_ids' => $wilbinIdList->all(),
            ],
        ];
    }
}
