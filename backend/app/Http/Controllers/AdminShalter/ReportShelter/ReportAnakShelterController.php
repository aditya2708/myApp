<?php

namespace App\Http\Controllers\AdminShalter\ReportShelter;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Aktivitas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use App\Models\AdminShelter;

class ReportAnakShelterController extends Controller
{
    public function reportAnak(Request $request) {
        // Mendapatkan ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;

        // Mencari admin shelter berdasarkan user yang login
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();

        // Jika admin shelter tidak ditemukan, tampilkan error
        if (!$adminShelter) {
            abort(403, 'Admin Shelter tidak ditemukan.');
        }

        // Mendapatkan ID shelter dari admin shelter
        $idShelter = $adminShelter->id_shelter;

        // Menangkap inputan filter dari request
        $tahun = $request->get('tahun');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $shelter = $request->get('shelter');
        $jenisKegiatan = $request->get('bulan');

        // Mendapatkan daftar jenis kegiatan dari aktivitas yang berbeda
        $jenisKegiatanList = Aktivitas::select('jenis_kegiatan')->distinct()->get();

        // Mengambil data anak berdasarkan shelter yang dikelola oleh admin yang sedang login
        $data_anak = Anak::where('id_shelter', $idShelter) // Filter berdasarkan id_shelter yang dikelola admin
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

        // Menambahkan data kehadiran per bulan
        foreach ($data_anak as $anak) {
            $attendanceData = [];
            for ($month = 1; $month <= 12; $month++) {
                // Mengambil data absensi untuk setiap bulan
                $attendance = DB::table('absen')
                    ->join('absen_user', 'absen_user.id_absen_user', '=', 'absen.id_absen_user')
                    ->join('aktivitas', 'aktivitas.id_aktivitas', '=', 'absen.id_aktivitas')
                    ->where('absen_user.id_anak', $anak->id_anak)
                    ->whereMonth('absen.created_at', $month)
                    ->when($jenisKegiatan, function ($query) use ($jenisKegiatan) {
                        return $query->where('aktivitas.jenis_kegiatan', $jenisKegiatan);
                    })
                    ->where('absen.absen', 'Ya')
                    ->count();

                // Menghitung persentase kehadiran berdasarkan jumlah hari
                $attendancePercentage = $attendance > 0 ? round(($attendance / 30) * 100) : 0;
                $attendanceData[] = $attendancePercentage;
            }
            // Menyimpan data kehadiran per bulan pada objek anak
            $anak->attendanceData = $attendanceData;
        }

        // Mendapatkan data kantor cabang yang relevan dengan shelter admin
        $kantorCabangOptions = Kacab::where('id_kacab', $adminShelter->id_kacab)->get();
        
        // Mendapatkan data wilayah binaan yang relevan dengan shelter admin
        $wilayahBinaanOptions = Wilbin::where('id_kacab', $adminShelter->id_kacab)->get();
        
        // Mendapatkan data shelter berdasarkan wilayah binaan yang dikelola oleh admin
        $shelterOptions = Shelter::whereHas('wilbin.kacab', function ($query) use ($adminShelter) {
            $query->where('id_kacab', $adminShelter->id_kacab);
        })->get();

        // Meneruskan data ke tampilan
        return view('AdminShalter.Report.ReportAnak.reportanak', compact(
            'data_anak', 'kantorCabangOptions', 'wilayahBinaanOptions', 'shelterOptions', 'jenisKegiatanList'
        ));
    }
}
