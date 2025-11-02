<?php

namespace App\Http\Controllers\AdminShalter;

use App\Models\Anak;
use App\Models\Survey;
use App\Models\Keluarga;
use App\Models\Keuangan;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DashboardAdminShalterController extends Controller
{
    /* Dashboard Admin Shalter */
    public function dashboardPemberdayaanShalter() {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
        
        // Ambil data admin shelter berdasarkan ID pengguna
        $adminShelter = \App\Models\AdminShelter::where('user_id', $user_id)->first();

        if (!$adminShelter) {
            abort(403, 'Anda tidak memiliki akses ke data ini.');
        }

        // Ambil id_kacab dari admin shelter yang sedang login
        $id_kacab = $adminShelter->id_kacab;
        $id_shelter = $adminShelter->id_shelter; // Dapatkan id_shelter

        // Menghitung jumlah anak aktif berdasarkan id_kacab dan shelter
        $anakAktifCount = Anak::where('status_validasi', 'Aktif')
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();

        // Menghitung jumlah anak yang belum aktif berdasarkan status tertentu
        $anakBelumAktifCount = Anak::whereIn('status_validasi', ['Tidak Aktif', 'Ditangguhkan', 'Ditolak'])
            ->whereHas('shelter.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();

        // Menghitung jumlah data survey yang sudah selesai berdasarkan id_kacab
        $surveyCount = Survey::whereNotNull('hasil_survey')
            ->whereHas('keluarga.wilbin', function($query) use ($id_kacab) {
                $query->where('id_kacab', $id_kacab);
            })
            ->count();

        // Menghitung jumlah keluarga berdasarkan id_kacab dan id_shelter yang terkait dengan admin shelter
        $keluargaCount = Keluarga::whereHas('wilbin', function($query) use ($id_kacab, $id_shelter) {
            $query->where('id_kacab', $id_kacab)
                  ->where('id_shelter', $id_shelter); // Menambahkan filter berdasarkan shelter
        })
        ->count();

        // Mengirimkan data ke view dashboard
        return view('AdminShalter.Pemberdayaan.dashboardAdminShalterPemberdayaan', compact(
            'anakAktifCount', 'anakBelumAktifCount', 'surveyCount', 'keluargaCount'
        ));
    }

    public function dashboardReportShalter() {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
        
        // Ambil Admin Shelter berdasarkan User
        $adminShelter = \App\Models\AdminShelter::where('user_id', $user_id)->first();
    
        if (!$adminShelter) {
            abort(403, 'Anda tidak memiliki akses ke data ini.');
        }
    
        // Ambil ID shelter yang terkait dengan admin shelter yang login
        $id_shelter = $adminShelter->id_shelter;
    
        // Menghitung jumlah Anak berdasarkan status_cpb dan status_validasi, hanya untuk shelter yang terkait dengan admin shelter yang login
        $bcpbAktif = Anak::where('id_shelter', $id_shelter)
            ->where('status_cpb', Anak::STATUS_CPB_BCPB)
            ->where('status_validasi', Anak::STATUS_AKTIF)
            ->count();
    
        $pbAktif = Anak::where('id_shelter', $id_shelter)
            ->where('status_cpb', Anak::STATUS_CPB_PB)
            ->where('status_validasi', Anak::STATUS_AKTIF)
            ->count();
    
        $cpbAktif = Anak::where('id_shelter', $id_shelter)
            ->where('status_cpb', Anak::STATUS_CPB_CPB)
            ->where('status_validasi', Anak::STATUS_AKTIF)
            ->count();
    
        $npbAktif = Anak::where('id_shelter', $id_shelter)
            ->where('status_cpb', Anak::STATUS_CPB_NPB)
            ->where('status_validasi', Anak::STATUS_AKTIF)
            ->count();
    
        $bcpbNonAktif = Anak::where('id_shelter', $id_shelter)
            ->where('status_cpb', Anak::STATUS_CPB_BCPB)
            ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
            ->count();
    
        $pbNonAktif = Anak::where('id_shelter', $id_shelter)
            ->where('status_cpb', Anak::STATUS_CPB_PB)
            ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
            ->count();
    
        $cpbNonAktif = Anak::where('id_shelter', $id_shelter)
            ->where('status_cpb', Anak::STATUS_CPB_CPB)
            ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
            ->count();
    
        $npbNonAktif = Anak::where('id_shelter', $id_shelter)
            ->where('status_cpb', Anak::STATUS_CPB_NPB)
            ->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
            ->count();
    
        // Kirim data ke view
        return view('AdminShalter.Report.dashboardAdminShalterReport', compact(
            'bcpbAktif', 'pbAktif', 'cpbAktif', 'npbAktif', 
            'bcpbNonAktif', 'pbNonAktif', 'cpbNonAktif', 'npbNonAktif'
        ));
    }
    

    /* Dashboard Keuangan Admin Shelter */
    public function dashboardKeuanganShalter() {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
        
        // Ambil data admin shelter berdasarkan ID pengguna
        $adminShelter = \App\Models\AdminShelter::where('user_id', $user_id)->first();

        if (!$adminShelter) {
            abort(403, 'Anda tidak memiliki akses ke data ini.');
        }
        
        // Ambil id_shelter yang terkait dengan admin shelter yang sedang login
        $id_shelter = $adminShelter->id_shelter;

        // Menghitung total keuangan berdasarkan shelter yang terkait dengan anak yang ada di shelter tersebut
        $totalKeuangan = Keuangan::whereHas('anak', function ($query) use ($id_shelter) {
            // Filter berdasarkan id_shelter yang ada di tabel anak
            $query->where('id_shelter', $id_shelter);
        })->count();

        // Kirim data ke view dashboard keuangan
        return view('AdminShalter.Keuangan.dashboardAdminShalterKeuangan', compact('totalKeuangan'));
    }
}
