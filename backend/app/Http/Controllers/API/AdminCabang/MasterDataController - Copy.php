<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Jenjang;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Exception;

class MasterDataController extends Controller
{
    // ============== KELAS CUSTOM METHODS ==============

    /**
     * Get custom kelas list
     */
    public function getKelasCustom(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $query = Kelas::with(['jenjang'])
                ->custom()
                ->active();

            // Filter by jenjang
            if ($request->has('jenjang_id')) {
                $query->where('id_jenjang', $request->jenjang_id);
            }

            // Filter by global/specific
            if ($request->has('is_global')) {
                $query->where('is_global', $request->boolean('is_global'));
            }

            // Search
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nama_kelas', 'like', "%{$search}%")
                      ->orWhere('deskripsi', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'urutan');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $kelasCustom = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $kelasCustom,
                'message' => 'Kelas custom berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil kelas custom',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create custom kelas
     */
    public function storeKelasCustom(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $validator = Validator::make($request->all(), [
                'id_jenjang' => 'required|exists:jenjang,id_jenjang',
                'nama_kelas' => 'required|string|max:255',
                'tingkat' => 'nullable|integer|min:1|max:20',
                'deskripsi' => 'nullable|string',
                'is_global' => 'boolean',
                'target_jenjang' => 'nullable|array',
                'target_jenjang.*' => 'integer|exists:jenjang,id_jenjang',
                'kelas_gabungan' => 'nullable|array',
                'kelas_gabungan.*' => 'integer|exists:kelas,id_kelas'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Check duplicate nama kelas dalam jenjang yang sama
            $existingKelas = Kelas::where('id_jenjang', $request->id_jenjang)
                ->where('nama_kelas', $request->nama_kelas)
                ->exists();

            if ($existingKelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama kelas sudah ada dalam jenjang ini'
                ], 422);
            }

            // Get next urutan
            $nextUrutan = Kelas::where('id_jenjang', $request->id_jenjang)
                ->max('urutan') + 1;

            $kelasData = [
                'id_jenjang' => $request->id_jenjang,
                'nama_kelas' => $request->nama_kelas,
                'tingkat' => $request->tingkat,
                'jenis_kelas' => 'custom',
                'is_custom' => true,
                'urutan' => $nextUrutan,
                'deskripsi' => $request->deskripsi,
                'is_active' => true,
                'is_global' => $request->get('is_global', false),
                'target_jenjang' => $request->target_jenjang ?? [],
                'kelas_gabungan' => $request->kelas_gabungan ?? []
            ];

            $kelas = Kelas::create($kelasData);
            $kelas->load(['jenjang']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $kelas,
                'message' => 'Kelas custom berhasil dibuat'
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat kelas custom',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update custom kelas
     */
    public function updateKelasCustom(Request $request, $id): JsonResponse
    {
        try {
            $kelas = Kelas::custom()->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nama_kelas' => 'required|string|max:255',
                'tingkat' => 'nullable|integer|min:1|max:20',
                'deskripsi' => 'nullable|string',
                'is_global' => 'boolean',
                'target_jenjang' => 'nullable|array',
                'target_jenjang.*' => 'integer|exists:jenjang,id_jenjang',
                'kelas_gabungan' => 'nullable|array',
                'kelas_gabungan.*' => 'integer|exists:kelas,id_kelas'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Check duplicate nama kelas dalam jenjang yang sama (exclude current)
            $existingKelas = Kelas::where('id_jenjang', $kelas->id_jenjang)
                ->where('nama_kelas', $request->nama_kelas)
                ->where('id_kelas', '!=', $id)
                ->exists();

            if ($existingKelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama kelas sudah ada dalam jenjang ini'
                ], 422);
            }

            $updateData = [
                'nama_kelas' => $request->nama_kelas,
                'tingkat' => $request->tingkat,
                'deskripsi' => $request->deskripsi,
                'is_global' => $request->get('is_global', $kelas->is_global),
                'target_jenjang' => $request->target_jenjang ?? [],
                'kelas_gabungan' => $request->kelas_gabungan ?? []
            ];

            $kelas->update($updateData);
            $kelas->load(['jenjang']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $kelas,
                'message' => 'Kelas custom berhasil diupdate'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate kelas custom',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete custom kelas
     */
    public function destroyKelasCustom($id): JsonResponse
    {
        try {
            $kelas = Kelas::custom()->findOrFail($id);

            DB::beginTransaction();

            // Check if kelas is being used
            $materiCount = $kelas->materi()->count();
            $templateMateriCount = $kelas->templateMateri()->count();

            if ($materiCount > 0 || $templateMateriCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kelas tidak dapat dihapus karena sedang digunakan dalam materi atau template'
                ], 422);
            }

            $kelas->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Kelas custom berhasil dihapus'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus kelas custom',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ============== MATA PELAJARAN CUSTOM METHODS ==============

    /**
     * Get custom mata pelajaran list
     */
    public function getMataPelajaranCustom(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $query = MataPelajaran::with(['jenjang'])
                ->where(function($q) use ($kacabId) {
                    $q->where('id_kacab', $kacabId);
                })
                ->active();

            // Filter by jenjang
            if ($request->has('jenjang_id')) {
                $query->where('id_jenjang', $request->jenjang_id);
            }

            // Filter by kategori
            if ($request->has('kategori')) {
                $query->where('kategori', $request->kategori);
            }

            // Filter by global/specific
            if ($request->has('is_global')) {
                $query->where('is_global', $request->boolean('is_global'));
            }

            // Search
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nama_mata_pelajaran', 'like', "%{$search}%")
                      ->orWhere('kode_mata_pelajaran', 'like', "%{$search}%")
                      ->orWhere('deskripsi', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'nama_mata_pelajaran');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $mataPelajaranCustom = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $mataPelajaranCustom,
                'message' => 'Mata pelajaran custom berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil mata pelajaran custom',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create custom mata pelajaran
     */
    public function storeMataPelajaranCustom(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $validator = Validator::make($request->all(), [
                'nama_mata_pelajaran' => 'required|string|max:255',
                'kode_mata_pelajaran' => 'nullable|string|max:20',
                'kategori' => 'required|in:wajib,muatan_lokal,pengembangan_diri,ekstrakurikuler',
                'deskripsi' => 'nullable|string',
                'id_jenjang' => 'required|exists:jenjang,id_jenjang',
                'is_global' => 'boolean',
                'target_jenjang' => 'nullable|array',
                'target_jenjang.*' => 'integer|exists:jenjang,id_jenjang',
                'target_kelas' => 'nullable|array',
                'target_kelas.*' => 'integer|exists:kelas,id_kelas'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Check duplicate nama mata pelajaran dalam kacab
            $existingMataPelajaran = MataPelajaran::where('id_kacab', $kacabId)
                ->where('nama_mata_pelajaran', $request->nama_mata_pelajaran)
                ->exists();

            if ($existingMataPelajaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama mata pelajaran sudah ada dalam cabang ini'
                ], 422);
            }

            // Generate kode if not provided
            $kodeMataPelajaran = $request->kode_mata_pelajaran;
            if (!$kodeMataPelajaran) {
                $kodeMataPelajaran = strtoupper(substr($request->nama_mata_pelajaran, 0, 3)) . '_' . $kacabId;
            }

            $mataPelajaranData = [
                'nama_mata_pelajaran' => $request->nama_mata_pelajaran,
                'kode_mata_pelajaran' => $kodeMataPelajaran,
                'kategori' => $request->kategori,
                'deskripsi' => $request->deskripsi,
                'status' => 'active',
                'id_kacab' => $kacabId,
                'id_jenjang' => $request->id_jenjang,
                'is_global' => $request->get('is_global', false),
                'target_jenjang' => $request->target_jenjang ?? [],
                'target_kelas' => $request->target_kelas ?? []
            ];

            $mataPelajaran = MataPelajaran::create($mataPelajaranData);
            $mataPelajaran->load(['jenjang']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $mataPelajaran,
                'message' => 'Mata pelajaran custom berhasil dibuat'
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat mata pelajaran custom',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update custom mata pelajaran
     */
    public function updateMataPelajaranCustom(Request $request, $id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            
            $mataPelajaran = MataPelajaran::where('id_kacab', $kacabId)
                ->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'nama_mata_pelajaran' => 'required|string|max:255',
                'kode_mata_pelajaran' => 'nullable|string|max:20',
                'kategori' => 'required|in:wajib,muatan_lokal,pengembangan_diri,ekstrakurikuler',
                'deskripsi' => 'nullable|string',
                'is_global' => 'boolean',
                'target_jenjang' => 'nullable|array',
                'target_jenjang.*' => 'integer|exists:jenjang,id_jenjang',
                'target_kelas' => 'nullable|array',
                'target_kelas.*' => 'integer|exists:kelas,id_kelas'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Check duplicate nama mata pelajaran dalam kacab (exclude current)
            $existingMataPelajaran = MataPelajaran::where('id_kacab', $kacabId)
                ->where('nama_mata_pelajaran', $request->nama_mata_pelajaran)
                ->where('id_mata_pelajaran', '!=', $id)
                ->exists();

            if ($existingMataPelajaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nama mata pelajaran sudah ada dalam cabang ini'
                ], 422);
            }

            $updateData = [
                'nama_mata_pelajaran' => $request->nama_mata_pelajaran,
                'kode_mata_pelajaran' => $request->kode_mata_pelajaran ?? $mataPelajaran->kode_mata_pelajaran,
                'kategori' => $request->kategori,
                'deskripsi' => $request->deskripsi,
                'is_global' => $request->get('is_global', $mataPelajaran->is_global),
                'target_jenjang' => $request->target_jenjang ?? [],
                'target_kelas' => $request->target_kelas ?? []
            ];

            $mataPelajaran->update($updateData);
            $mataPelajaran->load(['jenjang']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $mataPelajaran,
                'message' => 'Mata pelajaran custom berhasil diupdate'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate mata pelajaran custom',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete custom mata pelajaran
     */
    public function destroyMataPelajaranCustom($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            
            $mataPelajaran = MataPelajaran::where('id_kacab', $kacabId)
                ->findOrFail($id);

            DB::beginTransaction();

            // Check if mata pelajaran is being used
            $materiCount = $mataPelajaran->materi()->count();
            $templateMateriCount = $mataPelajaran->templateMateri()->count();

            if ($materiCount > 0 || $templateMateriCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mata pelajaran tidak dapat dihapus karena sedang digunakan dalam materi atau template'
                ], 422);
            }

            $mataPelajaran->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Mata pelajaran custom berhasil dihapus'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus mata pelajaran custom',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dropdown data for forms
     */
    public function getDropdownData(): JsonResponse
    {
        try {
            $jenjangList = Jenjang::active()
                ->orderBy('urutan')
                ->get(['id_jenjang', 'nama_jenjang', 'kode_jenjang']);

            $kelasStandard = Kelas::standard()
                ->active()
                ->with(['jenjang:id_jenjang,nama_jenjang'])
                ->orderBy('urutan')
                ->get(['id_kelas', 'id_jenjang', 'nama_kelas', 'tingkat']);

            return response()->json([
                'success' => true,
                'data' => [
                    'jenjang' => $jenjangList,
                    'kelas_standard' => $kelasStandard,
                    'kategori_mata_pelajaran' => [
                        'wajib' => 'Mata Pelajaran Wajib',
                        'muatan_lokal' => 'Muatan Lokal',
                        'pengembangan_diri' => 'Pengembangan Diri',
                        'ekstrakurikuler' => 'Ekstrakurikuler'
                    ]
                ],
                'message' => 'Dropdown data berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil dropdown data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}