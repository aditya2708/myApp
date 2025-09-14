<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Jenjang;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class MasterDataController extends Controller
{
    /**
     * Get admin cabang data
     */
    private function getAdminCabang()
    {
        $user = Auth::user();
        return AdminCabang::where('user_id', $user->id_users)->first();
    }

    /**
     * Get list of custom classes
     */
    public function getKelasCustom(Request $request): JsonResponse
    {
        try {
            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }

            $query = Kelas::with(['jenjang', 'kacab'])
                ->where('jenis_kelas', 'custom')
                ->where('is_active', true)
                ->where('id_kacab', $adminCabang->id_kacab);

            // Filter by jenjang if provided
            if ($request->has('id_jenjang') && $request->id_jenjang) {
                $query->where('id_jenjang', $request->id_jenjang);
            }

            // Search by name
            if ($request->has('search') && $request->search) {
                $query->where('nama_kelas', 'like', '%' . $request->search . '%');
            }

            $kelasCustom = $query->orderBy('urutan')
                ->orderBy('nama_kelas')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $kelasCustom,
                'message' => 'Kelas custom berhasil diambil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data kelas custom: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store new custom class
     */
    public function storeKelasCustom(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_jenjang' => 'required|exists:jenjang,id_jenjang',
                'nama_kelas' => 'required|string|max:100',
                'tingkat' => 'nullable|integer|min:1|max:15',
                'deskripsi' => 'nullable|string',
                'is_global' => 'boolean',
                'target_jenjang' => 'nullable|array',
                'target_jenjang.*' => 'exists:jenjang,id_jenjang',
                'kelas_gabungan' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }

            // Check duplicate name within jenjang and cabang
            $exists = Kelas::where('id_jenjang', $request->id_jenjang)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->where('nama_kelas', $request->nama_kelas)
                ->exists();

            if ($exists) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Nama kelas sudah ada pada jenjang ini'
                ], 422);
            }

            // Get next urutan
            $nextUrutan = Kelas::where('id_jenjang', $request->id_jenjang)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->max('urutan') + 1;

            $kelasCustom = Kelas::create([
                'id_jenjang' => $request->id_jenjang,
                'id_kacab' => $adminCabang->id_kacab,
                'nama_kelas' => $request->nama_kelas,
                'tingkat' => $request->tingkat,
                'jenis_kelas' => 'custom',
                'is_custom' => true,
                'urutan' => $nextUrutan,
                'deskripsi' => $request->deskripsi,
                'is_active' => true,
                'is_global' => $request->is_global ?? false,
                'target_jenjang' => $request->target_jenjang,
                'kelas_gabungan' => $request->kelas_gabungan
            ]);

            $kelasCustom->load(['jenjang', 'kacab']);

            return response()->json([
                'status' => 'success',
                'data' => $kelasCustom,
                'message' => 'Kelas custom berhasil dibuat'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat kelas custom: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update custom class
     */
    public function updateKelasCustom(Request $request, $id): JsonResponse
    {
        try {
            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }

            $kelasCustom = Kelas::where('id_kelas', $id)
                ->where('jenis_kelas', 'custom')
                ->where('id_kacab', $adminCabang->id_kacab)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'nama_kelas' => 'required|string|max:100',
                'tingkat' => 'nullable|integer|min:1|max:15',
                'deskripsi' => 'nullable|string',
                'is_global' => 'boolean',
                'target_jenjang' => 'nullable|array',
                'target_jenjang.*' => 'exists:jenjang,id_jenjang',
                'kelas_gabungan' => 'nullable|array',
                'is_active' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check duplicate name within jenjang and cabang (exclude current)
            $exists = Kelas::where('id_jenjang', $kelasCustom->id_jenjang)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->where('nama_kelas', $request->nama_kelas)
                ->where('id_kelas', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Nama kelas sudah ada pada jenjang ini'
                ], 422);
            }

            $kelasCustom->update([
                'nama_kelas' => $request->nama_kelas,
                'tingkat' => $request->tingkat,
                'deskripsi' => $request->deskripsi,
                'is_global' => $request->is_global ?? $kelasCustom->is_global,
                'target_jenjang' => $request->target_jenjang,
                'kelas_gabungan' => $request->kelas_gabungan,
                'is_active' => $request->is_active ?? $kelasCustom->is_active
            ]);

            $kelasCustom->load(['jenjang', 'kacab']);

            return response()->json([
                'status' => 'success',
                'data' => $kelasCustom,
                'message' => 'Kelas custom berhasil diperbarui'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui kelas custom: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete custom class
     */
    public function destroyKelasCustom($id): JsonResponse
    {
        try {
            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }

            $kelasCustom = Kelas::where('id_kelas', $id)
                ->where('jenis_kelas', 'custom')
                ->where('id_kacab', $adminCabang->id_kacab)
                ->firstOrFail();

            // Check if kelas is being used
            $isUsed = $kelasCustom->materi()->exists() || 
                     $kelasCustom->templateMateri()->exists();

            if ($isUsed) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Kelas custom tidak dapat dihapus karena sedang digunakan'
                ], 422);
            }

            $kelasCustom->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Kelas custom berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus kelas custom: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get list of custom mata pelajaran
     */
    public function getMataPelajaranCustom(Request $request): JsonResponse
    {
        try {
            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }

            $query = MataPelajaran::with(['jenjang', 'kacab'])
                ->where('status', 'active')
                ->where('id_kacab', $adminCabang->id_kacab);

            // Filter by jenjang if provided
            if ($request->has('id_jenjang') && $request->id_jenjang) {
                $query->where(function($q) use ($request) {
                    $q->where('id_jenjang', $request->id_jenjang)
                      ->orWhereJsonContains('target_jenjang', $request->id_jenjang);
                });
            }

            // Search by name
            if ($request->has('search') && $request->search) {
                $query->where('nama_mata_pelajaran', 'like', '%' . $request->search . '%');
            }

            // Filter by kategori
            if ($request->has('kategori') && $request->kategori) {
                $query->where('kategori', $request->kategori);
            }

            $mataPelajaranCustom = $query->orderBy('nama_mata_pelajaran')->get();

            return response()->json([
                'status' => 'success',
                'data' => $mataPelajaranCustom,
                'message' => 'Mata pelajaran custom berhasil diambil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data mata pelajaran custom: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store new custom mata pelajaran
     */
    public function storeMataPelajaranCustom(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nama_mata_pelajaran' => 'required|string|max:100',
                'kode_mata_pelajaran' => 'required|string|max:20|unique:mata_pelajaran,kode_mata_pelajaran',
                'kategori' => 'required|in:wajib,pilihan,muatan_lokal,pengembangan_diri',
                'deskripsi' => 'nullable|string',
                'id_jenjang' => 'nullable|exists:jenjang,id_jenjang',
                'is_global' => 'boolean',
                'target_jenjang' => 'nullable|array',
                'target_jenjang.*' => 'exists:jenjang,id_jenjang',
                'target_kelas' => 'nullable|array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }
            
            $mataPelajaranCustom = MataPelajaran::create([
                'nama_mata_pelajaran' => $request->nama_mata_pelajaran,
                'kode_mata_pelajaran' => $request->kode_mata_pelajaran,
                'kategori' => $request->kategori,
                'deskripsi' => $request->deskripsi,
                'status' => 'active',
                'id_kacab' => $adminCabang->id_kacab,
                'id_jenjang' => $request->id_jenjang,
                'is_global' => $request->is_global ?? false,
                'target_jenjang' => $request->target_jenjang,
                'target_kelas' => $request->target_kelas
            ]);

            $mataPelajaranCustom->load(['jenjang', 'kacab']);

            return response()->json([
                'status' => 'success',
                'data' => $mataPelajaranCustom,
                'message' => 'Mata pelajaran custom berhasil dibuat'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat mata pelajaran custom: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update custom mata pelajaran
     */
    public function updateMataPelajaranCustom(Request $request, $id): JsonResponse
    {
        try {
            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }
            
            $mataPelajaranCustom = MataPelajaran::where('id_mata_pelajaran', $id)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'nama_mata_pelajaran' => 'required|string|max:100',
                'kode_mata_pelajaran' => 'required|string|max:20|unique:mata_pelajaran,kode_mata_pelajaran,' . $id . ',id_mata_pelajaran',
                'kategori' => 'required|in:wajib,pilihan,muatan_lokal,pengembangan_diri',
                'deskripsi' => 'nullable|string',
                'id_jenjang' => 'nullable|exists:jenjang,id_jenjang',
                'is_global' => 'boolean',
                'target_jenjang' => 'nullable|array',
                'target_jenjang.*' => 'exists:jenjang,id_jenjang',
                'target_kelas' => 'nullable|array',
                'status' => 'in:active,inactive'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $mataPelajaranCustom->update([
                'nama_mata_pelajaran' => $request->nama_mata_pelajaran,
                'kode_mata_pelajaran' => $request->kode_mata_pelajaran,
                'kategori' => $request->kategori,
                'deskripsi' => $request->deskripsi,
                'id_jenjang' => $request->id_jenjang,
                'is_global' => $request->is_global ?? $mataPelajaranCustom->is_global,
                'target_jenjang' => $request->target_jenjang,
                'target_kelas' => $request->target_kelas,
                'status' => $request->status ?? $mataPelajaranCustom->status
            ]);

            $mataPelajaranCustom->load(['jenjang', 'kacab']);

            return response()->json([
                'status' => 'success',
                'data' => $mataPelajaranCustom,
                'message' => 'Mata pelajaran custom berhasil diperbarui'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memperbarui mata pelajaran custom: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete custom mata pelajaran
     */
    public function destroyMataPelajaranCustom($id): JsonResponse
    {
        try {
            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }
            
            $mataPelajaranCustom = MataPelajaran::where('id_mata_pelajaran', $id)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->firstOrFail();

            // Check if mata pelajaran is being used
            $isUsed = $mataPelajaranCustom->materi()->exists() || 
                     $mataPelajaranCustom->templateMateri()->exists();

            if ($isUsed) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Mata pelajaran custom tidak dapat dihapus karena sedang digunakan'
                ], 422);
            }

            $mataPelajaranCustom->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Mata pelajaran custom berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal menghapus mata pelajaran custom: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dropdown data for forms
     */
    public function getDropdownData(Request $request): JsonResponse
    {
        try {
            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }

            $data = [];

            // Get jenjang list
            $data['jenjang'] = Jenjang::active()
                ->select('id_jenjang', 'nama_jenjang', 'kode_jenjang')
                ->orderBy('urutan')
                ->get();

            // Get kategori mata pelajaran options
            $data['kategori_mata_pelajaran'] = [
                ['value' => 'wajib', 'label' => 'Wajib'],
                ['value' => 'pilihan', 'label' => 'Pilihan'],
                ['value' => 'muatan_lokal', 'label' => 'Muatan Lokal'],
                ['value' => 'pengembangan_diri', 'label' => 'Pengembangan Diri']
            ];

            // Get existing kelas for reference (if needed)
            if ($request->has('include_kelas') && $request->include_kelas) {
                $data['kelas_existing'] = Kelas::with('jenjang')
                    ->where('id_kacab', $adminCabang->id_kacab)
                    ->where('is_active', true)
                    ->orderBy('id_jenjang')
                    ->orderBy('urutan')
                    ->get()
                    ->groupBy('id_jenjang');
            }

            // Support backward compatibility
            if ($request->has('include_jenjang')) {
                // This is for compatibility with old jenjang endpoint
            }

            return response()->json([
                'status' => 'success',
                'data' => $data,
                'message' => 'Data dropdown berhasil diambil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data dropdown: ' . $e->getMessage()
            ], 500);
        }
    }
}