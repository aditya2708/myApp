<?php

namespace App\Http\Controllers\API\AdminCabang\Reports;

use App\Http\Controllers\Controller;
use App\Models\Absen;
use App\Models\Kacab;
use App\Models\Shelter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCabangAttendanceSummaryController extends Controller
{
    public function __invoke(Request $request, $cabang): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $kacab = Kacab::find($cabang);

        if (!$kacab) {
            return response()->json([
                'message' => 'Cabang tidak ditemukan',
            ], 404);
        }

        $month = (int) $validated['month'];
        $year = (int) $validated['year'];

        $attendanceByShelter = Absen::query()
            ->selectRaw('shelter.id_shelter as shelter_id, AVG(CASE WHEN absen.absen IN (\'Ya\', \'Terlambat\') THEN 1 ELSE 0 END) * 100 as attendance_avg')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->join('shelter', 'shelter.id_shelter', '=', 'aktivitas.id_shelter')
            ->join('wilbin', 'wilbin.id_wilbin', '=', 'shelter.id_wilbin')
            ->where('wilbin.id_kacab', $kacab->id_kacab)
            ->whereYear('aktivitas.tanggal', $year)
            ->whereMonth('aktivitas.tanggal', $month)
            ->groupBy('shelter.id_shelter')
            ->pluck('attendance_avg', 'shelter_id');

        $shelterCollection = Shelter::query()
            ->select('shelter.id_shelter', 'shelter.nama_shelter')
            ->join('wilbin', 'wilbin.id_wilbin', '=', 'shelter.id_wilbin')
            ->where('wilbin.id_kacab', $kacab->id_kacab)
            ->orderBy('shelter.nama_shelter')
            ->get()
            ->map(function ($shelter) use ($attendanceByShelter) {
                $average = $attendanceByShelter[$shelter->id_shelter] ?? 0;

                return [
                    'id' => $shelter->id_shelter,
                    'name' => $shelter->nama_shelter,
                    'attendance_avg' => round((float) $average, 2),
                ];
            });

        return response()->json([
            'month' => sprintf('%04d-%02d', $year, $month),
            'shelters' => $shelterCollection,
        ]);
    }
}
