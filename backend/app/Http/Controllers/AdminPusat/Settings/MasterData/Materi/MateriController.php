<?php

namespace App\Http\Controllers\AdminPusat\Settings\MasterData\Materi;

use App\Http\Controllers\Controller;
use App\Models\Materi;
use App\Models\LevelAnakBinaan;
use Illuminate\Http\Request;

class MateriController extends Controller
{
    public function index() {
        $materi_data = Materi::with('levelAnakBinaan')->get(); // Mengambil semua data tanpa pagination
        $levels = LevelAnakBinaan::all(); // Mengambil semua data level untuk dropdown
        return view('AdminPusat.Settings.MasterData.Materi.index', compact('materi_data', 'levels'));
    }

    public function store(Request $request) {
        $request->validate([
            'id_level_anak_binaan' => 'required|exists:level_as_anak_binaan,id_level_anak_binaan',
            'mata_pelajaran' => 'required|string|max:255',
            'nama_materi' => 'required|string|max:255',
        ]);

        // Tambahkan data baru ke tabel materi
        Materi::create($request->all());

        $totalData = Materi::count();
        $perPage = 10;
        $lastPage = ceil($totalData / $perPage);

        return redirect()->route('materi')->with('success', 'Data Materi berhasil ditambahkan')
            ->with('currentPage', $lastPage - 1); // Pengarahan ke halaman terakhir
    }

    public function update(Request $request, $id) {
        $request->validate([
            'id_level_anak_binaan' => 'required|exists:level_as_anak_binaan,id_level_anak_binaan',
            'mata_pelajaran' => 'required|string|max:255',
            'nama_materi' => 'required|string|max:255',
        ]);

        $materi = Materi::findOrFail($id);
        $materi->update($request->all());

        return redirect()->route('materi')->with('success', 'Data Materi berhasil diperbarui')
            ->with('currentPage', $request->input('current_page', 0));
    }

    public function destroy(Request $request, $id) {
        $materi = Materi::findOrFail($id);
        $materi->delete();

        return redirect()->route('materi')->with('success', 'Data Materi berhasil dihapus')
            ->with('currentPage', $request->input('current_page', 0));
    }
}
