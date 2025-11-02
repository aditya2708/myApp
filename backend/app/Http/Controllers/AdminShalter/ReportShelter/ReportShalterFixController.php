<?php

namespace App\Http\Controllers\AdminShalter\ReportShelter;

use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Aktivitas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\AdminShelter;

class ReportShalterFixController extends Controller
{
    public function shalterAbsenReport(Request $request)
    {
        // Mengambil ID user yang sedang login
        $user_id = auth()->user()->id_users;

        // Mencari data AdminShelter yang terkait dengan user yang login
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();

        // Jika admin shelter tidak ditemukan, hentikan eksekusi dan tampilkan error 403
        if (!$adminShelter) {
            abort(403, 'Admin Shelter tidak ditemukan.');
        }

        // Ambil ID shelter dari admin shelter yang sedang login
        $idShelter = $adminShelter->id_shelter;

        // Ambil parameter tab dari request
        $tab = $request->get('tab', 'tutor_pendidikan');

        // Ambil data filter dari request
        $tahun = $request->get('tahun') ?? date('Y');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $bulan = $request->get('bulan');
        $jenisKegiatan = $request->get('jenis_kegiatan');

        // Ambil data shelter yang dikelola oleh admin shelter
        $data_shelter = Shelter::with(['tutors.absenUser.absen', 'tutors.absenUser.anak'])
            ->where('id_shelter', $idShelter)
            ->first();

        // Validasi apakah data shelter ditemukan
        if (!$data_shelter) {
            return redirect()->back()->with('error', 'Shelter tidak ditemukan.');
        }

        // Menyusun data absensi
        $attendanceData = [];
        $childAttendanceData = [];
        $childAbsenceDetails = [];

        for ($month = 1; $month <= 12; $month++) {
            $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $tahun);

            $attendanceCount = DB::table('absen')
                ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                ->join('tutor', 'tutor.id_tutor', '=', 'absen_user.id_tutor')
                ->where('tutor.id_shelter', $data_shelter->id_shelter)
                ->whereMonth('absen.created_at', $month)
                ->whereYear('absen.created_at', $tahun)
                ->where('absen.absen', 'Ya')
                ->count();

            $childAttendanceCount = DB::table('absen')
                ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
                ->where('anak.id_shelter', $data_shelter->id_shelter)
                ->whereMonth('absen.created_at', $month)
                ->whereYear('absen.created_at', $tahun)
                ->where('absen.absen', 'Ya')
                ->count();

            $attendancePercentage = $daysInMonth > 0 ? round(($attendanceCount / $daysInMonth) * 100) : 0;
            $childAttendancePercentage = $daysInMonth > 0 ? round(($childAttendanceCount / $daysInMonth) * 100) : 0;

            $attendanceData[] = $attendancePercentage;
            $childAttendanceData[] = $childAttendancePercentage;

            $absenceDetails = DB::table('absen')
                ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
                ->where('anak.id_shelter', $data_shelter->id_shelter)
                ->whereMonth('absen.created_at', $month)
                ->whereYear('absen.created_at', $tahun)
                ->where('absen.absen', 'Tidak')
                ->get(['anak.full_name', 'absen.created_at']);

            $childAbsenceDetails[$month] = $absenceDetails;
        }

        $data_shelter->attendanceData = $attendanceData;
        $data_shelter->childAttendanceData = $childAttendanceData;
        $data_shelter->childAbsenceDetails = $childAbsenceDetails;

        $wilayahBinaanOptions = Wilbin::where('id_kacab', $adminShelter->id_kacab)->get();
        $jenisKegiatanList = Aktivitas::select('jenis_kegiatan')->distinct()->get();

        return view('AdminShalter.Report.ReportShalter.ShalterReportAbsen.shalterreportabsen', compact(
            'data_shelter',
            'wilayahBinaanOptions',
            'jenisKegiatanList'
        ));
    }
}
