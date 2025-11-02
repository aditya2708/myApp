<?php

namespace App\Http\Controllers\AdminCabang\PembedayaanCabang\DataBinaan\PengajuaanAnakBinaan;

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
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Models\AnakPendidikan;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class FormKeluargaCabangBaruController extends Controller
{
    public function formKeluargaBaru()
    {
        // Data admin cabang yang login
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Ambil data yang relevan dengan admin cabang yang login
        $provinsi = Provinsi::all();
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();
        $wilbins = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get(); // Ambil data wilayah binaan
        $bank = Bank::all();
    
        // Pass data ke view
        return view('AdminCabang.Pemberdayaan.DataBinaan.PengajuanAnakBinaan.FormPengajuanAnaKeluargaBaru', compact('provinsi', 'kacab', 'wilbins', 'bank'));
    }
    

        public function store(Request $request)
        {
            // dd($request->all());
            // Validasi data input
            $validatedData = $request->validate([
                // Data Keluarga
                'no_kk' => 'required|string|max:20',
                'kepala_keluarga' => 'required|string|max:255',
                'status_ortu' => 'required|string|in:yatim,piatu,"yatim piatu",dhuafa,"non dhuafa"',
                'id_kacab' => 'required|exists:kacab,id_kacab', 
                'id_wilbin' => 'required|exists:wilbin,id_wilbin', 
                'id_shelter' => 'required|exists:shelter,id_shelter',  
                'id_bank' => 'nullable|exists:bank,id_bank',
                'no_rek' => 'nullable|string|max:255',
                'an_rek' => 'nullable|string|max:255',
                'no_tlp' => 'nullable|string|max:255',
                'an_tlp' => 'nullable|string|max:255',

                // Validasi Data Pendidikan Anak
                'jenjang' => 'required|string|in:belum_sd,sd,smp,sma,perguruan_tinggi',
                'kelas' => 'nullable|string|max:255',
                'nama_sekolah' => 'nullable|string|max:255',
                'alamat_sekolah' => 'nullable|string|max:255',
                'jurusan' => 'nullable|string|max:255',
                'semester' => 'nullable|integer',
                'nama_pt' => 'nullable|string|max:255',
                'alamat_pt' => 'nullable|string|max:255',

                // Validasi data anak
                'nik_anak' => 'required|string|max:16',
                'id_shelter' => 'nullable|exists:shelter,id_shelter',
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

                // Data ayah
                'nik_ayah' => 'nullable|string|max:16',
                'nama_ayah' => 'nullable|string|max:255',
                'agama' => 'nullable|string|in:Islam,Kristen,Budha,Hindu,Konghucu', // Sesuaikan dengan field di tabel
                'tempat_lahir' => 'nullable|string|max:255',
                'tanggal_lahir' => 'nullable|date',
                'alamat' => 'nullable|string',
                'id_prov' => 'nullable|string|max:2',
                'id_kab' => 'nullable|string|max:4',
                'id_kec' => 'nullable|string|max:6',
                'id_kel' => 'nullable|string|max:10',
                'penghasilan' => 'nullable|string|in:dibawah_500k,500k_1500k,1500k_2500k,2500k_3500k,3500k_5000k,5000k_7000k,7000k_10000k,diatas_10000k',
                'tanggal_kematian' => 'nullable|date',
                'penyebab_kematian' => 'nullable|string|max:255',

                // Data Ibu
                'nik_ibu' => 'nullable|string|max:16',
                'nama_ibu' => 'nullable|string|max:255',
                'agama' => 'nullable|string|in:Islam,Kristen,Budha,Hindu,Konghucu',
                'tempat_lahir' => 'nullable|string|max:255',
                'tanggal_lahir' => 'nullable|date',
                'alamat' => 'nullable|string',
                'id_prov' => 'nullable|string|max:2',
                'id_kab' => 'nullable|string|max:4',
                'id_kec' => 'nullable|string|max:6',
                'id_kel' => 'nullable|string|max:10',
                'penghasilan' => 'nullable|string|in:dibawah_500k,500k_1500k,1500k_2500k,2500k_3500k,3500k_5000k,5000k_7000k,7000k_10000k,diatas_10000k',
                'tanggal_kematian' => 'nullable|date',
                'penyebab_kematian' => 'nullable|string|max:255',

                // Data Wali
                'nik_wali' => 'nullable|string|max:16',
                'nama_wali' => 'nullable|string|max:255',
                'agama' => 'nullable|string|in:Islam,Kristen,Budha,Hindu,Konghucu',
                'tempat_lahir' => 'nullable|string|max:255',
                'tanggal_lahir' => 'nullable|date',
                'id_prov' => 'nullable|string|max:2',
                'id_kab' => 'nullable|string|max:4',
                'id_kec' => 'nullable|string|max:6',
                'id_kel' => 'nullable|string|max:10',
                'penghasilan' => 'nullable|string|in:dibawah_500k,500k_1500k,1500k_2500k,2500k_3500k,3500k_5000k,5000k_7000k,7000k_10000k,diatas_10000k',
                'hub_kerabat' => 'nullable|string|in:Kakak,Saudara dari Ayah,Saudara dari Ibu,Tidak Ada Hubungan Keluarga',

            ]);

            // Pastikan admin cabang hanya menyimpan data di cabang yang sesuai
            $user_id = auth()->user()->id_users;
            $adminCabang = AdminCabang::where('user_id', $user_id)->first();

            if (!$adminCabang || $adminCabang->id_kacab != $request->id_kacab) {
                abort(403, 'Anda tidak diizinkan untuk menyimpan data di cabang ini.');
            }

            try {
                DB::beginTransaction();

                // Set nilai bank dan telepon menjadi null jika user memilih "No"
                if ($request->input('telp_choice') == 'no') {
                    $request->merge([
                        'no_telp' => null,
                        'an_tlp' => null,
                    ]);
                }

                if ($request->input('bank_choice') == 'no') {
                    $request->merge([
                        'id_bank' => null,
                        'no_rek' => null,
                        'an_rek' => null,
                    ]);
                }

                // Simpan data keluarga
                $keluarga = Keluarga::create([
                    'no_kk' => $request->no_kk,
                    'kepala_keluarga' => $request->kepala_keluarga,
                    'status_ortu' => $request->status_ortu,
                    'id_kacab' => $request->id_kacab,
                    'id_wilbin' => $request->id_wilbin,
                    'id_shelter' => $request->id_shelter,
                    'id_bank' => $request->id_bank,
                    'no_rek' => $request->no_rek,
                    'an_rek' => $request->an_rek,
                    'no_tlp' => $request->no_telp,
                    'an_tlp' => $request->an_tlp,
                ]);

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
                    'id_keluarga' => $keluarga->id_keluarga,  // Relasi dengan data keluarga yang baru disimpan
                    'id_anak_pend' => $pendidikan->id_anak_pend, // Tambahkan ini
                    'id_kelompok' => $keluarga->id_kelompok,
                    'id_shelter' => $keluarga->id_shelter,    // Pastikan Anda memasukkan nilai id_shelter di sini
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
                    'status_validasi' => Anak::STATUS_TIDAK_AKTIF, // Set default status
                ]);


                // Upload foto jika ada
                if ($request->hasFile('foto')) {
                    $folderPath = 'Anak/' . $anak->id_anak; // Path berdasarkan ID anak
                    $fileName = $request->file('foto')->getClientOriginalName(); // Nama asli file
                    $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public'); // Simpan file
                
                    // Simpan path relatif ke database
                    $anak->update(['foto' => $fileName]);
                }

                $ayah = Ayah::create([
                    'id_keluarga' => $keluarga->id_keluarga,
                    'nik_ayah' => $request->nik_ayah ?? '',  
                    'nama_ayah' => $request->nama_ayah ?? '',  
                    'agama' => $request->agama_ayah ?? '',
                    'tempat_lahir' => $request->tempat_lahir_ayah ?? '',
                    'tanggal_lahir' => $request->tanggal_lahir_ayah ?? '',
                    'alamat' => $request->alamat_ayah ?? '',
                    'id_prov' => $request->id_prov_ayah ?? null, // Set ke null jika tidak ada input valid
                    'id_kab' => $request->id_kab_ayah ?? null,  // Set ke null jika tidak ada input valid
                    'id_kec' => $request->id_kec_ayah ?? null,
                    'id_kel' => $request->id_kel_ayah ?? null,
                    'penghasilan' => $request->penghasilan_ayah ? $request->penghasilan_ayah : null, 
                    'tanggal_kematian' => $request->tanggal_kematian_ayah ?? null,
                    'penyebab_kematian' => $request->penyebab_kematian_ayah ?? '',
                ]);

                $ibu = Ibu::create([
                    'id_keluarga' => $keluarga->id_keluarga,
                    'nik_ibu' => $request->nik_ibu ?? '',  
                    'nama_ibu' => $request->nama_ibu ?? '',  
                    'agama' => $request->agama_ibu ?? '',
                    'tempat_lahir' => $request->tempat_lahir_ibu ?? '',
                    'tanggal_lahir' => $request->tanggal_lahir_ibu ?? '',
                    'alamat' => $request->alamat_ibu ?? '',
                    'id_prov' => $request->id_prov_ibu ?? null, // Set ke null jika tidak ada input valid
                    'id_kab' => $request->id_kab_ibu ?? null,  // Set ke null jika tidak ada input valid
                    'id_kec' => $request->id_kec_ibu ?? null,
                    'id_kel' => $request->id_kel_ibu ?? null,
                    'penghasilan' => $request->penghasilan_ibu ? $request->penghasilan_ibu : null, 
                    'tanggal_kematian' => $request->tanggal_kematian_ibu ?? null,
                    'penyebab_kematian' => $request->penyebab_kematian_ibu ?? '',
                ]);

                $wali = Wali::create([
                    'id_keluarga' => $keluarga->id_keluarga,
                    'nik_wali' => $request->nik_wali ?? '',  
                    'nama_wali' => $request->nama_wali ?? '',  
                    'agama' => $request->agama_wali ?? '',
                    'tempat_lahir' => $request->tempat_lahir_wali ?? '',
                    'tanggal_lahir' => $request->tanggal_lahir_wali ?? null,
                    'alamat' => $request->alamat_wali ?? '',
                    'id_prov' => $request->id_prov_wali ?? null, // Set ke null jika tidak ada input valid
                    'id_kab' => $request->id_kab_wali ?? null,  // Set ke null jika tidak ada input valid
                    'id_kec' => $request->id_kec_wali ?? null,
                    'id_kel' => $request->id_kel_wali ?? null,
                    'penghasilan' => $request->penghasilan_wali ? $request->penghasilan_wali : null, 
                    'hub_kerabat' => $request->hub_kerabat_wali,
                ]);
                        

            DB::commit();
            return redirect()->route('form_keluarga_baru.cabang')->with('success', 'Data Pengajuan Anak Binaan Berhasil Ditambahkan.');
        } catch (\Exception $e) {
            DB::rollback();
            return back()->withErrors(['msg' => 'Error: ' . $e->getMessage()]);
        }
    }
}
