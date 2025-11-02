<?php

namespace App\Http\Controllers\AdminPusat\Settings\DataWilayah\DataShalter;

use App\Http\Controllers\Controller;
use App\Models\Shelter;
use App\Models\Wilbin; // Tambahkan model Wilbin untuk mengambil data Wilayah Binaan
use Illuminate\Http\Request;

class DataShalterController extends Controller
{
    // Menampilkan daftar Shelter
    public function index(Request $request) {
        // Ambil semua data Shelter, karena pagination dilakukan oleh DataTables di client-side
        $data_shelter = Shelter::with('wilbin')->get(); // Menggunakan eager loading untuk relasi dengan Wilbin
        return view('AdminPusat.Settings.DataWilayah.Shelter.index', compact('data_shelter'));
    }

    // Menampilkan form create
    public function create() {
        // Mengambil semua data Wilayah Binaan untuk ditampilkan di dropdown
        $wilbin = Wilbin::all(); 
        return view('AdminPusat.Settings.DataWilayah.Shelter.create', compact('wilbin'));
    }

    // Menyimpan data baru
    public function store(Request $request) {
        $request->validate([
            'nama_shelter' => 'required',
            'nama_koordinator' => 'required',
            'no_telpon' => 'required',
            'alamat' => 'required',
            'id_wilbin' => 'required',
        ]);

        Shelter::create($request->all());

           // Menghitung halaman terakhir jika data bertambah
           $totalData = Shelter::count();
           $perPage = 10; // Sesuaikan dengan jumlah data per halaman
           $lastPage = ceil($totalData / $perPage) - 1;

        // Redirect kembali ke halaman Data Shelter dengan posisi terakhir di DataTables
        return redirect()->route('data_shalter')
                         ->with('success', 'Data Shelter berhasil ditambahkan')
                         ->with('currentPage', $lastPage); // Ini opsional, default ke halaman pertama setelah penambahan
    }

    // Menampilkan form edit
    public function edit($id_shelter) {
        $shelter = Shelter::findOrFail($id_shelter);
        $wilbin = Wilbin::all(); // Mengambil data Wilayah Binaan untuk dropdown
        return view('AdminPusat.Settings.DataWilayah.Shelter.edit', compact('shelter', 'wilbin'));
    }

    // Memperbarui data shelter yang ada
    public function update(Request $request, $id_shelter) {
        $request->validate([
            'nama_shelter' => 'required',
            'nama_koordinator' => 'required',
            'no_telpon' => 'required',
            'alamat' => 'required',
            'id_wilbin' => 'required',
        ]);

        $shelter = Shelter::findOrFail($id_shelter);
        $shelter->update($request->all());

        // Ambil current page dari form atau default ke halaman 0
        $currentPage = $request->input('current_page', 0);

        // Redirect kembali ke halaman Data Shelter dengan posisi di DataTables
        return redirect()->route('data_shalter')
                         ->with('success', 'Data Shelter berhasil diperbarui')
                         ->with('currentPage', $currentPage);
    }

    // Menghapus data shelter
    public function destroy(Request $request, $id_shelter) {
        $shelter = Shelter::findOrFail($id_shelter);
        $shelter->delete();

        // Ambil current page dari form atau default ke halaman 0
        $currentPage = $request->input('current_page', 0);

        // Redirect kembali ke halaman Data Shelter dengan posisi di DataTables
        return redirect()->route('data_shalter')
                         ->with('success', 'Data Shelter berhasil dihapus')
                         ->with('currentPage', $currentPage);
    }
}
