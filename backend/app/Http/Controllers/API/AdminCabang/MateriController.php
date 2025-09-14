<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use App\Models\Materi;
use App\Models\MataPelajaran;
use App\Models\Kelas;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class MateriController extends Controller
{
    /**
     * Get materi list by mata pelajaran and kelas
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $mataPelajaranId = $request->query('mata_pelajaran');
            $kelasId = $request->query('kelas');
            $search = $request->query('search');

            $query = Materi::where('id_kacab', $kacabId)
                ->with(['mataPelajaran', 'kelas.jenjang'])
                ->orderBy('urutan');

            if ($mataPelajaranId) {
                $query->where('id_mata_pelajaran', $mataPelajaranId);
            }

            if ($kelasId) {
                $query->where('id_kelas', $kelasId);
            }

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nama_materi', 'like', "%{$search}%")
                      ->orWhere('deskripsi', 'like', "%{$search}%");
                });
            }

            $materi = $query->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $materi,
                'message' => 'Materi berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil materi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store new materi
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $userId = auth()->id();

            $validator = Validator::make($request->all(), [
                'id_mata_pelajaran' => 'required|exists:mata_pelajaran,id_mata_pelajaran',
                'id_kelas' => 'required|exists:kelas,id_kelas',
                'nama_materi' => 'required|string|max:255',
                'deskripsi' => 'nullable|string',
                'tujuan_pembelajaran' => 'nullable|string',
                'durasi_menit' => 'nullable|integer|min:1',
                'tingkat_kesulitan' => 'nullable|in:mudah,sedang,sulit',
                'status' => 'nullable|in:draft,published,archived',
                'file' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240', // 10MB max
                'urutan' => 'nullable|integer|min:1'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate mata pelajaran and kelas consistency
            $mataPelajaran = MataPelajaran::find($request->id_mata_pelajaran);
            $kelas = Kelas::find($request->id_kelas);

            if ($mataPelajaran->id_jenjang && $kelas->id_jenjang && $mataPelajaran->id_jenjang !== $kelas->id_jenjang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Mata pelajaran dan kelas tidak sesuai jenjang'
                ], 422);
            }

            $data = $request->only([
                'id_mata_pelajaran', 'id_kelas', 'nama_materi', 'deskripsi', 
                'tujuan_pembelajaran', 'durasi_menit', 'tingkat_kesulitan', 'status'
            ]);

            $data['id_kacab'] = $kacabId;
            $data['created_by'] = $userId;
            $data['status'] = $data['status'] ?? 'draft';
            $data['tingkat_kesulitan'] = $data['tingkat_kesulitan'] ?? 'sedang';

            // Handle file upload
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('materi/' . $kacabId, $fileName, 'public');

                $data['file_path'] = $filePath;
                $data['file_name'] = $file->getClientOriginalName();
                $data['file_type'] = $file->getClientOriginalExtension();
                $data['file_size'] = $file->getSize();
            }

            // Auto-assign urutan if not provided
            if (!$request->has('urutan')) {
                $maxUrutan = Materi::where('id_mata_pelajaran', $request->id_mata_pelajaran)
                    ->where('id_kelas', $request->id_kelas)
                    ->max('urutan');
                $data['urutan'] = ($maxUrutan ?? 0) + 1;
            }

            $materi = Materi::create($data);
            $materi->load(['mataPelajaran', 'kelas.jenjang']);

            return response()->json([
                'success' => true,
                'data' => $materi,
                'message' => 'Materi berhasil dibuat'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat materi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show specific materi
     */
    public function show($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $materi = Materi::where('id_kacab', $kacabId)
                ->with(['mataPelajaran', 'kelas.jenjang'])
                ->find($id);

            if (!$materi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Materi tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $materi,
                'message' => 'Materi berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil materi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update materi
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $userId = auth()->id();

            $materi = Materi::where('id_kacab', $kacabId)->find($id);

            if (!$materi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Materi tidak ditemukan'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nama_materi' => 'sometimes|required|string|max:255',
                'deskripsi' => 'nullable|string',
                'tujuan_pembelajaran' => 'nullable|string',
                'durasi_menit' => 'nullable|integer|min:1',
                'tingkat_kesulitan' => 'nullable|in:mudah,sedang,sulit',
                'status' => 'nullable|in:draft,published,archived',
                'file' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:10240',
                'urutan' => 'nullable|integer|min:1'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->only([
                'nama_materi', 'deskripsi', 'tujuan_pembelajaran', 
                'durasi_menit', 'tingkat_kesulitan', 'status', 'urutan'
            ]);

            $data['updated_by'] = $userId;

            // Handle file upload
            if ($request->hasFile('file')) {
                // Delete old file if exists
                if ($materi->file_path) {
                    Storage::disk('public')->delete($materi->file_path);
                }

                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('materi/' . $kacabId, $fileName, 'public');

                $data['file_path'] = $filePath;
                $data['file_name'] = $file->getClientOriginalName();
                $data['file_type'] = $file->getClientOriginalExtension();
                $data['file_size'] = $file->getSize();
            }

            $materi->update($data);
            $materi->load(['mataPelajaran', 'kelas.jenjang']);

            return response()->json([
                'success' => true,
                'data' => $materi,
                'message' => 'Materi berhasil diupdate'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate materi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete materi
     */
    public function destroy($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $materi = Materi::where('id_kacab', $kacabId)->find($id);

            if (!$materi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Materi tidak ditemukan'
                ], 404);
            }

            // Delete file if exists
            if ($materi->file_path) {
                Storage::disk('public')->delete($materi->file_path);
            }

            $materi->delete();

            return response()->json([
                'success' => true,
                'message' => 'Materi berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus materi: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder materi urutan
     */
    public function reorder(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $validator = Validator::make($request->all(), [
                'materi_ids' => 'required|array',
                'materi_ids.*' => 'integer|exists:materi,id_materi'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $materiIds = $request->materi_ids;

            foreach ($materiIds as $index => $materiId) {
                Materi::where('id_kacab', $kacabId)
                    ->where('id_materi', $materiId)
                    ->update(['urutan' => $index + 1]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Urutan materi berhasil diupdate'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate urutan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get materi by mata pelajaran and kelas for selection
     */
    public function getByMataPelajaran($mataPelajaranId, $kelasId): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $materi = Materi::where('id_kacab', $kacabId)
                ->where('id_mata_pelajaran', $mataPelajaranId)
                ->where('id_kelas', $kelasId)
                ->with(['mataPelajaran', 'kelas'])
                ->orderBy('urutan')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $materi,
                'message' => 'Materi berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil materi: ' . $e->getMessage()
            ], 500);
        }
    }
}