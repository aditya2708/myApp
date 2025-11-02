<?php

namespace App\Http\Controllers\AdminPusat\Settings\MasterData\Struktur;

use App\Http\Controllers\Controller;
use App\Models\Struktur;
use Illuminate\Http\Request;

class StrukturController extends Controller
{
    public function index() {
        // Mengambil semua data struktur
        $data_struktur = Struktur::get(); // Menampilkan 10 data per halaman
        return view('AdminPusat.Settings.MasterData.Struktur.index', compact('data_struktur'));
    }

    public function store(Request $request) {
        // Validasi input form
        $request->validate([
            'struktur' => 'required',
            'status' => 'required|in:aktif,tidak aktif',
        ]);

        // Menambahkan data struktur baru
        Struktur::create($request->all());

        // Hitung total data untuk pagination
        $totalData = Struktur::count();
        $perPage = 10;
        $lastPage = ceil($totalData / $perPage); // Menghitung halaman terakhir

        return redirect()->route('struktur')->with('success', 'Data Struktur berhasil ditambahkan')
            ->with('currentPage', $lastPage - 1); // Arahkan ke halaman terakhir
    }

    public function update(Request $request, $id_struktur) {
        // Validasi input form
        $request->validate([
            'struktur' => 'required',
            'status' => 'required|in:aktif,tidak aktif',
        ]);

        // Mengupdate data struktur
        $struktur = Struktur::findOrFail($id_struktur);
        $struktur->update($request->all());

        return redirect()->route('struktur')->with('success', 'Data Struktur berhasil diperbarui')
            ->with('currentPage', $request->input('current_page', 0)); // Kembali ke pagination yang sama
    }

    public function destroy(Request $request, $id_struktur) {
        // Menghapus data struktur
        $struktur = Struktur::findOrFail($id_struktur);
        $struktur->delete();

        return redirect()->route('struktur')->with('success', 'Data Struktur berhasil dihapus')
            ->with('currentPage', $request->input('current_page', 0)); // Kembali ke pagination yang sama
    }
}
