<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use App\Models\TemplateMateri;
use App\Models\MataPelajaran;
use App\Models\Kelas;
use App\Models\TemplateAdoption;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TemplateKurikulumController extends Controller
{
    /**
     * List template dengan filters & pagination
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $mataPelajaranId = $request->query('mata_pelajaran');
            $kelasId = $request->query('kelas');
            $search = $request->query('search');
            $status = $request->query('status'); // active, inactive, all
            $kategori = $request->query('kategori');

            $query = TemplateMateri::with(['mataPelajaran', 'kelas.jenjang', 'createdBy'])
                ->withCount([
                    'templateAdoptions as total_distributions',
                    'templateAdoptions as pending_adoptions' => function($q) {
                        $q->where('status', 'pending');
                    },
                    'templateAdoptions as adopted_count' => function($q) {
                        $q->where('status', 'adopted');
                    }
                ])
                ->orderBy('urutan')
                ->orderBy('created_at', 'desc');

            if ($mataPelajaranId) {
                $query->where('id_mata_pelajaran', $mataPelajaranId);
            }

            if ($kelasId) {
                $query->where('id_kelas', $kelasId);
            }

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nama_template', 'like', "%{$search}%")
                      ->orWhere('deskripsi', 'like', "%{$search}%");
                });
            }

            if ($status && $status !== 'all') {
                $isActive = $status === 'active';
                $query->where('is_active', $isActive);
            }

            if ($kategori) {
                $query->where('kategori', $kategori);
            }

            $templates = $query->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Template list retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create template + file upload
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nama_template' => 'required|string|max:255',
                'deskripsi' => 'nullable|string|max:1000',
                'kategori' => 'required|in:materi_ajar,panduan,evaluasi,referensi',
                'id_mata_pelajaran' => 'required|exists:mata_pelajaran,id_mata_pelajaran',
                'id_kelas' => 'required|exists:kelas,id_kelas',
                'file' => 'required|file|mimes:pdf,doc,docx,ppt,pptx,jpg,jpeg,png|max:10240', // 10MB
                'version' => 'nullable|string|max:50',
                'urutan' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Get next urutan if not provided
            $urutan = $request->urutan;
            if (!$urutan) {
                $maxUrutan = TemplateMateri::where('id_mata_pelajaran', $request->id_mata_pelajaran)
                    ->where('id_kelas', $request->id_kelas)
                    ->max('urutan');
                $urutan = ($maxUrutan ?? 0) + 1;
            }

            // Handle file upload
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('templates', $fileName, 'public');

            // Get admin pusat ID from authenticated user
            $adminPusatId = auth()->user()->adminPusat->id_admin_pusat ?? 1; // Fallback for development

            $template = TemplateMateri::create([
                'id_mata_pelajaran' => $request->id_mata_pelajaran,
                'id_kelas' => $request->id_kelas,
                'created_by' => $adminPusatId,
                'nama_template' => $request->nama_template,
                'deskripsi' => $request->deskripsi,
                'kategori' => $request->kategori,
                'file_path' => $filePath,
                'file_name' => $fileName,
                'file_size' => $file->getSize(),
                'urutan' => $urutan,
                'version' => $request->version ?? '1.0',
                'is_active' => false, // Templates start inactive
                'metadata' => json_encode([
                    'original_filename' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'uploaded_at' => now()->toDateTimeString()
                ])
            ]);

            DB::commit();

            $template->load(['mataPelajaran', 'kelas.jenjang', 'createdBy']);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template created successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Clean up uploaded file if exists
            if (isset($filePath) && Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to create template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Detail template + adoption stats
     */
    public function show($id): JsonResponse
    {
        try {
            $template = TemplateMateri::with([
                'mataPelajaran', 
                'kelas.jenjang', 
                'createdBy',
                'templateAdoptions.kacab'
            ])
            ->withCount([
                'templateAdoptions as total_distributions',
                'templateAdoptions as pending_adoptions' => function($q) {
                    $q->where('status', 'pending');
                },
                'templateAdoptions as adopted_count' => function($q) {
                    $q->where('status', 'adopted');
                },
                'templateAdoptions as customized_count' => function($q) {
                    $q->where('status', 'customized');
                },
                'templateAdoptions as skipped_count' => function($q) {
                    $q->where('status', 'skipped');
                }
            ])
            ->find($id);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found',
                    'error' => 'Template with ID ' . $id . ' does not exist'
                ], 404);
            }

            // Calculate adoption rate
            $adoptionRate = 0;
            if ($template->total_distributions > 0) {
                $adoptedTotal = $template->adopted_count + $template->customized_count;
                $adoptionRate = round(($adoptedTotal / $template->total_distributions) * 100, 2);
            }

            $template->adoption_rate = $adoptionRate;

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template details retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update template + replace file
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $template = TemplateMateri::find($id);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found',
                    'error' => 'Template with ID ' . $id . ' does not exist'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nama_template' => 'sometimes|required|string|max:255',
                'deskripsi' => 'nullable|string|max:1000',
                'kategori' => 'sometimes|required|in:materi_ajar,panduan,evaluasi,referensi',
                'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,jpg,jpeg,png|max:10240',
                'version' => 'nullable|string|max:50',
                'urutan' => 'nullable|integer|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $updateData = $request->only(['nama_template', 'deskripsi', 'kategori', 'version', 'urutan']);

            // Handle file replacement
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('templates', $fileName, 'public');

                // Delete old file
                if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
                    Storage::disk('public')->delete($template->file_path);
                }

                $updateData['file_path'] = $filePath;
                $updateData['file_name'] = $fileName;
                $updateData['file_size'] = $file->getSize();
                $updateData['metadata'] = json_encode([
                    'original_filename' => $file->getClientOriginalName(),
                    'mime_type' => $file->getMimeType(),
                    'updated_at' => now()->toDateTimeString()
                ]);
            }

            $template->update($updateData);
            DB::commit();

            $template->load(['mataPelajaran', 'kelas.jenjang', 'createdBy']);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template updated successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Clean up new file if upload failed
            if (isset($filePath) && Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to update template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete template + cleanup
     */
    public function destroy($id): JsonResponse
    {
        try {
            $template = TemplateMateri::find($id);

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found',
                    'error' => 'Template with ID ' . $id . ' does not exist'
                ], 404);
            }

            // Check if template has pending or adopted distributions
            $activeDistributions = $template->templateAdoptions()
                ->whereIn('status', ['pending', 'adopted'])
                ->count();

            if ($activeDistributions > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete template with active distributions'
                ], 422);
            }

            DB::beginTransaction();

            // Delete file
            if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
                Storage::disk('public')->delete($template->file_path);
            }

            // Delete template record
            $template->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Template deleted successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activate template for distribution
     */
    public function activate($id): JsonResponse
    {
        try {
            $template = TemplateMateri::find($id);
            
            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found',
                    'error' => 'Template with ID ' . $id . ' does not exist'
                ], 404);
            }
            
            if ($template->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template is already active'
                ], 422);
            }

            $template->update(['is_active' => true]);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template activated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to activate template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deactivate template
     */
    public function deactivate($id): JsonResponse
    {
        try {
            $template = TemplateMateri::find($id);
            
            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template not found',
                    'error' => 'Template with ID ' . $id . ' does not exist'
                ], 404);
            }
            
            if (!$template->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template is already inactive'
                ], 422);
            }

            $template->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Template deactivated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to deactivate template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicate existing template
     */
    public function duplicate($id): JsonResponse
    {
        try {
            $sourceTemplate = TemplateMateri::find($id);

            if (!$sourceTemplate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Source template not found',
                    'error' => 'Template with ID ' . $id . ' does not exist'
                ], 404);
            }

            DB::beginTransaction();

            // Copy file
            $newFileName = 'copy_' . time() . '_' . $sourceTemplate->file_name;
            $newFilePath = 'templates/' . $newFileName;
            
            if (Storage::disk('public')->exists($sourceTemplate->file_path)) {
                Storage::disk('public')->copy($sourceTemplate->file_path, $newFilePath);
            }

            // Get next urutan
            $maxUrutan = TemplateMateri::where('id_mata_pelajaran', $sourceTemplate->id_mata_pelajaran)
                ->where('id_kelas', $sourceTemplate->id_kelas)
                ->max('urutan');

            $adminPusatId = auth()->user()->adminPusat->id_admin_pusat ?? 1;

            $newTemplate = TemplateMateri::create([
                'id_mata_pelajaran' => $sourceTemplate->id_mata_pelajaran,
                'id_kelas' => $sourceTemplate->id_kelas,
                'created_by' => $adminPusatId,
                'nama_template' => 'Copy of ' . $sourceTemplate->nama_template,
                'deskripsi' => $sourceTemplate->deskripsi,
                'kategori' => $sourceTemplate->kategori,
                'file_path' => $newFilePath,
                'file_name' => $newFileName,
                'file_size' => $sourceTemplate->file_size,
                'urutan' => ($maxUrutan ?? 0) + 1,
                'version' => '1.0',
                'is_active' => false,
                'metadata' => json_encode([
                    'duplicated_from' => $sourceTemplate->id_template_materi,
                    'duplicated_at' => now()->toDateTimeString()
                ])
            ]);

            DB::commit();

            $newTemplate->load(['mataPelajaran', 'kelas.jenjang', 'createdBy']);

            return response()->json([
                'success' => true,
                'data' => $newTemplate,
                'message' => 'Template duplicated successfully'
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            if (isset($newFilePath) && Storage::disk('public')->exists($newFilePath)) {
                Storage::disk('public')->delete($newFilePath);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Filter templates by mata pelajaran and kelas
     */
    public function getByMataPelajaran($mataPelajaranId, $kelasId): JsonResponse
    {
        try {
            $templates = TemplateMateri::where('id_mata_pelajaran', $mataPelajaranId)
                ->where('id_kelas', $kelasId)
                ->where('is_active', true)
                ->with(['mataPelajaran', 'kelas.jenjang'])
                ->withCount([
                    'templateAdoptions as adoption_count' => function($q) {
                        $q->whereIn('status', ['adopted', 'customized']);
                    }
                ])
                ->orderBy('urutan')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Templates retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}