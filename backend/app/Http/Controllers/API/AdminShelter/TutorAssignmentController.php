<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\TutorKelompok;
use App\Models\Tutor;
use App\Models\Kelompok;
use App\Models\MataPelajaran;
use App\Models\Aktivitas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * TutorAssignmentController - Manage tutor-kelompok assignments dengan expertise
 * 
 * Phase 3 Admin Shelter: Tutor Assignment Management
 * Features: Assignment CRUD, expertise matching, conflict detection, workload tracking
 */
class TutorAssignmentController extends Controller
{
    /**
     * Constructor - Setup middleware and validation
     */
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware('role:admin_shelter');
    }

    /**
     * Display a listing of tutor assignments in shelter
     * 
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        try {
            // Get authenticated admin shelter
            $adminShelter = Auth::user()->adminShelter;

            if (!$adminShelter || !$adminShelter->shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shelter tidak ditemukan'
                ], 403);
            }

            $shelterId = $adminShelter->shelter->id_shelter;

            // Base query dengan relationships
            $query = TutorKelompok::whereHas('kelompok', function($q) use ($shelterId) {
                    $q->where('id_shelter', $shelterId);
                })
                ->with([
                    'tutor:id_tutor,nama,no_telpon,alamat,jenis_tutor',
                    'kelompok:id_kelompok,nama_kelompok,jumlah_anggota,kelas_gabungan,id_shelter',
                    'kelompok.levelAnakBinaan:id_level_anak_binaan,nama_level_binaan',
                    'assignedBy:id_admin_shelter,nama'
                ]);

            // Apply filters
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->whereHas('tutor', function($tq) use ($search) {
                        $tq->where('nama', 'like', "%{$search}%");
                    })
                    ->orWhereHas('kelompok', function($kq) use ($search) {
                        $kq->where('nama_kelompok', 'like', "%{$search}%");
                    });
                });
            }

            if ($request->has('tutor_id')) {
                $query->where('id_tutor', $request->tutor_id);
            }

            if ($request->has('kelompok_id')) {
                $query->where('id_kelompok', $request->kelompok_id);
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'assigned_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            if ($sortBy === 'tutor_name') {
                $query->join('tutor', 'tutor_kelompok.id_tutor', '=', 'tutor.id_tutor')
                      ->orderBy('tutor.nama', $sortOrder)
                      ->select('tutor_kelompok.*');
            } elseif ($sortBy === 'kelompok_name') {
                $query->join('kelompok', 'tutor_kelompok.id_kelompok', '=', 'kelompok.id_kelompok')
                      ->orderBy('kelompok.nama_kelompok', $sortOrder)
                      ->select('tutor_kelompok.*');
            } else {
                $query->orderBy($sortBy, $sortOrder);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $assignments = $query->paginate($perPage);

            // Add additional data for each assignment
            $assignments->getCollection()->transform(function ($assignment) {
                // Decode mata_pelajaran JSON to array
                $mataPelajaranIds = is_string($assignment->mata_pelajaran) ? 
                    json_decode($assignment->mata_pelajaran, true) : 
                    $assignment->mata_pelajaran;

                // Get mata pelajaran details
                $mataPelajaranDetails = [];
                if (is_array($mataPelajaranIds) && !empty($mataPelajaranIds)) {
                    $mataPelajaranDetails = MataPelajaran::whereIn('id_mata_pelajaran', $mataPelajaranIds)
                        ->get(['id_mata_pelajaran', 'nama_mata_pelajaran', 'kategori'])
                        ->toArray();
                }

                // Add processed data
                $assignment->mata_pelajaran_list = $mataPelajaranDetails;
                $assignment->mata_pelajaran_count = count($mataPelajaranDetails);

                // Add recent activity count (last 30 days)
                $assignment->recent_activities_count = Aktivitas::where('nama_kelompok', $assignment->kelompok->nama_kelompok)
                    ->where('id_tutor', $assignment->id_tutor)
                    ->where('tanggal', '>=', now()->subDays(30))
                    ->count();

                // Add assignment duration info
                $assignment->assignment_duration_days = $assignment->assigned_at ? 
                    now()->diffInDays($assignment->assigned_at) : 0;

                return $assignment;
            });

            // Summary statistics
            $totalAssignments = TutorKelompok::whereHas('kelompok', function($q) use ($shelterId) {
                $q->where('id_shelter', $shelterId);
            })->count();

            $activeAssignments = TutorKelompok::whereHas('kelompok', function($q) use ($shelterId) {
                $q->where('id_shelter', $shelterId);
            })->where('is_active', true)->count();

            $uniqueTutors = TutorKelompok::whereHas('kelompok', function($q) use ($shelterId) {
                $q->where('id_shelter', $shelterId);
            })->where('is_active', true)->distinct('id_tutor')->count();

            $uniqueKelompok = TutorKelompok::whereHas('kelompok', function($q) use ($shelterId) {
                $q->where('id_shelter', $shelterId);
            })->where('is_active', true)->distinct('id_kelompok')->count();

            return response()->json([
                'success' => true,
                'message' => 'Data tutor assignments berhasil diambil',
                'data' => $assignments->items(),
                'meta' => [
                    'total' => $assignments->total(),
                    'current_page' => $assignments->currentPage(),
                    'last_page' => $assignments->lastPage(),
                    'per_page' => $assignments->perPage(),
                    'from' => $assignments->firstItem(),
                    'to' => $assignments->lastItem()
                ],
                'summary' => [
                    'total_assignments' => $totalAssignments,
                    'active_assignments' => $activeAssignments,
                    'unique_tutors' => $uniqueTutors,
                    'unique_kelompok' => $uniqueKelompok,
                    'utilization_rate' => $uniqueTutors > 0 ? round(($activeAssignments / $uniqueTutors), 2) : 0
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in TutorAssignmentController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data tutor assignments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified tutor assignment with activity history
     * 
     * @param int $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            // Get authenticated admin shelter
            $adminShelter = Auth::user()->adminShelter;

            if (!$adminShelter || !$adminShelter->shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shelter tidak ditemukan'
                ], 403);
            }

            $shelterId = $adminShelter->shelter->id_shelter;

            // Get assignment with relationships
            $assignment = TutorKelompok::with([
                    'tutor:id_tutor,nama,no_telpon,alamat,jenis_tutor,keahlian,pengalaman_mengajar',
                    'kelompok:id_kelompok,nama_kelompok,jumlah_anggota,kelas_gabungan,id_level_anak_binaan,id_shelter',
                    'kelompok.levelAnakBinaan:id_level_anak_binaan,nama_level_binaan',
                    'kelompok.shelter:id_shelter,nama_shelter',
                    'assignedBy:id_admin_shelter,nama'
                ])
                ->whereHas('kelompok', function($q) use ($shelterId) {
                    $q->where('id_shelter', $shelterId);
                })
                ->find($id);

            if (!$assignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Assignment tidak ditemukan atau tidak dapat diakses'
                ], 404);
            }

            // Process mata pelajaran data
            $mataPelajaranIds = is_string($assignment->mata_pelajaran) ? 
                json_decode($assignment->mata_pelajaran, true) : 
                $assignment->mata_pelajaran;

            $mataPelajaranDetails = [];
            if (is_array($mataPelajaranIds) && !empty($mataPelajaranIds)) {
                $mataPelajaranDetails = MataPelajaran::whereIn('id_mata_pelajaran', $mataPelajaranIds)
                    ->get(['id_mata_pelajaran', 'nama_mata_pelajaran', 'kategori', 'deskripsi']);
            }

            // Get recent activity history (last 50 activities)
            $recentActivities = Aktivitas::where('nama_kelompok', $assignment->kelompok->nama_kelompok)
                ->where('id_tutor', $assignment->id_tutor)
                ->where('id_shelter', $shelterId)
                ->with(['materi.mataPelajaran:id_mata_pelajaran,nama_mata_pelajaran'])
                ->orderBy('tanggal', 'desc')
                ->limit(50)
                ->get(['id_aktivitas', 'jenis_kegiatan', 'materi', 'id_materi', 'tanggal', 'start_time', 'end_time']);

            // Activity statistics
            $activityStats = [
                'total_activities' => Aktivitas::where('nama_kelompok', $assignment->kelompok->nama_kelompok)
                    ->where('id_tutor', $assignment->id_tutor)
                    ->where('id_shelter', $shelterId)
                    ->count(),
                'activities_last_30_days' => Aktivitas::where('nama_kelompok', $assignment->kelompok->nama_kelompok)
                    ->where('id_tutor', $assignment->id_tutor)
                    ->where('id_shelter', $shelterId)
                    ->where('tanggal', '>=', now()->subDays(30))
                    ->count(),
                'bimbel_count' => Aktivitas::where('nama_kelompok', $assignment->kelompok->nama_kelompok)
                    ->where('id_tutor', $assignment->id_tutor)
                    ->where('id_shelter', $shelterId)
                    ->where('jenis_kegiatan', 'Bimbel')
                    ->count(),
                'kegiatan_count' => Aktivitas::where('nama_kelompok', $assignment->kelompok->nama_kelompok)
                    ->where('id_tutor', $assignment->id_tutor)
                    ->where('id_shelter', $shelterId)
                    ->where('jenis_kegiatan', 'Kegiatan')
                    ->count(),
                'first_activity' => Aktivitas::where('nama_kelompok', $assignment->kelompok->nama_kelompok)
                    ->where('id_tutor', $assignment->id_tutor)
                    ->where('id_shelter', $shelterId)
                    ->orderBy('tanggal', 'asc')
                    ->value('tanggal'),
                'last_activity' => Aktivitas::where('nama_kelompok', $assignment->kelompok->nama_kelompok)
                    ->where('id_tutor', $assignment->id_tutor)
                    ->where('id_shelter', $shelterId)
                    ->orderBy('tanggal', 'desc')
                    ->value('tanggal')
            ];

            // Assignment performance metrics
            $assignmentDays = $assignment->assigned_at ? now()->diffInDays($assignment->assigned_at) : 0;
            $avgActivitiesPerWeek = $assignmentDays > 0 ? 
                round(($activityStats['total_activities'] / $assignmentDays) * 7, 1) : 0;

            return response()->json([
                'success' => true,
                'message' => 'Detail assignment berhasil diambil',
                'data' => [
                    'assignment' => $assignment,
                    'mata_pelajaran_details' => $mataPelajaranDetails,
                    'recent_activities' => $recentActivities,
                    'activity_stats' => $activityStats,
                    'performance_metrics' => [
                        'assignment_duration_days' => $assignmentDays,
                        'avg_activities_per_week' => $avgActivitiesPerWeek,
                        'activity_frequency' => $activityStats['activities_last_30_days'] > 0 ? 'Aktif' : 
                            ($activityStats['total_activities'] > 0 ? 'Kurang Aktif' : 'Tidak Aktif'),
                        'mata_pelajaran_count' => count($mataPelajaranDetails)
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in TutorAssignmentController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail assignment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to validate shelter access
     * 
     * @return array [adminShelter, shelterId] or null if invalid
     */
    private function validateShelterAccess()
    {
        $adminShelter = Auth::user()->adminShelter;

        if (!$adminShelter || !$adminShelter->shelter) {
            return null;
        }

        return [$adminShelter, $adminShelter->shelter->id_shelter];
    }
}