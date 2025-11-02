<?php

namespace App\Http\Controllers\AdminShalter\ReportShelter;

use App\Models\Tutor;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ReportTutorShelterController extends Controller
{
    public function reportTutorPekanan(Request $request)
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;

        // Cek apakah admin shelter ditemukan
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();
        if (!$adminShelter) {
            abort(403, 'Admin Shelter tidak ditemukan.');
        }

        // Ambil ID shelter dari admin shelter
        $idShelter = $adminShelter->id_shelter;

        // Ambil filter dari request
        $tahun = $request->get('tahun');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $shelter = $request->get('shelter');
        $bulan = $request->get('bulan');
        $tab = $request->get('tab', 'persentase');

        // Ambil daftar tutor yang terkait dengan shelter
        $data_tutor = Tutor::where('id_shelter', $idShelter) // Pastikan data tutor terkait shelter yang login
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

        // Proses data kehadiran untuk setiap tutor
        foreach ($data_tutor as $tutor) {
            $absenceData = [];
            $attendanceData = [];
            $monthlyData = [];

            // Loop untuk menghitung kehadiran setiap bulan
            for ($month = 1; $month <= 12; $month++) {
                $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $tahun ?? date('Y'));

                // Hitung jumlah kehadiran (absen) berdasarkan bulan dan tahun
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

                // Menyimpan data kehadiran
                $absenceData[] = $attendance;
                $attendanceData[] = $attendancePercentage;
                $monthlyData[] = [
                    'month' => $month,
                    'attendance' => $attendance,
                    'attendancePercentage' => $attendancePercentage,
                ];
            }

            // Menyimpan data ke dalam objek tutor
            $tutor->absenceData = $absenceData;
            $tutor->attendanceData = $attendanceData;
            $tutor->monthlyData = $monthlyData;
        }

        // Ambil data wilayah binaan dan shelter terkait
        $wilayahBinaanOptions = Wilbin::where('id_kacab', $adminShelter->id_kacab)->get();
        $shelterOptions = Shelter::whereHas('wilbin.kacab', function ($query) use ($adminShelter) {
            $query->where('id_kacab', $adminShelter->id_kacab);
        })->get();

        // Meneruskan data ke tampilan
        return view('AdminShalter.Report.ReportTutor.TutorReportPekanan.tutorrportpekanan', compact(
            'data_tutor',
            'wilayahBinaanOptions',
            'shelterOptions',
            'tab',
            'adminShelter'  // Menambahkan informasi adminShelter untuk tampilan
        ));
    }

    public function reportTutorPendidikan(Request $request) {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;

        // Cek apakah admin shelter ditemukan
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();
        if (!$adminShelter) {
            abort(403, 'Admin Shelter tidak ditemukan.');
        }

        // Ambil ID shelter dari admin shelter
        $idShelter = $adminShelter->id_shelter;

        // Ambil filter dari request
        $tahun = $request->get('tahun');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $shelter = $request->get('shelter');
        $bulan = $request->get('bulan');
        $tab = $request->get('tab', 'persentase');

        // Ambil daftar tutor yang terkait dengan shelter
        $data_tutor = Tutor::where('id_shelter', $idShelter) // Pastikan data tutor terkait shelter yang login
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

        // Proses data kehadiran untuk setiap tutor
        foreach ($data_tutor as $tutor) {
            $absenceData = [];
            $attendanceData = [];
            $monthlyData = [];

            // Loop untuk menghitung kehadiran setiap bulan
            for ($month = 1; $month <= 12; $month++) {
                $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $tahun ?? date('Y'));

                // Hitung jumlah kehadiran (absen) berdasarkan bulan dan tahun
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

                // Menyimpan data kehadiran
                $absenceData[] = $attendance;
                $attendanceData[] = $attendancePercentage;
                $monthlyData[] = [
                    'month' => $month,
                    'attendance' => $attendance,
                    'attendancePercentage' => $attendancePercentage,
                ];
            }

            // Menyimpan data ke dalam objek tutor
            $tutor->absenceData = $absenceData;
            $tutor->attendanceData = $attendanceData;
            $tutor->monthlyData = $monthlyData;
        }

        // Ambil data wilayah binaan dan shelter terkait
        $wilayahBinaanOptions = Wilbin::where('id_kacab', $adminShelter->id_kacab)->get();
        $shelterOptions = Shelter::whereHas('wilbin.kacab', function ($query) use ($adminShelter) {
            $query->where('id_kacab', $adminShelter->id_kacab);
        })->get();

        return view('AdminShalter.Report.ReportTutor.TutorReportPendidikan.tutorreportpendidikan', compact(
            'data_tutor',
            'wilayahBinaanOptions',
            'shelterOptions',
            'tab',
            'adminShelter'  // Menambahkan informasi adminShelter untuk tampilan
        ));
    }
}
