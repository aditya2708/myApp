<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use App\Support\AdminShelterScope;
use Illuminate\Support\Facades\Schema;

class SemesterController extends Controller
{
    use AdminShelterScope;

    /**
     * Get semester list for shelter (read-only from cabang data)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Admin Shelter gets semesters from their cabang
            $kacabId = auth()->user()->adminShelter->id_kacab;
            $companyId = $this->companyId();
            $search = $request->query('search');
            $status = $request->query('status');
            $tahunAjaran = $request->query('tahun_ajaran');

            $query = Semester::where('id_kacab', $kacabId)
                ->when($companyId && Schema::hasColumn('semester', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                ->with(['kurikulum']);

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nama_semester', 'like', "%{$search}%")
                      ->orWhere('tahun_ajaran', 'like', "%{$search}%");
                });
            }

            if ($status && $status !== 'all') {
                $hasStatusColumn = \Schema::hasColumn('semester', 'status');
                if ($hasStatusColumn) {
                    $query->where('status', $status);
                } else {
                    // Fallback to is_active for backward compatibility
                    if ($status === 'active') {
                        $query->where('is_active', true);
                    } elseif ($status === 'draft') {
                        $query->where('is_active', false);
                    }
                }
            }

            if ($tahunAjaran) {
                $query->where('tahun_ajaran', $tahunAjaran);
            }

            $semester = $query->orderBy('tahun_selesai', 'desc')
                ->orderBy('periode', 'desc')
                ->paginate(20);

            // Transform data to match admin cabang response format
            $transformedData = $semester->getCollection()->map(function($item) {
                return [
                    'id' => $item->id_semester,
                    'nama' => $item->nama_semester,
                    'tahun_ajaran' => $item->tahun_ajaran,
                    'periode' => $item->periode,
                    'mulai' => $item->tanggal_mulai ? \Carbon\Carbon::parse($item->tanggal_mulai)->format('Y-m-d') : null,
                    'selesai' => $item->tanggal_selesai ? \Carbon\Carbon::parse($item->tanggal_selesai)->format('Y-m-d') : null,
                    'kurikulum_id' => $item->kurikulum_id,
                    'aktif' => $item->is_active,
                    'id_kacab' => $item->id_kacab,
                    'id_shelter' => $item->id_shelter,
                    'status' => $item->status ?? ($item->is_active ? 'active' : 'draft'),
                    'type' => 'cabang',
                    'tahun_mulai' => $item->tahun_mulai,
                    'tahun_selesai' => $item->tahun_selesai,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Semester berhasil diambil',
                'page' => $semester->currentPage(),
                'per_page' => $semester->perPage(),
                'total' => $semester->total(),
                'data' => $transformedData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show specific semester (read-only)
     */
    public function show($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminShelter->id_kacab;
            $companyId = $this->companyId();

            $semester = Semester::where('id_kacab', $kacabId)
                ->when($companyId && Schema::hasColumn('semester', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                ->with(['kurikulum'])
                ->find($id);

            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak ditemukan'
                ], 404);
            }

            // Transform data to match admin cabang response format
            $transformedSemester = [
                'id' => $semester->id_semester,
                'nama' => $semester->nama_semester,
                'tahun_ajaran' => $semester->tahun_ajaran,
                'periode' => $semester->periode,
                'mulai' => $semester->tanggal_mulai ? Carbon::parse($semester->tanggal_mulai)->format('Y-m-d') : null,
                'selesai' => $semester->tanggal_selesai ? Carbon::parse($semester->tanggal_selesai)->format('Y-m-d') : null,
                'kurikulum_id' => $semester->kurikulum_id,
                'aktif' => $semester->is_active,
                'id_kacab' => $semester->id_kacab,
                'id_shelter' => $semester->id_shelter,
                'status' => $semester->status ?? ($semester->is_active ? 'active' : 'draft'),
                'type' => 'cabang',
                'tahun_mulai' => $semester->tahun_mulai,
                'tahun_selesai' => $semester->tahun_selesai,
            ];

            return response()->json([
                'success' => true,
                'data' => $transformedSemester,
                'message' => 'Semester berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active semester for shelter (read-only from cabang)
     */
    public function getActive(): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminShelter->id_kacab;
            $companyId = $this->companyId();

            // Check if status column exists
            $hasStatusColumn = \Schema::hasColumn('semester', 'status');

            $query = Semester::where('id_kacab', $kacabId)
                ->when($companyId && Schema::hasColumn('semester', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                ->with(['kurikulum']);

            if ($hasStatusColumn) {
                $query->where('status', 'active');
            } else {
                $query->where('is_active', true);
            }

            $semester = $query->first();

            // Transform data if semester exists
            $transformedSemester = null;
            if ($semester) {
                $transformedSemester = [
                    'id' => $semester->id_semester,
                    'nama' => $semester->nama_semester,
                    'tahun_ajaran' => $semester->tahun_ajaran,
                    'periode' => $semester->periode,
                    'mulai' => $semester->tanggal_mulai ? Carbon::parse($semester->tanggal_mulai)->format('Y-m-d') : null,
                    'selesai' => $semester->tanggal_selesai ? Carbon::parse($semester->tanggal_selesai)->format('Y-m-d') : null,
                    'kurikulum_id' => $semester->kurikulum_id,
                    'aktif' => $semester->is_active,
                    'id_kacab' => $semester->id_kacab,
                    'id_shelter' => $semester->id_shelter,
                    'status' => $semester->status ?? ($semester->is_active ? 'active' : 'draft'),
                    'type' => 'cabang',
                    'tahun_mulai' => $semester->tahun_mulai,
                    'tahun_selesai' => $semester->tahun_selesai,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $transformedSemester,
                'message' => $semester ? 'Semester aktif ditemukan' : 'Tidak ada semester aktif'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil semester aktif: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get semester statistics for shelter (read-only)
     */
    public function getStatistics(): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminShelter->id_kacab;
            $companyId = $this->companyId();

            // Check if status column exists in semester table
            $hasStatusColumn = \Schema::hasColumn('semester', 'status');

            if ($hasStatusColumn) {
                $stats = [
                    'total' => Semester::where('id_kacab', $kacabId)->when($companyId && Schema::hasColumn('semester', 'company_id'), fn ($q) => $q->where('company_id', $companyId))->count(),
                    'active' => Semester::where('id_kacab', $kacabId)->when($companyId && Schema::hasColumn('semester', 'company_id'), fn ($q) => $q->where('company_id', $companyId))->where('status', 'active')->count(),
                    'draft' => Semester::where('id_kacab', $kacabId)->when($companyId && Schema::hasColumn('semester', 'company_id'), fn ($q) => $q->where('company_id', $companyId))->where('status', 'draft')->count(),
                    'completed' => Semester::where('id_kacab', $kacabId)->when($companyId && Schema::hasColumn('semester', 'company_id'), fn ($q) => $q->where('company_id', $companyId))->where('status', 'completed')->count(),
                    'archived' => Semester::where('id_kacab', $kacabId)->when($companyId && Schema::hasColumn('semester', 'company_id'), fn ($q) => $q->where('company_id', $companyId))->where('status', 'archived')->count(),
                ];
            } else {
                // Fallback for when status column doesn't exist yet
                $total = Semester::where('id_kacab', $kacabId)
                    ->when($companyId && Schema::hasColumn('semester', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                    ->count();
                $stats = [
                    'total' => $total,
                    'active' => 0, // Default when no status column
                    'draft' => $total, // Assume all are draft
                    'completed' => 0,
                    'archived' => 0,
                    'note' => 'Status column not found. Please run database migration.'
                ];
            }

            // Add shelter-specific context
            $stats['shelter_name'] = auth()->user()->adminShelter->shelter->nama_shelter ?? 'Unknown Shelter';
            $stats['access_type'] = 'read_only';
            $stats['message'] = 'Data semester dikelola oleh Admin Cabang';

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistik semester berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik: ' . $e->getMessage()
            ], 500);
        }
    }
}
