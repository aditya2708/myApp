<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Kurikulum;
use App\Models\KurikulumMateri;
use App\Models\Semester;
use Illuminate\Http\Request;

class AdminShelterKurikulumController extends Controller
{
    public function index(Request $request)
    {
        try {
            $adminShelter = auth()->user()->adminShelter;
            $query = Kurikulum::with(['kacab'])
                ->byKacab($adminShelter->shelter->wilbin->id_kacab)
                ->active();
            
            if ($request->has('tahun_berlaku')) {
                $query->byTahun($request->tahun_berlaku);
            }
            
            if ($request->has('search')) {
                $query->where('nama_kurikulum', 'like', '%' . $request->search . '%');
            }
            
            $kurikulum = $query
                ->withCount(['kurikulumMateri'])
                ->addSelect([
                    'mata_pelajaran_count' => KurikulumMateri::selectRaw('COUNT(DISTINCT id_mata_pelajaran)')
                        ->whereColumn('kurikulum_materi.id_kurikulum', 'kurikulum.id_kurikulum'),
                ])
                ->orderBy('tahun_berlaku', 'desc')
                ->orderBy('nama_kurikulum')
                ->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Data kurikulum berhasil diambil',
                'data' => $kurikulum
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data kurikulum',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $adminShelter = auth()->user()->adminShelter;
            $kurikulum = Kurikulum::with(['kacab', 'kurikulumMateri.mataPelajaran', 'kurikulumMateri.materi'])
                ->byKacab($adminShelter->shelter->wilbin->id_kacab)
                ->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Detail kurikulum berhasil diambil',
                'data' => $kurikulum
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kurikulum tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function getPreview($id)
    {
        try {
            $adminShelter = auth()->user()->adminShelter;
            $kurikulum = Kurikulum::with([
                'kurikulumMateri.mataPelajaran',
                'kurikulumMateri.materi'
            ])->byKacab($adminShelter->shelter->wilbin->id_kacab)
              ->findOrFail($id);

            $preview = [
                'kurikulum' => $kurikulum->only(['id_kurikulum', 'nama_kurikulum', 'deskripsi', 'tahun_berlaku']),
                'total_mata_pelajaran' => $kurikulum->getTotalMataPelajaran(),
                'total_materi' => $kurikulum->getTotalMateri(),
                'mata_pelajaran' => $kurikulum->mataPelajaran
                    ->unique('id_mata_pelajaran')
                    ->values()
                    ->map(function ($mp) use ($kurikulum) {
                        return [
                            'id_mata_pelajaran' => $mp->id_mata_pelajaran,
                            'nama' => $mp->nama_mata_pelajaran,
                        'kategori' => $mp->kategori,
                        'total_materi' => $kurikulum->kurikulumMateri()
                            ->where('id_mata_pelajaran', $mp->id_mata_pelajaran)
                            ->count()
                    ];
                })
            ];
            
            return response()->json([
                'success' => true,
                'message' => 'Preview kurikulum berhasil diambil',
                'data' => $preview
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil preview kurikulum',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getForDropdown()
    {
        try {
            $adminShelter = auth()->user()->adminShelter;
            $kurikulum = Kurikulum::byKacab($adminShelter->shelter->wilbin->id_kacab)
                ->active()
                ->select('id_kurikulum', 'nama_kurikulum', 'tahun_berlaku')
                ->orderBy('tahun_berlaku', 'desc')
                ->orderBy('nama_kurikulum')
                ->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Data dropdown kurikulum berhasil diambil',
                'data' => $kurikulum
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dropdown kurikulum',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function setActive($id)
    {
        try {
            $adminShelter = auth()->user()->adminShelter;
            $kacabId = $adminShelter->shelter->wilbin->id_kacab;
            $shelterId = $adminShelter->shelter->id_shelter;

            // Ensure kurikulum exists for this cabang
            $kurikulum = Kurikulum::where('id_kacab', $kacabId)->findOrFail($id);

            // Find active semester for this shelter
            $query = Semester::where('id_kacab', $kacabId)
                ->where('id_shelter', $shelterId);

            if (\Schema::hasColumn('semester', 'status')) {
                $query->where('status', 'active');
            } else {
                $query->where('is_active', true);
            }

            $semester = $query->first();

            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester aktif tidak ditemukan'
                ], 404);
            }

            $semester->kurikulum_id = $kurikulum->id_kurikulum;
            $semester->save();

            return response()->json([
                'success' => true,
                'message' => 'Kurikulum aktif berhasil ditetapkan',
                'data' => $semester
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menetapkan kurikulum aktif: ' . $e->getMessage()
            ], 500);
        }
    }
}