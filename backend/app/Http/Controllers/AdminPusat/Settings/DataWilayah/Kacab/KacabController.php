<?php

namespace App\Http\Controllers\AdminPusat\Settings\DataWilayah\Kacab;

use App\Http\Controllers\GlobalApiDataWilayahIndonesiaController;
use App\Models\Kacab;
use Illuminate\Http\Request;

class KacabController extends GlobalApiDataWilayahIndonesiaController
{
    public function index(Request $request) {
        // Ambil data kacab dan gunakan DataTables untuk menampilkan
        $data_kacab = Kacab::get(); // Anda dapat menyesuaikan ini sesuai kebutuhan
        return view('AdminPusat.Settings.DataWilayah.Kacab.index', compact('data_kacab'));
    }

    public function create() {
        $provinsiResponse = $this->getProvinsi();
        $provinsi = json_decode($provinsiResponse->content(), true); // Decode JSON response menjadi array
        
        return view('AdminPusat.Settings.DataWilayah.Kacab.create', compact('provinsi'));
    }

    public function store(Request $request) {
        $request->validate([
            'nama_kacab' => 'required',
            'no_telpon' => 'required',
            'alamat' => 'required',
            'id_prov' => 'required',
            'id_kab' => 'required',
            'id_kec' => 'required',
            'id_kel' => 'required',
        ]);
    
        Kacab::create($request->all());
    
        // Menghitung halaman terakhir jika data bertambah
        $totalData = Kacab::count();
        $perPage = 10; // Sesuaikan dengan jumlah data per halaman
        $lastPage = ceil($totalData / $perPage) - 1;
    
        return redirect()->route('kantor_cabang')
                         ->with('success', 'Data Kacab berhasil ditambahkan')
                         ->with('currentPage', $lastPage);
    }
    

    public function edit($id_kacab) {
        $kacab = Kacab::findOrFail($id_kacab);
    
        $provinsi = $this->getProvinsi();
        $provinsi = json_decode($provinsi->content(), true);
        $kabupaten = $this->getKabupaten($kacab->id_prov);
        $kabupaten = json_decode($kabupaten->content(), true);
        $kecamatan = $this->getKecamatan($kacab->id_kab);
        $kecamatan = json_decode($kecamatan->content(), true);
        $kelurahan = $this->getKelurahan($kacab->id_kec);
        $kelurahan = json_decode($kelurahan->content(), true);
    
        return view('AdminPusat.Settings.DataWilayah.Kacab.edit', compact('kacab', 'provinsi', 'kabupaten', 'kecamatan', 'kelurahan'));
    }

    public function update(Request $request, $id_kacab) {
        $request->validate([
            'nama_kacab' => 'required',
            'no_telpon' => 'required',
            'alamat' => 'required',
            'id_prov' => 'required',
            'id_kab' => 'required',
            'id_kec' => 'required',
            'id_kel' => 'required',
        ]);
    
        $kacab = Kacab::findOrFail($id_kacab);
        $kacab->update($request->all());
    
        // Ambil current page dari form atau default ke halaman 0
        $currentPage = $request->input('current_page', 0);
    
        return redirect()->route('kantor_cabang')
                         ->with('success', 'Data Kacab berhasil diperbarui')
                         ->with('currentPage', $currentPage);
    }
    
    
    public function destroy(Request $request, $id_kacab) {
        $kacab = Kacab::findOrFail($id_kacab);
        $kacab->delete();
    
        return redirect()->route('kantor_cabang')
                         ->with('success', 'Data Kacab berhasil dihapus')
                         ->with('currentPage', $request->input('current_page', 0));
    }
    
}
