<?php

namespace App\Http\Controllers\AdminPusat\Settings\MasterData\Sdm;

use App\Models\SDM;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Provinsi;
use App\Models\Struktur;
use App\Models\Kabupaten;
use App\Models\Kecamatan;
use App\Models\Kelurahan;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class SdmController extends Controller
{
    public function index(Request $request) {
        $data_sdm = SDM::with(['provinsi', 'kabupaten', 'kecamatan', 'kelurahan', 'struktur', 'wilbin', 'kacab'])->get();
        return view('AdminPusat.Settings.MasterData.Sdm.index', compact('data_sdm'));
    }

    public function create() {
        $provinsi = Provinsi::all();
        $kacab = Kacab::all();
        $struktur = Struktur::all();
        $wilbin = Wilbin::all();
        
        return view('AdminPusat.Settings.MasterData.Sdm.create', compact('provinsi', 'kacab', 'struktur', 'wilbin'));
    }

    public function getWilbinByKacab($id_kacab) {
        $wilbins = Wilbin::where('id_kacab', $id_kacab)->get();
        
        return response()->json($wilbins);
    }
    

    public function store(Request $request) {
        $request->validate([
            'nik' => 'required|unique:sdm',
            'nama' => 'required',
            'jenis_kelamin' => 'required',
            'alamat' => 'required',
            'id_prov' => 'required',
            'id_kab' => 'required',
            'id_kec' => 'required',
            'id_kel' => 'required',
            'id_kacab' => 'required',
            'id_wilbin' => 'required',
        ]);
    
        // Ambil data Wilayah Binaan berdasarkan id_kacab yang dipilih
        $wilbin = Wilbin::where('id_kacab', $request->id_kacab)->pluck('id_wilbin')->toArray();
    
        // Validasi apakah Wilayah Binaan yang dipilih sesuai dengan Kacab
        if (!in_array($request->id_wilbin, $wilbin)) {
            return redirect()->back()->withErrors(['id_wilbin' => 'Wilayah Binaan yang dipilih tidak sesuai dengan Kacab yang dipilih.'])->withInput();
        }
    
        // Simpan data jika validasi lolos
        SDM::create($request->all());
        $lastPage = ceil(SDM::count() / 10) - 1;
    
        return redirect()->route('sdm')
                         ->with('success', 'Data SDM berhasil ditambahkan')
                         ->with('currentPage', $lastPage);
    }    

    public function edit($id_sdm) {
        $sdm = SDM::with('provinsi', 'kabupaten', 'kecamatan', 'kelurahan', 'kacab', 'struktur', 'wilbin')->findOrFail($id_sdm);
        $provinsi = Provinsi::all();
        $kacab = Kacab::all();
        $struktur = Struktur::all();
        $wilbin = Wilbin::all();
    
        // Ambil data berdasarkan provinsi, kabupaten, dan kecamatan yang ada di $sdm
        $kabupaten = $sdm->id_prov ? Kabupaten::where('id_prov', $sdm->id_prov)->get() : collect([]);
        $kecamatan = $sdm->id_kab ? Kecamatan::where('id_kab', $sdm->id_kab)->get() : collect([]);
        $kelurahan = $sdm->id_kec ? Kelurahan::where('id_kec', $sdm->id_kec)->get() : collect([]);
        
        return view('AdminPusat.Settings.MasterData.Sdm.edit', compact('sdm', 'provinsi', 'kabupaten', 'kecamatan', 'kelurahan', 'kacab', 'struktur', 'wilbin'));
    }
    
    public function update(Request $request, $id_sdm) {
        $request->validate([
            'nama' => 'required',
        ]);
        
        $sdm = SDM::findOrFail($id_sdm);
        $sdm->update($request->all());
        
        // Ambil current_page dari request atau set default ke 0
        $currentPage = $request->input('current_page', 0);
        
        // Redirect ke halaman SDM dengan query string current_page
        return redirect()->route('sdm', ['page' => $currentPage])
                         ->with('success', 'Data SDM berhasil diperbarui')
                         ->with('currentPage', $currentPage);
    }

    public function destroy(Request $request, $id_sdm) {
        $sdm = SDM::findOrFail($id_sdm);
        $sdm->delete();

        $currentPage = $request->input('current_page', 0);

        return redirect()->route('sdm')
                         ->with('success', 'Data SDM berhasil dihapus')
                         ->with('currentPage', $currentPage);
    }

     
    
}
