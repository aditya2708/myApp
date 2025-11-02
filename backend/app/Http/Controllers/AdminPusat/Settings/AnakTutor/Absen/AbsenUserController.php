<?php

namespace App\Http\Controllers\AdminPusat\Settings\AnakTutor\Absen;

use App\Models\Anak;
use App\Models\Tutor;
use App\Models\AbsenUser;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class AbsenUserController extends Controller
{
    // Absensi Anak
    public function absenAnak() {
        // Ambil data absensi yang memiliki id_anak saja
        $data_absensi = AbsenUser::with('anak')->whereNotNull('id_anak')->whereNull('id_tutor')->get();

        // Anak yang belum ada di tabel absen_user
        $available_anak = Anak::whereNotIn('id_anak', $data_absensi->pluck('id_anak'))
                              ->where('status_validasi', 'Aktif')
                              ->get();

        return view('AdminPusat.Settings.AnakTutor.AbsensiAnak.index', compact('data_absensi', 'available_anak'));
    }

    public function create(Request $request) {
        $request->validate([
            'id_anak' => 'required|exists:anak,id_anak'
        ]);

        // Pastikan hanya `id_anak` yang diisi, `id_tutor` kosong
        AbsenUser::create([
            'id_anak' => $request->id_anak,
            'id_tutor' => null
        ]);

        return redirect()->route('absen_anak')->with('success', 'Data absensi berhasil ditambahkan.');
    }

    public function update(Request $request, $id_absen_user) {
        $request->validate([
            'id_anak' => 'required|exists:anak,id_anak'
        ]);

        $absen = AbsenUser::where('id_absen_user', $id_absen_user)->whereNotNull('id_anak')->firstOrFail();
        $absen->update([
            'id_anak' => $request->id_anak,
            'id_tutor' => null
        ]);

        return redirect()->route('absen_anak')->with('success', 'Data absensi berhasil diperbarui.');
    }

    public function destroy($id_absen_user) {
        $absen = AbsenUser::where('id_absen_user', $id_absen_user)->whereNotNull('id_anak')->firstOrFail();
        $absen->delete();

        return redirect()->route('absen_anak')->with('success', 'Data absensi berhasil dihapus.');
    }

    // Absensi Tutor
    public function absenTutor() {
        // Ambil data absensi yang memiliki id_tutor saja
        $data_absensi = AbsenUser::with('tutor')->whereNotNull('id_tutor')->whereNull('id_anak')->get();

        // Tutor yang belum ada di tabel absen_user
        $available_tutor = Tutor::whereNotIn('id_tutor', $data_absensi->pluck('id_tutor'))
                                ->get();

        return view('AdminPusat.Settings.AnakTutor.AbsensiTutor.index', compact('data_absensi', 'available_tutor'));
    }

    public function createTutor(Request $request) {
        $request->validate([
            'id_tutor' => 'required|exists:tutor,id_tutor'
        ]);

        // Pastikan hanya `id_tutor` yang diisi, `id_anak` kosong
        AbsenUser::create([
            'id_tutor' => $request->id_tutor,
            'id_anak' => null
        ]);

        return redirect()->route('absen_tutor')->with('success', 'Data absensi tutor berhasil ditambahkan.');
    }

    public function updateTutor(Request $request, $id_absen_user) {
        $request->validate([
            'id_tutor' => 'required|exists:tutor,id_tutor',
        ]);

        $absen = AbsenUser::where('id_absen_user', $id_absen_user)->whereNotNull('id_tutor')->firstOrFail();
        $absen->update([
            'id_tutor' => $request->id_tutor,
            'id_anak' => null
        ]);

        return redirect()->route('absen_tutor')->with('success', 'Data absensi tutor berhasil diperbarui.');
    }

    public function destroyTutor($id_absen_user) {
        $absen = AbsenUser::where('id_absen_user', $id_absen_user)->whereNotNull('id_tutor')->firstOrFail();
        $absen->delete();

        return redirect()->route('absen_tutor')->with('success', 'Data absensi tutor berhasil dihapus.');
    }
}
