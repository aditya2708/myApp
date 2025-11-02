<?php

namespace App\Http\Controllers\AdminShalter\PemberdayaanShelter\DataKelompok;

use App\Models\Anak;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Kelompok;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use App\Models\LevelAnakBinaan;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class DataKelompokShelterController extends Controller
{
    public function index()
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;

        // Ambil data admin shelter berdasarkan ID pengguna
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();

        if (!$adminShelter) {
            abort(403, 'Admin Shelter tidak ditemukan.');
        }

        // Ambil semua wilayah binaan dan shelter yang terkait dengan admin shelter yang sedang login
        $wilbins = Wilbin::with(['shelters' => function ($query) use ($adminShelter) {
                // Menyaring shelter berdasarkan id_shelter yang sesuai dengan admin shelter
                $query->where('id_shelter', $adminShelter->id_shelter)
                    ->with('kelompok'); // Memuat relasi kelompok
            }])
            ->where('id_kacab', $adminShelter->id_kacab) // Mengambil wilayah binaan berdasarkan id_kacab yang terhubung dengan admin shelter
            ->get();

        // Ambil shelter dari wilayah binaan yang sudah difilter
        $data_shelters = $wilbins->flatMap(function ($wilbin) {
            return $wilbin->shelters; // Menyusun semua shelter dari wilbin
        });

        // Debug untuk memastikan relasi dimuat dengan benar
        foreach ($data_shelters as $shelter) {
            Log::info("Shelter: {$shelter->nama_shelter}, Jumlah Kelompok: " . $shelter->kelompok->count());
        }

        // Kirim data ke view
        return view('AdminShalter.Pemberdayaan.DataKelompok.index', compact('data_shelters'));
    }

    public function show($id_shelter)
    {
        // Ambil shelter dan kelompok yang terkait dengan shelter tersebut
        $shelter = Shelter::with(['kelompok.levelAnakBinaan'])->findOrFail($id_shelter);

        // Jika shelter tidak memiliki kelompok
        if ($shelter->kelompok->isEmpty()) {
            return view('AdminShalter.Pemberdayaan.DataKelompok.show', [
                'shelter' => $shelter,
                'message' => 'Tidak ada kelompok terdaftar untuk shelter ini.'
            ]);
        }

        return view('AdminShalter.Pemberdayaan.DataKelompok.show', compact('shelter'));
    }

    public function getJumlahAnggota($id_kelompok)
    {
        $kelompok = Kelompok::findOrFail($id_kelompok);
        $jumlahAnggota = $kelompok->anak()->count();
        return response()->json(['jumlah_anggota' => $jumlahAnggota]);
    }

    public function create($id_shelter) {
        $levelAnakBinaan = LevelAnakBinaan::all();
        return view('AdminShalter.Pemberdayaan.DataKelompok.createKelompok', compact('levelAnakBinaan', 'id_shelter'));
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
    
        return redirect()->route('datakelompokshelter.show.shelter', ['id' => $id_shelter])->with('success', 'Kelompok berhasil ditambahkan');
    }

    public function edit($id_kelompok)
    {
        $kelompok = Kelompok::with('levelAnakBinaan')->findOrFail($id_kelompok);
        $levelAnakBinaan = LevelAnakBinaan::all();
        return view('AdminShalter.Pemberdayaan.DataKelompok.editKelompok', compact('kelompok', 'levelAnakBinaan'));
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

        return redirect()->route('datakelompokshelter.show.shelter', ['id' => $kelompok->id_shelter])->with('success', 'Kelompok berhasil diperbarui');
    }

    public function createanak($id_shelter, $id_kelompok) {
        // Dapatkan anak binaan yang berada di shelter saat ini dan belum memiliki kelompok
        $anakBinaan = Anak::where('id_shelter', $id_shelter)
                        ->whereNull('id_kelompok') // Hanya anak tanpa kelompok
                        ->get();

        $kelompok = Kelompok::findOrFail($id_kelompok);

        return view('AdminShalter.Pemberdayaan.DataKelompok.tambahAnggota', compact('anakBinaan', 'id_shelter', 'kelompok'));
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

        return redirect()->route('kelompok.createanak.shelter', ['id_shelter' => $id_shelter, 'id_kelompok' => $id_kelompok])
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
}
