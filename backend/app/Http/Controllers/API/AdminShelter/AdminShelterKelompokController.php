<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Models\Anak;
use App\Models\Kelompok;
use App\Models\Kelas;
use App\Models\Jenjang;
use App\Models\Aktivitas;
use App\Models\TutorKelompok;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Resources\Kelompok\KelompokCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminShelterKelompokController extends Controller
{
   public function index(Request $request)
  {
      $adminShelter = Auth::user()->adminShelter;

      if (!$adminShelter || !$adminShelter->shelter) {
          return response()->json([
              'success' => false,
              'message' => 'Shelter tidak ditemukan'
          ], 403);
      }

      $query = Kelompok::with(['shelter']);
      $query->where('id_shelter', $adminShelter->shelter->id_shelter);

      if ($request->has('search')) {
          $query->where('nama_kelompok', 'like', '%' . $request->search . '%');
      }

      // Filter by kelas gabungan if provided
      if ($request->has('kelas_ids')) {
          $kelasIds = is_array($request->kelas_ids) ? $request->kelas_ids : [$request->kelas_ids];
          $query->where(function($q) use ($kelasIds) {
              foreach ($kelasIds as $kelasId) {
                  $q->orWhereJsonContains('kelas_gabungan', $kelasId);
              }
          });
      }

      $totalKelompok = $query->count();

      $kelompok = $query->with(['shelter'])
      ->withCount('anak')
      ->latest()
      ->paginate($request->per_page ?? 10);

      return response()->json([
          'success'    => true,
          'message'    => 'Daftar Kelompok',
          'data'       => KelompokCollection::collection($kelompok),
          'pagination' => [
              'total'         => $kelompok->total(),
              'per_page'      => $kelompok->perPage(),
              'current_page'  => $kelompok->currentPage(),
              'last_page'     => $kelompok->lastPage(),
              'from'          => $kelompok->firstItem(),
              'to'            => $kelompok->lastItem()
          ],
          'summary'   => [
              'total_kelompok'   => $totalKelompok
          ]
      ], 200);
  }

 public function show($id)
{
    $kelompok = Kelompok::with(['shelter', 'anak.anakPendidikan'])
        ->withCount('anak')
        ->findOrFail($id);

    // Load kelas gabungan details if available
    if (is_array($kelompok->kelas_gabungan) && !empty($kelompok->kelas_gabungan)) {
        // Flatten the array in case it contains nested arrays
        $kelasIds = collect($kelompok->kelas_gabungan)->flatten()->filter()->unique()->values()->all();
        
        if (!empty($kelasIds)) {
            $kelasDetails = Kelas::whereIn('id_kelas', $kelasIds)
                ->with('jenjang')
                ->get();
            $kelompok->kelas_gabungan_details = $kelasDetails;
        }
    }

    // Manual response for testing
    return response()->json([
        'success' => true,
        'message' => 'Detail Kelompok',
        'data' => [
            'id_kelompok' => $kelompok->id_kelompok,
            'nama_kelompok' => $kelompok->nama_kelompok,
            'jumlah_anggota' => $kelompok->jumlah_anggota ?? 0,
            'kelas_gabungan' => $kelompok->kelas_gabungan ? (is_string($kelompok->kelas_gabungan) ? json_decode($kelompok->kelas_gabungan, true) : $kelompok->kelas_gabungan) : [],
            'kelas_gabungan_details' => $kelompok->kelas_gabungan_details ?? null,
            'shelter' => [
                'id_shelter' => $kelompok->shelter->id_shelter ?? null,
                'nama_shelter' => $kelompok->shelter->nama_shelter ?? 'Tidak Ada Shelter',
            ],
            'anak_count' => $kelompok->anak()->count(),
            'anak' => $kelompok->anak->map(function($anak) {
                return [
                    'id_anak' => $anak->id_anak,
                    'full_name' => $anak->full_name,
                    'foto_url' => $anak->foto_url,
                    'jenis_kelamin' => $anak->jenis_kelamin,
                    'agama' => $anak->agama,
                    'status_validasi' => $anak->status_validasi,
                    'tanggal_lahir' => $anak->tanggal_lahir,
                    'nik_anak' => $anak->nik_anak,
                    'anakPendidikan' => $anak->anakPendidikan ? [
                        'jenjang' => $anak->anakPendidikan->jenjang,
                        'kelas' => $anak->anakPendidikan->kelas
                    ] : null
                ];
            })
        ]
    ], 200);
}

   public function store(Request $request)
   {
       $adminShelter = Auth::user()->adminShelter;

       if (!$adminShelter || !$adminShelter->shelter) {
           return response()->json([
               'success' => false,
               'message' => 'Shelter tidak ditemukan'
           ], 403);
       }

       $validatedData = $request->validate([
           // Removed id_level_anak_binaan - using kelas_gabungan approach
           'nama_kelompok' => [
               'required', 
               'string', 
               'max:255', 
               'unique:kelompok,nama_kelompok,NULL,id_kelompok,id_shelter,' . $adminShelter->shelter->id_shelter
           ],
           'jumlah_anggota' => 'nullable|integer|min:0',
           'kelas_gabungan' => 'required|array|min:1',
           'kelas_gabungan.*' => 'exists:kelas,id_kelas',
           'anak_ids' => 'nullable|array',
           'anak_ids.*' => 'exists:anak,id_anak'
       ]);

       $validatedData['id_shelter'] = $adminShelter->shelter->id_shelter;

       DB::beginTransaction();
       
       try {
           $kelompok = Kelompok::create($validatedData);

           // Assign anak to kelompok if provided
           if (isset($validatedData['anak_ids']) && is_array($validatedData['anak_ids'])) {
               $successCount = 0;
               $errors = [];

               foreach ($validatedData['anak_ids'] as $anakId) {
                   $anak = Anak::where('id_anak', $anakId)
                       ->where('id_shelter', $adminShelter->shelter->id_shelter)
                       ->whereNull('id_kelompok')
                       ->where('status_validasi', 'aktif')
                       ->first();

                   if ($anak) {
                       // Validate anak compatibility with kelas gabungan
                       if ($this->validateAnakKelasCompatibility($anak, $kelompok->kelas_gabungan)) {
                           $anak->id_kelompok = $kelompok->id_kelompok;
                           $anak->save();
                           $successCount++;
                       } else {
                           $errors[] = "Anak ID $anakId tidak sesuai dengan kelas gabungan kelompok";
                       }
                   } else {
                       $errors[] = "Anak ID $anakId tidak tersedia atau tidak aktif";
                   }
               }

               // Update jumlah_anggota
               $kelompok->jumlah_anggota = $kelompok->anak()->count();
               $kelompok->save();
           }

           DB::commit();

           return response()->json([
               'success' => true,
               'message' => 'Kelompok berhasil dibuat',
               'data'    => new KelompokCollection($kelompok->load(['anak']))
           ], 201);

       } catch (\Exception $e) {
           DB::rollBack();
           return response()->json([
               'success' => false,
               'message' => 'Gagal membuat kelompok: ' . $e->getMessage()
           ], 500);
       }
   }

   public function update(Request $request, $id)
   {
       $adminShelter = Auth::user()->adminShelter;

       if (!$adminShelter || !$adminShelter->shelter) {
           return response()->json([
               'success' => false,
               'message' => 'Shelter tidak ditemukan'
           ], 403);
       }

       $kelompok = Kelompok::findOrFail($id);

       if ($kelompok->id_shelter !== $adminShelter->shelter->id_shelter) {
           return response()->json([
               'success' => false,
               'message' => 'Anda tidak memiliki izin untuk mengubah kelompok ini'
           ], 403);
       }

       $validatedData = $request->validate([
           // Removed id_level_anak_binaan - using kelas_gabungan approach
           'kelas_gabungan' => 'sometimes|array|min:1',
           'kelas_gabungan.*' => 'exists:kelas,id_kelas',
           'nama_kelompok' => [
               'sometimes', 
               'string', 
               'max:255', 
               'unique:kelompok,nama_kelompok,' . $id . ',id_kelompok,id_shelter,' . $adminShelter->shelter->id_shelter
           ],
           'jumlah_anggota' => 'nullable|integer|min:0'
       ]);

       // Update kelas gabungan if changed - validate compatibility with existing anak
       if (isset($validatedData['kelas_gabungan']) && $validatedData['kelas_gabungan'] !== $kelompok->kelas_gabungan) {
           // Validate that all existing anak are compatible with new kelas gabungan
           $existingAnak = $kelompok->anak;
           foreach ($existingAnak as $anak) {
               if (!$this->validateAnakKelasCompatibility($anak, $validatedData['kelas_gabungan'])) {
                   return response()->json([
                       'success' => false,
                       'message' => "Anak {$anak->nama_lengkap} tidak sesuai dengan kelas gabungan baru"
                   ], 422);
               }
           }
       }

       $kelompok->update($validatedData);

       return response()->json([
           'success' => true,
           'message' => 'Kelompok berhasil diperbarui',
           'data'    => new KelompokCollection($kelompok)
       ], 200);
   }

   public function destroy($id)
   {
       $adminShelter = Auth::user()->adminShelter;

       if (!$adminShelter || !$adminShelter->shelter) {
           return response()->json([
               'success' => false,
               'message' => 'Shelter tidak ditemukan'
           ], 403);
       }

       $kelompok = Kelompok::findOrFail($id);

       if ($kelompok->id_shelter !== $adminShelter->shelter->id_shelter) {
           return response()->json([
               'success' => false,
               'message' => 'Anda tidak memiliki izin untuk menghapus kelompok ini'
           ], 403);
       }

       if ($kelompok->anak()->count() > 0) {
           return response()->json([
               'success' => false,
               'message' => 'Tidak dapat menghapus kelompok yang memiliki anak'
           ], 400);
       }

       $kelompok->delete();

       return response()->json([
           'success' => true,
           'message' => 'Kelompok berhasil dihapus'
       ], 200);
   }

   /**
    * NEW: Get available kelas for kelompok form (replaces getLevels)
    */
   public function getAvailableKelas()
   {
       try {
           $adminShelter = Auth::user()->adminShelter;

           if (!$adminShelter || !$adminShelter->shelter) {
               return response()->json([
                   'success' => false,
                   'message' => 'Shelter tidak ditemukan'
               ], 403);
           }

           // Get kelas with jenjang
           $kelasList = Kelas::where('is_active', true)
               ->with(['jenjang' => function($query) {
                   $query->where('is_active', true);
               }])
               ->orderBy('id_jenjang')
               ->orderBy('tingkat')
               ->get();

           // Group by jenjang for better organization
           $groupedKelas = $kelasList->groupBy('jenjang.nama_jenjang');

           return response()->json([
               'success' => true,
               'message' => 'Daftar kelas tersedia berhasil diambil',
               'data' => [
                   'kelas_list' => $kelasList,
                   'grouped_kelas' => $groupedKelas
               ]
           ]);

       } catch (\Exception $e) {
           Log::error('Error in AdminShelterKelompokController@getAvailableKelas: ' . $e->getMessage());
           return response()->json([
               'success' => false,
               'message' => 'Terjadi kesalahan saat mengambil data kelas',
               'error' => $e->getMessage()
           ], 500);
       }
   }



   /**
    * NEW: Validate anak compatibility with kelas gabungan (replaces old id_level_anak_binaan logic)
    */
   private function validateAnakKelasCompatibility($anak, $kelasGabunganIds)
   {
       if (!$anak->anakPendidikan || empty($kelasGabunganIds)) {
           return true; // Allow if no specific education data
       }

       // Get anak's current education level
       $anakJenjang = strtolower(trim($anak->anakPendidikan->jenjang ?? ''));
       $anakTingkat = $anak->anakPendidikan->tingkat ?? 0;

       // Get kelas details for kelas gabungan
       $kelasList = Kelas::whereIn('id_kelas', $kelasGabunganIds)
           ->with('jenjang')
           ->get();

       if ($kelasList->isEmpty()) {
           return false;
       }

       // Check if anak is compatible with any of the kelas in gabungan
       foreach ($kelasList as $kelas) {
           $kelasJenjang = strtolower($kelas->jenjang->nama_jenjang ?? '');
           
           // Direct jenjang match
           if ($this->isJenjangCompatible($anakJenjang, $kelasJenjang)) {
               // Additional tingkat validation for more precise matching
               if ($this->isTingkatCompatible($anakTingkat, $kelas->tingkat, $kelasJenjang)) {
                   return true;
               }
           }
       }

       return false;
   }

   /**
    * Helper: Check if anak's jenjang is compatible with kelas jenjang
    */
   private function isJenjangCompatible($anakJenjang, $kelasJenjang)
   {
       $jenjangMapping = [
           'tk' => ['paud', 'tk'],
           'paud' => ['paud', 'tk'],
           'sd' => ['sd', 'dasar'],
           'smp' => ['smp', 'menengah pertama'],
           'sma' => ['sma', 'smk', 'menengah atas'],
           'smk' => ['sma', 'smk', 'menengah atas']
       ];

       // Exact match
       if ($anakJenjang === $kelasJenjang) {
           return true;
       }

       // Check mapping compatibility
       if (isset($jenjangMapping[$anakJenjang])) {
           foreach ($jenjangMapping[$anakJenjang] as $compatible) {
               if (strpos($kelasJenjang, $compatible) !== false) {
                   return true;
               }
           }
       }

       return false;
   }

   /**
    * Helper: Check if anak's tingkat is compatible with kelas tingkat
    */
   private function isTingkatCompatible($anakTingkat, $kelasTingkat, $kelasJenjang)
   {
       if (!$anakTingkat || !$kelasTingkat) {
           return true; // Allow if no specific tingkat data
       }

       // Allow some flexibility (±1 tingkat)
       $tolerance = 1;
       
       // For SD/SMP/SMA, check if tingkat is within acceptable range
       if (in_array($kelasJenjang, ['sd', 'smp', 'sma'])) {
           return abs($anakTingkat - $kelasTingkat) <= $tolerance;
       }

       // For other jenjang, be more flexible
       return true;
   }




   /**
    * Get available anak that can be added to kelompok (Enhanced for Phase 3)
    * This is an enhanced version of getAvailableChildren with kelompok-specific filtering
    */
   public function getAvailableAnak($kelompokId)
   {
       try {
           $adminShelter = Auth::user()->adminShelter;

           if (!$adminShelter || !$adminShelter->shelter) {
               return response()->json([
                   'success' => false,
                   'message' => 'Shelter tidak ditemukan'
               ], 403);
           }

           $shelterId = $adminShelter->shelter->id_shelter;
           
           $kelompok = Kelompok::where('id_kelompok', $kelompokId)
               ->where('id_shelter', $shelterId)
               // Removed levelAnakBinaan relationship
               ->first();

           if (!$kelompok) {
               return response()->json([
                   'success' => false,
                   'message' => 'Kelompok tidak ditemukan'
               ], 404);
           }

           // Get anak that are not in any kelompok and have status aktif
           $availableAnak = Anak::whereNull('id_kelompok')
               ->where('id_shelter', $shelterId)
               ->where('status_validasi', 'aktif')
               ->with(['anakPendidikan'])
               ->get();

           // Filter anak based on education compatibility with kelas gabungan
           $compatibleAnak = $availableAnak->filter(function ($anak) use ($kelompok) {
               return $this->validateAnakKelasCompatibility($anak, $kelompok->kelas_gabungan ?? []);
           });

           return response()->json([
               'success' => true,
               'message' => 'Data anak yang tersedia berhasil diambil',
               'data' => [
                   'available_anak' => $compatibleAnak->values(),
                   'total_available' => $compatibleAnak->count(),
                   'kelompok_info' => [
                       'id' => $kelompok->id_kelompok,
                       'nama' => $kelompok->nama_kelompok,
                       'kelas_details' => $this->getKelasDetails($kelompok->kelas_gabungan ?? []),
                       'kelas_gabungan' => $kelompok->kelas_gabungan
                   ]
               ]
           ]);

       } catch (\Exception $e) {
           Log::error('Error in AdminShelterKelompokController@getAvailableAnak: ' . $e->getMessage());
           return response()->json([
               'success' => false,
               'message' => 'Terjadi kesalahan saat mengambil data anak yang tersedia',
               'error' => $e->getMessage()
           ], 500);
       }
   }

   /**
    * Add multiple anak to kelompok (Enhanced for Phase 3)
    */
   public function addAnak(Request $request, $kelompokId)
   {
       try {
           $validatedData = $request->validate([
               'anak_ids' => 'required|array|min:1',
               'anak_ids.*' => 'exists:anak,id_anak'
           ]);

           $adminShelter = Auth::user()->adminShelter;

           if (!$adminShelter || !$adminShelter->shelter) {
               return response()->json([
                   'success' => false,
                   'message' => 'Shelter tidak ditemukan'
               ], 403);
           }

           $shelterId = $adminShelter->shelter->id_shelter;
           
           $kelompok = Kelompok::where('id_kelompok', $kelompokId)
               ->where('id_shelter', $shelterId)
               // Removed levelAnakBinaan relationship
               ->first();

           if (!$kelompok) {
               return response()->json([
                   'success' => false,
                   'message' => 'Kelompok tidak ditemukan'
               ], 404);
           }

           DB::beginTransaction();

           $successCount = 0;
           $errors = [];

           foreach ($validatedData['anak_ids'] as $anakId) {
               try {
                   $anak = Anak::with('anakPendidikan')->findOrFail($anakId);

                   // Validate anak belongs to same shelter
                   if ($anak->id_shelter !== $shelterId) {
                       $errors[] = "Anak ID $anakId tidak berada di shelter yang sama";
                       continue;
                   }

                   // Validate anak is not in any kelompok
                   if ($anak->id_kelompok) {
                       $errors[] = "Anak ID $anakId sudah berada dalam kelompok lain";
                       continue;
                   }

                   // Validate anak status is aktif
                   if ($anak->status_validasi !== 'aktif') {
                       $errors[] = "Anak ID $anakId tidak memiliki status aktif";
                       continue;
                   }

                   // Validate kelas gabungan compatibility
                   if (!empty($kelompok->kelas_gabungan) && !$this->validateAnakKelasCompatibility($anak, $kelompok->kelas_gabungan)) {
                       $anakJenjang = $anak->anakPendidikan->jenjang ?? 'Unknown';
                       $kelasDetails = $this->getKelasDetails($kelompok->kelas_gabungan);
                       $kelasNames = $kelasDetails->pluck('jenjang.nama_jenjang')->unique()->implode(', ');
                       $errors[] = "Anak ID $anakId dengan jenjang '$anakJenjang' tidak sesuai dengan kelas gabungan kelompok ($kelasNames)";
                       continue;
                   }

                   // Add anak to kelompok
                   $anak->id_kelompok = $kelompokId;
                   // Removed id_level_anak_binaan assignment
                   $anak->save();

                   $successCount++;

               } catch (\Exception $e) {
                   $errors[] = "Error pada anak ID $anakId: " . $e->getMessage();
               }
           }

           // Update jumlah_anggota
           $kelompok->jumlah_anggota = $kelompok->anak()->count();
           $kelompok->save();

           DB::commit();

           return response()->json([
               'success' => $successCount > 0,
               'message' => $successCount > 0 ? 
                   "Berhasil menambahkan $successCount anak ke kelompok" : 
                   'Tidak ada anak yang berhasil ditambahkan',
               'data' => [
                   'added_count' => $successCount,
                   'total_members' => $kelompok->jumlah_anggota,
                   'errors' => $errors
               ]
           ], $successCount > 0 ? 200 : 422);

       } catch (\Exception $e) {
           DB::rollBack();
           Log::error('Error in AdminShelterKelompokController@addAnak: ' . $e->getMessage());
           return response()->json([
               'success' => false,
               'message' => 'Terjadi kesalahan saat menambahkan anak ke kelompok',
               'error' => $e->getMessage()
           ], 500);
       }
   }

   /**
    * Remove anak from kelompok (Enhanced version)
    */
   public function removeAnak($kelompokId, $anakId)
   {
       try {
           $adminShelter = Auth::user()->adminShelter;

           if (!$adminShelter || !$adminShelter->shelter) {
               return response()->json([
                   'success' => false,
                   'message' => 'Shelter tidak ditemukan'
               ], 403);
           }

           $shelterId = $adminShelter->shelter->id_shelter;
           
           $kelompok = Kelompok::where('id_kelompok', $kelompokId)
               ->where('id_shelter', $shelterId)
               ->first();

           if (!$kelompok) {
               return response()->json([
                   'success' => false,
                   'message' => 'Kelompok tidak ditemukan'
               ], 404);
           }

           $anak = Anak::where('id_anak', $anakId)
               ->where('id_kelompok', $kelompokId)
               ->where('id_shelter', $shelterId)
               ->first();

           if (!$anak) {
               return response()->json([
                   'success' => false,
                   'message' => 'Anak binaan tidak ditemukan di kelompok ini'
               ], 404);
           }

           DB::beginTransaction();

           // Remove anak from kelompok
           $anak->id_kelompok = null;
           // Removed id_level_anak_binaan assignment
           $anak->save();

           // Update jumlah_anggota
           $kelompok->jumlah_anggota = $kelompok->anak()->count();
           $kelompok->save();

           DB::commit();

           return response()->json([
               'success' => true,
               'message' => 'Anak binaan berhasil dikeluarkan dari kelompok',
               'data' => [
                   'remaining_members' => $kelompok->jumlah_anggota
               ]
           ]);

       } catch (\Exception $e) {
           DB::rollBack();
           Log::error('Error in AdminShelterKelompokController@removeAnak: ' . $e->getMessage());
           return response()->json([
               'success' => false,
               'message' => 'Terjadi kesalahan saat mengeluarkan anak dari kelompok',
               'error' => $e->getMessage()
           ], 500);
       }
   }

   /**
    * Helper method to safely get kelas details from kelas_gabungan array
    */
   private function getKelasDetails($kelasGabungan)
   {
       if (!is_array($kelasGabungan) || empty($kelasGabungan)) {
           return collect([]);
       }

       // Flatten the array in case it contains nested arrays
       $kelasIds = collect($kelasGabungan)->flatten()->filter()->unique()->values()->all();
       
       if (empty($kelasIds)) {
           return collect([]);
       }

       return Kelas::whereIn('id_kelas', $kelasIds)
           ->with('jenjang')
           ->get(['id_kelas', 'nama_kelas', 'tingkat', 'id_jenjang']);
   }

   /**
    * Get kelompok statistics (NEW for Phase 3)
    */
   public function getKelompokStats($kelompokId)
   {
       try {
           $adminShelter = Auth::user()->adminShelter;

           if (!$adminShelter || !$adminShelter->shelter) {
               return response()->json([
                   'success' => false,
                   'message' => 'Shelter tidak ditemukan'
               ], 403);
           }

           $shelterId = $adminShelter->shelter->id_shelter;
           
           $kelompok = Kelompok::where('id_kelompok', $kelompokId)
               ->where('id_shelter', $shelterId)
               ->with(['levelAnakBinaan'])
               ->first();

           if (!$kelompok) {
               return response()->json([
                   'success' => false,
                   'message' => 'Kelompok tidak ditemukan'
               ], 404);
           }

           // Basic counts
           $anakCount = Anak::where('id_kelompok', $kelompokId)->count();
           $tutorCount = TutorKelompok::where('id_kelompok', $kelompokId)
               ->where('is_active', true)
               ->count();

           // Activity statistics
           $totalActivities = Aktivitas::where('nama_kelompok', $kelompok->nama_kelompok)
               ->where('id_shelter', $shelterId)
               ->count();

           $recentActivities = Aktivitas::where('nama_kelompok', $kelompok->nama_kelompok)
               ->where('id_shelter', $shelterId)
               ->where('tanggal', '>=', now()->subDays(30))
               ->count();

           // Monthly activity trend (last 6 months)
           $monthlyStats = [];
           for ($i = 5; $i >= 0; $i--) {
               $month = now()->subMonths($i);
               $count = Aktivitas::where('nama_kelompok', $kelompok->nama_kelompok)
                   ->where('id_shelter', $shelterId)
                   ->whereYear('tanggal', $month->year)
                   ->whereMonth('tanggal', $month->month)
                   ->count();
               
               $monthlyStats[] = [
                   'month' => $month->format('Y-m'),
                   'month_name' => $month->format('M Y'),
                   'activity_count' => $count
               ];
           }

           // Kelas gabungan details
           $kelasGabunganDetails = [];
           if (is_array($kelompok->kelas_gabungan) && !empty($kelompok->kelas_gabungan)) {
               // Flatten the array in case it contains nested arrays
               $kelasIds = collect($kelompok->kelas_gabungan)->flatten()->filter()->unique()->values()->all();
               
               if (!empty($kelasIds)) {
                   $kelasGabunganDetails = Kelas::whereIn('id_kelas', $kelasIds)
                       ->with('jenjang')
                       ->get()
                       ->map(function($kelas) {
                           return [
                               'id_kelas' => $kelas->id_kelas,
                               'nama_kelas' => $kelas->nama_kelas,
                               'jenjang' => $kelas->jenjang->nama_jenjang ?? 'Unknown'
                           ];
                       });
               }
           }

           $stats = [
               'basic_stats' => [
                   'total_anak' => $anakCount,
                   'active_tutors' => $tutorCount,
                   'total_activities' => $totalActivities,
                   'recent_activities' => $recentActivities,
                   'kelas_gabungan_count' => is_array($kelompok->kelas_gabungan) ? count($kelompok->kelas_gabungan) : 0
               ],
               'kelas_gabungan_details' => $kelasGabunganDetails,
               'activity_trend' => $monthlyStats,
               'performance_indicators' => [
                   'avg_activities_per_month' => $totalActivities > 0 ? round($totalActivities / 6, 1) : 0,
                   'tutor_to_anak_ratio' => $anakCount > 0 ? round($tutorCount / $anakCount, 2) : 0,
                   'activity_frequency' => $recentActivities > 0 ? 'Aktif' : ($totalActivities > 0 ? 'Kurang Aktif' : 'Tidak Aktif')
               ]
           ];

           return response()->json([
               'success' => true,
               'message' => 'Statistik kelompok berhasil diambil',
               'data' => [
                   'kelompok_info' => [
                       'id_kelompok' => $kelompok->id_kelompok,
                       'nama_kelompok' => $kelompok->nama_kelompok,
                       'kelas_details' => $this->getKelasDetails($kelompok->kelas_gabungan ?? []),
                       'kelas_gabungan' => $kelompok->kelas_gabungan
                   ],
                   'stats' => $stats
               ]
           ]);

       } catch (\Exception $e) {
           Log::error('Error in AdminShelterKelompokController@getKelompokStats: ' . $e->getMessage());
           return response()->json([
               'success' => false,
               'message' => 'Terjadi kesalahan saat mengambil statistik kelompok',
               'error' => $e->getMessage()
           ], 500);
       }
   }
}