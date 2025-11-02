<?php

namespace App\Http\Controllers\AdminPusat\Pemberdayaan\DataKelompok;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Shelter;
use App\Models\Kelompok;
use Illuminate\Http\Request;
use App\Models\LevelAnakBinaan;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class DataKelompokController extends Controller
{
    public function index()
    {
        // Ambil data shelter beserta relasi kelompok dan wilbin
        $data_shelters = Shelter::with(['wilbin.kacab', 'kelompok'])->get();

        // Debug data untuk memastikan relasi kelompok dimuat
        foreach ($data_shelters as $shelter) {
            Log::info("Shelter: {$shelter->nama_shelter}, Kelompok count: " . $shelter->kelompok->count());
        }

        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKelompok.index', compact('data_shelters'));
    }

    public function show($id_shelter)
    {
        // Ambil shelter dan kelompok yang terkait dengan shelter tersebut
        $shelter = Shelter::with(['kelompok.levelAnakBinaan'])->findOrFail($id_shelter);

        // Jika shelter tidak memiliki kelompok
        if ($shelter->kelompok->isEmpty()) {
            return view('AdminPusat.Pemberdayaan.DataBinaan.DataKelompok.show', [
                'shelter' => $shelter,
                'message' => 'Tidak ada kelompok terdaftar untuk shelter ini.'
            ]);
        }

        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKelompok.show', compact('shelter'));
    }

    public function getJumlahAnggota($id_kelompok)
    {
        $kelompok = Kelompok::findOrFail($id_kelompok);
        $jumlahAnggota = $kelompok->anak()->count();
        return response()->json(['jumlah_anggota' => $jumlahAnggota]);
    }


    // Tambah Data Kelompok 
    public function create($id_shelter)
    {
        $levelAnakBinaan = LevelAnakBinaan::all();
        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKelompok.createKelompok', compact('levelAnakBinaan', 'id_shelter'));
    }
    
    public function createprosess(Request $request, $id_shelter)
    {
        $request->validate([
            'id_level_anak_binaan' => 'required|exists:level_as_anak_binaan,id_level_anak_binaan',
            'nama_kelompok' => 'required|string|max:255',
        ]);
    
        $kelompok = Kelompok::create([
            'id_level_anak_binaan' => $request->id_level_anak_binaan,
            'nama_kelompok' => $request->nama_kelompok,
            'id_shelter' => $id_shelter,
            'jumlah_anggota' => 0,
        ]);
    
        return redirect()->route('datakelompokshelter.show', ['id' => $id_shelter])->with('success', 'Kelompok berhasil ditambahkan');
    }

    public function pindahanak($id_shelter)
    {
        // Ambil hanya anak binaan yang dihapus dari kelompok (id_kelompok null) dan berada di shelter tertentu
        $anakBinaan = Anak::where('id_shelter', $id_shelter)
                        ->whereNull('id_kelompok') // Ambil yang belum memiliki kelompok
                        ->get();

        $kacabList = Kacab::all(); // Ambil daftar Kantor Cabang

        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKelompok.pindahshelter', compact('anakBinaan', 'kacabList', 'id_shelter'));
    }

    public function pindahanakshelterprosess(Request $request, $id_shelter)
    {
        $request->validate([
            'id_anak' => 'required|exists:anak,id_anak',
            'id_shelter_baru' => 'required|exists:shelter,id_shelter',
        ]);

        $anak = Anak::findOrFail($request->id_anak);
        $anak->id_kelompok = null; // Hapus dari kelompok lama
        $anak->id_shelter = $request->id_shelter_baru; // Update ke shelter baru
        $anak->save();

        // Redirect ke shelter tujuan setelah pemindahan
        return redirect()->route('datakelompokshelter.show', ['id' => $request->id_shelter_baru])
            ->with('success', 'Anak berhasil dipindahkan ke shelter baru.');
    }

   // Tambah Data Anggota Anak
    public function createanak($id_shelter, $id_kelompok)
    {
        // Dapatkan anak binaan yang berada di shelter saat ini dan belum memiliki kelompok
        $anakBinaan = Anak::where('id_shelter', $id_shelter)
                        ->whereNull('id_kelompok') // Hanya anak tanpa kelompok
                        ->get();

        $kelompok = Kelompok::findOrFail($id_kelompok);

        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKelompok.tambahAnggota', compact('anakBinaan', 'id_shelter', 'kelompok'));
    }

    public function createanakprosess(Request $request, $id_shelter, $id_kelompok)
    {
        $request->validate([
            'id_anak' => 'required|exists:anak,id_anak'
        ]);

        // Perbarui data anak untuk memasukkan id_kelompok yang dipilih
        $anak = Anak::findOrFail($request->id_anak);
        $anak->id_kelompok = $id_kelompok;
        $anak->save();

        // Perbarui jumlah anggota di kelompok
        $kelompok = Kelompok::findOrFail($id_kelompok);
        $kelompok->jumlah_anggota = $kelompok->anak()->count();
        $kelompok->save();

        return redirect()->route('kelompok.createanak', ['id_shelter' => $id_shelter, 'id_kelompok' => $id_kelompok])
                        ->with('success', 'Anggota berhasil ditambahkan');
    }

    // Edit Kelompok
    public function edit($id_kelompok)
    {
        $kelompok = Kelompok::with('levelAnakBinaan')->findOrFail($id_kelompok);
        $levelAnakBinaan = LevelAnakBinaan::all();
        return view('AdminPusat.Pemberdayaan.DataBinaan.DataKelompok.editKelompok', compact('kelompok', 'levelAnakBinaan'));
    }

    public function editprosess(Request $request, $id_kelompok)
    {
        $request->validate([
            'id_level_anak_binaan' => 'required|exists:level_as_anak_binaan,id_level_anak_binaan',
            'nama_kelompok' => 'required|string|max:255',
        ]);

        $kelompok = Kelompok::findOrFail($id_kelompok);
        $kelompok->update([
            'id_level_anak_binaan' => $request->id_level_anak_binaan,
            'nama_kelompok' => $request->nama_kelompok,
        ]);

        return redirect()->route('datakelompokshelter.show', ['id' => $kelompok->id_shelter])->with('success', 'Kelompok berhasil diperbarui');
    }

    public function deleteanak($id_anak)
    {
        try {
            $anak = Anak::findOrFail($id_anak);
            $anak->id_kelompok = null; // Hapus dari kelompok lama
            $anak->save();

            return response()->json([
                'status' => 'success',
                'message' => 'Data anak berhasil dihapus dari kelompok dan siap dipindahkan.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan saat menghapus data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
