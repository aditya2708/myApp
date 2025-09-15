<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use App\Models\Semester;
use App\Models\Kurikulum;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SemesterController extends Controller
{
    /**
     * Get semester list for cabang
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $search = $request->query('search');
            $status = $request->query('status');
            $tahunAjaran = $request->query('tahun_ajaran');

            $query = Semester::where('id_kacab', $kacabId)
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

            return response()->json([
                'success' => true,
                'data' => $semester,
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
     * Store new semester
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $validator = Validator::make($request->all(), [
                'nama_semester' => 'required|string|max:255',
                'tahun_ajaran' => 'required|string|max:20',
                'periode' => 'required|in:ganjil,genap',
                'tanggal_mulai' => 'required|date',
                'tanggal_selesai' => 'required|date|after:tanggal_mulai',
                'kurikulum_id' => 'required|exists:kurikulum,id_kurikulum',
                'status' => 'nullable|in:draft,active,completed,archived',
                'type' => 'nullable|in:cabang,shelter'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check for overlapping semesters
            $hasStatusColumn = \Schema::hasColumn('semester', 'status');
            $overlappingQuery = Semester::where('id_kacab', $kacabId);
            
            if ($hasStatusColumn) {
                $overlappingQuery->where('status', '!=', 'archived');
            } else {
                $overlappingQuery->where('is_active', '!=', false);
            }
            
            $overlapping = $overlappingQuery->where(function($query) use ($request) {
                    $query->whereBetween('tanggal_mulai', [$request->tanggal_mulai, $request->tanggal_selesai])
                          ->orWhereBetween('tanggal_selesai', [$request->tanggal_mulai, $request->tanggal_selesai])
                          ->orWhere(function($q) use ($request) {
                              $q->where('tanggal_mulai', '<=', $request->tanggal_mulai)
                                ->where('tanggal_selesai', '>=', $request->tanggal_selesai);
                          });
                })
                ->exists();

            if ($overlapping) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terdapat semester lain yang tumpang tindih dengan periode ini'
                ], 422);
            }

            $data = $request->only([
                'nama_semester', 'tahun_ajaran', 'periode', 'tanggal_mulai', 
                'tanggal_selesai', 'kurikulum_id', 'status', 'type'
            ]);

            $data['id_kacab'] = $kacabId;
            $data['status'] = $data['status'] ?? 'draft';
            $data['type'] = $data['type'] ?? 'cabang';

            // Extract tahun_mulai and tahun_selesai from dates
            $data['tahun_mulai'] = date('Y', strtotime($request->tanggal_mulai));
            $data['tahun_selesai'] = date('Y', strtotime($request->tanggal_selesai));

            // Auto-generate nama_semester if not unique
            $baseName = $data['nama_semester'];
            $counter = 1;
            while (Semester::where('id_kacab', $kacabId)->where('nama_semester', $data['nama_semester'])->exists()) {
                $data['nama_semester'] = $baseName . ' (' . $counter . ')';
                $counter++;
            }

            $semester = Semester::create($data);
            $semester->load(['kurikulum']);

            return response()->json([
                'success' => true,
                'data' => $semester,
                'message' => 'Semester berhasil dibuat'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show specific semester
     */
    public function show($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $semester = Semester::where('id_kacab', $kacabId)
                ->with(['kurikulum'])
                ->find($id);

            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $semester,
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
     * Update semester
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $semester = Semester::where('id_kacab', $kacabId)->find($id);

            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak ditemukan'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nama_semester' => 'sometimes|string|max:255',
                'tahun_ajaran' => 'sometimes|string|max:20',
                'periode' => 'sometimes|in:ganjil,genap',
                'tanggal_mulai' => 'sometimes|date',
                'tanggal_selesai' => 'sometimes|date|after_or_equal:' . ($request->tanggal_mulai ?? $semester->tanggal_mulai),
                'kurikulum_id' => 'sometimes|required|exists:kurikulum,id_kurikulum',
                'status' => 'nullable|in:draft,active,completed,archived',
                'type' => 'nullable|in:cabang,shelter'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check for overlapping semesters if dates are being updated
            if ($request->has('tanggal_mulai') || $request->has('tanggal_selesai')) {
                $tanggalMulai = $request->tanggal_mulai ?? $semester->tanggal_mulai;
                $tanggalSelesai = $request->tanggal_selesai ?? $semester->tanggal_selesai;

                $overlappingQuery = Semester::where('id_kacab', $kacabId)
                    ->where('id_semester', '!=', $id);
                
                $hasStatusColumn = \Schema::hasColumn('semester', 'status');
                if ($hasStatusColumn) {
                    $overlappingQuery->where('status', '!=', 'archived');
                } else {
                    $overlappingQuery->where('is_active', '!=', false);
                }
                
                $overlapping = $overlappingQuery->where(function($query) use ($tanggalMulai, $tanggalSelesai) {
                        $query->whereBetween('tanggal_mulai', [$tanggalMulai, $tanggalSelesai])
                              ->orWhereBetween('tanggal_selesai', [$tanggalMulai, $tanggalSelesai])
                              ->orWhere(function($q) use ($tanggalMulai, $tanggalSelesai) {
                                  $q->where('tanggal_mulai', '<=', $tanggalMulai)
                                    ->where('tanggal_selesai', '>=', $tanggalSelesai);
                              });
                    })
                    ->exists();

                if ($overlapping) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Terdapat semester lain yang tumpang tindih dengan periode ini'
                    ], 422);
                }
            }

            $data = $request->only([
                'nama_semester', 'tahun_ajaran', 'periode', 'tanggal_mulai',
                'tanggal_selesai', 'kurikulum_id', 'status', 'type'
            ]);

            // Ensure kurikulum_id is present either in existing record or update data
            if (!$semester->kurikulum_id && !isset($data['kurikulum_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kurikulum harus diisi'
                ], 422);
            }

            // Update tahun_mulai and tahun_selesai if dates changed
            if ($request->has('tanggal_mulai')) {
                $data['tahun_mulai'] = date('Y', strtotime($request->tanggal_mulai));
            }
            if ($request->has('tanggal_selesai')) {
                $data['tahun_selesai'] = date('Y', strtotime($request->tanggal_selesai));
            }

            $semester->update($data);
            $semester->load(['kurikulum']);

            return response()->json([
                'success' => true,
                'data' => $semester,
                'message' => 'Semester berhasil diupdate'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengupdate semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete semester
     */
    public function destroy($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $semester = Semester::where('id_kacab', $kacabId)->find($id);

            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak ditemukan'
                ], 404);
            }

            // Check if semester can be deleted (no related data)
            if (!$semester->canBeDeleted()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak dapat dihapus karena masih memiliki data terkait'
                ], 422);
            }

            $semester->delete();

            return response()->json([
                'success' => true,
                'message' => 'Semester berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active semester for cabang
     */
    public function getActive(): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            // Check if status column exists
            $hasStatusColumn = \Schema::hasColumn('semester', 'status');

            $query = Semester::where('id_kacab', $kacabId)
                ->with(['kurikulum']);

            if ($hasStatusColumn) {
                $query->where('status', 'active');
            } else {
                $query->where('is_active', true);
            }

            $semester = $query->first();

            return response()->json([
                'success' => true,
                'data' => $semester,
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
     * Set semester as active
     */
    public function setActive($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $semester = Semester::where('id_kacab', $kacabId)->find($id);

            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak ditemukan'
                ], 404);
            }

            // Deactivate other active semesters
            Semester::where('id_kacab', $kacabId)
                ->where('id_semester', '!=', $id)
                ->update(['is_active' => false, 'status' => 'draft']);

            // Set this semester as active and assign active kurikulum
            $activeKurikulum = Kurikulum::where('id_kacab', $kacabId)
                ->where(function($q) {
                    $q->where('is_active', true)
                      ->orWhere('status', 'aktif');
                })
                ->first();

            if (!$semester->kurikulum_id && !$activeKurikulum) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester belum memiliki kurikulum'
                ], 422);
            }

            $updateData = ['is_active' => true, 'status' => 'active'];
            if ($activeKurikulum) {
                $updateData['kurikulum_id'] = $activeKurikulum->id_kurikulum;
            }

            $semester->update($updateData);
            $semester->load(['kurikulum']);

            return response()->json([
                'success' => true,
                'data' => $semester,
                'message' => 'Semester berhasil diaktifkan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengaktifkan semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activate semester (alias for setActive)
     */
    public function activate($id): JsonResponse
    {
        return $this->setActive($id);
    }

    /**
     * Deactivate semester
     */
    public function deactivate($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $semester = Semester::where('id_kacab', $kacabId)->find($id);

            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak ditemukan'
                ], 404);
            }

            // Check if status column exists
            $hasStatusColumn = \Schema::hasColumn('semester', 'status');

            if ($hasStatusColumn) {
                $semester->update(['is_active' => false, 'status' => 'draft']);
            } else {
                $semester->update(['is_active' => false]);
            }
            
            $semester->load(['kurikulum']);

            return response()->json([
                'success' => true,
                'data' => $semester,
                'message' => 'Semester berhasil dinonaktifkan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menonaktifkan semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete semester
     */
    public function complete($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $semester = Semester::where('id_kacab', $kacabId)->find($id);

            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak ditemukan'
                ], 404);
            }

            // Check if status column exists
            $hasStatusColumn = \Schema::hasColumn('semester', 'status');

            if ($hasStatusColumn) {
                $semester->update(['is_active' => false, 'status' => 'completed']);
            } else {
                $semester->update(['is_active' => false]);
            }
            
            $semester->load(['kurikulum']);

            return response()->json([
                'success' => true,
                'data' => $semester,
                'message' => 'Semester berhasil diselesaikan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyelesaikan semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Archive semester
     */
    public function archive($id): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $semester = Semester::where('id_kacab', $kacabId)->find($id);

            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak ditemukan'
                ], 404);
            }

            // Can only archive completed or inactive semesters
            if ($semester->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat mengarsipkan semester yang masih aktif. Nonaktifkan terlebih dahulu.'
                ], 422);
            }

            // Check if status column exists
            $hasStatusColumn = \Schema::hasColumn('semester', 'status');

            if ($hasStatusColumn) {
                $semester->update(['status' => 'archived']);
            }
            
            $semester->load(['kurikulum']);

            return response()->json([
                'success' => true,
                'data' => $semester,
                'message' => 'Semester berhasil diarsipkan'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengarsipkan semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get semester statistics
     */
    public function getStatistics(): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            // Check if status column exists in semester table
            $hasStatusColumn = \Schema::hasColumn('semester', 'status');

            if ($hasStatusColumn) {
                $stats = [
                    'total' => Semester::where('id_kacab', $kacabId)->count(),
                    'active' => Semester::where('id_kacab', $kacabId)->where('status', 'active')->count(),
                    'draft' => Semester::where('id_kacab', $kacabId)->where('status', 'draft')->count(),
                    'completed' => Semester::where('id_kacab', $kacabId)->where('status', 'completed')->count(),
                    'archived' => Semester::where('id_kacab', $kacabId)->where('status', 'archived')->count(),
                ];
            } else {
                // Fallback for when status column doesn't exist yet
                $total = Semester::where('id_kacab', $kacabId)->count();
                $stats = [
                    'total' => $total,
                    'active' => 0, // Default when no status column
                    'draft' => $total, // Assume all are draft
                    'completed' => 0,
                    'archived' => 0,
                    'note' => 'Status column not found. Please run database migration.'
                ];
            }

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