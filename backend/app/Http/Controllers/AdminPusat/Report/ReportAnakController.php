<?php

namespace App\Http\Controllers\AdminPusat\Report;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Aktivitas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Http\Controllers\Controller;

class ReportAnakController extends Controller
{
    public function reportAnak(Request $request)
    {
        // Ambil filter dari request
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $shelter = $request->get('shelter');
        $jenisKegiatan = $request->get('bulan'); // ganti nama filter jadi bulan
    
        // Ambil daftar jenis kegiatan dari tabel aktivitas
        $jenisKegiatanList = Aktivitas::select('jenis_kegiatan')->distinct()->get();
    
        // Filter data anak berdasarkan request dengan eager loading
        $data_anak = Anak::with('shelter.wilbin.kacab') // Eager load relasi yang diperlukan
            ->when($tahun, function ($query) use ($tahun) {
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

        // Ambil data kehadiran untuk semua anak dalam satu query
        $attendanceData = DB::table('absen')
            ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
            ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
            ->select('absen_user.id_anak', DB::raw('MONTH(absen.created_at) as month'), DB::raw('COUNT(*) as attendance_count'))
            ->whereIn('absen_user.id_anak', $data_anak->pluck('id_anak')->toArray()) // Ambil data anak yang sudah difilter
            ->where('absen.absen', 'Ya')
            ->when($jenisKegiatan, function ($query) use ($jenisKegiatan) {
                return $query->where('aktivitas.jenis_kegiatan', $jenisKegiatan);
            })
            ->groupBy('absen_user.id_anak', 'month')
            ->get();

        // Proses data kehadiran untuk setiap anak
        foreach ($data_anak as $anak) {
            $attendanceDataForAnak = $attendanceData->where('id_anak', $anak->id_anak);
            $attendancePercentages = [];
            for ($month = 1; $month <= 12; $month++) {
                $attendance = $attendanceDataForAnak->where('month', $month)->first();
                $attendanceCount = $attendance ? $attendance->attendance_count : 0;
                $attendancePercentages[] = $attendanceCount > 0 ? round(($attendanceCount / 30) * 100) : 0;
            }
            $anak->attendanceData = $attendancePercentages;
        }
    
        // Pilihan filter
        $kantorCabangOptions = Cache::remember('kantor_cabang_options', now()->addHours(1), function () {
            return Kacab::all();
        });
        $wilayahBinaanOptions = Cache::remember('wilayah_binaan_options', now()->addHours(1), function () {
            return Wilbin::all();
        });
        $shelterOptions = Cache::remember('shelter_options', now()->addHours(1), function () {
            return Shelter::all();
        });
    
        // Return view dengan data
        return view('AdminPusat.Report.ReportAnak.reportanak', compact(
            'data_anak', 'kantorCabangOptions', 'wilayahBinaanOptions', 'shelterOptions', 'jenisKegiatanList'
        ));
    }
}
