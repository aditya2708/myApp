<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use App\Models\TemplateMateri;
use App\Models\TemplateAdoption;
use App\Models\Kacab;
use App\Models\Materi;
use App\Support\AdminPusatScope;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MonitoringController extends Controller
{
    use AdminPusatScope;

    /**
     * Get dashboard overview statistics
     */
    public function getDashboardStats(): JsonResponse
    {
        try {
            $companyId = $this->companyId();
            // Basic counts
            $totalTemplates = $this->applyCompanyScope(TemplateMateri::query(), $companyId, 'template_materi')->count();
            $activeTemplates = $this->applyCompanyScope(TemplateMateri::where('is_active', true), $companyId, 'template_materi')->count();
            $totalDistributions = $this->applyCompanyScope(TemplateAdoption::query(), $companyId, 'template_adoptions')->count();
            $totalCabang = $this->applyCompanyScope(Kacab::where('status', 'active'), $companyId, 'kacab')->count();

            // Adoption statistics
            $adoptionStats = $this->applyCompanyScope(
                TemplateAdoption::select('status', DB::raw('count(*) as count')),
                $companyId,
                'template_adoptions'
            )
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $pending = $adoptionStats['pending'] ?? 0;
            $adopted = $adoptionStats['adopted'] ?? 0;
            $customized = $adoptionStats['customized'] ?? 0;
            $skipped = $adoptionStats['skipped'] ?? 0;

            // Overall adoption rate
            $totalAdopted = $adopted + $customized;
            $overallAdoptionRate = $totalDistributions > 0 
                ? round(($totalAdopted / $totalDistributions) * 100, 2) 
                : 0;

            // Recent activity (last 30 days)
            $recentDistributions = $this->applyCompanyScope(
                TemplateAdoption::where('created_at', '>=', Carbon::now()->subDays(30)),
                $companyId,
                'template_adoptions'
            )->count();

            $recentAdoptions = $this->applyCompanyScope(
                TemplateAdoption::whereIn('status', ['adopted', 'customized'])
                    ->where('adopted_at', '>=', Carbon::now()->subDays(30)),
                $companyId,
                'template_adoptions'
            )->count();

            // Most active cabang (by adoption rate)
            $topCabang = $this->applyCompanyScope(Kacab::withCount([
                'templateAdoptions as total_received',
                'templateAdoptions as adopted_count' => function($q) {
                    $q->whereIn('status', ['adopted', 'customized']);
                }
            ]), $companyId, 'kacab')
            ->having('total_received', '>', 0)
            ->get()
            ->map(function($cabang) {
                $cabang->adoption_rate = round(($cabang->adopted_count / $cabang->total_received) * 100, 2);
                return $cabang;
            })
            ->sortByDesc('adoption_rate')
            ->take(5)
            ->values();

            // Most distributed templates
            $topTemplates = $this->applyCompanyScope(TemplateMateri::withCount([
                'templateAdoptions as distribution_count',
                'templateAdoptions as adoption_count' => function($q) {
                    $q->whereIn('status', ['adopted', 'customized']);
                }
            ]), $companyId, 'template_materi')
            ->having('distribution_count', '>', 0)
            ->orderByDesc('distribution_count')
            ->take(5)
            ->get()
            ->map(function($template) {
                $template->adoption_rate = $template->distribution_count > 0 
                    ? round(($template->adoption_count / $template->distribution_count) * 100, 2) 
                    : 0;
                return $template;
            });

            $dashboardData = [
                'overview' => [
                    'total_templates' => $totalTemplates,
                    'active_templates' => $activeTemplates,
                    'total_distributions' => $totalDistributions,
                    'total_cabang' => $totalCabang,
                    'overall_adoption_rate' => $overallAdoptionRate
                ],
                'adoption_breakdown' => [
                    'pending' => $pending,
                    'adopted' => $adopted,
                    'customized' => $customized,
                    'skipped' => $skipped,
                    'total_adopted' => $totalAdopted
                ],
                'recent_activity' => [
                    'distributions_last_30_days' => $recentDistributions,
                    'adoptions_last_30_days' => $recentAdoptions
                ],
                'top_performing' => [
                    'cabang' => $topCabang,
                    'templates' => $topTemplates
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $dashboardData,
                'message' => 'Dashboard statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve dashboard statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get adoption rates per cabang
     */
    public function getCabangAdoptionRates(Request $request): JsonResponse
    {
        try {
            $companyId = $this->companyId();
            $search = $request->query('search');
            $sortBy = $request->query('sort_by', 'adoption_rate'); // adoption_rate, nama_kacab, total_received
            $sortOrder = $request->query('sort_order', 'desc');

            $query = $this->applyCompanyScope(Kacab::where('status', 'active'), $companyId, 'kacab')
                ->withCount([
                    'templateAdoptions as total_received' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                    },
                    'templateAdoptions as pending_count' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                        $q->where('status', 'pending');
                    },
                    'templateAdoptions as adopted_count' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                        $q->where('status', 'adopted');
                    },
                    'templateAdoptions as customized_count' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                        $q->where('status', 'customized');
                    },
                    'templateAdoptions as skipped_count' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                        $q->where('status', 'skipped');
                    }
                ]);

            if ($search) {
                $query->where('nama_kacab', 'like', "%{$search}%");
            }

            $cabangList = $query->get();

            // Calculate adoption rates and add statistics
            $cabangList = $cabangList->map(function($cabang) {
                $totalAdopted = $cabang->adopted_count + $cabang->customized_count;
                $cabang->total_adopted = $totalAdopted;
                
                if ($cabang->total_received > 0) {
                    $cabang->adoption_rate = round(($totalAdopted / $cabang->total_received) * 100, 2);
                    $cabang->pending_rate = round(($cabang->pending_count / $cabang->total_received) * 100, 2);
                    $cabang->skip_rate = round(($cabang->skipped_count / $cabang->total_received) * 100, 2);
                } else {
                    $cabang->adoption_rate = 0;
                    $cabang->pending_rate = 0;
                    $cabang->skip_rate = 0;
                }

                // Performance classification
                if ($cabang->adoption_rate >= 80) {
                    $cabang->performance_level = 'excellent';
                } elseif ($cabang->adoption_rate >= 60) {
                    $cabang->performance_level = 'good';
                } elseif ($cabang->adoption_rate >= 40) {
                    $cabang->performance_level = 'average';
                } else {
                    $cabang->performance_level = 'needs_improvement';
                }

                return $cabang;
            });

            // Sort results
            if ($sortBy === 'adoption_rate') {
                $cabangList = $sortOrder === 'desc' 
                    ? $cabangList->sortByDesc('adoption_rate') 
                    : $cabangList->sortBy('adoption_rate');
            } elseif ($sortBy === 'total_received') {
                $cabangList = $sortOrder === 'desc' 
                    ? $cabangList->sortByDesc('total_received') 
                    : $cabangList->sortBy('total_received');
            } else {
                $cabangList = $sortOrder === 'desc' 
                    ? $cabangList->sortByDesc('nama_kacab') 
                    : $cabangList->sortBy('nama_kacab');
            }

            // Calculate summary statistics
            $summary = [
                'total_cabang' => $cabangList->count(),
                'average_adoption_rate' => $cabangList->avg('adoption_rate'),
                'performance_distribution' => [
                    'excellent' => $cabangList->where('performance_level', 'excellent')->count(),
                    'good' => $cabangList->where('performance_level', 'good')->count(),
                    'average' => $cabangList->where('performance_level', 'average')->count(),
                    'needs_improvement' => $cabangList->where('performance_level', 'needs_improvement')->count()
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'cabang_list' => $cabangList->values(),
                    'summary' => $summary
                ],
                'message' => 'Cabang adoption rates retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cabang adoption rates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get template performance (most/least adopted)
     */
    public function getTemplatePerformance(Request $request): JsonResponse
    {
        try {
            $companyId = $this->companyId();
            $sortBy = $request->query('sort_by', 'adoption_rate'); // adoption_rate, distribution_count, nama_template
            $sortOrder = $request->query('sort_order', 'desc');
            $limit = $request->query('limit', 20);

            $templates = $this->applyCompanyScope(TemplateMateri::with(['mataPelajaran', 'kelas.jenjang']), $companyId, 'template_materi')
                ->withCount([
                    'templateAdoptions as distribution_count' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                    },
                    'templateAdoptions as pending_count' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                        $q->where('status', 'pending');
                    },
                    'templateAdoptions as adopted_count' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                        $q->where('status', 'adopted');
                    },
                    'templateAdoptions as customized_count' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                        $q->where('status', 'customized');
                    },
                    'templateAdoptions as skipped_count' => function($q) use ($companyId) {
                        $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                        $q->where('status', 'skipped');
                    }
                ])
                ->get()
                ->map(function($template) {
                    $totalAdopted = $template->adopted_count + $template->customized_count;
                    $template->total_adopted = $totalAdopted;
                    
                    if ($template->distribution_count > 0) {
                        $template->adoption_rate = round(($totalAdopted / $template->distribution_count) * 100, 2);
                        $template->skip_rate = round(($template->skipped_count / $template->distribution_count) * 100, 2);
                    } else {
                        $template->adoption_rate = 0;
                        $template->skip_rate = 0;
                    }

                    // Performance classification
                    if ($template->adoption_rate >= 80) {
                        $template->performance_level = 'high_performing';
                    } elseif ($template->adoption_rate >= 50) {
                        $template->performance_level = 'moderate_performing';
                    } elseif ($template->distribution_count > 0) {
                        $template->performance_level = 'low_performing';
                    } else {
                        $template->performance_level = 'not_distributed';
                    }

                    return $template;
                });

            // Sort templates
            if ($sortBy === 'adoption_rate') {
                $templates = $sortOrder === 'desc' 
                    ? $templates->sortByDesc('adoption_rate') 
                    : $templates->sortBy('adoption_rate');
            } elseif ($sortBy === 'distribution_count') {
                $templates = $sortOrder === 'desc' 
                    ? $templates->sortByDesc('distribution_count') 
                    : $templates->sortBy('distribution_count');
            } else {
                $templates = $sortOrder === 'desc' 
                    ? $templates->sortByDesc('nama_template') 
                    : $templates->sortBy('nama_template');
            }

            $templates = $templates->take($limit)->values();

            // Performance summary
            $allTemplates = $this->applyCompanyScope(
                TemplateMateri::withCount(['templateAdoptions as distribution_count' => function($q) use ($companyId) {
                    $this->applyCompanyScope($q, $companyId, 'template_adoptions');
                }]),
                $companyId,
                'template_materi'
            )->get();
            $performanceSummary = [
                'total_templates' => $allTemplates->count(),
                'distributed_templates' => $allTemplates->where('distribution_count', '>', 0)->count(),
                'not_distributed' => $allTemplates->where('distribution_count', 0)->count(),
                'performance_levels' => [
                    'high_performing' => $templates->where('performance_level', 'high_performing')->count(),
                    'moderate_performing' => $templates->where('performance_level', 'moderate_performing')->count(),
                    'low_performing' => $templates->where('performance_level', 'low_performing')->count(),
                    'not_distributed' => $templates->where('performance_level', 'not_distributed')->count()
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'templates' => $templates,
                    'summary' => $performanceSummary
                ],
                'message' => 'Template performance data retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve template performance',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get adoption trends over time
     */
    public function getAdoptionTrends(Request $request): JsonResponse
    {
        try {
            $companyId = $this->companyId();
            $period = $request->query('period', 'monthly'); // daily, weekly, monthly
            $months = (int) $request->query('months', 6); // Number of months back
            $templateId = $request->query('template_id');
            $kacabId = $request->query('kacab_id');

            $startDate = Carbon::now()->subMonths($months)->startOfMonth();
            
            $query = $this->applyCompanyScope(TemplateAdoption::where('created_at', '>=', $startDate), $companyId, 'template_adoptions');

            if ($templateId) {
                $query->where('id_template_materi', $templateId);
            }

            if ($kacabId) {
                $query->where('id_kacab', $kacabId);
            }

            // Get distribution trends
            $distributions = $query->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
                DB::raw('count(*) as total_distributions')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

            // Get adoption trends
            $adoptions = $this->applyCompanyScope(
                TemplateAdoption::whereIn('status', ['adopted', 'customized'])
                    ->where('adopted_at', '>=', $startDate),
                $companyId,
                'template_adoptions'
            )
                ->when($templateId, function($q) use ($templateId) {
                    return $q->where('id_template_materi', $templateId);
                })
                ->when($kacabId, function($q) use ($kacabId) {
                    return $q->where('id_kacab', $kacabId);
                })
                ->select(
                    DB::raw("DATE_FORMAT(adopted_at, '%Y-%m') as period"),
                    DB::raw('count(*) as total_adoptions')
                )
                ->groupBy('period')
                ->orderBy('period')
                ->get();

            // Merge distribution and adoption data
            $trendData = collect();
            $currentDate = $startDate->copy();
            
            while ($currentDate <= Carbon::now()) {
                $periodKey = $currentDate->format('Y-m');
                
                $distributionData = $distributions->firstWhere('period', $periodKey);
                $adoptionData = $adoptions->firstWhere('period', $periodKey);
                
                $totalDistributions = $distributionData ? $distributionData->total_distributions : 0;
                $totalAdoptions = $adoptionData ? $adoptionData->total_adoptions : 0;
                
                $adoptionRate = $totalDistributions > 0 
                    ? round(($totalAdoptions / $totalDistributions) * 100, 2) 
                    : 0;

                $trendData->push([
                    'period' => $periodKey,
                    'month_name' => $currentDate->format('F Y'),
                    'distributions' => $totalDistributions,
                    'adoptions' => $totalAdoptions,
                    'adoption_rate' => $adoptionRate
                ]);

                $currentDate->addMonth();
            }

            // Calculate trend direction
            $recentPeriods = $trendData->take(-3);
            $trendDirection = 'stable';
            
            if ($recentPeriods->count() >= 2) {
                $firstRate = $recentPeriods->first()['adoption_rate'];
                $lastRate = $recentPeriods->last()['adoption_rate'];
                
                if ($lastRate > $firstRate + 5) {
                    $trendDirection = 'improving';
                } elseif ($lastRate < $firstRate - 5) {
                    $trendDirection = 'declining';
                }
            }

            $summary = [
                'total_periods' => $trendData->count(),
                'average_adoption_rate' => round($trendData->avg('adoption_rate'), 2),
                'total_distributions' => $trendData->sum('distributions'),
                'total_adoptions' => $trendData->sum('adoptions'),
                'trend_direction' => $trendDirection,
                'best_performing_month' => $trendData->sortByDesc('adoption_rate')->first(),
                'worst_performing_month' => $trendData->where('distributions', '>', 0)->sortBy('adoption_rate')->first()
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'trends' => $trendData->values(),
                    'summary' => $summary
                ],
                'message' => 'Adoption trends retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve adoption trends',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed cabang adoption information
     */
    public function getCabangDetails($kacabId): JsonResponse
    {
        try {
            $companyId = $this->companyId();
            $kacab = $this->applyCompanyScope(Kacab::query(), $companyId, 'kacab')->find($kacabId);

            if (!$kacab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cabang not found',
                    'error' => 'Cabang with ID ' . $kacabId . ' does not exist'
                ], 404);
            }

            // Get adoption statistics
            $adoptionStats = $this->applyCompanyScope(
                TemplateAdoption::where('id_kacab', $kacabId),
                $companyId,
                'template_adoptions'
            )
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $totalReceived = array_sum($adoptionStats);
            $adopted = ($adoptionStats['adopted'] ?? 0) + ($adoptionStats['customized'] ?? 0);
            $adoptionRate = $totalReceived > 0 ? round(($adopted / $totalReceived) * 100, 2) : 0;

            // Get recent adoption history
            $recentActivity = $this->applyCompanyScope(
                TemplateAdoption::where('id_kacab', $kacabId),
                $companyId,
                'template_adoptions'
            )
                ->with(['templateMateri'])
                ->orderBy('updated_at', 'desc')
                ->take(10)
                ->get();

            // Get templates by category
            $templatesByCategory = $this->applyCompanyScope(
                TemplateAdoption::where('id_kacab', $kacabId),
                $companyId,
                'template_adoptions'
            )
                ->with(['templateMateri'])
                ->get()
                ->groupBy('templateMateri.kategori')
                ->map(function($items, $kategori) {
                    $adopted = $items->whereIn('status', ['adopted', 'customized'])->count();
                    $total = $items->count();
                    
                    return [
                        'kategori' => $kategori,
                        'total' => $total,
                        'adopted' => $adopted,
                        'adoption_rate' => $total > 0 ? round(($adopted / $total) * 100, 2) : 0
                    ];
                });

            // Monthly adoption trend for this cabang
            $monthlyTrend = $this->applyCompanyScope(
                TemplateAdoption::where('id_kacab', $kacabId),
                $companyId,
                'template_adoptions'
            )
                ->where('created_at', '>=', Carbon::now()->subMonths(6))
                ->select(
                    DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                    DB::raw('count(*) as received'),
                    DB::raw('sum(case when status in ("adopted", "customized") then 1 else 0 end) as adopted')
                )
                ->groupBy('month')
                ->orderBy('month')
                ->get()
                ->map(function($item) {
                    $item->adoption_rate = $item->received > 0 
                        ? round(($item->adopted / $item->received) * 100, 2) 
                        : 0;
                    return $item;
                });

            $cabangDetails = [
                'kacab_info' => $kacab,
                'adoption_summary' => [
                    'total_received' => $totalReceived,
                    'total_adopted' => $adopted,
                    'adoption_rate' => $adoptionRate,
                    'status_breakdown' => $adoptionStats
                ],
                'recent_activity' => $recentActivity,
                'templates_by_category' => $templatesByCategory->values(),
                'monthly_trend' => $monthlyTrend
            ];

            return response()->json([
                'success' => true,
                'data' => $cabangDetails,
                'message' => 'Cabang details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cabang details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed template usage statistics
     */
    public function getTemplateUsageStats($templateId): JsonResponse
    {
        try {
            $companyId = $this->companyId();
            $template = $this->applyCompanyScope(TemplateMateri::with(['mataPelajaran', 'kelas.jenjang']), $companyId, 'template_materi')
                ->find($templateId);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found',
                    'error' => 'Template with ID ' . $templateId . ' does not exist'
                ], 404);
            }

            // Get distribution and adoption stats
            $adoptions = $this->applyCompanyScope(
                TemplateAdoption::where('id_template_materi', $templateId),
                $companyId,
                'template_adoptions'
            )
                ->with(['kacab'])
                ->get();

            $stats = [
                'total_distributed' => $adoptions->count(),
                'adopted' => $adoptions->whereIn('status', ['adopted', 'customized'])->count(),
                'pending' => $adoptions->where('status', 'pending')->count(),
                'skipped' => $adoptions->where('status', 'skipped')->count()
            ];

            $adoptionRate = $stats['total_distributed'] > 0 
                ? round(($stats['adopted'] / $stats['total_distributed']) * 100, 2) 
                : 0;

            // Distribution by cabang with performance
            $cabangPerformance = $adoptions->groupBy('id_kacab')->map(function($items) {
                $kacab = $items->first()->kacab;
                $status = $items->first()->status;
                
                return [
                    'kacab_name' => $kacab->nama_kacab,
                    'status' => $status,
                    'adopted_at' => $items->first()->adopted_at,
                    'adoption_notes' => $items->first()->adoption_notes
                ];
            })->values();

            // Usage in actual materials (if adopted and implemented)
            $materialUsage = $this->applyCompanyScope(
                Materi::where('template_source_id', $templateId),
                $companyId,
                'materi'
            )
                ->with(['kacab'])
                ->count();

            $templateUsageStats = [
                'template_info' => $template,
                'distribution_stats' => array_merge($stats, ['adoption_rate' => $adoptionRate]),
                'cabang_performance' => $cabangPerformance,
                'material_implementations' => $materialUsage,
                'adoption_timeline' => $adoptions->where('adopted_at', '!=', null)
                    ->sortBy('adopted_at')
                    ->map(function($adoption) {
                        return [
                            'kacab_name' => $adoption->kacab->nama_kacab,
                            'status' => $adoption->status,
                            'adopted_at' => $adoption->adopted_at,
                            'days_to_adopt' => $adoption->created_at->diffInDays($adoption->adopted_at)
                        ];
                    })
                    ->values()
            ];

            return response()->json([
                'success' => true,
                'data' => $templateUsageStats,
                'message' => 'Template usage statistics retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve template usage statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export adoption report (basic JSON format)
     */
    public function exportAdoptionReport(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->query('date_from', Carbon::now()->subMonths(3)->toDateString());
            $dateTo = $request->query('date_to', Carbon::now()->toDateString());
            $format = $request->query('format', 'json'); // json, csv (future)

            $reportData = [
                'report_info' => [
                    'generated_at' => now()->toDateTimeString(),
                    'period_from' => $dateFrom,
                    'period_to' => $dateTo,
                    'generated_by' => $request->user()?->name ?? 'System'
                ],
                'summary' => $this->getDashboardStats()->getData()->data,
                'cabang_performance' => $this->getCabangAdoptionRates($request)->getData()->data,
                'template_performance' => $this->getTemplatePerformance($request)->getData()->data,
                'adoption_trends' => $this->getAdoptionTrends($request)->getData()->data
            ];

            return response()->json([
                'success' => true,
                'data' => $reportData,
                'message' => 'Adoption report generated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate adoption report',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
