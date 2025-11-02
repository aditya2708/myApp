<?php

namespace App\Http\Controllers\AdminPusat\Settings\MasterData\LevelBinaan;

use App\Http\Controllers\Controller;
use App\Models\LevelAnakBinaan;
use Illuminate\Http\Request;

class LevelBinaanController extends Controller
{
    public function index() {
        // Ambil semua data level anak binaan
        $data_levelbinaan = LevelAnakBinaan::get();
        return view('AdminPusat.Settings.MasterData.LevelBinaan.index', compact('data_levelbinaan'));
    }

    public function store(Request $request) {
        $request->validate([
            'nama_level_binaan' => 'required',
        ]);

        // Tambahkan data baru
        LevelAnakBinaan::create($request->all());

        // Hitung total data
        $totalData = LevelAnakBinaan::count();
        $perPage = 10; // Sesuaikan dengan jumlah per halaman di DataTables
        $lastPage = ceil($totalData / $perPage); // Hitung halaman terakhir

        // Redirect ke halaman terakhir jika data baru mengisi halaman baru
        return redirect()->route('levelbinaan')->with('success', 'Data Level Anak Binaan berhasil ditambahkan')
            ->with('currentPage', $lastPage - 1); // Pengarahan ke halaman terakhir
    }

    public function update(Request $request, $id) {
        $request->validate([
            'nama_level_binaan' => 'required',
        ]);

        $levelbinaan = LevelAnakBinaan::findOrFail($id);
        $levelbinaan->update($request->all());

        // Redirect ke halaman yang sama
        return redirect()->route('levelbinaan')->with('success', 'Data Level Anak Binaan berhasil diperbarui')
            ->with('currentPage', $request->input('current_page', 0));
    }

    public function destroy(Request $request, $id) {
        $levelbinaan = LevelAnakBinaan::findOrFail($id);
        $levelbinaan->delete();

        // Redirect ke halaman yang sama
        return redirect()->route('levelbinaan')->with('success', 'Data Level Anak Binaan berhasil dihapus')
            ->with('currentPage', $request->input('current_page', 0));
    }
}
