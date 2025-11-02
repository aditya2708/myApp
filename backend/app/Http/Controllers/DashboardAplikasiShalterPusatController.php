<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Donatur;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class DashboardAplikasiShalterPusatController extends Controller
{
    /* Dashboard Aplikasi Shalter */
    // Dashboard Admin Pusat
    public function dashboardShalterPusat()
    {
        // Periksa apakah user adalah admin
        if (!in_array(Auth::user()->level, ['admin_pusat', 'admin_cabang', 'admin_shelter'])) {
            return redirect('/')->withErrors(['error' => 'Anda tidak memiliki akses ke halaman ini.']);
        }

        // Periksa apakah email user terkait ada di tabel donatur
        $hasDonatur = Donatur::whereHas('user', function ($query) {
            $query->where('email', Auth::user()->email);
        })->exists();

        return view('AdminPusat.dashboardAplikasiShalterPusat', compact('hasDonatur'));
    }

    // Dashboard Admin Shalter
    public function dashboardShalter() {
        // Periksa apakah user adalah admin
        if (!in_array(Auth::user()->level, ['admin_pusat', 'admin_cabang', 'admin_shelter'])) {
            return redirect('/')->withErrors(['error' => 'Anda tidak memiliki akses ke halaman ini.']);
        }

        // Periksa apakah email user terkait ada di tabel donatur
        $hasDonatur = Donatur::whereHas('user', function ($query) {
            $query->where('email', Auth::user()->email);
        })->exists();

        return view('AdminShalter.dashboardAplikasiShalter', compact('hasDonatur'));
    }

    /* Dashboard Admin Cabang */
    public function dashboardCabang() {
        // Periksa apakah user adalah admin
        if (!in_array(Auth::user()->level, ['admin_pusat', 'admin_cabang', 'admin_shelter'])) {
            return redirect('/')->withErrors(['error' => 'Anda tidak memiliki akses ke halaman ini.']);
        }

        // Periksa apakah email user terkait ada di tabel donatur
        $hasDonatur = Donatur::whereHas('user', function ($query) {
            $query->where('email', Auth::user()->email);
        })->exists();

        return view('AdminCabang.dashboardAplikasiShaltersCabang', compact('hasDonatur'));
    }
}
