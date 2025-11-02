<?php

namespace App\Http\Controllers\AdminCabang\PembedayaanCabang\DataKelompok;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Kelompok;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Models\LevelAnakBinaan;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class DataKelompokCabangController extends Controller
{
    public function index()
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;

        // Ambil data admin cabang berdasarkan ID pengguna
        // Jika tidak ada relasi langsung, bisa mencari berdasarkan nama cabang atau id_kacab yang sesuai
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Ambil semua wilayah binaan dan shelter terkait yang dimiliki oleh admin cabang yang sedang login
        $wilbins = Wilbin::with(['shelters' => function ($query) {
                $query->with('kelompok'); // Memuat relasi kelompok
            }])
            ->where('id_kacab', $adminCabang->id_kacab) // Mengambil wilayah binaan berdasarkan id_kacab yang terhubung dengan admin cabang
            ->get();

        // Debug untuk memastikan relasi dimuat dengan benar
        foreach ($wilbins as $wilbin) {
            Log::info("Wilbin: {$wilbin->nama_wilbin}, Shelter count: " . $wilbin->shelters->count());
        }

        // Kirim data ke view
        return view('AdminCabang.Pemberdayaan.DataBinaan.DataKelompok.index', compact('wilbins'));
    }

    public function show($id_shelter)
    {
        // Ambil shelter dan kelompok yang terkait dengan shelter tersebut
        $shelter = Shelter::with(['kelompok.levelAnakBinaan'])->findOrFail($id_shelter);

        // Jika shelter tidak memiliki kelompok
        if ($shelter->kelompok->isEmpty()) {
            return view('AdminCabang.Pemberdayaan.DataBinaan.DataKelompok.show', [
                'shelter' => $shelter,
                'message' => 'Tidak ada kelompok terdaftar untuk shelter ini.'
            ]);
        }

        return view('AdminCabang.Pemberdayaan.DataBinaan.DataKelompok.show', compact('shelter'));
    }

    public function getJumlahAnggota($id_kelompok)
    {
        $kelompok = Kelompok::findOrFail($id_kelompok);
        $jumlahAnggota = $kelompok->anak()->count();
        return response()->json(['jumlah_anggota' => $jumlahAnggota]);
    }

    public function create($id_shelter) {
        $levelAnakBinaan = LevelAnakBinaan::all();
        return view('AdminCabang.Pemberdayaan.DataBinaan.DataKelompok.createKelompok', compact('levelAnakBinaan', 'id_shelter'));
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
    
        return redirect()->route('datakelompokshelter.show.cabang', ['id' => $id_shelter])->with('success', 'Kelompok berhasil ditambahkan');
    }

    public function edit($id_kelompok)
    {
        $kelompok = Kelompok::with('levelAnakBinaan')->findOrFail($id_kelompok);
        $levelAnakBinaan = LevelAnakBinaan::all();
        return view('AdminCabang.Pemberdayaan.DataBinaan.DataKelompok.editKelompok', compact('kelompok', 'levelAnakBinaan'));
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

        return redirect()->route('datakelompokshelter.show.cabang', ['id' => $kelompok->id_shelter])->with('success', 'Kelompok berhasil diperbarui');
    }

    public function createanak($id_shelter, $id_kelompok) {
        // Dapatkan anak binaan yang berada di shelter saat ini dan belum memiliki kelompok
        $anakBinaan = Anak::where('id_shelter', $id_shelter)
                        ->whereNull('id_kelompok') // Hanya anak tanpa kelompok
                        ->get();

        $kelompok = Kelompok::findOrFail($id_kelompok);

        return view('AdminCabang.Pemberdayaan.DataBinaan.DataKelompok.tambahAnggota', compact('anakBinaan', 'id_shelter', 'kelompok'));
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

        return redirect()->route('kelompok.createanak.cabang', ['id_shelter' => $id_shelter, 'id_kelompok' => $id_kelompok])
                        ->with('success', 'Anggota berhasil ditambahkan');
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

    public function pindahanak($id_shelter)
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;

        // Ambil data admin cabang berdasarkan ID pengguna
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Ambil hanya anak binaan yang dihapus dari kelompok (id_kelompok null) dan berada di shelter tertentu
        $anakBinaan = Anak::where('id_shelter', $id_shelter)
                        ->whereNull('id_kelompok') // Ambil yang belum memiliki kelompok
                        ->get();

        // Ambil data untuk dropdown filter
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();
        $wilbins = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();

        // Kirimkan data ke view
        return view('AdminCabang.Pemberdayaan.DataBinaan.DataKelompok.pindahshelter', 
                    compact('anakBinaan', 'kacab', 'id_shelter', 'wilbins'));
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
        return redirect()->route('datakelompokshelter.show.cabang', ['id' => $request->id_shelter_baru])
            ->with('success', 'Anak berhasil dipindahkan ke shelter baru.');
    }
}

