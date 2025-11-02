<?php

namespace App\Http\Controllers\AdminCabang\PembedayaanCabang\DataBinaan\DataCalonAnakBinaan;

use App\Models\Anak;
use App\Models\Keluarga;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Models\AnakPendidikan;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class DataCalonAnakBinaanCabangController extends Controller
{
    public function index()
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
    
        // Cari admin cabang yang sesuai dengan ID pengguna
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Ambil data anak berdasarkan cabang admin
        $data_anak = Anak::with('keluarga', 'shelter')
            ->whereHas('keluarga', function ($query) use ($adminCabang) {
                $query->where('id_kacab', $adminCabang->id_kacab);
            })
            ->where(function ($query) {
                $query->where('status_validasi', Anak::STATUS_TIDAK_AKTIF)
                    ->orWhere('status_validasi', Anak::STATUS_DITANGGUHKAN)
                    ->orWhere('status_validasi', Anak::STATUS_DITOLAK)
                    ->orWhereNull('status_validasi'); // Anak yang belum pernah divalidasi
            })
            ->get();
    
        return view('AdminCabang.Pemberdayaan.DataBinaan.DataCalonAnakBinaan.index', compact('data_anak'));
    }
    

    public function aktivasicalonanakbinaanshow($id) {
        $anak = Anak::with(['keluarga.ayah', 'keluarga.ibu', 'shelter'])
                ->findOrFail($id);

        $tab = request()->get('tab', 'data-anakaktivasi');

        return view('AdminCabang.Pemberdayaan.DataBinaan.DataCalonAnakBinaan.AktifDataCalonAnak.AktivCalonAnak', compact('anak'));
    }

    public function activasi(Request $request, $id ) {
        $anak = Anak::findOrFail($id);
    
        // Cek pilihan user dari request, apakah 'aktifkan', 'tolak', atau 'tangguhkan'
        $status_validasi = $request->input('status_validasi');
    
        if ($status_validasi == 'aktif') {
            // Set status validasi ke "Aktif"
            $anak->status_validasi = Anak::STATUS_AKTIF;
    
            // Set status CPB sesuai dengan jenis anak binaan
            if ($anak->jenis_anak_binaan == 'BPCB') {
                $anak->status_cpb = Anak::STATUS_CPB_BCPB;
            } elseif ($anak->jenis_anak_binaan == 'NPB') {
                $anak->status_cpb = Anak::STATUS_CPB_NPB;
            }
    
            // Simpan perubahan
            $anak->save();
    
            // Redirect ke halaman Anak Binaan
            return redirect()->route('AnakBinaan.cabang')
                             ->with('success', 'Status validasi anak berhasil diaktifkan.');
        } elseif ($status_validasi == 'tolak') {
            // Set status validasi ke "Ditolak"
            $anak->status_validasi = Anak::STATUS_DITOLAK;
        } elseif ($status_validasi == 'tangguhkan') {
            // Set status validasi ke "Ditangguhkan"
            $anak->status_validasi = Anak::STATUS_DITANGGUHKAN;
        }
    
        // Simpan status validasi baru
        $anak->save();
    
        // Redirect ke halaman Calon Anak Binaan jika statusnya ditolak atau ditangguhkan
        return redirect()->route('calonAnakBinaan.cabang')
                         ->with('success', 'Status validasi anak berhasil diubah.');
    }
    
    public function show($id_anak)
    {
        // Ambil data anak beserta relasi keluarga, ayah, ibu, wali, pendidikan, dan shelter
        $anak = Anak::with(['keluarga.ayah', 'keluarga.ibu', 'keluarga.wali', 'anakPendidikan', 'shelter'])
                    ->findOrFail($id_anak);

        // Tentukan tab yang akan di-load
        $tab = request()->get('tab', 'data-anak');

        // Tampilkan halaman show dengan tab yang sesuai
        return view('AdminCabang.Pemberdayaan.DataBinaan.DataCalonAnakBinaan.show', compact('anak', 'tab'));
    }

     /* Data Edit Di Calon Anak Binaan */
    // Menampilkan form edit data anak
    public function editcalonanakbinaan($id)
    {
        $anak = Anak::with('keluarga')->findOrFail($id); // Mengambil data anak beserta keluarga
        $daftarKeluarga = Keluarga::all(); // Mengambil seluruh data keluarga untuk dropdown ganti keluarga

        return view('AdminCabang.Pemberdayaan.DataBinaan.DataCalonAnakBinaan.DataAnakEdit.Anakedit', compact('anak', 'daftarKeluarga'));
    }

    // Menyimpan proses update data anak
    public function editprosesscalonanakbinaan(Request $request, $id)
    {
        $request->validate([
            'nik_anak' => 'required|string|max:16',
            'anak_ke' => 'required|integer',
            'dari_bersaudara' => 'required|integer',
            'nick_name' => 'required|string|max:255',
            'full_name' => 'required|string|max:255',
            'agama' => 'required|string|in:Islam,Kristen,Budha,Hindu,Konghucu',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|string|in:Laki-laki,Perempuan',
            'tinggal_bersama' => 'required|string|in:Ayah,Wali',
            'jenis_anak_binaan' => 'required|string|in:BPCB,NPB',
            'pelajaran_favorit' => 'nullable|string|max:255',
            'prestasi' => 'nullable|string|max:255',
            'jarak_rumah' => 'nullable|integer',
            'transportasi' => 'required|string|in:jalan_kaki,sepeda,sepeda_motor,angkutan_umum,diantar_orang_tua_wali,lainnya',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'id_keluarga' => 'required|exists:keluarga,id_keluarga', // Validasi No Keluarga
        ]);

        // Temukan data anak
        $anak = Anak::findOrFail($id);

        // Update data anak
        $anak->update([
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
            'pelajaran_favorit' => $request->pelajaran_favorit,
            'prestasi' => $request->prestasi,
            'jarak_rumah' => $request->jarak_rumah,
            'transportasi' => $request->transportasi,
            'id_keluarga' => $request->id_keluarga, // Update No Keluarga
        ]);

        // Cek jika ada foto baru yang diunggah
        if ($request->hasFile('foto')) {
            // Hapus foto lama jika ada
            if ($anak->foto) {
                Storage::disk('public')->delete($anak->foto);
            }
            // Upload foto baru
            $fotoPath = $request->file('foto')->store('Anak/DataFoto', 'public');
            $anak->update(['foto' => $fotoPath]);
        }

        // Redirect kembali dengan pesan sukses
        return redirect()->route('calonAnakBinaan.show.cabang', $anak->id_anak)
                         ->with('success', 'Data anak berhasil diperbarui.');
    }

    // Data Pendidikan Anak
    public function editPendidikanAnakBinaan($id) {
        $anak = Anak::with('anakPendidikan')->findOrFail($id); // Mengambil data anak beserta pendidikan
        return view('AdminCabang.Pemberdayaan.DataBinaan.DataCalonAnakBinaan.DataPendidikanAnak.AnakPendidikanEdit', compact('anak'));
    }

    public function editprosesspendidikananakbinaan(Request $request, $id)
    {
        $request->validate([
            'jenjang' => 'required|string|in:belum_sd,sd,smp,sma,perguruan_tinggi',
            'kelas' => 'nullable|string|max:255',
            'nama_sekolah' => 'nullable|string|max:255',
            'alamat_sekolah' => 'nullable|string|max:255',
            'jurusan' => 'nullable|string|max:255',
            'semester' => 'nullable|integer',
            'nama_pt' => 'nullable|string|max:255',
            'alamat_pt' => 'nullable|string|max:255',
        ]);
        
        // Temukan data pendidikan anak berdasarkan id_anak_pend
        $pendidikan = AnakPendidikan::where('id_anak_pend', $id)->firstOrFail();

        // Temukan data anak untuk mendapatkan id_anak
        $anak = Anak::where('id_anak_pend', $pendidikan->id_anak_pend)->firstOrFail();

        // Update data pendidikan anak, dan kosongkan field jika jenjang tertentu dipilih
        if ($request->jenjang == 'belum_sd') {
            $pendidikan->update([
                'jenjang' => $request->jenjang,
                'kelas' => null,
                'nama_sekolah' => null,
                'alamat_sekolah' => null,
                'jurusan' => null,
                'semester' => null,
                'nama_pt' => null,
                'alamat_pt' => null,
            ]);
        } elseif ($request->jenjang == 'sd' || $request->jenjang == 'smp' || $request->jenjang == 'sma') {
            $pendidikan->update([
                'jenjang' => $request->jenjang,
                'kelas' => $request->kelas,
                'nama_sekolah' => $request->nama_sekolah,
                'alamat_sekolah' => $request->alamat_sekolah,
                'jurusan' => null,
                'semester' => null,
                'nama_pt' => null,
                'alamat_pt' => null,
            ]);
        } elseif ($request->jenjang == 'perguruan_tinggi') {
            $pendidikan->update([
                'jenjang' => $request->jenjang,
                'kelas' => null,
                'nama_sekolah' => null,
                'alamat_sekolah' => null,
                'jurusan' => $request->jurusan,
                'semester' => $request->semester,
                'nama_pt' => $request->nama_pt,
                'alamat_pt' => $request->alamat_pt,
            ]);
        }

        // Redirect kembali dengan pesan sukses ke tab 'anak-pendidikan'
        return redirect()->route('calonAnakBinaan.show.cabang', ['id' => $anak->id_anak, 'tab' => 'anak-pendidikan'])
                        ->with('success', 'Data pendidikan anak berhasil diperbarui.');
    } 

    public function destroy(Request $request, $id_anak)
    {
        // Temukan data Anak berdasarkan id
        $anak = Anak::findOrFail($id_anak);

        // Jika anak memiliki foto, hapus foto dari storage
        if ($anak->foto) {
            Storage::disk('public')->delete($anak->foto);
        }

        // Hapus data anak
        $anak->delete();

        // Ambil halaman saat ini dari request
        $currentPage = $request->input('current_page', 0);

        // Redirect ke halaman Calon Anak Binaan dengan pesan sukses
        return redirect()->route('calonAnakBinaan.cabang', ['page' => $currentPage])
                         ->with('success', 'Data Calon Anak Binaan berhasil dihapus')
                         ->with('currentPage', $currentPage);
    }

}
