<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Aktivitas;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class ReportAnakCabangController extends Controller
{
    public function reportAnak(Request $request)
    {
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        $idCabang = $adminCabang->id_kacab;

        $tahun = $request->get('tahun');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $shelter = $request->get('shelter');
        $jenisKegiatan = $request->get('bulan');

        $jenisKegiatanList = Aktivitas::select('jenis_kegiatan')->distinct()->get();

        $data_anak = Anak::whereHas('shelter.wilbin.kacab', function ($query) use ($idCabang) {
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

        // Menghitung data kehadiran per anak
        foreach ($data_anak as $anak) {
            $attendanceData = Cache::remember(
                "attendance_data_{$anak->id_anak}_{$tahun}_{$jenisKegiatan}", 
                now()->addMinutes(30), 
                function () use ($anak, $tahun, $jenisKegiatan) {
                    $attendanceData = [];
                    for ($month = 1; $month <= 12; $month++) {
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

                        $attendancePercentage = $attendance > 0 ? round(($attendance / 30) * 100) : 0;
                        $attendanceData[] = $attendancePercentage;
                    }
                    return $attendanceData;
                }
            );

            $anak->attendanceData = $attendanceData;
        }

        // Caching data dropdown
        $kantorCabangOptions = Cache::remember("kantor_cabang_options_{$idCabang}", now()->addHours(1), function () use ($idCabang) {
            return Kacab::where('id_kacab', $idCabang)->get();
        });

        $wilayahBinaanOptions = Cache::remember("wilayah_binaan_options_{$idCabang}", now()->addHours(1), function () use ($idCabang) {
            return Wilbin::where('id_kacab', $idCabang)->get();
        });

        $shelterOptions = Cache::remember("shelter_options_{$idCabang}_{$wilayahBinaan}", now()->addHours(1), function () use ($idCabang, $wilayahBinaan) {
            return Shelter::whereHas('wilbin.kacab', function ($query) use ($idCabang) {
                    $query->where('id_kacab', $idCabang);
                })
                ->when($wilayahBinaan, function ($query) use ($wilayahBinaan) {
                    $query->where('id_wilbin', $wilayahBinaan);
                })
                ->get();
        });

        return view('AdminCabang.Report.ReportAnak.reportanak', compact(
            'data_anak', 'kantorCabangOptions', 'wilayahBinaanOptions', 'shelterOptions', 'jenisKegiatanList'
        ));
    }
}
