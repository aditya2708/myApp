<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use App\Models\Jenjang;
use App\Models\Kelas;
use App\Models\MataPelajaran;
use App\Models\TemplateMateri;
use App\Models\TemplateAdoption;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HierarchyController extends Controller
{
    /**
     * Get full hierarchy structure with template counts
     */
    public function getStruktur(): JsonResponse
    {
        try {
            $cacheKey = 'admin_pusat_hierarchy_struktur';
            
            $struktur = Cache::remember($cacheKey, 300, function () { // 5 minute cache
                return Jenjang::active()
                    ->with([
                        'kelas' => function($query) {
                            $query->active()->orderBy('urutan');
                        }
                    ])
                    ->orderBy('urutan')
                    ->get()
                    ->map(function($jenjang) {
                        // Add template statistics for jenjang
                        $jenjang->template_stats = [
                            'total_templates' => TemplateMateri::whereHas('kelas', function($q) use ($jenjang) {
                                $q->where('id_jenjang', $jenjang->id_jenjang);
                            })->count(),
                            'active_templates' => TemplateMateri::where('is_active', true)
                                ->whereHas('kelas', function($q) use ($jenjang) {
                                    $q->where('id_jenjang', $jenjang->id_jenjang);
                                })->count(),
                            'distributed_templates' => TemplateMateri::whereHas('templateAdoptions')
                                ->whereHas('kelas', function($q) use ($jenjang) {
                                    $q->where('id_jenjang', $jenjang->id_jenjang);
                                })->count()
                        ];

                        // Add template statistics for each kelas
                        $jenjang->kelas = $jenjang->kelas->map(function($kelas) {
                            $kelas->template_stats = [
                                'total_templates' => TemplateMateri::where('id_kelas', $kelas->id_kelas)->count(),
                                'active_templates' => TemplateMateri::where('id_kelas', $kelas->id_kelas)
                                    ->where('is_active', true)->count(),
                                'distributed_templates' => TemplateMateri::where('id_kelas', $kelas->id_kelas)
                                    ->whereHas('templateAdoptions')->count()
                            ];

                            // Get mata pelajaran for this kelas through jenjang relationship
                            $mataPelajaranList = MataPelajaran::where('id_jenjang', $kelas->id_jenjang)
                                ->where(function($query) {
                                    $query->where('is_global', true)
                                          ->orWhereNotNull('id_kacab'); // Include all kacab-specific subjects for template management
                                })
                                ->where('status', 'active')
                                ->get()
                                ->map(function($mataPelajaran) use ($kelas) {
                                    $mataPelajaran->template_stats = [
                                        'total_templates' => TemplateMateri::where('id_mata_pelajaran', $mataPelajaran->id_mata_pelajaran)
                                            ->where('id_kelas', $kelas->id_kelas)->count(),
                                        'active_templates' => TemplateMateri::where('id_mata_pelajaran', $mataPelajaran->id_mata_pelajaran)
                                            ->where('id_kelas', $kelas->id_kelas)
                                            ->where('is_active', true)->count(),
                                        'adoption_rate' => $this->calculateMataPelajaranAdoptionRate($mataPelajaran->id_mata_pelajaran, $kelas->id_kelas)
                                    ];

                                    return $mataPelajaran;
                                });
                            
                            $kelas->mataPelajaran = $mataPelajaranList;

                            return $kelas;
                        });

                        return $jenjang;
                    });
            });

            return response()->json([
                'success' => true,
                'data' => $struktur,
                'message' => 'Hierarchy structure retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve hierarchy structure',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get kelas per jenjang for template management
     */
    public function getKelas($jenjangId): JsonResponse
    {
        try {
            $jenjang = Jenjang::find($jenjangId);

            if (!$jenjang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jenjang not found',
                    'error' => 'Jenjang with ID ' . $jenjangId . ' does not exist'
                ], 404);
            }

            $kelasList = Kelas::where('id_jenjang', $jenjangId)
                ->active()
                ->orderBy('urutan')
                ->get()
                ->map(function($kelas) {
                    // Add template statistics
                    $kelas->template_stats = [
                        'total_templates' => TemplateMateri::where('id_kelas', $kelas->id_kelas)->count(),
                        'active_templates' => TemplateMateri::where('id_kelas', $kelas->id_kelas)
                            ->where('is_active', true)->count(),
                        'distributed_templates' => TemplateMateri::where('id_kelas', $kelas->id_kelas)
                            ->whereHas('templateAdoptions')->count(),
                        'pending_distributions' => TemplateAdoption::whereHas('templateMateri', function($q) use ($kelas) {
                            $q->where('id_kelas', $kelas->id_kelas);
                        })->where('status', 'pending')->count()
                    ];

                    // Calculate overall adoption rate for this kelas
                    $totalDistributions = TemplateAdoption::whereHas('templateMateri', function($q) use ($kelas) {
                        $q->where('id_kelas', $kelas->id_kelas);
                    })->count();

                    $adoptedDistributions = TemplateAdoption::whereHas('templateMateri', function($q) use ($kelas) {
                        $q->where('id_kelas', $kelas->id_kelas);
                    })->whereIn('status', ['adopted', 'customized'])->count();

                    $kelas->adoption_rate = $totalDistributions > 0 
                        ? round(($adoptedDistributions / $totalDistributions) * 100, 2) 
                        : 0;

                    return $kelas;
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'jenjang' => $jenjang,
                    'kelas_list' => $kelasList
                ],
                'message' => 'Kelas list retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve kelas list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get mata pelajaran per kelas for template management
     */
    public function getMataPelajaran($kelasId): JsonResponse
    {
        try {
            $kelas = Kelas::with('jenjang')->find($kelasId);

            if (!$kelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kelas not found',
                    'error' => 'Kelas with ID ' . $kelasId . ' does not exist'
                ], 404);
            }

            $mataPelajaranList = MataPelajaran::active()
                ->where(function($query) use ($kelas) {
                    // Global mata pelajaran OR specific to this jenjang
                    $query->where('is_global', true)
                          ->orWhere('id_jenjang', $kelas->id_jenjang);
                })
                ->orderBy('nama_mata_pelajaran')
                ->get()
                ->map(function($mataPelajaran) use ($kelasId) {
                    // Add template statistics for this mata pelajaran + kelas combination
                    $mataPelajaran->template_stats = [
                        'total_templates' => TemplateMateri::where('id_mata_pelajaran', $mataPelajaran->id_mata_pelajaran)
                            ->where('id_kelas', $kelasId)->count(),
                        'active_templates' => TemplateMateri::where('id_mata_pelajaran', $mataPelajaran->id_mata_pelajaran)
                            ->where('id_kelas', $kelasId)
                            ->where('is_active', true)->count(),
                        'distributed_templates' => TemplateMateri::where('id_mata_pelajaran', $mataPelajaran->id_mata_pelajaran)
                            ->where('id_kelas', $kelasId)
                            ->whereHas('templateAdoptions')->count()
                    ];

                    // Calculate adoption statistics
                    $adoptionStats = $this->getDetailedAdoptionStats($mataPelajaran->id_mata_pelajaran, $kelasId);
                    $mataPelajaran->adoption_stats = $adoptionStats;

                    return $mataPelajaran;
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'kelas' => $kelas,
                    'mata_pelajaran_list' => $mataPelajaranList
                ],
                'message' => 'Mata pelajaran list retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve mata pelajaran list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get template statistics for specific mata pelajaran + kelas
     */
    public function getTemplateStats($mataPelajaranId, $kelasId): JsonResponse
    {
        try {
            $mataPelajaran = MataPelajaran::find($mataPelajaranId);
            $kelas = Kelas::with('jenjang')->find($kelasId);

            if (!$mataPelajaran) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mata Pelajaran not found',
                    'error' => 'Mata Pelajaran with ID ' . $mataPelajaranId . ' does not exist'
                ], 404);
            }

            if (!$kelas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kelas not found',
                    'error' => 'Kelas with ID ' . $kelasId . ' does not exist'
                ], 404);
            }

            // Basic template counts
            $templateStats = [
                'total_templates' => TemplateMateri::where('id_mata_pelajaran', $mataPelajaranId)
                    ->where('id_kelas', $kelasId)->count(),
                'active_templates' => TemplateMateri::where('id_mata_pelajaran', $mataPelajaranId)
                    ->where('id_kelas', $kelasId)
                    ->where('is_active', true)->count(),
                'inactive_templates' => TemplateMateri::where('id_mata_pelajaran', $mataPelajaranId)
                    ->where('id_kelas', $kelasId)
                    ->where('is_active', false)->count()
            ];

            // Distribution and adoption statistics
            $distributionStats = TemplateAdoption::whereHas('templateMateri', function($q) use ($mataPelajaranId, $kelasId) {
                $q->where('id_mata_pelajaran', $mataPelajaranId)
                  ->where('id_kelas', $kelasId);
            })
            ->selectRaw('
                count(*) as total_distributions,
                sum(case when status = "pending" then 1 else 0 end) as pending,
                sum(case when status = "adopted" then 1 else 0 end) as adopted,
                sum(case when status = "customized" then 1 else 0 end) as customized,
                sum(case when status = "skipped" then 1 else 0 end) as skipped
            ')
            ->first();

            $totalAdopted = ($distributionStats->adopted ?? 0) + ($distributionStats->customized ?? 0);
            $adoptionRate = ($distributionStats->total_distributions ?? 0) > 0 
                ? round(($totalAdopted / $distributionStats->total_distributions) * 100, 2) 
                : 0;

            // Top performing templates in this category
            $topTemplates = TemplateMateri::where('id_mata_pelajaran', $mataPelajaranId)
                ->where('id_kelas', $kelasId)
                ->withCount([
                    'templateAdoptions as distribution_count',
                    'templateAdoptions as adoption_count' => function($q) {
                        $q->whereIn('status', ['adopted', 'customized']);
                    }
                ])
                ->having('distribution_count', '>', 0)
                ->get()
                ->map(function($template) {
                    $template->adoption_rate = $template->distribution_count > 0 
                        ? round(($template->adoption_count / $template->distribution_count) * 100, 2) 
                        : 0;
                    return $template;
                })
                ->sortByDesc('adoption_rate')
                ->take(5)
                ->values();

            // Recent activity
            $recentActivity = TemplateAdoption::whereHas('templateMateri', function($q) use ($mataPelajaranId, $kelasId) {
                $q->where('id_mata_pelajaran', $mataPelajaranId)
                  ->where('id_kelas', $kelasId);
            })
            ->with(['templateMateri', 'kacab'])
            ->orderBy('updated_at', 'desc')
            ->take(10)
            ->get();

            $detailedStats = [
                'context' => [
                    'mata_pelajaran' => $mataPelajaran,
                    'kelas' => $kelas
                ],
                'template_summary' => $templateStats,
                'distribution_summary' => [
                    'total_distributions' => $distributionStats->total_distributions ?? 0,
                    'pending' => $distributionStats->pending ?? 0,
                    'adopted' => $distributionStats->adopted ?? 0,
                    'customized' => $distributionStats->customized ?? 0,
                    'skipped' => $distributionStats->skipped ?? 0,
                    'adoption_rate' => $adoptionRate
                ],
                'top_performing_templates' => $topTemplates,
                'recent_activity' => $recentActivity
            ];

            return response()->json([
                'success' => true,
                'data' => $detailedStats,
                'message' => 'Template statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve template statistics',
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
            Cache::forget('admin_pusat_hierarchy_struktur');
            
            return response()->json([
                'success' => true,
                'message' => 'Hierarchy cache cleared successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate adoption rate for mata pelajaran + kelas combination
     */
    private function calculateMataPelajaranAdoptionRate($mataPelajaranId, $kelasId): float
    {
        $totalDistributions = TemplateAdoption::whereHas('templateMateri', function($q) use ($mataPelajaranId, $kelasId) {
            $q->where('id_mata_pelajaran', $mataPelajaranId)
              ->where('id_kelas', $kelasId);
        })->count();

        if ($totalDistributions === 0) {
            return 0;
        }

        $adoptedDistributions = TemplateAdoption::whereHas('templateMateri', function($q) use ($mataPelajaranId, $kelasId) {
            $q->where('id_mata_pelajaran', $mataPelajaranId)
              ->where('id_kelas', $kelasId);
        })->whereIn('status', ['adopted', 'customized'])->count();

        return round(($adoptedDistributions / $totalDistributions) * 100, 2);
    }

    /**
     * Get detailed adoption statistics for mata pelajaran + kelas
     */
    private function getDetailedAdoptionStats($mataPelajaranId, $kelasId): array
    {
        $adoptionData = TemplateAdoption::whereHas('templateMateri', function($q) use ($mataPelajaranId, $kelasId) {
            $q->where('id_mata_pelajaran', $mataPelajaranId)
              ->where('id_kelas', $kelasId);
        })
        ->selectRaw('
            count(*) as total_distributions,
            sum(case when status = "pending" then 1 else 0 end) as pending,
            sum(case when status = "adopted" then 1 else 0 end) as adopted,
            sum(case when status = "customized" then 1 else 0 end) as customized,
            sum(case when status = "skipped" then 1 else 0 end) as skipped
        ')
        ->first();

        $totalAdopted = ($adoptionData->adopted ?? 0) + ($adoptionData->customized ?? 0);
        $adoptionRate = ($adoptionData->total_distributions ?? 0) > 0 
            ? round(($totalAdopted / $adoptionData->total_distributions) * 100, 2) 
            : 0;

        return [
            'total_distributions' => $adoptionData->total_distributions ?? 0,
            'pending' => $adoptionData->pending ?? 0,
            'adopted' => $adoptionData->adopted ?? 0,
            'customized' => $adoptionData->customized ?? 0,
            'skipped' => $adoptionData->skipped ?? 0,
            'total_adopted' => $totalAdopted,
            'adoption_rate' => $adoptionRate
        ];
    }
}