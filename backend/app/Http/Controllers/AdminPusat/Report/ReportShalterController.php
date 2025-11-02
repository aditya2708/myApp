<?php

namespace App\Http\Controllers\AdminPusat\Report;

use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Aktivitas;
use App\Models\Anak;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ReportShalterController extends Controller
{
    public function shalterAbsenReport(Request $request) {
        
        // Ambil parameter tab dari request, default 'tutor_pendidikan'
        $tab = $request->get('tab', 'tutor_pendidikan');
    
        // Ambil data filter dari request
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $ketidakHadiran = $request->get('ketidak_hadiran');
        $bulan = $request->get('bulan'); // Filter berdasarkan bulan
        $jenisKegiatan = $request->get('jenis_kegiatan');
    
        // Ambil data shelter dengan join ke absensi (Tutor dan Anak)
        $data_shelter = Shelter::with(['tutors.absenUser.absen', 'tutors.absenUser.anak']) // Relasi ke anak
            ->when($tahun, function ($query) use ($tahun) {
                return $query->whereHas('tutors.absenUser.absen', function ($query) use ($tahun) {
                    $query->whereYear('absen.created_at', $tahun);
                });
            })
            ->when($kantorCabang, function ($query) use ($kantorCabang) {
                return $query->whereHas('wilbin', function ($query) use ($kantorCabang) {
                    $query->where('id_kacab', $kantorCabang);
                });
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
            // Menggunakan parameter tab untuk kondisi yang lebih sederhana tanpa memerlukan kolom 'kategori' atau 'tipe'
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
            $childAbsenceDetails = []; // Menyimpan detail ketidakhadiran anak
            
            for ($month = 1; $month <= 12; $month++) {
                // Menghitung jumlah kehadiran tutor
                $attendanceCount = DB::table('absen')
                    ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->join('tutor', 'tutor.id_tutor', '=', 'absen_user.id_tutor')
                    ->where('tutor.id_shelter', $shelter->id_shelter)
                    ->whereMonth('absen.created_at', $month)
                    ->where('absen.absen', 'Ya')
                    ->count();
    
                // Menghitung jumlah kehadiran anak
                $childAttendanceCount = DB::table('absen')
                    ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
                    ->where('anak.id_shelter', $shelter->id_shelter)
                    ->whereMonth('absen.created_at', $month)
                    ->where('absen.absen', 'Ya')
                    ->count();
    
                // Menghitung hari dalam bulan tersebut
                $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, date('Y'));
    
                // Menghitung persentase kehadiran
                $attendancePercentage = $attendanceCount > 0 ? round(($attendanceCount / $daysInMonth) * 100) : 0;
                $childAttendancePercentage = $childAttendanceCount > 0 ? round(($childAttendanceCount / $daysInMonth) * 100) : 0;
    
                // Menambahkan data ke array
                $attendanceData[] = $attendancePercentage;
                $childAttendanceData[] = $childAttendancePercentage;
                
                // Mendapatkan detail ketidakhadiran anak
                $absenceDetails = DB::table('absen')
                    ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
                    ->where('anak.id_shelter', $shelter->id_shelter)
                    ->whereMonth('absen.created_at', $month)
                    ->where('absen.absen', 'Tidak') // Filter ketidakhadiran
                    ->get(['anak.full_name', 'absen.created_at']); // Use full_name instead of nama
                    
                $childAbsenceDetails[$month] = $absenceDetails;
            }
    
            // Menambahkan data ke objek shelter
            $shelter->attendanceData = $attendanceData;
            $shelter->childAttendanceData = $childAttendanceData;
            $shelter->childAbsenceDetails = $childAbsenceDetails; // Menyimpan detail ketidakhadiran
        }
    
        // Filter dropdown untuk form
        $kantorCabangOptions = Kacab::all();
        $wilayahBinaanOptions = Wilbin::all();
        $jenisKegiatanList = Aktivitas::select('jenis_kegiatan')->distinct()->get();
    
        // Return data ke view
        return view('AdminPusat.Report.ReportShalter.ShalterReportAbsen.shalterreportabsen', compact(
            'data_shelter',
            'kantorCabangOptions',
            'wilayahBinaanOptions',
            'jenisKegiatanList'
        ));
    }
}
