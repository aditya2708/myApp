<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use App\Models\Jenjang;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\Materi;
use App\Models\TemplateAdoption;
use App\Support\AdminCabangScope;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Exception;

class HierarchyController extends Controller
{
    use AdminCabangScope;

    /**
     * Get full kurikulum structure with counts
     */
    public function getStruktur(Request $request): JsonResponse
    {
        try {
            $adminCabang = auth()->user()->adminCabang;
            $kacabId = $adminCabang->id_kacab;
            $companyId = $this->companyId($adminCabang->company_id ?? null);
            $cacheKey = "kurikulum_struktur_{$kacabId}_" . ($companyId ?? 'none');

            $struktur = Cache::remember($cacheKey, 300, function () use ($kacabId, $companyId) {
                $jenjangList = $this->applyCompanyScope(
                    Jenjang::active()
                        ->with(['kelas' => function($query) use ($companyId) {
                            $this->applyCompanyScope($query, $companyId, 'kelas');
                            $query->active()->orderBy('urutan');
                        }])
                        ->orderBy('urutan'),
                    $companyId
                )->get();

                $result = [];

                foreach ($jenjangList as $jenjang) {
                    // Count mata pelajaran untuk jenjang ini (ONCE per jenjang, not per kelas)
                    $mataPelajaranCountJenjang = $this->applyCompanyScope(
                        MataPelajaran::where('id_jenjang', $jenjang->id_jenjang)
                            ->where(function($q) use ($kacabId) {
                            $q->where('is_global', true)
                              ->orWhere('id_kacab', $kacabId);
                        })
                            ->active(),
                        $companyId,
                        'mata_pelajaran'
                    )->count();

                    $jenjangData = [
                        'id_jenjang' => $jenjang->id_jenjang,
                        'nama_jenjang' => $jenjang->nama_jenjang,
                        'kode_jenjang' => $jenjang->kode_jenjang,
                        'deskripsi' => $jenjang->deskripsi,
                        'kelas_count' => 0,
                        'mata_pelajaran_count' => $mataPelajaranCountJenjang, // Set once per jenjang
                        'materi_count' => 0,
                        'pending_templates_count' => 0,
                        'kelas' => []
                    ];

                    foreach ($jenjang->kelas as $kelas) {

                        // Count materi untuk kelas ini
                        $materiCount = $this->applyCompanyScope(
                            Materi::where('id_kelas', $kelas->id_kelas)
                                ->where('id_kacab', $kacabId),
                            $companyId,
                            'materi'
                        )->count();

                        // Count pending templates untuk kelas ini
                        $pendingTemplatesCount = $this->applyCompanyScope(
                            TemplateAdoption::where('id_kacab', $kacabId)
                                ->whereHas('templateMateri', function($q) use ($kelas, $companyId) {
                                $q->where('id_kelas', $kelas->id_kelas);
                                $this->applyCompanyScope($q, $companyId, 'template_materi');
                            })
                                ->pending(),
                            $companyId,
                            'template_adoptions'
                        )->count();

                        $kelasData = [
                            'id_kelas' => $kelas->id_kelas,
                            'nama_kelas' => $kelas->nama_kelas,
                            'tingkat' => $kelas->tingkat,
                            'jenis_kelas' => $kelas->jenis_kelas,
                            'is_custom' => $kelas->is_custom,
                            'mata_pelajaran_count' => $mataPelajaranCountJenjang, // Same count for all kelas in jenjang
                            'materi_count' => $materiCount,
                            'pending_templates_count' => $pendingTemplatesCount
                        ];

                        $jenjangData['kelas'][] = $kelasData;
                        // DO NOT add mata_pelajaran_count again - already set once per jenjang
                        $jenjangData['materi_count'] += $materiCount;
                        $jenjangData['pending_templates_count'] += $pendingTemplatesCount;
                    }

                    $jenjangData['kelas_count'] = count($jenjangData['kelas']);
                    $result[] = $jenjangData;
                }

                return $result;
            });

            return response()->json([
                'success' => true,
                'data' => $struktur,
                'message' => 'Struktur kurikulum berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil struktur kurikulum',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get kelas list per jenjang
     */
    public function getKelas($jenjangId, Request $request): JsonResponse
    {
        try {
            $adminCabang = auth()->user()->adminCabang;
            $kacabId = $adminCabang->id_kacab;
            $companyId = $this->companyId($adminCabang->company_id ?? null);
            $includeCustom = $request->get('include_custom', true);

            $query = $this->applyCompanyScope(
                Kelas::where('id_jenjang', $jenjangId)
                    ->active()
                    ->orderBy('urutan'),
                $companyId,
                'kelas'
            );

            if (!$includeCustom) {
                $query->standard();
            }

            $kelasList = $query->get();

            $result = [];

            foreach ($kelasList as $kelas) {
                // Count mata pelajaran untuk kelas ini
                $mataPelajaranCount = $this->applyCompanyScope(
                    MataPelajaran::where('id_jenjang', $jenjangId)
                        ->where(function($q) use ($kacabId) {
                        $q->where('is_global', true)
                          ->orWhere('id_kacab', $kacabId);
                    })
                        ->active(),
                    $companyId,
                    'mata_pelajaran'
                )->count();

                // Count materi untuk kelas ini
                $materiCount = $this->applyCompanyScope(
                    Materi::where('id_kelas', $kelas->id_kelas)
                        ->where('id_kacab', $kacabId),
                    $companyId,
                    'materi'
                )->count();

                // Count pending templates untuk kelas ini
                $pendingTemplatesCount = $this->applyCompanyScope(
                    TemplateAdoption::where('id_kacab', $kacabId)
                        ->whereHas('templateMateri', function($q) use ($kelas, $companyId) {
                        $q->where('id_kelas', $kelas->id_kelas);
                        $this->applyCompanyScope($q, $companyId, 'template_materi');
                    })
                        ->pending(),
                    $companyId,
                    'template_adoptions'
                )->count();

                $result[] = [
                    'id_kelas' => $kelas->id_kelas,
                    'id_jenjang' => $kelas->id_jenjang,
                    'nama_kelas' => $kelas->nama_kelas,
                    'tingkat' => $kelas->tingkat,
                    'jenis_kelas' => $kelas->jenis_kelas,
                    'is_custom' => $kelas->is_custom,
                    'is_global' => $kelas->is_global,
                    'deskripsi' => $kelas->deskripsi,
                    'mata_pelajaran_count' => $mataPelajaranCount,
                    'materi_count' => $materiCount,
                    'pending_templates_count' => $pendingTemplatesCount
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Kelas berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil kelas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get mata pelajaran list per kelas
     */
    public function getMataPelajaran($kelasId, Request $request): JsonResponse
    {
        try {
            $adminCabang = auth()->user()->adminCabang;
            $kacabId = $adminCabang->id_kacab;
            $companyId = $this->companyId($adminCabang->company_id ?? null);
            $includeCustom = $request->get('include_custom', true);

            // Get kelas info to get jenjang
            $kelas = $this->applyCompanyScope(Kelas::query(), $companyId, 'kelas')->findOrFail($kelasId);

            $query = $this->applyCompanyScope(
                MataPelajaran::where('id_jenjang', $kelas->id_jenjang)
                    ->where(function($q) use ($kacabId, $includeCustom) {
                    $q->where('is_global', true);
                    if ($includeCustom) {
                        $q->orWhere('id_kacab', $kacabId);
                    }
                })
                ->active()
                ->with(['jenjang'])
                ->orderBy('nama_mata_pelajaran'),
                $companyId,
                'mata_pelajaran'
            );

            $mataPelajaranList = $query->get();

            $result = [];

            foreach ($mataPelajaranList as $mataPelajaran) {
                // Count materi untuk mata pelajaran dan kelas ini
                $materiCount = $this->applyCompanyScope(
                    Materi::where('id_mata_pelajaran', $mataPelajaran->id_mata_pelajaran)
                        ->where('id_kelas', $kelasId)
                        ->where('id_kacab', $kacabId),
                    $companyId,
                    'materi'
                )->count();

                // Count pending templates untuk mata pelajaran dan kelas ini
                $pendingTemplatesCount = $this->applyCompanyScope(
                    TemplateAdoption::where('id_kacab', $kacabId)
                        ->whereHas('templateMateri', function($q) use ($mataPelajaran, $kelasId, $companyId) {
                        $q->where('id_mata_pelajaran', $mataPelajaran->id_mata_pelajaran)
                          ->where('id_kelas', $kelasId);
                        $this->applyCompanyScope($q, $companyId, 'template_materi');
                    })
                        ->pending(),
                    $companyId,
                    'template_adoptions'
                )->count();

                $result[] = [
                    'id_mata_pelajaran' => $mataPelajaran->id_mata_pelajaran,
                    'id_jenjang' => $mataPelajaran->id_jenjang,
                    'nama_mata_pelajaran' => $mataPelajaran->nama_mata_pelajaran,
                    'kode_mata_pelajaran' => $mataPelajaran->kode_mata_pelajaran,
                    'kategori' => $mataPelajaran->kategori,
                    'deskripsi' => $mataPelajaran->deskripsi,
                    'is_global' => $mataPelajaran->is_global,
                    'id_kacab' => $mataPelajaran->id_kacab,
                    'materi_count' => $materiCount,
                    'pending_templates_count' => $pendingTemplatesCount,
                    'jenjang' => $mataPelajaran->jenjang
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Mata pelajaran berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil mata pelajaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get mata pelajaran stats with templates info
     */
    public function getMataPelajaranStats($mataPelajaranId, $kelasId, Request $request): JsonResponse
    {
        try {
            $adminCabang = auth()->user()->adminCabang;
            $kacabId = $adminCabang->id_kacab;
            $companyId = $this->companyId($adminCabang->company_id ?? null);

            $mataPelajaran = $this->applyCompanyScope(
                MataPelajaran::with(['jenjang']),
                $companyId,
                'mata_pelajaran'
            )->findOrFail($mataPelajaranId);

            $kelas = $this->applyCompanyScope(
                Kelas::with(['jenjang']),
                $companyId,
                'kelas'
            )->findOrFail($kelasId);

            // Get materi count
            $materiCount = $this->applyCompanyScope(
                Materi::where('id_mata_pelajaran', $mataPelajaranId)
                    ->where('id_kelas', $kelasId)
                    ->where('id_kacab', $kacabId),
                $companyId,
                'materi'
            )->count();

            // Get materi from template count
            $materiFromTemplateCount = $this->applyCompanyScope(
                Materi::where('id_mata_pelajaran', $mataPelajaranId)
                    ->where('id_kelas', $kelasId)
                    ->where('id_kacab', $kacabId)
                    ->fromTemplate(),
                $companyId,
                'materi'
            )->count();

            // Get custom materi count
            $customMateriCount = $this->applyCompanyScope(
                Materi::where('id_mata_pelajaran', $mataPelajaranId)
                    ->where('id_kelas', $kelasId)
                    ->where('id_kacab', $kacabId)
                    ->custom(),
                $companyId,
                'materi'
            )->count();

            // Get pending templates count
            $pendingTemplatesCount = $this->applyCompanyScope(
                TemplateAdoption::where('id_kacab', $kacabId)
                    ->whereHas('templateMateri', function($q) use ($mataPelajaranId, $kelasId, $companyId) {
                    $q->where('id_mata_pelajaran', $mataPelajaranId)
                      ->where('id_kelas', $kelasId);
                    $this->applyCompanyScope($q, $companyId, 'template_materi');
                })
                    ->pending(),
                $companyId,
                'template_adoptions'
            )->count();

            // Get adopted templates count
            $adoptedTemplatesCount = $this->applyCompanyScope(
                TemplateAdoption::where('id_kacab', $kacabId)
                    ->whereHas('templateMateri', function($q) use ($mataPelajaranId, $kelasId, $companyId) {
                    $q->where('id_mata_pelajaran', $mataPelajaranId)
                      ->where('id_kelas', $kelasId);
                    $this->applyCompanyScope($q, $companyId, 'template_materi');
                })
                    ->adopted(),
                $companyId,
                'template_adoptions'
            )->count();

            $result = [
                'mata_pelajaran' => $mataPelajaran,
                'kelas' => $kelas,
                'stats' => [
                    'total_materi' => $materiCount,
                    'materi_from_template' => $materiFromTemplateCount,
                    'custom_materi' => $customMateriCount,
                    'pending_templates' => $pendingTemplatesCount,
                    'adopted_templates' => $adoptedTemplatesCount
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Stats mata pelajaran berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil stats mata pelajaran',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Clear hierarchy cache
     */
    public function clearCache(): JsonResponse
    {
        try {
            $adminCabang = auth()->user()->adminCabang;
            $kacabId = $adminCabang->id_kacab;
            $companyId = $this->companyId($adminCabang->company_id ?? null);
            $cacheKey = "kurikulum_struktur_{$kacabId}_" . ($companyId ?? 'none');
            
            Cache::forget($cacheKey);

            return response()->json([
                'success' => true,
                'message' => 'Cache berhasil dibersihkan'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membersihkan cache',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
