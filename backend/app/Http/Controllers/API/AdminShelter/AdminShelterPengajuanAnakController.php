<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\Keluarga;
use App\Models\Anak;
use App\Models\AnakPendidikan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class AdminShelterPengajuanAnakController extends Controller
{
    /**
     * Get priority families (families without children) in the same shelter
     */
    public function getPriorityFamilies(Request $request)
    {
        // Get admin's shelter ID from authenticated user
        $shelterId = auth()->user()->adminShelter->id_shelter;
        
        if (!$shelterId) {
            return response()->json([
                'success' => false,
                'message' => 'Admin shelter not found or not associated with any shelter'
            ], 400);
        }
        
        // Get families without children, sorted by newest registration
        $priorityFamilies = Keluarga::where('id_shelter', $shelterId)
            ->whereDoesntHave('anak')
            ->select(['id_keluarga', 'no_kk', 'kepala_keluarga', 'created_at'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($keluarga) {
                return [
                    'id_keluarga' => $keluarga->id_keluarga,
                    'no_kk' => $keluarga->no_kk,
                    'kepala_keluarga' => $keluarga->kepala_keluarga,
                    'is_priority' => true,
                    'child_count' => 0,
                    'created_at' => $keluarga->created_at
                ];
            });
        
        return response()->json([
            'success' => true,
            'data' => $priorityFamilies
        ]);
    }

    /**
     * Search for family by KK number
     */
    public function searchKeluarga(Request $request)
    {
        $search = $request->query('search', '');
        
        // Get admin's shelter ID from authenticated user
        $shelterId = auth()->user()->adminShelter->id_shelter;
        
        // Ambil data keluarga berdasarkan pencarian no_kk dan filter shelter admin yang login
        $keluarga = Keluarga::where('no_kk', 'like', '%' . $search . '%')
                           ->where('id_shelter', $shelterId)
                           ->select(['id_keluarga', 'no_kk', 'kepala_keluarga'])
                           ->get();
        
        return response()->json([
            'success' => true,
            'data' => $keluarga
        ]);
    }
    
    /**
     * Validate if KK number exists
     */
    public function validateKK(Request $request)
    {
        // Validasi input
        $validator = Validator::make($request->all(), [
            'no_kk' => 'required|string|max:20',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Cari keluarga berdasarkan nomor KK
        $keluarga = Keluarga::where('no_kk', $request->no_kk)
                           ->with(['shelter', 'wilbin', 'kacab'])
                           ->first();
        
        if ($keluarga) {
            return response()->json([
                'success' => true,
                'message' => 'Keluarga ditemukan!',
                'keluarga' => $keluarga,
            ]);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Nomor KK tidak ditemukan, silakan ajukan keluarga baru.',
            ], 404);
        }
    }
    
    /**
     * Submit new child with existing KK
     */
    public function submitAnak(Request $request)
    {
        // Validasi data yang diterima dari form
        $validator = Validator::make($request->all(), [
            'no_kk' => 'required|string|max:20',
            'jenjang' => 'required|string|in:belum_sd,sd,smp,sma,perguruan_tinggi',
            'kelas' => 'nullable|string|max:255',
            'nama_sekolah' => 'nullable|string|max:255',
            'alamat_sekolah' => 'nullable|string|max:255',
            'jurusan' => 'nullable|string|max:255',
            'semester' => 'nullable|integer',
            'nama_pt' => 'nullable|string|max:255',
            'alamat_pt' => 'nullable|string|max:255',
            'nik_anak' => 'required|string|max:16',
            'anak_ke' => 'required|integer',
            'dari_bersaudara' => 'required|integer',
            'nick_name' => 'required|string|max:255',
            'full_name' => 'required|string|max:255',
            'agama' => 'required|string|in:Islam,Kristen,Katolik,Buddha,Hindu,Konghucu',
            'tempat_lahir' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|string|in:Laki-laki,Perempuan',
            'tinggal_bersama' => 'required|string|in:Ayah,Ibu,Ayah dan Ibu,Wali',
            'hafalan' => 'required|string|in:Tahfidz,Non-Tahfidz',
            'pelajaran_favorit' => 'nullable|string|max:255',
            'prestasi' => 'nullable|string|max:255',
            'jarak_rumah' => 'nullable|numeric',
            'hobi' => 'nullable|string|max:255',
            'transportasi' => 'required|string',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation Error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Cek apakah keluarga ditemukan berdasarkan nomor KK
        $keluarga = Keluarga::where('no_kk', $request->no_kk)->first();
        
        if (!$keluarga) {
            return response()->json([
                'success' => false,
                'message' => 'Keluarga dengan nomor KK tersebut tidak ditemukan.',
            ], 404);
        }
        
        try {
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
                'id_kelompok' => $keluarga->id_kelompok ?? null,
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
                'hafalan' => $request->hafalan,
                'pelajaran_favorit' => $request->pelajaran_favorit,
                'prestasi' => $request->prestasi,
                'jarak_rumah' => $request->jarak_rumah,
                'hobi' => $request->hobi,
                'transportasi' => $request->transportasi,
                'status_validasi' => 'aktif',
                'status_cpb' => 'BCPB',
            ]);
            
            // Upload foto jika ada
            if ($request->hasFile('foto')) {
                $folderPath = 'Anak/' . $anak->id_anak;
                $fileName = $request->file('foto')->getClientOriginalName();
                $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public');
                
                $anak->update(['foto' => $fileName]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Data anak berhasil disimpan!',
                'data' => [
                    'anak' => $anak,
                    'pendidikan' => $pendidikan
                ]
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Error saat menyimpan anak: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan data anak',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}