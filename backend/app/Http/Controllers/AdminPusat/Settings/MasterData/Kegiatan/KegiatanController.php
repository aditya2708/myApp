<?php

namespace App\Http\Controllers\AdminPusat\Settings\MasterData\Kegiatan;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use Illuminate\Http\Request;

class KegiatanController extends Controller
{
    public function index() {
        // Mengambil data kegiatan untuk ditampilkan pada halaman index
        $data_kegiatan = Kegiatan::get(); // Pagination 10 per halaman
        return view('AdminPusat.Settings.MasterData.Kegiatan.index', compact('data_kegiatan'));
    }

    public function store(Request $request) {
        $request->validate([
            'nama_kegiatan' => 'required',
        ]);

        // Tambahkan data kegiatan baru
        Kegiatan::create($request->all());

        // Hitung total data untuk mengetahui halaman terakhir
        $totalData = Kegiatan::count();
        $perPage = 10;
        $lastPage = ceil($totalData / $perPage); // Halaman terakhir

        return redirect()->route('kegiatan')->with('success', 'Data Kegiatan berhasil ditambahkan')
            ->with('currentPage', $lastPage - 1); // Arahkan ke halaman terakhir
    }

    public function update(Request $request, $id_kegiatan) {
        $request->validate([
            'nama_kegiatan' => 'required',
        ]);

        // Update data kegiatan
        $kegiatan = Kegiatan::findOrFail($id_kegiatan);
        $kegiatan->update($request->all());

        // Redirect ke halaman yang sama
        return redirect()->route('kegiatan')->with('success', 'Data Kegiatan berhasil diperbarui')
            ->with('currentPage', $request->input('current_page', 0)); // Kembali ke pagination yang sama
    }

    public function destroy(Request $request, $id_kegiatan) {
        // Hapus data kegiatan
        $kegiatan = Kegiatan::findOrFail($id_kegiatan);
        $kegiatan->delete();

        // Redirect ke halaman yang sama
        return redirect()->route('kegiatan')->with('success', 'Data Kegiatan berhasil dihapus')
            ->with('currentPage', $request->input('current_page', 0)); // Kembali ke pagination yang sama
    }
}
