<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use App\Models\TemplateAdoption;
use App\Models\TemplateMateri;
use App\Models\Materi;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Exception;
use Illuminate\Support\Facades\Schema;
use App\Support\SsoContext;

class TemplateAdoptionController extends Controller
{
    /**
     * Get pending template adoptions
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $companyId = $this->companyId(auth()->user()->adminCabang->company_id ?? null);

            $query = TemplateAdoption::with([
                'templateMateri.mataPelajaran',
                'templateMateri.kelas.jenjang',
                'templateMateri.createdBy'
            ])
            ->byKacab($kacabId, $companyId);

            // Filter by status
            $status = $request->get('status', 'pending');
            if ($status === 'pending') {
                $query->pending();
            } elseif ($status === 'adopted') {
                $query->adopted();
            } elseif ($status === 'customized') {
                $query->customized();
            } elseif ($status === 'skipped') {
                $query->where('status', 'skipped');
            }

            // Filter by jenjang
            if ($request->has('jenjang_id')) {
                $query->whereHas('templateMateri.kelas', function($q) use ($request) {
                    $q->where('id_jenjang', $request->jenjang_id);
                });
            }

            // Filter by kelas
            if ($request->has('kelas_id')) {
                $query->whereHas('templateMateri', function($q) use ($request) {
                    $q->where('id_kelas', $request->kelas_id);
                });
            }

            // Filter by mata pelajaran
            if ($request->has('mata_pelajaran_id')) {
                $query->whereHas('templateMateri', function($q) use ($request) {
                    $q->where('id_mata_pelajaran', $request->mata_pelajaran_id);
                });
            }

            // Search
            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('templateMateri', function($q) use ($search) {
                    $q->where('nama_template', 'like', "%{$search}%")
                      ->orWhere('deskripsi', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $adoptions = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $adoptions,
                'message' => 'Template adoptions berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil template adoptions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show template adoption details with preview
     */
    public function show($adoptionId): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $companyId = $this->companyId(auth()->user()->adminCabang->company_id ?? null);

            $adoption = TemplateAdoption::with([
                'templateMateri.mataPelajaran',
                'templateMateri.kelas.jenjang',
                'templateMateri.createdBy',
                'materiHasil'
            ])
            ->byKacab($kacabId, $companyId)
            ->findOrFail($adoptionId);

            // Check if similar materi already exists
            $existingMateri = Materi::where('id_mata_pelajaran', $adoption->templateMateri->id_mata_pelajaran)
                ->where('id_kelas', $adoption->templateMateri->id_kelas)
                ->where('id_kacab', $kacabId)
                ->where('nama_materi', 'like', '%' . $adoption->templateMateri->nama_template . '%')
                ->exists();

            $result = [
                'adoption' => $adoption,
                'template_preview' => [
                    'nama_template' => $adoption->templateMateri->nama_template,
                    'deskripsi' => $adoption->templateMateri->deskripsi,
                    'kategori' => $adoption->templateMateri->kategori,
                    'file_name' => $adoption->templateMateri->file_name,
                    'file_size' => $adoption->templateMateri->file_size,
                    'metadata' => $adoption->templateMateri->metadata,
                    'urutan' => $adoption->templateMateri->urutan,
                ],
                'existing_similar' => $existingMateri,
                'suggested_name' => $adoption->templateMateri->nama_template
            ];

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Template adoption detail berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Template adoption tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Adopt template as-is (no customization)
     */
    public function adopt(Request $request, $adoptionId): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $companyId = $this->companyId(auth()->user()->adminCabang->company_id ?? null);
            $userId = auth()->id();

            $adoption = TemplateAdoption::with('templateMateri')
                ->byKacab($kacabId, $companyId)
                ->pending()
                ->findOrFail($adoptionId);

            $validator = Validator::make($request->all(), [
                'adoption_notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $template = $adoption->templateMateri;

            // Get next urutan for materi
            $nextUrutan = Materi::where('id_mata_pelajaran', $template->id_mata_pelajaran)
                ->where('id_kelas', $template->id_kelas)
                ->where('id_kacab', $kacabId)
                ->max('urutan') + 1;

            // Create materi from template
            $materiData = [
                'id_mata_pelajaran' => $template->id_mata_pelajaran,
                'id_kelas' => $template->id_kelas,
                'id_kacab' => $kacabId,
                'company_id' => $companyId,
                'template_source_id' => $template->id_template_materi,
                'nama_materi' => $template->nama_template,
                'deskripsi' => $template->deskripsi,
                'kategori' => $template->kategori,
                'urutan' => $nextUrutan,
                'is_from_template' => true,
                'is_customized' => false,
                'metadata' => $template->metadata
            ];

            // Copy file if exists
            if ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
                $originalPath = $template->file_path;
                $fileName = time() . '_' . $template->file_name;
                $newPath = 'materi/' . $kacabId . '/' . $fileName;
                
                Storage::disk('public')->copy($originalPath, $newPath);
                
                $materiData['file_path'] = $newPath;
                $materiData['file_name'] = $template->file_name;
                $materiData['file_size'] = $template->file_size;
            }

            $materi = Materi::create($materiData);

            // Update adoption status
            $adoption->update([
                'status' => 'adopted',
                'adopted_by' => $userId,
                'id_materi_hasil' => $materi->id_materi,
                'adoption_notes' => $request->adoption_notes,
                'adopted_at' => now()
            ]);

            $materi->load(['mataPelajaran', 'kelas', 'templateSource']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'adoption' => $adoption,
                    'materi' => $materi
                ],
                'message' => 'Template berhasil diadopsi'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengadopsi template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Adopt template with customization
     */
    public function customize(Request $request, $adoptionId): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $companyId = $this->companyId(auth()->user()->adminCabang->company_id ?? null);
            $userId = auth()->id();

            $adoption = TemplateAdoption::with('templateMateri')
                ->byKacab($kacabId, $companyId)
                ->pending()
                ->findOrFail($adoptionId);

            $validator = Validator::make($request->all(), [
                'nama_materi' => 'required|string|max:255',
                'deskripsi' => 'nullable|string',
                'kategori' => 'required|in:teori,praktik,latihan,ujian',
                'file' => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,jpg,jpeg,png,mp4,mp3|max:10240',
                'metadata' => 'nullable|array',
                'adoption_notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            $template = $adoption->templateMateri;

            // Get next urutan for materi
            $nextUrutan = Materi::where('id_mata_pelajaran', $template->id_mata_pelajaran)
                ->where('id_kelas', $template->id_kelas)
                ->where('id_kacab', $kacabId)
                ->max('urutan') + 1;

            // Create customized materi from template
            $materiData = [
                'id_mata_pelajaran' => $template->id_mata_pelajaran,
                'id_kelas' => $template->id_kelas,
                'id_kacab' => $kacabId,
                'company_id' => $companyId,
                'template_source_id' => $template->id_template_materi,
                'nama_materi' => $request->nama_materi,
                'deskripsi' => $request->deskripsi,
                'kategori' => $request->kategori,
                'urutan' => $nextUrutan,
                'is_from_template' => true,
                'is_customized' => true,
                'metadata' => $request->metadata ?? []
            ];

            // Handle file upload or copy from template
            if ($request->hasFile('file')) {
                // Use custom file
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('materi/' . $kacabId, $fileName, 'public');
                
                $materiData['file_path'] = $filePath;
                $materiData['file_name'] = $fileName;
                $materiData['file_size'] = $file->getSize();
            } elseif ($template->file_path && Storage::disk('public')->exists($template->file_path)) {
                // Copy file from template
                $originalPath = $template->file_path;
                $fileName = time() . '_' . $template->file_name;
                $newPath = 'materi/' . $kacabId . '/' . $fileName;
                
                Storage::disk('public')->copy($originalPath, $newPath);
                
                $materiData['file_path'] = $newPath;
                $materiData['file_name'] = $template->file_name;
                $materiData['file_size'] = $template->file_size;
            }

            $materi = Materi::create($materiData);

            // Update adoption status
            $adoption->update([
                'status' => 'customized',
                'adopted_by' => $userId,
                'id_materi_hasil' => $materi->id_materi,
                'adoption_notes' => $request->adoption_notes,
                'adopted_at' => now()
            ]);

            $materi->load(['mataPelajaran', 'kelas', 'templateSource']);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'adoption' => $adoption,
                    'materi' => $materi
                ],
                'message' => 'Template berhasil diadopsi dengan customization'
            ]);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengadopsi template dengan customization',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Skip template adoption
     */
    public function skip(Request $request, $adoptionId): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $companyId = $this->companyId(auth()->user()->adminCabang->company_id ?? null);
            $userId = auth()->id();

            $adoption = TemplateAdoption::byKacab($kacabId)
                ->pending()
                ->when($companyId && Schema::hasColumn('template_adoptions', 'company_id'), function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->findOrFail($adoptionId);

            $validator = Validator::make($request->all(), [
                'adoption_notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $adoption->update([
                'status' => 'skipped',
                'adopted_by' => $userId,
                'adoption_notes' => $request->adoption_notes,
                'adopted_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => $adoption,
                'message' => 'Template berhasil di-skip'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal skip template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get adoption history
     */
    public function getAdoptionHistory(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $companyId = $this->companyId(auth()->user()->adminCabang->company_id ?? null);

            $query = TemplateAdoption::with([
                'templateMateri.mataPelajaran',
                'templateMateri.kelas.jenjang',
                'materiHasil',
                'adoptedBy'
            ])
            ->byKacab($kacabId, $companyId)
            ->whereIn('status', ['adopted', 'customized', 'skipped']);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by date range
            if ($request->has('date_from')) {
                $query->whereDate('adopted_at', '>=', $request->date_from);
            }
            
            if ($request->has('date_to')) {
                $query->whereDate('adopted_at', '<=', $request->date_to);
            }

            // Search
            if ($request->has('search')) {
                $search = $request->search;
                $query->whereHas('templateMateri', function($q) use ($search) {
                    $q->where('nama_template', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'adopted_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $history = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $history,
                'message' => 'Adoption history berhasil diambil'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil adoption history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ambil company id dari SSO context atau fallback.
     */
    private function companyId(?int $fallback = null): ?int
    {
        if (app()->bound(SsoContext::class) && app(SsoContext::class)->company()) {
            return app(SsoContext::class)->company()->id;
        }

        return $fallback;
    }
}
