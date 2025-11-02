<?php

namespace App\Http\Controllers\AdminPusat;

use App\Models\Anak;
use App\Models\Bank;
use App\Models\User;
use App\Models\Kacab;
use App\Models\Tutor;
use App\Models\Materi;
use App\Models\Survey;
use App\Models\Wilbin;
use App\Models\AlQuran;
use App\Models\Donatur;
use App\Models\Keluarga;
use App\Models\Keuangan;
use App\Models\AdminPusat;
use App\Models\AdminCabang;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Berita;

class DashboardAdminPusatController extends Controller
{
     /* Dashboard Admin Pusat */

    public function dashboardSettingsPusat() {
        $totalUsers = User::count();
        $totalDonatur = Donatur::count();
        $totalAdminShelter = AdminShelter::count();
        $totalAdminCabang = AdminCabang::count();
        $totalAdminPusat = AdminPusat::count();
        $totalTutor = Tutor::count();
        $totalCabang = Kacab::count();
        $totalWilbin = Wilbin::count();
        $totalShelter = Wilbin::count();
        $totalQuran = AlQuran::count();
        $totalbank = Bank::count();
        $totalMateri = Materi::count();
        
        return view('AdminPusat.Settings.dashboardAdminPusatSettings', compact('totalUsers', 'totalDonatur', 'totalAdminShelter', 'totalAdminCabang', 'totalAdminPusat', 'totalTutor', 'totalCabang', 'totalWilbin', 'totalShelter', 'totalQuran', 'totalbank', 'totalMateri'));
    }


    public function dashboardPemberdayaanPusat() {
        // Menghitung jumlah anak aktif
        $anakAktifCount = Anak::where('status_validasi', 'Aktif')->count();

        // Menghitung jumlah anak belum aktif (status "Tidak Aktif", "Ditangguhkan", atau "Ditolak")
        $anakBelumAktifCount = Anak::whereIn('status_validasi', ['Tidak Aktif', 'Ditangguhkan', 'Ditolak'])->count();

        // Menghitung jumlah data survey yang sudah diinput
        $surveyCount = Survey::whereNotNull('hasil_survey')->count();

        // Menghitung jumlah data keluarga yang sudah terdaftar
        $keluargaCount = Keluarga::count();

        return view('AdminPusat.Pemberdayaan.dashboardAdminPusatPemberdayaan', compact(
            'anakAktifCount', 'anakBelumAktifCount', 'surveyCount', 'keluargaCount'
        ));
    }

    public function dashboardKeuanganPusat() {
        // Menghitung total data keuangan
        $totalKeuangan = Keuangan::count();
    
        return view('AdminPusat.Keuangan.dashboardAdminPusatKeuangan', compact('totalKeuangan'));
    }
    
    public function dashboardBeritaPusat() {
        $totalBerita = Berita::count();
        return view('AdminPusat.Berita.dashboardAdminPusatBerita', compact('totalBerita'));
    }
   

    public function dashboardReportPusat() {
         // Menghitung jumlah Anak berdasarkan status_cpb dan status_validasi
         $bcpbAktif = Anak::where('status_cpb', Anak::STATUS_CPB_BCPB)
         ->where('status_validasi', Anak::STATUS_AKTIF)
         ->count();

        $pbAktif = Anak::where('status_cpb', Anak::STATUS_CPB_PB)
            ->where('status_validasi', Anak::STATUS_AKTIF)
            ->count();

        $cpbAktif = Anak::where('status_cpb', Anak::STATUS_CPB_CPB)
                ->where('status_validasi', Anak::STATUS_AKTIF)
                ->count();

        $npbAktif = Anak::where('status_cpb', Anak::STATUS_CPB_NPB)
                ->where('status_validasi', Anak::STATUS_AKTIF)
                ->count();

        $bcpbNonAktif = Anak::where('status_cpb', Anak::STATUS_CPB_BCPB)
                    ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
                    ->count();

        $pbNonAktif = Anak::where('status_cpb', Anak::STATUS_CPB_PB)
                ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
                ->count();

        $cpbNonAktif = Anak::where('status_cpb', Anak::STATUS_CPB_CPB)
                ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
                ->count();

        $npbNonAktif = Anak::where('status_cpb', Anak::STATUS_CPB_NPB)
                ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
                ->count();

        return view(' AdminPusat.Report.dashboardAdminPusatReport', compact(
        'bcpbAktif', 'pbAktif', 'cpbAktif', 'npbAktif', 
        'bcpbNonAktif', 'pbNonAktif', 'cpbNonAktif', 'npbNonAktif'
        ));
    }

   
}
