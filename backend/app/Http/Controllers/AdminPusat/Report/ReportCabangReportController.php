<?php

namespace App\Http\Controllers\AdminPusat\Report;

use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Aktivitas;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ReportCabangReportController extends Controller
{
    public function cabangreportTutorPendidikan(Request $request) {
        // Ambil parameter tab dari request
        $tab = $request->get('tab', 'tutor_pendidikan');

        // Ambil data filter dari request
        $tahun = $request->get('tahun') ?? date('Y');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $jenisKegiatan = $request->get('jenis_kegiatan');

        // Ambil data Kacab dengan relasi menggunakan eager loading
        $data_kacab = Kacab::with([
            'wilbins.shelters.tutors.absenUser.absen', 
            'wilbins.shelters.tutors.absenUser.anak'
        ])
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
            ->get();

        // Mengambil data kehadiran dengan query yang dioptimalkan
        $attendanceData = DB::table('absen')
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('tutor', 'tutor.id_tutor', '=', 'absen_user.id_tutor')
            ->join('anak', 'anak.id_anak', '=', 'absen_user.id_anak')
            ->select(
                'absen_user.id_tutor', 
                'absen_user.id_anak', 
                DB::raw('MONTH(absen.created_at) as month'),
                DB::raw('COUNT(*) as attendance_count')
            )
            ->whereYear('absen.created_at', $tahun)
            ->where('absen.absen', 'Ya')
            ->groupBy('absen_user.id_tutor', 'absen_user.id_anak', 'month')
            ->get();

        // Inisialisasi data untuk setiap Kacab
        foreach ($data_kacab as $kacab) {
            $attendanceDataForKacab = $attendanceData->whereIn('id_tutor', $kacab->wilbins->pluck('id_shelter')->toArray());
            $attendanceDataForKacabAnak = $attendanceData->whereIn('id_anak', $kacab->wilbins->flatMap(function ($wilbin) {
                return $wilbin->shelters->flatMap(function ($shelter) {
                    return $shelter->tutors->pluck('id_anak');
                });
            })); // Ambil data anak

            $attendanceDataArray = array_fill(0, 12, 0);
            $childAttendanceDataArray = array_fill(0, 12, 0);

            foreach ($kacab->wilbins as $wilbin) {
                foreach ($wilbin->shelters as $shelter) {
                    // Hitung kehadiran tutor dan anak untuk setiap bulan
                    for ($month = 1; $month <= 12; $month++) {
                        $attendanceCount = $attendanceDataForKacab->where('month', $month)
                            ->where('id_tutor', $shelter->tutors->pluck('id_tutor')->first())
                            ->sum('attendance_count');

                        $childAttendanceCount = $attendanceDataForKacabAnak->where('month', $month)
                            ->where('id_anak', $shelter->tutors->pluck('id_anak')->first())
                            ->sum('attendance_count');

                        // Hitung persentase kehadiran
                        $daysInMonth = cal_days_in_month(CAL_GREGORIAN, $month, $tahun);
                        $attendancePercentage = $daysInMonth > 0 ? round(($attendanceCount / $daysInMonth) * 100, 2) : 0;
                        $childAttendancePercentage = $daysInMonth > 0 ? round(($childAttendanceCount / $daysInMonth) * 100, 2) : 0;

                        // Simpan data
                        $attendanceDataArray[$month - 1] += $attendancePercentage;
                        $childAttendanceDataArray[$month - 1] += $childAttendancePercentage;
                    }
                }
            }

            // Hitung rata-rata per shelter
            $kacab->attendanceData = array_map(function ($value) {
                return round($value, 2);
            }, $attendanceDataArray);

            $kacab->childAttendanceData = array_map(function ($value) {
                return round($value, 2);
            }, $childAttendanceDataArray);
        }

        // Data untuk dropdown
        $kantorCabangOptions = Cache::remember('kantor_cabang_options', now()->addHours(1), function () {
            return Kacab::all();
        });

        $wilayahBinaanOptions = Cache::remember('wilayah_binaan_options', now()->addHours(1), function () {
            return Wilbin::all();
        });

        $jenisKegiatanList = Cache::remember('jenis_kegiatan_list', now()->addHours(1), function () {
            return Aktivitas::select('jenis_kegiatan')->distinct()->get();
        });

        return view('AdminPusat.Report.CabangReport.cabangtutorpendidikan', compact(
            'data_kacab', 
            'kantorCabangOptions', 
            'wilayahBinaanOptions', 
            'jenisKegiatanList'
        ));
    }
}
