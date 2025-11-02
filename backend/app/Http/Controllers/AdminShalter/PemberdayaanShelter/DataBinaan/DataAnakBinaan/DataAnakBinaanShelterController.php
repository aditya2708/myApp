<?php

namespace App\Http\Controllers\AdminShalter\PemberdayaanShelter\DataBinaan\DataAnakBinaan;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Keluarga;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use App\Models\AnakPendidikan;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class DataAnakBinaanShelterController extends Controller
{
    public function index(Request $request)
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
    
        // Ambil Admin Shelter berdasarkan User
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();
    
        if (!$adminShelter) {
            abort(403, 'Admin shelter tidak ditemukan.');
        }
    
        // Query dasar untuk anak yang status_validasi aktif dan sesuai dengan admin shelter
        $query = Anak::where('status_validasi', Anak::STATUS_AKTIF)
            ->with('keluarga') // Eager load keluarga
            ->whereHas('keluarga', function ($q) use ($adminShelter) {
                $q->where('id_kacab', $adminShelter->id_kacab); // Filter berdasarkan id_kacab
            })
            ->where('id_shelter', $adminShelter->id_shelter); // Filter berdasarkan id_shelter yang terkait dengan admin shelter
    
        // Jika ada filter tambahan dari request (misal berdasarkan wilbin atau lainnya)
        if ($request->has('wilbin_id')) {
            $query->whereHas('keluarga', function ($q) use ($request) {
                $q->where('id_wilbin', $request->get('wilbin_id'));
            });
        }
    
        // Ambil data anak yang sudah difilter
        $data_anak = $query->get();
    
        // Ambil data untuk dropdown filter: Kacab dan Wilbin yang relevan dengan admin shelter yang login
        $kacab = Kacab::where('id_kacab', $adminShelter->id_kacab)->get();
        $wilbins = Wilbin::where('id_kacab', $adminShelter->id_kacab)->get();
    
        // Kembalikan data ke view
        return view('AdminShalter.Pemberdayaan.DataBinaan.DataAnakBinaan.index', compact('data_anak', 'kacab', 'wilbins'));
    }

    public function getAnakBinaanAjax(Request $request)
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
    
        // Ambil Admin Shelter berdasarkan User
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();
    
        if (!$adminShelter) {
            abort(403, 'Admin shelter tidak ditemukan.');
        }

        $query = Anak::where('status_validasi', Anak::STATUS_AKTIF)
            ->with('keluarga') // Eager load keluarga
            ->whereHas('keluarga', function ($q) use ($adminShelter) {
                $q->where('id_kacab', $adminShelter->id_kacab); // Filter berdasarkan id_kacab
            })
        ->where('id_shelter', $adminShelter->id_shelter);

        // Filter berdasarkan kolom
        if ($request->filled('no')) {
            $query->where('id_anak', $request->no);
        }
        if ($request->filled('nama')) {
            $query->where('full_name', 'like', '%' . $request->nama . '%');
        }
        if ($request->filled('agama')) {
            $query->where('agama', 'like', '%' . $request->agama . '%');
        }
        if ($request->filled('jenis_kelamin')) {
            $query->where('jenis_kelamin', $request->jenis_kelamin);
        }
        if ($request->filled('kepala_keluarga')) {
            $query->whereHas('keluarga', function ($q) use ($request) {
                $q->where('kepala_keluarga', 'like', '%' . $request->kepala_keluarga . '%');
            });
        }
        if ($request->filled('status_binaan')) {
            $query->where('status_cpb', 'like', '%' . $request->status_binaan . '%');
        }
            
        // Filter berdasarkan Kacab, Wilayah Binaan, dan Shelter
        if ($request->has('id_kacab') && $request->id_kacab != '') {
            $query->whereHas('keluarga', function ($q) use ($request) {
                $q->where('id_kacab', $request->id_kacab);
            });
        }

        if ($request->has('id_wilbin') && $request->id_wilbin != '') {
            $query->whereHas('keluarga', function ($q) use ($request) {
                $q->where('id_wilbin', $request->id_wilbin);
            });
        }

        if ($request->has('id_shelter') && $request->id_shelter != '') {
            $query->whereHas('keluarga', function ($q) use ($request) {
                $q->where('id_shelter', $request->id_shelter);
            });
        }

        // Total data sebelum filtering
        $totalData = $query->count();

        // Pencarian
        if ($request->filled('search.value')) {
            $searchValue = $request->input('search.value');
            $query->where('full_name', 'like', "%{$searchValue}%");
        }

        // Total data setelah filtering
        $totalFiltered = $query->count();

        // Sorting dan Pagination
        $sortColumnIndex = $request->input('order.0.column');
        $sortColumnName = $request->input("columns.$sortColumnIndex.data", 'id_anak');
        $sortDirection = $request->input('order.0.dir', 'asc');

        if ($sortColumnName !== 'DT_RowIndex') {
            $query->orderBy($sortColumnName, $sortDirection);
        }

        $query->skip($request->input('start'))->take($request->input('length'));

        // Data Mapping
        $data = $query->get()->map(function ($anak, $index) use ($request) {
            // $editUrl = route('editAnakBinaan.cabang', $anak->id_anak);
            $showUrl = route('AnakBinaan.show.shelter', $anak->id_anak);
            $deleteAction = "confirmDelete('{$anak->full_name}', {$anak->id_anak})";
            $nonaktifAction = route('anak.nonactivasi.shelter', $anak->id_anak);

            return [
                'DT_RowIndex' => $request->input('start') + $index + 1,
                'nama' => $anak->full_name,
                'agama' => $anak->agama,
                'jenis_kelamin' => $anak->jenis_kelamin,
                'kepala_keluarga' => $anak->keluarga->kepala_keluarga ?? 'null',
                'status_binaan' => $anak->status_cpb ?? '-',
                'aksi' => '
                    <div class="action-buttons" style="display: flex; gap: 8px; align-items: center;">
                        <a href="' . $showUrl . '" class="btn btn-link btn-info btn-lg">
                            <i class="fa fa-eye"></i>
                        </a>
                        <form action="' . $nonaktifAction . '" method="POST" style="display: inline;">
                            ' . csrf_field() . method_field('PATCH') . '
                            <button type="submit" class="btn btn-link btn-danger btn-lg">
                                <i class="fa fa-times"></i> Non Aktifkan
                            </button>
                        </form>
                        <button type="button" class="btn btn-link btn-danger" onclick="' . $deleteAction . '">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                ',
            ];
        });

        return response()->json([
            'draw' => intval($request->input('draw')),
            'recordsTotal' => $totalData,
            'recordsFiltered' => $totalFiltered,
            'data' => $data,
        ]);
    }

    public function show($id_anak) {
        // Ambil data anak beserta relasi keluarga, pendidikan, dan shelter
        $anak = Anak::with(['keluarga', 'anakPendidikan', 'shelter'])
        ->findOrFail($id_anak);

       // Tentukan tab yang akan di-load
       $tab = request()->get('tab', 'data-anak');

       // Tampilkan halaman show dengan tab yang sesuai
       return view('AdminShalter.Pemberdayaan.DataBinaan.DataAnakBinaan.show', compact('anak', 'tab'));
   }

   public function nonactivasi($id)
   {
       $anak = Anak::findOrFail($id);
   
       // Update status validasi menjadi "Tidak Aktif" menggunakan konstanta
       $anak->status_validasi = Anak::STATUS_NON_AKTIF;
       $anak->save();
   
       // Redirect ke halaman "Data Anak Non Binaan" setelah non-aktivasi
       return redirect()->route('NonAnakBinaan.shelter')->with('success', 'Status validasi anak berhasil dinonaktifkan.');
   }

   public function editanakbinaanShelter($id)
   {
       $anak = Anak::with('keluarga')->findOrFail($id); // Mengambil data anak beserta keluarga
       $daftarKeluarga = Keluarga::all(); // Mengambil seluruh data keluarga untuk dropdown ganti keluarga

       return view('AdminShalter.Pemberdayaan.DataBinaan.DataAnakBinaan.DataAnakEditBinaan.AnakBinaanEdit', compact('anak', 'daftarKeluarga'));
   }

   // Menyimpan proses update data anak
   public function editprosessanakbinaanShelter(Request $request, $id)
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
           'tinggal_bersama' => 'required|string|in:Ayah,Wali,Ibu',
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
       return redirect()->route('AnakBinaan.show.shelter', $anak->id_anak)
                        ->with('success', 'Data anak berhasil diperbarui.');
   }

    // Data Pendidikan Anak
    public function editPendidikanAnakShelter($id) {
       $anak = Anak::with('anakPendidikan')->findOrFail($id); // Mengambil data anak beserta pendidikan
       return view('AdminShalter.Pemberdayaan.DataBinaan.DataAnakBinaan.DataPendidikanAnakEdit.DataPendidikanBinaanEdit', compact('anak'));
   }

   public function editprosesspendidikananakShelter(Request $request, $id)
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
       return redirect()->route('AnakBinaan.show.shelter', ['id' => $anak->id_anak, 'tab' => 'anak-pendidikan'])
                       ->with('success', 'Data pendidikan anak berhasil diperbarui.');
   } 

   public function destroy($id)
    {
        try {
            // Temukan data Anak berdasarkan ID
            $anak = Anak::findOrFail($id);
    
            // Jika anak memiliki foto, hapus foto dari storage
            if ($anak->foto) {
                Storage::disk('public')->delete($anak->foto);
            }
    
            // Hapus data anak
            $anak->delete();
    
            return response()->json(['message' => 'Data Anak Binaan berhasil dihapus.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan saat menghapus data.'], 500);
        }
    }
}
