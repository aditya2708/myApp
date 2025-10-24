<?php

namespace App\Services\AdminCabang\Reports;

use App\Models\Absen;
use App\Models\AdminCabang;
use App\Models\Aktivitas;
use App\Models\Tutor;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TutorAttendanceReportService
{
    /**
     * Build tutor attendance summary for a branch administrator.
     */
    public function build(AdminCabang $adminCabang, array $filters = []): array
    {
        $adminCabang->loadMissing('kacab');
        $kacab = $adminCabang->kacab;

        if (!$kacab) {
            throw new RuntimeException('Admin cabang tidak memiliki data cabang terkait.');
        }

        $shelterIds = $kacab->shelters()->pluck('id_shelter');

        if (!empty($filters['shelter_id']) && !$shelterIds->contains($filters['shelter_id'])) {
            throw new RuntimeException('Shelter tidak ditemukan pada cabang ini.');
        }

        $baseActivityQuery = Aktivitas::query();

        if ($shelterIds->isNotEmpty()) {
            $baseActivityQuery->whereIn('id_shelter', $shelterIds);
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

        $tutors = Tutor::query()
            ->leftJoinSub($activityStatsQuery, 'activity_stats', function ($join) {
                $join->on('activity_stats.id_tutor', '=', 'tutor.id_tutor');
            })
            ->leftJoinSub($attendanceStatsQuery, 'attendance_stats', function ($join) {
                $join->on('attendance_stats.id_tutor', '=', 'tutor.id_tutor');
            })
            ->leftJoin('shelter', 'shelter.id_shelter', '=', 'tutor.id_shelter')
            ->where(function ($query) use ($kacab, $shelterIds) {
                $query->where('tutor.id_kacab', $kacab->id_kacab);

                if ($shelterIds->isNotEmpty()) {
                    $query->orWhereIn('tutor.id_shelter', $shelterIds);
                }
            })
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
            ->get();

        $tutorSummaries = $tutors->map(function (Tutor $tutor) {
            $totalActivities = (int) ($tutor->total_activities ?? 0);
            $presentCount = (int) ($tutor->present_count ?? 0);
            $lateCount = (int) ($tutor->late_count ?? 0);
            $absentCount = (int) ($tutor->absent_count ?? 0);
            $verifiedAttendanceCount = (int) ($tutor->verified_attendance_count ?? 0);
            $attendanceTotal = $presentCount + $lateCount + $absentCount;

            if ($verifiedAttendanceCount === 0) {
                $verifiedAttendanceCount = $attendanceTotal;
            }

            $activityTypes = collect(explode(',', (string) ($tutor->activity_types ?? '')))
                ->map(fn($type) => trim($type))
                ->filter()
                ->unique()
                ->values()
                ->all();

            return [
                'id_tutor' => $tutor->id_tutor,
                'nama' => $tutor->nama,
                'email' => $tutor->email,
                'no_hp' => $tutor->no_hp,
                'foto' => $tutor->foto,
                'foto_url' => method_exists($tutor, 'getFotoUrlAttribute') ? $tutor->foto_url : null,
                'maple' => $tutor->maple,
                'total_activities' => $totalActivities,
                'present_count' => $presentCount,
                'late_count' => $lateCount,
                'absent_count' => $absentCount,
                'verified_attendance_count' => $verifiedAttendanceCount,
                'attendance_total' => $attendanceTotal,
                'activity_types' => $activityTypes,
                'shelter' => [
                    'id' => $tutor->shelter_id ? (int) $tutor->shelter_id : null,
                    'name' => $tutor->shelter_name,
                ],
            ];
        });

        return [
            'tutors' => $tutorSummaries,
            'metadata' => [
                'kacab' => [
                    'id' => $kacab->id_kacab,
                    'nama' => $kacab->nama_kacab,
                    'email' => $kacab->email,
                ],
                'shelter_ids' => $shelterIds->values()->all(),
            ],
        ];
    }
}
