<?php

namespace App\Http\Controllers\AdminCabang;

use App\Models\Anak;
use App\Models\Tutor;
use App\Models\Survey;
use App\Models\Wilbin;
use App\Models\Donatur;
use App\Models\Shelter;
use App\Models\Keluarga;
use App\Models\Keuangan;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DashboardAdminCabangController extends Controller
{
    /* Admin Cabang Settings */
    public function dashboardSettingsCabang()
    {
        // Ambil admin cabang yang login
        $user_id = auth()->user()->id_users;
        $adminCabang = \App\Models\AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Anda tidak memiliki akses ke data ini.');
        }

        $id_kacab = $adminCabang->id_kacab;

        // Hitung data terkait berdasarkan id_kacab
        $totalWilbin = Wilbin::where('id_kacab', $id_kacab)->count();
        $totalShelter = Shelter::whereIn('id_wilbin', Wilbin::where('id_kacab', $id_kacab)->pluck('id_wilbin'))->count();
        $totalDonatur = Donatur::where('id_kacab', $id_kacab)->count();
        $totalAdminShelter = AdminShelter::where('id_kacab', $id_kacab)->count();
        $totalTutor = Tutor::where('id_kacab', $id_kacab)->count();

        // Kembalikan ke view dengan data yang sesuai
        return view('AdminCabang.Settings.dashboardAdminCabangSettings', compact(
            'totalWilbin',
            'totalShelter',
            'totalDonatur',
            'totalAdminShelter',
            'totalTutor'
        ));
    }

    /* Dashboard Admin Cabang */
    public function dashboardPemberdayaanCabang() {
        // Ambil admin cabang yang login
        $user_id = auth()->user()->id_users;
        $adminCabang = \App\Models\AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Anda tidak memiliki akses ke data ini.');
        }
    
        $id_kacab = $adminCabang->id_kacab;
    
        // Menghitung jumlah anak aktif berdasarkan id_kacab
        $anakAktifCount = Anak::where('status_validasi', 'Aktif')
                              ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                                  $query->where('id_kacab', $id_kacab);
                              })
                              ->count();
    
        // Menghitung jumlah anak belum aktif berdasarkan status tertentu
        $anakBelumAktifCount = Anak::whereIn('status_validasi', ['Tidak Aktif', 'Ditangguhkan', 'Ditolak'])
                                   ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                                       $query->where('id_kacab', $id_kacab);
                                   })
                                   ->count();
    
        // Menghitung jumlah data survey berdasarkan id_kacab
        $surveyCount = Survey::whereNotNull('hasil_survey')
                             ->whereHas('keluarga.wilbin', function($query) use ($id_kacab) {
                                 $query->where('id_kacab', $id_kacab);
                             })
                             ->count();
    
        // Menghitung jumlah keluarga berdasarkan id_kacab
        $keluargaCount = Keluarga::whereHas('wilbin', function($query) use ($id_kacab) {
                                  $query->where('id_kacab', $id_kacab);
                              })
                              ->count();
    
        return view('AdminCabang.Pemberdayaan.dashboardAdminCabangPemberdayaan', compact(
            'anakAktifCount', 'anakBelumAktifCount', 'surveyCount', 'keluargaCount'
        ));
    }
    
    public function dashboardReportCabang() {
        $user_id = auth()->user()->id_users;
        $adminCabang = \App\Models\AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Anda tidak memiliki akses ke data ini.');
        }
    
        $id_kacab = $adminCabang->id_kacab;
    
        // Menghitung jumlah Anak berdasarkan status_cpb, status_validasi, dan id_kacab
        $bcpbAktif = Anak::where('status_cpb', Anak::STATUS_CPB_BCPB)
            ->where('status_validasi', Anak::STATUS_AKTIF)
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();
    
        $pbAktif = Anak::where('status_cpb', Anak::STATUS_CPB_PB)
            ->where('status_validasi', Anak::STATUS_AKTIF)
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();
    
        $cpbAktif = Anak::where('status_cpb', Anak::STATUS_CPB_CPB)
            ->where('status_validasi', Anak::STATUS_AKTIF)
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();
    
        $npbAktif = Anak::where('status_cpb', Anak::STATUS_CPB_NPB)
            ->where('status_validasi', Anak::STATUS_AKTIF)
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();
    
        $bcpbNonAktif = Anak::where('status_cpb', Anak::STATUS_CPB_BCPB)
            ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();
    
        $pbNonAktif = Anak::where('status_cpb', Anak::STATUS_CPB_PB)
            ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();
    
        $cpbNonAktif = Anak::where('status_cpb', Anak::STATUS_CPB_CPB)
            ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();
    
        $npbNonAktif = Anak::where('status_cpb', Anak::STATUS_CPB_NPB)
            ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();
    
        return view('AdminCabang.Report.dashboardAdminCabangReport', compact(
            'bcpbAktif', 'pbAktif', 'cpbAktif', 'npbAktif', 
            'bcpbNonAktif', 'pbNonAktif', 'cpbNonAktif', 'npbNonAktif'
        ));
    }
    

    public function dashboardKeuanganCabang() {
        $totalKeuangan = Keuangan::count();
        return view('AdminCabang.Keuangan.dashboardAdminCabangKeuangan' , compact('totalKeuangan'));
    }

    
}
