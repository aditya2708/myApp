<?php

namespace App\Http\Controllers\AdminPusat\Report;

use App\Models\Kacab;
use App\Models\Tutor;
use App\Models\Wilbin;
use App\Models\Shelter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ReportTutorController extends Controller
{
    public function reportTutorPendidikan(Request $request)
    {
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $shelter = $request->get('shelter');
        $bulan = $request->get('bulan');
        $tab = $request->get('tab', 'persentase'); // Default ke 'persentase'

        // Filter data tutor berdasarkan request
        $data_tutor = Tutor::when($tahun, function ($query) use ($tahun) {
                return $query->whereYear('created_at', $tahun);
            })
            ->when($kantorCabang, function ($query) use ($kantorCabang) {
                return $query->whereHas('shelter.wilbin.kacab', function ($query) use ($kantorCabang) {
                    $query->where('id_kacab', $kantorCabang);
                });
            })
            ->when($wilayahBinaan, function ($query) use ($wilayahBinaan) {
                return $query->whereHas('shelter.wilbin', function ($query) use ($wilayahBinaan) {
                    $query->where('id_wilbin', $wilayahBinaan);
                });
            })
            ->when($shelter, function ($query) use ($shelter) {
                return $query->where('id_shelter', $shelter);
            })
            ->get();

        foreach ($data_tutor as $tutor) {
            $absenceData = [];
            $attendanceData = [];
            $monthlyData = [];

            for ($month = 1; $month <= 12; $month++) {
                $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $tahun ?? date('Y'));

                $attendance = DB::table('absen')
                    ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
                    ->where('absen_user.id_tutor', $tutor->id_tutor)
                    ->whereYear('absen.created_at', $tahun ?? date('Y'))
                    ->whereMonth('absen.created_at', $month)
                    ->where('absen.absen', 'Ya')
                    ->distinct('absen.id_absen')
                    ->count();

                $attendancePercentage = $daysInMonth > 0 ? round(($attendance / $daysInMonth) * 100) : 0;

                $absenceData[] = $attendance;
                $attendanceData[] = $attendancePercentage;
                $monthlyData[] = [
                    'month' => $month,
                    'attendance' => $attendance,
                    'attendancePercentage' => $attendancePercentage,
                ];
            }

            $tutor->absenceData = $absenceData;
            $tutor->attendanceData = $attendanceData;
            $tutor->monthlyData = $monthlyData;
        }

        $kantorCabangOptions = Kacab::all();
        $wilayahBinaanOptions = Wilbin::all();
        $shelterOptions = Shelter::all();

        // Mengembalikan view dengan data yang sudah difilter
        return view('AdminPusat.Report.ReportTutor.TutorReportPendidikan.tutorreportpendidikan', compact(
            'data_tutor', 'kantorCabangOptions', 'wilayahBinaanOptions', 'shelterOptions', 'tab'
        ));
    }

    // Report Tutor Pekanan
    public function reportTutorPekanan(Request $request)
    {
        // Ambil data filter dari request
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $shelter = $request->get('shelter');
        $bulan = $request->get('bulan');
        $tab = $request->get('tab', 'persentase'); // Default ke 'persentase'

        // Filter data tutor berdasarkan request
        $data_tutor = Tutor::when($tahun, function ($query) use ($tahun) {
                return $query->whereYear('created_at', $tahun);
            })
            ->when($kantorCabang, function ($query) use ($kantorCabang) {
                return $query->whereHas('shelter.wilbin.kacab', function ($query) use ($kantorCabang) {
                    $query->where('id_kacab', $kantorCabang);
                });
            })
            ->when($wilayahBinaan, function ($query) use ($wilayahBinaan) {
                return $query->whereHas('shelter.wilbin', function ($query) use ($wilayahBinaan) {
                    $query->where('id_wilbin', $wilayahBinaan);
                });
            })
            ->when($shelter, function ($query) use ($shelter) {
                return $query->where('id_shelter', $shelter);
            })
            ->get();

        foreach ($data_tutor as $tutor) {
            $absenceData = [];
            $attendanceData = [];
            $monthlyData = [];

            for ($month = 1; $month <= 12; $month++) {
                $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $tahun ?? date('Y'));

                $attendance = DB::table('absen')
                    ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
                    ->where('absen_user.id_tutor', $tutor->id_tutor)
                    ->whereYear('absen.created_at', $tahun ?? date('Y'))
                    ->whereMonth('absen.created_at', $month)
                    ->where('absen.absen', 'Ya')
                    ->distinct('absen.id_absen')
                    ->count();

                $attendancePercentage = $daysInMonth > 0 ? round(($attendance / $daysInMonth) * 100) : 0;

                $absenceData[] = $attendance;
                $attendanceData[] = $attendancePercentage;
                $monthlyData[] = [
                    'month' => $month,
                    'attendance' => $attendance,
                    'attendancePercentage' => $attendancePercentage,
                ];
            }

            $tutor->absenceData = $absenceData;
            $tutor->attendanceData = $attendanceData;
            $tutor->monthlyData = $monthlyData;
        }

        $kantorCabangOptions = Kacab::all();
        $wilayahBinaanOptions = Wilbin::all();
        $shelterOptions = Shelter::all();

        return view('AdminPusat.Report.ReportTutor.TutorReportPekanan.tutorrportpekanan', compact(
            'data_tutor',
            'kantorCabangOptions',
            'wilayahBinaanOptions',
            'shelterOptions',
            'tab'
        ));
    }

    
}
