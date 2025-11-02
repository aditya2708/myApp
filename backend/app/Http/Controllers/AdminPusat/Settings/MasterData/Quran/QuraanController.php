<?php

namespace App\Http\Controllers\AdminPusat\Settings\MasterData\Quran;

use App\Http\Controllers\Controller;
use App\Models\AlQuran;
use Illuminate\Http\Request;

class QuraanController extends Controller
{
    public function index() {
        // Ambil semua data Al-Quran
        $data_alquran = AlQuran::get();
        return view('AdminPusat.Settings.MasterData.Quran.index', compact('data_alquran'));
    }

    public function store(Request $request) {
        $request->validate([
            'nama' => 'required',
            'ayat' => 'required',
            'keterangan' => 'required',
        ]);

        // Tambahkan data baru
        AlQuran::create($request->all());

        // Hitung total data
        $totalData = AlQuran::count();
        $perPage = 10; // Sesuaikan dengan jumlah per halaman di DataTables
        $lastPage = ceil($totalData / $perPage); // Hitung halaman terakhir

        // Redirect ke halaman terakhir jika data baru mengisi halaman baru
        return redirect()->route('alquran')->with('success', 'Data Al-Quran berhasil ditambahkan')
            ->with('currentPage', $lastPage - 1); // Pengarahan ke halaman terakhir
    }

    public function update(Request $request, $id) {
        $request->validate([
            'nama' => 'required',
            'ayat' => 'required',
            'keterangan' => 'required',
        ]);

        $alquran = AlQuran::findOrFail($id);
        $alquran->update($request->all());

        // Redirect ke halaman yang sama
        return redirect()->route('alquran')->with('success', 'Data Al-Quran berhasil diperbarui')
            ->with('currentPage', $request->input('current_page', 0));
    }

    public function destroy(Request $request, $id) {
        $alquran = AlQuran::findOrFail($id);
        $alquran->delete();

        // Redirect ke halaman yang sama
        return redirect()->route('alquran')->with('success', 'Data Al-Quran berhasil dihapus')
            ->with('currentPage', $request->input('current_page', 0));
    }
}
