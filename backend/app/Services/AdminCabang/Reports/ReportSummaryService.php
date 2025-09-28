<?php

namespace App\Services\AdminCabang\Reports;

use App\Models\AdminCabang;
use App\Models\Aktivitas;
use App\Models\Anak;
use App\Models\Tutor;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ReportSummaryService
{
    /**
     * Build a cabang-wide summary for the given admin cabang.
     */
    public function build(AdminCabang $adminCabang, ?Carbon $startDate = null, ?Carbon $endDate = null): array
    {
        $adminCabang->loadMissing('kacab');
        $kacab = $adminCabang->kacab;

        if (!$kacab) {
            throw new RuntimeException('Admin cabang tidak memiliki data cabang terkait.');
        }

        $shelterIds = $kacab->shelters()->pluck('id_shelter');

        $totalShelters = $shelterIds->count();
        $totalActiveAnak = $shelterIds->isEmpty()
            ? 0
            : Anak::whereIn('id_shelter', $shelterIds)
                ->whereIn('status_validasi', Anak::STATUS_AKTIF)
                ->count();

        $totalTutors = Tutor::where('id_kacab', $kacab->id_kacab)->count();
        $wilbinCount = $kacab->wilbins()->count();

        $activityQuery = Aktivitas::query()->whereIn('id_shelter', $shelterIds);

        if ($startDate) {
            $activityQuery->whereDate('tanggal', '>=', $startDate->toDateString());
        }

        if ($endDate) {
            $activityQuery->whereDate('tanggal', '<=', $endDate->toDateString());
        }

        $totalActivities = (clone $activityQuery)->count();

        $activityStatusBreakdown = (clone $activityQuery)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(function ($row) {
                $status = $row->status ?? 'unknown';

                return [$status => (int) $row->total];
            })
            ->toArray();

        $activityTypeBreakdown = (clone $activityQuery)
            ->select('jenis_kegiatan', DB::raw('count(*) as total'))
            ->groupBy('jenis_kegiatan')
            ->get()
            ->mapWithKeys(function ($row) {
                $type = $row->jenis_kegiatan ?? 'unknown';

                return [$type => (int) $row->total];
            })
            ->toArray();

        $startDateString = $startDate?->toDateString();
        $endDateString = $endDate?->toDateString();

        return [
            'summary' => [
                'total_active_anak' => $totalActiveAnak,
                'total_tutors' => $totalTutors,
                'total_shelters' => $totalShelters,
                'wilbin_count' => $wilbinCount,
                'recent_aktivitas' => [
                    'total' => $totalActivities,
                    'by_status' => $activityStatusBreakdown,
                    'by_jenis_kegiatan' => $activityTypeBreakdown,
                    'date_range' => [
                        'start_date' => $startDateString,
                        'end_date' => $endDateString,
                    ],
                ],
            ],
            'metadata' => [
                'kacab' => [
                    'id' => $kacab->id_kacab,
                    'nama' => $kacab->nama_kacab,
                    'email' => $kacab->email,
                ],
                'filters' => [
                    'start_date' => $startDateString,
                    'end_date' => $endDateString,
                ],
                'shelter_ids' => $shelterIds->values()->all(),
                'generated_at' => now()->toIso8601String(),
            ],
        ];
    }
}
