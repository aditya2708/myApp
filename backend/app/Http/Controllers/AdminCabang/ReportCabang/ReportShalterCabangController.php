<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Aktivitas;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ReportShalterCabangController extends Controller
{
    public function shalterAbsenReport(Request $request)
    {
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        $idCabang = $adminCabang->id_kacab; // Ambil ID cabang admin yang login
        $kantorCabang = Kacab::find($idCabang);

        // Ambil parameter tab dari request
        $tab = $request->get('tab', 'tutor_pendidikan');

        // Ambil data filter dari request
        $tahun = $request->get('tahun') ?? date('Y'); // Default ke tahun sekarang
        $wilayahBinaan = $request->get('wilayah_binaan');
        $bulan = $request->get('bulan');
        $jenisKegiatan = $request->get('jenis_kegiatan');

        // Ambil data shelter dengan join ke absensi (Tutor dan Anak) yang sesuai dengan cabang admin
        $data_shelter = Shelter::with(['tutors.absenUser.absen', 'tutors.absenUser.anak'])
            ->whereHas('wilbin.kacab', function ($query) use ($idCabang) {
                $query->where('id_kacab', $idCabang); // Hanya shelter dari cabang yang sesuai
            })
            ->when($wilayahBinaan, function ($query) use ($wilayahBinaan) {
                return $query->whereHas('wilbin', function ($query) use ($wilayahBinaan) {
                    $query->where('id_wilbin', $wilayahBinaan);
                });
            })
            ->when($jenisKegiatan, function ($query) use ($jenisKegiatan) {
                return $query->whereHas('aktivitas', function ($query) use ($jenisKegiatan) {
                    $query->where('jenis_kegiatan', $jenisKegiatan);
                });
            })
            ->when($tab == 'quantitas', function ($query) {
                return $query; // Jika tab 'quantitas', tidak perlu filter berdasarkan kolom
            })
            ->when($tab == 'anak', function ($query) {
                return $query; // Jika tab 'anak', tidak perlu filter berdasarkan kolom
            })
            ->when($tab == 'peringatan', function ($query) {
                return $query; // Jika tab 'peringatan', tidak perlu filter berdasarkan kolom
            })
            ->get();

        // Menyusun data absensi berdasarkan bulan dan ketidakhadiran
        foreach ($data_shelter as $shelter) {
            $attendanceData = [];
            $childAttendanceData = [];
            $childAbsenceDetails = [];

            for ($month = 1; $month <= 12; $month++) {
                // Menghitung jumlah hari dalam bulan
                $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $tahun);

                // Menghitung jumlah kehadiran tutor
                $attendanceCount = DB::table('absen')
                    ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->join('tutor', 'tutor.id_tutor', '=', 'absen_user.id_tutor')
                    ->where('tutor.id_shelter', $shelter->id_shelter)
                    ->whereMonth('absen.created_at', $month)
                    ->whereYear('absen.created_at', $tahun)
                    ->where('absen.absen', 'Ya')
                    ->count();

                // Menghitung jumlah kehadiran anak
                $childAttendanceCount = DB::table('absen')
                    ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
                    ->where('anak.id_shelter', $shelter->id_shelter)
                    ->whereMonth('absen.created_at', $month)
                    ->whereYear('absen.created_at', $tahun)
                    ->where('absen.absen', 'Ya')
                    ->count();

                // Menghitung persentase kehadiran
                $attendancePercentage = $daysInMonth > 0 ? round(($attendanceCount / $daysInMonth) * 100) : 0;
                $childAttendancePercentage = $daysInMonth > 0 ? round(($childAttendanceCount / $daysInMonth) * 100) : 0;

                // Menambahkan data ke array
                $attendanceData[] = $attendancePercentage;
                $childAttendanceData[] = $childAttendancePercentage;

                // Mendapatkan detail ketidakhadiran anak
                $absenceDetails = DB::table('absen')
                    ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
                    ->where('anak.id_shelter', $shelter->id_shelter)
                    ->whereMonth('absen.created_at', $month)
                    ->whereYear('absen.created_at', $tahun)
                    ->where('absen.absen', 'Tidak') // Filter ketidakhadiran
                    ->get(['anak.full_name', 'absen.created_at']);

                $childAbsenceDetails[$month] = $absenceDetails;
            }

            // Menambahkan data ke objek shelter
            $shelter->attendanceData = $attendanceData;
            $shelter->childAttendanceData = $childAttendanceData;
            $shelter->childAbsenceDetails = $childAbsenceDetails;
        }

        // Menghitung rata-rata kehadiran untuk seluruh shelter cabang
        $totalAttendancePercentage = 0;
        $totalChildAttendancePercentage = 0;
        $totalShelters = count($data_shelter);

        foreach ($data_shelter as $shelter) {
            $totalAttendancePercentage += array_sum($shelter->attendanceData) / count($shelter->attendanceData);
            $totalChildAttendancePercentage += array_sum($shelter->childAttendanceData) / count($shelter->childAttendanceData);
        }

        $averageAttendancePercentage = $totalShelters > 0 ? round($totalAttendancePercentage / $totalShelters) : 0;
        $averageChildAttendancePercentage = $totalShelters > 0 ? round($totalChildAttendancePercentage / $totalShelters) : 0;

        // Filter dropdown untuk form (hanya menampilkan opsi sesuai cabang)
        $wilayahBinaanOptions = Wilbin::where('id_kacab', $idCabang)->get();
        $jenisKegiatanList = Aktivitas::select('jenis_kegiatan')->distinct()->get();

        return view('AdminCabang.Report.ReportShalter.ShalterReportAbsen.shalterreportabsen', compact(
            'data_shelter',
            'wilayahBinaanOptions',
            'jenisKegiatanList',
            'kantorCabang',
            'averageAttendancePercentage',
            'averageChildAttendancePercentage'
        ));
    }
}
