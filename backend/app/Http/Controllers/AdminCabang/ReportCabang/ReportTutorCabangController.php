<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Kacab;
use App\Models\Tutor;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ReportTutorCabangController extends Controller
{
    // Report Tutor Pekanan
    public function reportTutorPekanan(Request $request)
    {
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        $idCabang = $adminCabang->id_kacab;
        $kantorCabang = Kacab::find($idCabang);

        $tahun = $request->get('tahun');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $shelter = $request->get('shelter');
        $bulan = $request->get('bulan');
        $tab = $request->get('tab', 'persentase');

        $data_tutor = Tutor::whereHas('shelter.wilbin.kacab', function ($query) use ($idCabang) {
                $query->where('id_kacab', $idCabang);
            })
            ->when($tahun, function ($query) use ($tahun) {
                return $query->whereYear('created_at', $tahun);
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

        $wilayahBinaanOptions = Wilbin::where('id_kacab', $idCabang)->get();
        $shelterOptions = Shelter::whereHas('wilbin.kacab', function ($query) use ($idCabang) {
            $query->where('id_kacab', $idCabang);
        })->get();

        return view('AdminCabang.Report.ReportTutor.TutorReportPekanan.tutorrportpekanan', compact(
            'data_tutor',
            'wilayahBinaanOptions',
            'shelterOptions',
            'tab',
            'kantorCabang'
        ));
    }

    public function reportTutorPendidikan(Request $request) {
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        $idCabang = $adminCabang->id_kacab;
        $kantorCabang = Kacab::find($idCabang);

        $tahun = $request->get('tahun');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $shelter = $request->get('shelter');
        $bulan = $request->get('bulan');
        $tab = $request->get('tab', 'persentase');

        $data_tutor = Tutor::whereHas('shelter.wilbin.kacab', function ($query) use ($idCabang) {
                $query->where('id_kacab', $idCabang);
            })
            ->when($tahun, function ($query) use ($tahun) {
                return $query->whereYear('created_at', $tahun);
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

        $wilayahBinaanOptions = Wilbin::where('id_kacab', $idCabang)->get();
        $shelterOptions = Shelter::whereHas('wilbin.kacab', function ($query) use ($idCabang) {
            $query->where('id_kacab', $idCabang);
        })->get();

        return view('AdminCabang.Report.ReportTutor.TutorReportPendidikan.tutorreportpendidikan', compact(
            'data_tutor',
            'wilayahBinaanOptions',
            'shelterOptions',
            'tab',
            'kantorCabang'
        ));
    }
}
