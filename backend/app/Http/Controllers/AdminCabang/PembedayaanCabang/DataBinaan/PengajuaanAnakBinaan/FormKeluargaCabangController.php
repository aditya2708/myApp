<?php

namespace App\Http\Controllers\AdminCabang\PembedayaanCabang\DataBinaan\PengajuaanAnakBinaan;

use App\Models\Anak;
use App\Models\Keluarga;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Models\AnakPendidikan;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class FormKeluargaCabangController extends Controller
{
    public function pengajuananak()
    {
         // Data admin cabang yang login
         $user_id = auth()->user()->id_users;
         $adminCabang = AdminCabang::where('user_id', $user_id)->first();
     
         if (!$adminCabang) {
             abort(403, 'Admin cabang tidak ditemukan.');
         }

        // Tampilkan halaman form input No. KK
        return view('AdminCabang.Pemberdayaan.DataBinaan.PengajuanAnakBinaan.FormPengajuanAnakKeluarga');
    }

    public function getKkByCabang(Request $request)
    {
        // Ambil admin cabang yang login
        $adminCabang = auth()->user()->adminCabang;

        if (!$adminCabang) {
            return response()->json(['message' => 'Admin cabang tidak ditemukan.'], 404);
        }

        // Ambil ID cabang dari admin cabang
        $cabang_id = $adminCabang->id_kacab;

        // Debugging log
        Log::info('Cabang ID:', ['id_kacab' => $cabang_id]);

        // Query data keluarga berdasarkan cabang dan pencarian
        $keluarga = Keluarga::where('id_kacab', $cabang_id)
            ->where('no_kk', 'like', '%' . $request->search . '%')
            ->get(['no_kk', 'kepala_keluarga']);

        if ($keluarga->isEmpty()) {
            Log::info('Tidak ada data keluarga untuk cabang:', ['id_kacab' => $cabang_id]);
        }

        return response()->json($keluarga);
    }

    public function validasikk(Request $request)
    {
        // Validasi input
        $request->validate([
            'no_kk' => 'required|string|max:20',
        ]);

        // Cari keluarga berdasarkan nomor KK
        $keluarga = Keluarga::where('no_kk', $request->no_kk)->first();

        if ($keluarga) {
            return response()->json([
                'status' => 'success',
                'message' => 'Keluarga ditemukan!',
                'keluarga' => $keluarga,
            ]);
        } else {
            return response()->json([
                'status' => 'error',
                'message' => 'Nomor KK tidak ditemukan, silakan ajukan keluarga baru.',
                'redirect' => route('form_keluarga_baru.cabang'),
            ]);
        }
    }

    public function pengajuananakstore(Request $request)
    {
        // Validasi data yang diterima dari form
        $request->validate([
            'no_kk' => 'required|string|max:20', // Pastikan nomor KK ada untuk mencari keluarga
            'jenjang' => 'required|string|in:belum_sd,sd,smp,sma,perguruan_tinggi',
            'kelas' => 'nullable|string|max:255',
            'nama_sekolah' => 'nullable|string|max:255',
            'alamat_sekolah' => 'nullable|string|max:255',
            'jurusan' => 'nullable|string|max:255',
            'semester' => 'nullable|integer',
            'nama_pt' => 'nullable|string|max:255',
            'alamat_pt' => 'nullable|string|max:255',
            'id_shelter' => 'nullable|exists:shelter,id_shelter',
            'nik_anak' => 'required|string|max:16',
            'anak_ke' => 'required|integer',
            'dari_bersaudara' => 'required|integer',
            'nick_name' => 'required|string|max:255',
            'full_name' => 'required|string|max:255',
            'agama' => 'required|string|in:Islam,Kristen,Budha,Hindu,Konghucu',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|string|in:Laki-laki,Perempuan',
            'tinggal_bersama' => 'required|string|in:Ayah,Ibu,Wali',
            'jenis_anak_binaan' => 'required|string|in:BPCB,NPB',
            'hafalan' => 'required|string|in:Tahfidz,Non-Tahfidz',
            'pelajaran_favorit' => 'nullable|string|max:255',
            'prestasi' => 'nullable|string|max:255',
            'jarak_rumah' => 'nullable|string|regex:/^\d+(\.\d{1,2})?$/',
            'transportasi' => 'required|string|in:jalan_kaki,sepeda,sepeda_motor,angkutan_umum,diantar_orang_tua_wali,lainnya',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // Cek apakah keluarga ditemukan berdasarkan nomor KK
        $keluarga = Keluarga::where('no_kk', $request->no_kk)->first();

        if (!$keluarga) {
            // Keluarga tidak ditemukan, kembali dengan pesan error
            return redirect()->back()->with('error', 'Keluarga dengan nomor KK tersebut tidak ditemukan.');
        }

        // Simpan data pendidikan anak
        $pendidikan = AnakPendidikan::create([
            'id_keluarga' => $keluarga->id_keluarga,
            'jenjang' => $request->jenjang,
            'kelas' => $request->kelas,
            'nama_sekolah' => $request->nama_sekolah,
            'alamat_sekolah' => $request->alamat_sekolah,
            'jurusan' => $request->jurusan,
            'semester' => $request->semester,
            'nama_pt' => $request->nama_pt,
            'alamat_pt' => $request->alamat_pt,
        ]);

        // Simpan data anak
        $anak = Anak::create([
            'id_keluarga' => $keluarga->id_keluarga,
            'id_anak_pend' => $pendidikan->id_anak_pend, 
            'id_kelompok' => $keluarga->id_kelompok,
            'id_shelter' => $keluarga->id_shelter, 
            'nik_anak' => $request->nik_anak,
            'anak_ke' => $request->anak_ke,
            'dari_bersaudara' => $request->dari_bersaudara,
            'nick_name' => $request->nick_name,
            'full_name' => $request->full_name,
            'agama' => $request->agama,
            'tempat_lahir' => $request->tempat_lahir,
            'tanggal_lahir' => $request->tanggal_lahir,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tinggal_bersama' => $request->tinggal_bersama,
            'jenis_anak_binaan' => $request->jenis_anak_binaan,
            'hafalan' => $request->hafalan,
            'pelajaran_favorit' => $request->pelajaran_favorit,
            'prestasi' => $request->prestasi,
            'jarak_rumah' => $request->jarak_rumah,
            'hobi' => $request->hobi,
            'transportasi' => $request->transportasi,
            'status_validasi' => Anak::STATUS_TIDAK_AKTIF, 
        ]);

        // Upload foto jika ada
        if ($request->hasFile('foto')) {
            $folderPath = 'Anak/' . $anak->id_anak; // Path berdasarkan ID anak
            $fileName = $request->file('foto')->getClientOriginalName(); // Nama asli file
            $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public'); // Simpan file
        
            // Simpan path relatif ke database
            $anak->update(['foto' => $fileName]);
        }

        return redirect()->route('ajukan_anak.cabang')->with('success', 'Data anak berhasil disimpan!');
    }
}
