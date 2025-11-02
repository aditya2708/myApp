<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Aktivitas;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ReportPerCabangController extends Controller
{
    public function cabangreportTutorPendidikan(Request $request) {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
    
        // Ambil Admin Cabang berdasarkan User
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Ambil parameter tab dari request
        $tab = $request->get('tab', 'tutor_pendidikan');
    
        // Ambil data filter dari request
        $tahun = $request->get('tahun') ?? date('Y');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $jenisKegiatan = $request->get('jenis_kegiatan');
    
        // Ambil data Kacab dengan relasi
        $data_kacab = Kacab::with(['wilbins.shelters.tutors.absenUser.absen', 'wilbins.shelters.tutors.absenUser.anak'])
            // Filter berdasarkan cabang yang terkait dengan admin yang sedang login
            ->where('id_kacab', $adminCabang->id_kacab)
            ->when($kantorCabang, function ($query) use ($kantorCabang) {
                return $query->where('id_kacab', $kantorCabang);
            })
            ->when($wilayahBinaan, function ($query) use ($wilayahBinaan) {
                return $query->whereHas('wilbins', function ($query) use ($wilayahBinaan) {
                    $query->where('id_wilbin', $wilayahBinaan);
                });
            })
            ->when($jenisKegiatan, function ($query) use ($jenisKegiatan) {
                return $query->whereHas('wilbins.shelters.aktivitas', function ($query) use ($jenisKegiatan) {
                    $query->where('jenis_kegiatan', $jenisKegiatan);
                });
            })
            ->when($tab == 'cabangtutorpekanan', function ($query) {
                return $query; 
            })
            ->when($tab == 'cabanganakpendidikan', function ($query) {
                return $query; 
            })
            ->get();
    
        foreach ($data_kacab as $kacab) {
            $attendanceData = array_fill(0, 12, 0); // Inisialisasi array kehadiran
            $childAttendanceData = array_fill(0, 12, 0); // Inisialisasi array kehadiran anak
    
            foreach ($kacab->wilbins as $wilbin) {
                foreach ($wilbin->shelters as $shelter) {
                    for ($month = 1; $month <= 12; $month++) {
                        // Hitung kehadiran tutor
                        $attendanceCount = DB::table('absen')
                            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                            ->join('tutor', 'tutor.id_tutor', '=', 'absen_user.id_tutor')
                            ->where('tutor.id_shelter', $shelter->id_shelter)
                            ->whereMonth('absen.created_at', $month)
                            ->whereYear('absen.created_at', $tahun)
                            ->where('absen.absen', 'Ya')
                            ->count();
    
                    // Hitung kehadiran anak
                    $childAttendanceCount = DB::table('absen')
                        ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                        ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
                        ->where('anak.id_shelter', $shelter->id_shelter)
                        ->whereMonth('absen.created_at', $month)
                        ->whereYear('absen.created_at', $tahun)
                        ->where('absen.absen', 'Ya')
                        ->count();

                    // Hari dalam bulan
                    $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $tahun);

                    // Kalkulasi persentase
                    $attendancePercentage = $daysInMonth > 0 ? round(($attendanceCount / $daysInMonth) * 100, 2) : 0;
                    $childAttendancePercentage = $daysInMonth > 0 ? round(($childAttendanceCount / $daysInMonth) * 100, 2) : 0;

                    // Simpan data
                    $attendanceData[$month - 1] += $attendancePercentage;
                    $childAttendanceData[$month - 1] += $childAttendancePercentage;
                    }
                }
            }
    
            // Hitung rata-rata per shelter
            $kacab->attendanceData = array_map(function ($value) {
                return round($value, 2);
            }, $attendanceData);
    
            $kacab->childAttendanceData = array_map(function ($value) {
                return round($value, 2);
            }, $childAttendanceData);
        }
    
        // Data untuk dropdown
        $kantorCabangOptions = Kacab::all();
        $wilayahBinaanOptions = Wilbin::all();
        $jenisKegiatanList = Aktivitas::select('jenis_kegiatan')->distinct()->get();
    
        return view('AdminCabang.Report.CabangReport.cabangtutorpendidikan', compact(
            'data_kacab',
            'kantorCabangOptions',
            'wilayahBinaanOptions',
            'jenisKegiatanList'
        ));
    }
    
}
