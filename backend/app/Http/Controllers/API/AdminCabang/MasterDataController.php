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
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use App\Support\SsoContext;

class MasterDataController extends Controller
{
    private const JENJANG_TINGKAT_RANGE = [
        'SD' => ['min' => 1, 'max' => 6],
        'SMP' => ['min' => 7, 'max' => 9],
        'SMA' => ['min' => 10, 'max' => 12],
        'SMK' => ['min' => 10, 'max' => 12],
    ];

    /**
     * Get admin cabang data
     */
    private function getAdminCabang()
    {
        $user = Auth::user();
        return AdminCabang::where('user_id', $user->id_users)->first();
    }

    private function normalizeTargetArray($value): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof Collection) {
            $value = $value->toArray();
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $value = $decoded;
            }
        }

        if ($value === null) {
            return null;
        }

        if (!is_array($value)) {
            $value = [$value];
        }

        $value = array_values(array_filter($value, function ($item) {
            return $item !== null && $item !== '';
        }));

        if (empty($value)) {
            return null;
        }

        return array_map('intval', $value);
    }

    private function getTingkatRangeForJenjang(?Jenjang $jenjang): ?array
    {
        if (!$jenjang || !$jenjang->kode_jenjang) {
            return null;
        }

        $kodeJenjang = strtoupper($jenjang->kode_jenjang);

        return self::JENJANG_TINGKAT_RANGE[$kodeJenjang] ?? null;
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

            $companyId = $this->companyId($adminCabang->company_id ?? null);

            $query = Kelas::with(['jenjang', 'kacab'])
                ->where('jenis_kelas', 'custom')
                ->where('is_active', true)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->when($companyId && Schema::hasColumn('kelas', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                });

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

            $jenjang = Jenjang::find($request->id_jenjang);
            $tingkatRange = $this->getTingkatRangeForJenjang($jenjang);

            if ($request->filled('tingkat') && $tingkatRange) {
                if ($request->tingkat < $tingkatRange['min'] || $request->tingkat > $tingkatRange['max']) {
                    $message = sprintf(
                        'Tingkat untuk jenjang %s harus antara %d dan %d',
                        $jenjang->kode_jenjang ?? $jenjang->nama_jenjang,
                        $tingkatRange['min'],
                        $tingkatRange['max']
                    );

                    return response()->json([
                        'status' => 'error',
                        'message' => $message,
                        'errors' => [
                            'tingkat' => [$message]
                        ]
                    ], 422);
                }
            }

            $adminCabang = $this->getAdminCabang();
            if (!$adminCabang) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Admin cabang tidak ditemukan'
                ], 404);
            }
            $companyId = $this->companyId($adminCabang->company_id ?? null);

            // Check duplicate name within jenjang and cabang
            $exists = Kelas::where('id_jenjang', $request->id_jenjang)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->when($companyId && Schema::hasColumn('kelas', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
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
                ->when($companyId && Schema::hasColumn('kelas', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->max('urutan') + 1;

            $kelasCustom = Kelas::create([
                'id_jenjang' => $request->id_jenjang,
                'id_kacab' => $adminCabang->id_kacab,
                'company_id' => $companyId,
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
            $companyId = $this->companyId($adminCabang->company_id ?? null);

            $kelasCustom = Kelas::where('id_kelas', $id)
                ->where('jenis_kelas', 'custom')
                ->where('id_kacab', $adminCabang->id_kacab)
                ->when($companyId && Schema::hasColumn('kelas', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->firstOrFail();

            $kelasCustom->loadMissing('jenjang');

            $validator = Validator::make($request->all(), [
                'id_jenjang' => 'sometimes|exists:jenjang,id_jenjang',
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

            $targetJenjangId = $request->input('id_jenjang', $kelasCustom->id_jenjang);
            $jenjang = $targetJenjangId ? Jenjang::find($targetJenjangId) : null;
            $tingkatRange = $this->getTingkatRangeForJenjang($jenjang ?? $kelasCustom->jenjang);

            if ($request->filled('tingkat') && $tingkatRange) {
                if ($request->tingkat < $tingkatRange['min'] || $request->tingkat > $tingkatRange['max']) {
                    $jenjangLabel = $jenjang?->kode_jenjang
                        ?? $jenjang?->nama_jenjang
                        ?? optional($kelasCustom->jenjang)->kode_jenjang
                        ?? optional($kelasCustom->jenjang)->nama_jenjang
                        ?? 'tertentu';

                    $message = sprintf(
                        'Tingkat untuk jenjang %s harus antara %d dan %d',
                        $jenjangLabel,
                        $tingkatRange['min'],
                        $tingkatRange['max']
                    );

                    return response()->json([
                        'status' => 'error',
                        'message' => $message,
                        'errors' => [
                            'tingkat' => [$message]
                        ]
                    ], 422);
                }
            }

            // Check duplicate name within jenjang and cabang (exclude current)
            $exists = Kelas::where('id_jenjang', $targetJenjangId)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->when($companyId && Schema::hasColumn('kelas', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
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
                'id_jenjang' => $targetJenjangId,
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
            $companyId = $this->companyId($adminCabang->company_id ?? null);

            $kelasCustom = Kelas::where('id_kelas', $id)
                ->where('jenis_kelas', 'custom')
                ->where('id_kacab', $adminCabang->id_kacab)
                ->when($companyId && Schema::hasColumn('kelas', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
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
            $companyId = $this->companyId($adminCabang->company_id ?? null);

            $query = MataPelajaran::with(['jenjang', 'kacab'])
                ->where('status', 'active')
                ->where('id_kacab', $adminCabang->id_kacab)
                ->when($companyId && Schema::hasColumn('mata_pelajaran', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                });

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
            $companyId = $this->companyId($adminCabang->company_id ?? null);
            
            $targetJenjang = $this->normalizeTargetArray($request->input('target_jenjang'));
            $targetKelas = $this->normalizeTargetArray($request->input('target_kelas'));

            $mataPelajaranCustom = MataPelajaran::create([
                'nama_mata_pelajaran' => $request->nama_mata_pelajaran,
                'kode_mata_pelajaran' => $request->kode_mata_pelajaran,
                'kategori' => $request->kategori,
                'deskripsi' => $request->deskripsi,
                'status' => 'active',
                'id_kacab' => $adminCabang->id_kacab,
                'id_jenjang' => $request->id_jenjang,
                'is_global' => $request->is_global ?? false,
                'target_jenjang' => $targetJenjang,
                'target_kelas' => $targetKelas,
                'company_id' => $companyId,
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
            $companyId = $this->companyId($adminCabang->company_id ?? null);
            
            $mataPelajaranCustom = MataPelajaran::where('id_mata_pelajaran', $id)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->when($companyId && Schema::hasColumn('mata_pelajaran', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
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

            $targetJenjang = $this->normalizeTargetArray($request->input('target_jenjang'));
            $targetKelas = $this->normalizeTargetArray($request->input('target_kelas'));

            $mataPelajaranCustom->update([
                'nama_mata_pelajaran' => $request->nama_mata_pelajaran,
                'kode_mata_pelajaran' => $request->kode_mata_pelajaran,
                'kategori' => $request->kategori,
                'deskripsi' => $request->deskripsi,
                'id_jenjang' => $request->id_jenjang,
                'is_global' => $request->is_global ?? $mataPelajaranCustom->is_global,
                'target_jenjang' => $targetJenjang,
                'target_kelas' => $targetKelas,
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
            $companyId = $this->companyId($adminCabang->company_id ?? null);
            
            $mataPelajaranCustom = MataPelajaran::where('id_mata_pelajaran', $id)
                ->where('id_kacab', $adminCabang->id_kacab)
                ->when($companyId && Schema::hasColumn('mata_pelajaran', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
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
            $companyId = $this->companyId($adminCabang->company_id ?? null);

            $data = [];

            // Get jenjang list
            $data['jenjang'] = Jenjang::active()
                ->select('id_jenjang', 'nama_jenjang', 'kode_jenjang')
                ->orderBy('urutan')
                ->get()
                ->map(function (Jenjang $jenjang) {
                    $kodeJenjang = strtoupper((string) $jenjang->kode_jenjang);
                    $tingkatRange = self::JENJANG_TINGKAT_RANGE[$kodeJenjang] ?? null;

                    $minTingkat = $tingkatRange['min'] ?? null;
                    $maxTingkat = $tingkatRange['max'] ?? null;
                    $allowedTingkat = ($minTingkat !== null && $maxTingkat !== null)
                        ? range($minTingkat, $maxTingkat)
                        : [];

                    $existingMetadata = $jenjang->metadata ?? null;
                    if (is_string($existingMetadata)) {
                        $decoded = json_decode($existingMetadata, true);
                        $existingMetadata = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
                    }

                    $metadata = is_array($existingMetadata) ? $existingMetadata : [];

                    $rangeMetadata = array_filter([
                        'min_tingkat' => $minTingkat,
                        'max_tingkat' => $maxTingkat,
                        'allowed_tingkat' => !empty($allowedTingkat) ? $allowedTingkat : null,
                        'tingkat_range' => ($minTingkat !== null && $maxTingkat !== null) ? [
                            'min' => $minTingkat,
                            'max' => $maxTingkat,
                            'allowed' => $allowedTingkat,
                        ] : null,
                    ], fn ($value) => $value !== null);

                    $metadata = array_merge($metadata, $rangeMetadata);
                    $metadata = empty($metadata) ? (object) [] : $metadata;

                    return [
                        'id_jenjang' => $jenjang->id_jenjang,
                        'nama_jenjang' => $jenjang->nama_jenjang,
                        'kode_jenjang' => $jenjang->kode_jenjang,
                        'min_tingkat' => $minTingkat,
                        'max_tingkat' => $maxTingkat,
                        'allowed_tingkat' => $allowedTingkat,
                        'metadata' => $metadata,
                    ];
                })
                ->values();

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
                    ->when($companyId && Schema::hasColumn('kelas', 'company_id'), function ($q) use ($companyId) {
                        $q->where('company_id', $companyId);
                    })
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

    /**
     * Ambil company id dari SSO context atau fallback admin cabang.
     */
    private function companyId(?int $fallback = null): ?int
    {
        if (app()->bound(SsoContext::class) && app(SsoContext::class)->company()) {
            return app(SsoContext::class)->company()->id;
        }

        return $fallback;
    }
}
