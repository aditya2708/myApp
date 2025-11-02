<?php

namespace App\Http\Controllers\AdminPusat\Pemberdayaan\DataBinaan\DataKeluarga;

use App\Models\Ibu;
use App\Models\Anak;
use App\Models\Ayah;
use App\Models\Bank;
use App\Models\Wali;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Keluarga;
use App\Models\Provinsi;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class DataKeluargaController extends Controller
{
    public function index(Request $request) {
        // Query dasar untuk data keluarga
        $query = Keluarga::with(['kacab', 'wilbin', 'shelter']);

        // Filter berdasarkan Kacab, Wilayah Binaan, dan Shelter
        if ($request->has('id_kacab') && $request->id_kacab != '') {
            $query->where('id_kacab', $request->id_kacab);
        }

        if ($request->has('id_wilbin') && $request->id_wilbin != '') {
            $query->where('id_wilbin', $request->id_wilbin);
        }

        if ($request->has('id_shelter') && $request->id_shelter != '') {
            $query->where('id_shelter', $request->id_shelter);
        }

        // Ambil data keluarga berdasarkan filter
        $data_keluarga = $query->get();

        // Ambil semua data kacab untuk dropdown filter
        $kacab = Kacab::all();

        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKeluarga.index', compact('data_keluarga', 'kacab'));
    }

    public function show($id_keluarga)
    {
        // Ambil data keluarga bersama relasi ayah, ibu, kacab, wilbin, dan shelter
        $keluarga = Keluarga::with(['kacab', 'wilbin', 'shelter', 'ayah', 'ibu'])
                            ->findOrFail($id_keluarga);

        // Tentukan tab yang akan di-load
        $tab = request()->get('tab', 'data-keluarga');

        // Tampilkan halaman show dengan data keluarga yang relevan
        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKeluarga.show', compact('keluarga', 'tab'));
    }

    public function destroy(Request $request, $id_keluarga)
    {
        // Temukan data keluarga berdasarkan id
        $keluarga = Keluarga::findOrFail($id_keluarga);

        // Hapus data keluarga
        $keluarga->delete();

        // Redirect ke halaman keluarga dengan pesan sukses
        return redirect()->route('keluarga')
                         ->with('success', 'Data keluarga berhasil dihapus');
    }

    // Edit Data Keluarga
    public function edit($id_keluarga) {
        $keluarga = Keluarga::with(['kacab', 'wilbin', 'shelter', 'bank'])->findOrFail($id_keluarga);
        $kacab = Kacab::all();
        $wilbin = Wilbin::all();
        $shelter = Shelter::all();
        $bank = Bank::all();
    
        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKeluarga.DataEditKeluarga.editdatakeluarga', compact('keluarga', 'kacab', 'wilbin', 'shelter', 'bank'));
    }
    
    public function update(Request $request, $id_keluarga) {
        $validatedData = $request->validate([
            'no_kk' => 'required|string|max:20',
            'kepala_keluarga' => 'required|string|max:255',
            'status_ortu' => 'nullable|string|max:255',
            'id_kacab' => 'required|exists:kacab,id_kacab',
            'id_wilbin' => 'required|exists:wilbin,id_wilbin',
            'id_shelter' => 'required|exists:shelter,id_shelter',
            'id_bank' => 'nullable|exists:bank,id_bank',
            'no_rek' => 'nullable|string|max:255',
            'an_rek' => 'nullable|string|max:255',
            'no_telp' => 'nullable|string|max:255',
            'an_tlp' => 'nullable|string|max:255',
        ]);
    
        $keluarga = Keluarga::findOrFail($id_keluarga);
        $keluarga->update($validatedData);
    
        return redirect()->route('Keluarga.show', $keluarga->id_keluarga)
                         ->with('success', 'Data keluarga berhasil diperbarui.');
    }

    // Edit Data Ayah
    public function editAyah($id_keluarga) {
        $ayah = Ayah::where('id_keluarga', $id_keluarga)->first();
        if (empty($ayah->penghasilan)) {
            $ayah->penghasilan = null; // atau kosongkan sesuai kebutuhan
            $ayah->save();
        }
    
        // Ambil data provinsi untuk dropdown
        $provinsi = Provinsi::all();
        
        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKeluarga.DataEditAyah.editdatakeluargaayah', compact('ayah', 'provinsi'));
    }

    public function updateAyah(Request $request, $id_keluarga) {
        $validatedData = $request->validate([
            'nama_ayah' => 'nullable|string|max:255',
            'tempat_lahir' => 'nullable|string|max:255',
            'tanggal_lahir' => 'nullable|date',
            'tanggal_kematian' => 'nullable|date',
            'penyebab_kematian' => 'nullable|string|max:255',
            'nik_ayah' => 'nullable|string|max:16',
            'agama' => 'nullable|string|in:Islam,Kristen,Budha,Hindu,Konghucu',
            'alamat' => 'nullable|string|max:255',
            'id_prov' => 'nullable|exists:provinsi,id_prov',
            'id_kab' => 'nullable|exists:kabupaten,id_kab',
            'id_kec' => 'nullable|exists:kecamatan,id_kec',
            'id_kel' => 'nullable|exists:kelurahan,id_kel',
            'penghasilan' => 'nullable|string|in:500000,1500000,2500000,3500000,5000000,7000000,10000000',

        ]);

        $ayah = Ayah::where('id_keluarga', $id_keluarga)->firstOrFail();
        $ayah->update($validatedData);

        return redirect()->route('Keluarga.show', ['id' => $id_keluarga, 'tab' => 'data-ayah'])
                        ->with('success', 'Data ayah berhasil diperbarui.');
    }

    // Data Edit Ibu
    public function editIbu($id_keluarga) {
        $ibu = Ibu::where('id_keluarga', $id_keluarga)->first();
        if (empty($ibu->penghasilan)) {
            $ibu->penghasilan = null; // atau kosongkan sesuai kebutuhan
            $ibu->save();
        }
    
        // Ambil data provinsi untuk dropdown
        $provinsi = Provinsi::all();
        
        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKeluarga.DataEditIbu.editdatakeluargaibu', compact('ibu', 'provinsi'));
    }
    
    public function updateIbu(Request $request, $id_keluarga) {
        $validatedData = $request->validate([
            'nama_ibu' => 'nullable|string|max:255',
            'tempat_lahir' => 'nullable|string|max:255',
            'tanggal_lahir' => 'nullable|date',
            'tanggal_kematian' => 'nullable|date',
            'penyebab_kematian' => 'nullable|string|max:255',
            'nik_ibu' => 'nullable|string|max:16',
            'agama' => 'nullable|string|in:Islam,Kristen,Budha,Hindu,Konghucu',
            'alamat' => 'nullable|string|max:255',
            'id_prov' => 'nullable|exists:provinsi,id_prov',
            'id_kab' => 'nullable|exists:kabupaten,id_kab',
            'id_kec' => 'nullable|exists:kecamatan,id_kec',
            'id_kel' => 'nullable|exists:kelurahan,id_kel',
            'penghasilan' => 'nullable|string|in:500000,1500000,2500000,3500000,5000000,7000000,10000000',
        ]);
    
        $ibu = Ibu::where('id_keluarga', $id_keluarga)->firstOrFail();
        $ibu->update($validatedData);
    
        return redirect()->route('Keluarga.show', ['id' => $id_keluarga, 'tab' => 'data-ibu'])
                        ->with('success', 'Data Ibu berhasil diperbarui.');
    }
    

    public function editWali($id_keluarga) {
        $wali = Wali::where('id_keluarga', $id_keluarga)->first();
         if (empty($wali->penghasilan)) {
            $wali->penghasilan = null; // atau kosongkan sesuai kebutuhan
            $wali->save();
        }
        $provinsi = Provinsi::all(); // Ambil data provinsi untuk dropdown
    
        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKeluarga.DataEditWali.editdatakeluargawali', compact('wali', 'provinsi'));
    }
    
    public function updateWali(Request $request, $id_keluarga) {
        $validatedData = $request->validate([
            'nama_wali' => 'nullable|string|max:255',
            'tempat_lahir' => 'nullable|string|max:255',
            'tanggal_lahir' => 'nullable|date',
            'agama' => 'nullable|string|in:Islam,Kristen,Budha,Hindu,Konghucu',
            'alamat' => 'nullable|string|max:255',
            'id_prov' => 'nullable|exists:provinsi,id_prov',
            'id_kab' => 'nullable|exists:kabupaten,id_kab',
            'id_kec' => 'nullable|exists:kecamatan,id_kec',
            'id_kel' => 'nullable|exists:kelurahan,id_kel',
            'penghasilan' => 'nullable|string|in:500000,1500000,2500000,3500000,5000000,7000000,10000000',
            'hub_kerabat' => 'nullable|string|in:Kakak,Saudara dari Ayah,Saudara dari Ibu,Tidak Ada Hubungan Keluarga',
        ]);
    
        $wali = Wali::where('id_keluarga', $id_keluarga)->firstOrFail();
        $wali->update($validatedData);
    
        return redirect()->route('Keluarga.show', ['id' => $id_keluarga, 'tab' => 'data-wali'])
                        ->with('success', 'Data Wali berhasil diperbarui.');
    }
    
}
