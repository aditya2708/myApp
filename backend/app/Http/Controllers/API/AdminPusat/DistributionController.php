<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use App\Models\TemplateMateri;
use App\Models\TemplateAdoption;
use App\Models\Kacab;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class DistributionController extends Controller
{
    /**
     * Get available cabang untuk selection
     */
    public function getAvailableCabang(Request $request): JsonResponse
    {
        try {
            $search = $request->query('search');
            $withStats = $request->query('with_stats', false);

            $query = Kacab::where('status', 'active')
                ->orderBy('nama_kacab');

            if ($search) {
                $query->where('nama_kacab', 'like', "%{$search}%");
            }

            if ($withStats) {
                $query->withCount([
                    'templateAdoptions as total_received',
                    'templateAdoptions as pending_count' => function($q) {
                        $q->where('status', 'pending');
                    },
                    'templateAdoptions as adopted_count' => function($q) {
                        $q->where('status', 'adopted');
                    },
                    'templateAdoptions as customized_count' => function($q) {
                        $q->where('status', 'customized');
                    }
                ]);
            }

            $cabangList = $query->get();

            // Calculate adoption rates if stats requested
            if ($withStats) {
                $cabangList->each(function($cabang) {
                    $total = $cabang->total_received;
                    if ($total > 0) {
                        $adopted = $cabang->adopted_count + $cabang->customized_count;
                        $cabang->adoption_rate = round(($adopted / $total) * 100, 2);
                    } else {
                        $cabang->adoption_rate = 0;
                    }
                });
            }

            return response()->json([
                'success' => true,
                'data' => $cabangList,
                'message' => 'Cabang list retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cabang list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Distribute template to selected cabang
     */
    public function distributeTemplate(Request $request, $templateId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'cabang_ids' => 'required|array|min:1',
                'cabang_ids.*' => 'required|exists:kacab,id_kacab',
                'distribution_notes' => 'nullable|string|max:500',
                'force_redistribution' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $template = TemplateMateri::find($templateId);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found',
                    'error' => 'Template with ID ' . $templateId . ' does not exist'
                ], 404);
            }

            if (!$template->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot distribute inactive template'
                ], 422);
            }

            $cabangIds = $request->cabang_ids;
            $forceRedistribution = $request->force_redistribution ?? false;
            $distributionNotes = $request->distribution_notes;

            DB::beginTransaction();

            $distributedTo = [];
            $skippedDuplicates = [];
            $errors = [];

            foreach ($cabangIds as $cabangId) {
                try {
                    // Check if already distributed
                    $existingDistribution = TemplateAdoption::where('id_template_materi', $templateId)
                        ->where('id_kacab', $cabangId)
                        ->first();

                    if ($existingDistribution && !$forceRedistribution) {
                        $skippedDuplicates[] = [
                            'cabang_id' => $cabangId,
                            'reason' => 'Already distributed',
                            'existing_status' => $existingDistribution->status
                        ];
                        continue;
                    }

                    // If force redistribution and exists, update existing
                    if ($existingDistribution && $forceRedistribution) {
                        $existingDistribution->update([
                            'status' => 'pending',
                            'adoption_notes' => $distributionNotes,
                            'adopted_at' => null,
                            'updated_at' => now()
                        ]);
                        
                        $distributedTo[] = [
                            'cabang_id' => $cabangId,
                            'adoption_id' => $existingDistribution->id_adoption,
                            'action' => 'redistributed'
                        ];
                    } else {
                        // Create new distribution
                        $adoption = TemplateAdoption::create([
                            'id_template_materi' => $templateId,
                            'id_kacab' => $cabangId,
                            'status' => 'pending',
                            'adoption_notes' => $distributionNotes
                        ]);

                        $distributedTo[] = [
                            'cabang_id' => $cabangId,
                            'adoption_id' => $adoption->id_adoption,
                            'action' => 'distributed'
                        ];
                    }

                } catch (\Exception $e) {
                    $errors[] = [
                        'cabang_id' => $cabangId,
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            $result = [
                'template_id' => $templateId,
                'distributed_to' => $distributedTo,
                'skipped_duplicates' => $skippedDuplicates,
                'errors' => $errors,
                'total_requested' => count($cabangIds),
                'total_distributed' => count($distributedTo),
                'total_skipped' => count($skippedDuplicates),
                'total_errors' => count($errors)
            ];

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => "Template distributed to {$result['total_distributed']} cabang"
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to distribute template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk distribute multiple templates
     */
    public function bulkDistribute(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_ids' => 'required|array|min:1',
                'template_ids.*' => 'required|exists:template_materi,id_template_materi',
                'cabang_ids' => 'required|array|min:1',
                'cabang_ids.*' => 'required|exists:kacab,id_kacab',
                'distribution_notes' => 'nullable|string|max:500',
                'force_redistribution' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $templateIds = $request->template_ids;
            $cabangIds = $request->cabang_ids;
            $forceRedistribution = $request->force_redistribution ?? false;
            $distributionNotes = $request->distribution_notes;

            // Validate all templates are active
            $inactiveTemplates = TemplateMateri::whereIn('id_template_materi', $templateIds)
                ->where('is_active', false)
                ->pluck('nama_template', 'id_template_materi');

            if ($inactiveTemplates->isNotEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot distribute inactive templates',
                    'inactive_templates' => $inactiveTemplates
                ], 422);
            }

            DB::beginTransaction();

            $bulkResults = [];
            $totalDistributed = 0;
            $totalSkipped = 0;
            $totalErrors = 0;

            foreach ($templateIds as $templateId) {
                $templateResults = [
                    'template_id' => $templateId,
                    'distributed_to' => [],
                    'skipped_duplicates' => [],
                    'errors' => []
                ];

                foreach ($cabangIds as $cabangId) {
                    try {
                        $existingDistribution = TemplateAdoption::where('id_template_materi', $templateId)
                            ->where('id_kacab', $cabangId)
                            ->first();

                        if ($existingDistribution && !$forceRedistribution) {
                            $templateResults['skipped_duplicates'][] = [
                                'cabang_id' => $cabangId,
                                'reason' => 'Already distributed',
                                'existing_status' => $existingDistribution->status
                            ];
                            $totalSkipped++;
                            continue;
                        }

                        if ($existingDistribution && $forceRedistribution) {
                            $existingDistribution->update([
                                'status' => 'pending',
                                'adoption_notes' => $distributionNotes,
                                'adopted_at' => null,
                                'updated_at' => now()
                            ]);
                            
                            $templateResults['distributed_to'][] = [
                                'cabang_id' => $cabangId,
                                'adoption_id' => $existingDistribution->id_adoption,
                                'action' => 'redistributed'
                            ];
                        } else {
                            $adoption = TemplateAdoption::create([
                                'id_template_materi' => $templateId,
                                'id_kacab' => $cabangId,
                                'status' => 'pending',
                                'adoption_notes' => $distributionNotes
                            ]);

                            $templateResults['distributed_to'][] = [
                                'cabang_id' => $cabangId,
                                'adoption_id' => $adoption->id_adoption,
                                'action' => 'distributed'
                            ];
                        }

                        $totalDistributed++;

                    } catch (\Exception $e) {
                        $templateResults['errors'][] = [
                            'cabang_id' => $cabangId,
                            'error' => $e->getMessage()
                        ];
                        $totalErrors++;
                    }
                }

                $bulkResults[] = $templateResults;
            }

            DB::commit();

            $summary = [
                'total_templates' => count($templateIds),
                'total_cabang' => count($cabangIds),
                'total_operations' => count($templateIds) * count($cabangIds),
                'total_distributed' => $totalDistributed,
                'total_skipped' => $totalSkipped,
                'total_errors' => $totalErrors,
                'results_by_template' => $bulkResults
            ];

            return response()->json([
                'success' => true,
                'data' => $summary,
                'message' => "Bulk distribution completed: {$totalDistributed} distributions sent"
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to bulk distribute templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get distribution history for a template
     */
    public function getDistributionHistory($templateId): JsonResponse
    {
        try {
            $template = TemplateMateri::find($templateId);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found',
                    'error' => 'Template with ID ' . $templateId . ' does not exist'
                ], 404);
            }

            $distributions = TemplateAdoption::where('id_template_materi', $templateId)
                ->with(['kacab', 'adoptedBy'])
                ->orderBy('created_at', 'desc')
                ->get();

            $stats = [
                'total_distributions' => $distributions->count(),
                'pending' => $distributions->where('status', 'pending')->count(),
                'adopted' => $distributions->where('status', 'adopted')->count(),
                'customized' => $distributions->where('status', 'customized')->count(),
                'skipped' => $distributions->where('status', 'skipped')->count()
            ];

            $adoptionRate = 0;
            if ($stats['total_distributions'] > 0) {
                $adoptedTotal = $stats['adopted'] + $stats['customized'];
                $adoptionRate = round(($adoptedTotal / $stats['total_distributions']) * 100, 2);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'template' => $template->only(['id_template_materi', 'nama_template', 'version']),
                    'distributions' => $distributions,
                    'statistics' => $stats,
                    'adoption_rate' => $adoptionRate
                ],
                'message' => 'Distribution history retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve distribution history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel pending distribution
     */
    public function cancelDistribution($adoptionId): JsonResponse
    {
        try {
            $adoption = TemplateAdoption::find($adoptionId);

            if (!$adoption) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template adoption not found',
                    'error' => 'Adoption with ID ' . $adoptionId . ' does not exist'
                ], 404);
            }

            if ($adoption->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Can only cancel pending distributions'
                ], 422);
            }

            $adoption->delete();

            return response()->json([
                'success' => true,
                'message' => 'Distribution cancelled successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel distribution',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get distribution summary overview
     */
    public function getDistributionSummary(Request $request): JsonResponse
    {
        try {
            $dateFrom = $request->query('date_from');
            $dateTo = $request->query('date_to');
            $templateId = $request->query('template_id');
            $kacabId = $request->query('kacab_id');

            $query = TemplateAdoption::with(['templateMateri', 'kacab']);

            if ($dateFrom) {
                $query->whereDate('created_at', '>=', $dateFrom);
            }

            if ($dateTo) {
                $query->whereDate('created_at', '<=', $dateTo);
            }

            if ($templateId) {
                $query->where('id_template_materi', $templateId);
            }

            if ($kacabId) {
                $query->where('id_kacab', $kacabId);
            }

            $distributions = $query->get();

            $summary = [
                'total_distributions' => $distributions->count(),
                'status_breakdown' => [
                    'pending' => $distributions->where('status', 'pending')->count(),
                    'adopted' => $distributions->where('status', 'adopted')->count(),
                    'customized' => $distributions->where('status', 'customized')->count(),
                    'skipped' => $distributions->where('status', 'skipped')->count()
                ],
                'by_template' => $distributions->groupBy('id_template_materi')->map(function($items) {
                    $template = $items->first()->templateMateri;
                    return [
                        'template_name' => $template->nama_template,
                        'total' => $items->count(),
                        'adopted' => $items->whereIn('status', ['adopted', 'customized'])->count()
                    ];
                }),
                'by_cabang' => $distributions->groupBy('id_kacab')->map(function($items) {
                    $kacab = $items->first()->kacab;
                    return [
                        'kacab_name' => $kacab->nama_kacab,
                        'total' => $items->count(),
                        'adopted' => $items->whereIn('status', ['adopted', 'customized'])->count()
                    ];
                })
            ];

            // Overall adoption rate
            $totalAdopted = $summary['status_breakdown']['adopted'] + $summary['status_breakdown']['customized'];
            $overallAdoptionRate = $summary['total_distributions'] > 0 
                ? round(($totalAdopted / $summary['total_distributions']) * 100, 2) 
                : 0;

            $summary['overall_adoption_rate'] = $overallAdoptionRate;

            return response()->json([
                'success' => true,
                'data' => $summary,
                'message' => 'Distribution summary retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve distribution summary',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}