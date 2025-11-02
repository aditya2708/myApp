<?php

namespace App\Http\Controllers\AdminPusat\Settings\DataWilayah\Wilbin;

use App\Http\Controllers\Controller;
use App\Models\Wilbin;
use App\Models\Kacab;
use Illuminate\Http\Request;

class WilayahBinaanController extends Controller
{
    public function index(Request $request) {
        $data_wilbin = Wilbin::with('kacab')->get();
        return view('AdminPusat.Settings.DataWilayah.Wilbin.index', compact('data_wilbin'));
    }

    public function create() {
        $kacab = Kacab::all();
        return view('AdminPusat.Settings.DataWilayah.Wilbin.create', compact('kacab'));
    }

    public function store(Request $request) {
        $request->validate([
            'nama_wilbin' => 'required',
            'id_kacab' => 'required',
        ]);
    
        // Menyimpan data wilayah binaan
        Wilbin::create([
            'nama_wilbin' => $request->nama_wilbin,
            'id_kacab' => $request->id_kacab
        ]);
    
        // Menghitung halaman terakhir jika data bertambah
        $totalData = Wilbin::count();
        $perPage = 10;
        $lastPage = ceil($totalData / $perPage) - 1;
    
        return redirect()->route('wilayah_binaan')
                         ->with('success', 'Data Wilayah Binaan berhasil ditambahkan')
                         ->with('currentPage', $lastPage);
    }    

    public function edit($id_wilbin, Request $request) {
        $wilbin = Wilbin::findOrFail($id_wilbin);
        $kacab = Kacab::all();
        return view('AdminPusat.Settings.DataWilayah.Wilbin.edit', compact('wilbin', 'kacab'))
            ->with('currentPage', $request->query('current_page', 0));
    }

    public function update(Request $request, $id_wilbin) {
        $request->validate([
            'nama_wilbin' => 'required',
            'id_kacab' => 'required',
        ]);

        $wilbin = Wilbin::findOrFail($id_wilbin);
        $wilbin->update($request->all());

        return redirect()->route('wilayah_binaan')
                         ->with('success', 'Data Wilayah Binaan berhasil diperbarui')
                         ->with('currentPage', $request->input('current_page', 0));
    }

    public function destroy(Request $request, $id_wilbin) {
        $wilbin = Wilbin::findOrFail($id_wilbin);
        $wilbin->delete();

        return redirect()->route('wilayah_binaan')
                         ->with('success', 'Data Wilayah Binaan berhasil dihapus')
                         ->with('currentPage', $request->input('current_page', 0));
    }
}
