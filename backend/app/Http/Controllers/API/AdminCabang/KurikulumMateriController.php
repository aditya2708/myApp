<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use App\Http\Requests\KurikulumMateriRequest;
use App\Models\Kurikulum;
use App\Models\KurikulumMateri;
use App\Models\Materi;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class KurikulumMateriController extends Controller
{
    /**
     * Display a listing of materi for the given kurikulum.
     */
    public function index(Request $request, Kurikulum $kurikulum): JsonResponse
    {
        try {
            $adminCabang = auth()->user()->adminCabang ?? null;
            $kacabId = $adminCabang->id_kacab ?? null;

            if ($kurikulum->id_kacab !== $kacabId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke kurikulum ini.'
                ], 403);
            }

            $query = KurikulumMateri::where('id_kurikulum', $kurikulum->id_kurikulum)
                ->with([
                    'materi.mataPelajaran',
                    'materi.kelas.jenjang',
                    'mataPelajaran.jenjang'
                ])
                ->orderBy('urutan');

            if ($request->filled('mata_pelajaran')) {
                $query->where('id_mata_pelajaran', $request->query('mata_pelajaran'));
            }

            if ($request->filled('kelas')) {
                $kelasId = $request->query('kelas');
                $query->whereHas('materi', fn ($q) => $q->where('id_kelas', $kelasId));
            }

            $materi = $query->get();

            return response()->json([
                'success' => true,
                'data' => $materi,
                'message' => 'Daftar materi kurikulum berhasil diambil.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil materi kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created materi mapping in storage.
     */
    public function store(KurikulumMateriRequest $request, Kurikulum $kurikulum): JsonResponse
    {
        try {
            $adminCabang = auth()->user()->adminCabang ?? null;
            $kacabId = $adminCabang->id_kacab ?? null;

            if ($kurikulum->id_kacab !== $kacabId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke kurikulum ini.'
                ], 403);
            }

            $data = $request->validated();
            $data['id_kurikulum'] = $kurikulum->id_kurikulum;

            $materi = Materi::where('id_materi', $data['id_materi'])->first();

            if (!$materi || ($materi->id_kacab && $materi->id_kacab !== $kacabId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Materi tidak ditemukan untuk cabang ini.'
                ], 422);
            }

            if ((int) $materi->id_mata_pelajaran !== (int) $data['id_mata_pelajaran']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Materi tidak sesuai dengan mata pelajaran yang dipilih.'
                ], 422);
            }

            if (empty($data['urutan'])) {
                $data['urutan'] = KurikulumMateri::getNextUrutan(
                    $kurikulum->id_kurikulum,
                    $data['id_mata_pelajaran']
                ) ?? 1;
            } else {
                KurikulumMateri::where('id_kurikulum', $kurikulum->id_kurikulum)
                    ->where('id_mata_pelajaran', $data['id_mata_pelajaran'])
                    ->where('urutan', '>=', $data['urutan'])
                    ->increment('urutan');
            }

            $kurikulumMateri = KurikulumMateri::create($data);
            $kurikulumMateri->load(['materi.mataPelajaran', 'materi.kelas.jenjang', 'mataPelajaran.jenjang']);

            return response()->json([
                'success' => true,
                'data' => $kurikulumMateri,
                'message' => 'Materi berhasil ditambahkan ke kurikulum.'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan materi ke kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified materi from the kurikulum.
     */
    public function destroy(Kurikulum $kurikulum, int $materi): JsonResponse
    {
        try {
            $adminCabang = auth()->user()->adminCabang ?? null;
            $kacabId = $adminCabang->id_kacab ?? null;

            if ($kurikulum->id_kacab !== $kacabId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke kurikulum ini.'
                ], 403);
            }

            $record = KurikulumMateri::where('id_kurikulum', $kurikulum->id_kurikulum)
                ->where('id_materi', $materi)
                ->first();

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Materi tidak ditemukan pada kurikulum.'
                ], 404);
            }

            $mataPelajaranId = $record->id_mata_pelajaran;

            KurikulumMateri::where('id_kurikulum', $kurikulum->id_kurikulum)
                ->where('id_mata_pelajaran', $mataPelajaranId)
                ->where('id_materi', $materi)
                ->delete();

            KurikulumMateri::reorderUrutan($kurikulum->id_kurikulum, $mataPelajaranId);

            return response()->json([
                'success' => true,
                'message' => 'Materi berhasil dihapus dari kurikulum.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus materi dari kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reorder materi sequence inside kurikulum for a specific mata pelajaran.
     */
    public function reorder(Request $request, Kurikulum $kurikulum): JsonResponse
    {
        try {
            $adminCabang = auth()->user()->adminCabang ?? null;
            $kacabId = $adminCabang->id_kacab ?? null;

            if ($kurikulum->id_kacab !== $kacabId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki akses ke kurikulum ini.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'id_mata_pelajaran' => ['required', 'integer', 'exists:mata_pelajaran,id_mata_pelajaran'],
                'order' => ['required', 'array', 'min:1'],
                'order.*' => [
                    'integer',
                    Rule::exists('kurikulum_materi', 'id_materi')->where(function ($query) use ($kurikulum) {
                        return $query->where('id_kurikulum', $kurikulum->id_kurikulum);
                    })
                ],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $mataPelajaranId = (int) $request->input('id_mata_pelajaran');
            $order = collect($request->input('order'));

            $existingIds = KurikulumMateri::where('id_kurikulum', $kurikulum->id_kurikulum)
                ->where('id_mata_pelajaran', $mataPelajaranId)
                ->pluck('id_materi');

            if ($order->unique()->count() !== $order->count()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Duplikasi materi terdeteksi pada permintaan reorder.',
                    'errors' => ['order' => 'Setiap materi hanya boleh muncul satu kali.']
                ], 422);
            }

            if ($order->count() !== $existingIds->count()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Daftar urutan harus mencakup semua materi pada mata pelajaran ini.',
                    'errors' => ['order' => $order->values()->all()]
                ], 422);
            }

            $missing = $order->diff($existingIds);
            if ($missing->isNotEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Beberapa materi tidak terdaftar pada kurikulum ini.',
                    'errors' => ['order' => $missing->values()->all()]
                ], 422);
            }

            DB::transaction(function () use ($order, $kurikulum, $mataPelajaranId) {
                $order->values()->each(function ($materiId, $index) use ($kurikulum, $mataPelajaranId) {
                    KurikulumMateri::where('id_kurikulum', $kurikulum->id_kurikulum)
                        ->where('id_mata_pelajaran', $mataPelajaranId)
                        ->where('id_materi', $materiId)
                        ->update(['urutan' => $index + 1]);
                });
            });

            $updated = KurikulumMateri::where('id_kurikulum', $kurikulum->id_kurikulum)
                ->where('id_mata_pelajaran', $mataPelajaranId)
                ->orderBy('urutan')
                ->with(['materi.mataPelajaran', 'materi.kelas.jenjang', 'mataPelajaran.jenjang'])
                ->get();

            return response()->json([
                'success' => true,
                'data' => $updated,
                'message' => 'Urutan materi berhasil diperbarui.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui urutan materi: ' . $e->getMessage()
            ], 500);
        }
    }
}
