<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Aktivitas;
use App\Models\Shelter;
use App\Models\Materi;
use App\Models\Tutor;
use App\Models\Semester;
use App\Models\Kelompok;
use App\Models\MataPelajaran;
use App\Models\TutorKelompok;
use App\Http\Resources\AktivitasResource;
use App\Http\Requests\AktivitasRequest;
use App\Http\Requests\AdminShelter\UpdateAktivitasStatusRequest;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AktivitasController extends Controller
{
    protected AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    /**
     * Display a listing of activities for the shelter.
     *
     * @param Request $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        try {
            // Get the authenticated admin_shelter
            $user = Auth::user();
            
            // Ensure the user has an admin_shelter profile
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            // Get shelter_id from the admin_shelter relationship
            $shelterId = $user->adminShelter->shelter->id_shelter;
            
            // Base query with tutor relation only (materi is string field)
            $query = Aktivitas::where('id_shelter', $shelterId)
                ->with(['tutor']);
            
            // Auto-update status for activities that might be completed
            $this->updateActivitiesStatus($shelterId);
            
            // Query params
            $search = $request->input('search');
            $dateFrom = $request->input('date_from');
            $dateTo = $request->input('date_to');
            $type = $request->input('jenis_kegiatan');
            $typeNot = $request->input('jenis_kegiatan_not');
            $namaKelompok = $request->input('nama_kelompok');
            $tutorId = $request->input('id_tutor');
            $mataPelajaranId = $request->input('mata_pelajaran_id');
            $kelasId = $request->input('kelas_id');
            $semesterId = $request->input('semester_id');
            
            // Apply filters
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('jenis_kegiatan', 'like', "%$search%")
                      ->orWhere('materi', 'like', "%$search%")
                      ->orWhere('nama_kelompok', 'like', "%$search%")
                      ->orWhereHas('tutor', function($tq) use ($search) {
                          $tq->where('nama', 'like', "%$search%");
                      });
                });
            }
            
            if ($dateFrom) {
                $query->whereDate('tanggal', '>=', $dateFrom);
            }
            
            if ($dateTo) {
                $query->whereDate('tanggal', '<=', $dateTo);
            }
            
            if ($type) {
                $query->where('jenis_kegiatan', $type);
            }
            
            if ($typeNot) {
                $query->where('jenis_kegiatan', '!=', $typeNot);
            }
            
            if ($namaKelompok) {
                $query->where('nama_kelompok', $namaKelompok);
            }
            
            if ($tutorId) {
                $query->where('id_tutor', $tutorId);
            }
            
            // New kurikulum-based filters
            if ($mataPelajaranId) {
                $query->whereNotNull('id_materi')
                      ->whereHas('materiRelation', function($mq) use ($mataPelajaranId) {
                          $mq->where('id_mata_pelajaran', $mataPelajaranId);
                      });
            }
            
            if ($kelasId) {
                $query->whereNotNull('id_materi')
                      ->whereHas('materiRelation', function($mq) use ($kelasId) {
                          $mq->where('id_kelas', $kelasId);
                      });
            }
            
            // Semester filter (based on activity date)
            if ($semesterId) {
                $semester = Semester::find($semesterId);
                if ($semester) {
                    $query->whereBetween('tanggal', [$semester->tanggal_mulai, $semester->tanggal_selesai]);
                }
            }
            
            // Default pagination
            $perPage = $request->per_page ?? 10;
            
            // Order by date (most recent first)
            $aktivitas = $query->orderBy('tanggal', 'desc')->paginate($perPage);
            
            // Add kurikulum integration info to each activity (only for activities with id_materi)
            $aktivitas->getCollection()->transform(function ($activity) {
                if ($activity->id_materi) {
                    // Fetch materi relationship only when needed for additional info
                    $materi = \App\Models\Materi::with(['mataPelajaran', 'kelas.jenjang'])
                        ->find($activity->id_materi);
                    
                    if ($materi) {
                        $activity->kurikulum_info = [
                            'mata_pelajaran' => $materi->mataPelajaran->nama_mata_pelajaran ?? null,
                            'kelas' => $materi->kelas->nama_kelas ?? null,
                            'jenjang' => $materi->kelas->jenjang->nama_jenjang ?? null,
                            'kategori' => $materi->mataPelajaran->kategori ?? null,
                            'is_from_template' => $materi->is_from_template ?? false,
                        ];
                    } else {
                        $activity->kurikulum_info = null;
                    }
                } else {
                    $activity->kurikulum_info = null;
                }
                return $activity;
            });
            
            return response()->json([
                'success' => true,
                'message' => 'Data aktivitas berhasil diambil',
                'data' => $aktivitas->items(),
                'meta' => [
                    'total' => $aktivitas->total(),
                    'current_page' => $aktivitas->currentPage(),
                    'last_page' => $aktivitas->lastPage(),
                    'from' => $aktivitas->firstItem(),
                    'to' => $aktivitas->lastItem()
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in AktivitasController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data aktivitas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created activity.
     *
     * @param  AktivitasRequest  $request
     * @return \Illuminate\Http\Response
     */
    public function store(AktivitasRequest $request)
    {
        try {
            // Get the authenticated admin_shelter
            $user = Auth::user();
            
            // Ensure the user has an admin_shelter profile
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            // Get shelter_id from the admin_shelter relationship
            $shelterId = $user->adminShelter->shelter->id_shelter;
            
            // Validate tutor belongs to the same shelter if provided
            if ($request->id_tutor) {
                $tutor = Tutor::find($request->id_tutor);
                if (!$tutor || $tutor->id_shelter != $shelterId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid tutor selected. Tutor must belong to your shelter.'
                    ], 400);
                }
            }
            
            // Check for activity conflicts (tutor and kelompok overlap)
            $conflictValidation = $this->validateActivityConflicts($request, $shelterId);
            if (!$conflictValidation['success']) {
                return response()->json($conflictValidation, 400);
            }
            
            // Create activity
            $aktivitas = new Aktivitas();
            $aktivitas->id_shelter = $shelterId;
            $aktivitas->id_tutor = $request->id_tutor;
            $aktivitas->jenis_kegiatan = $request->jenis_kegiatan;
            
            // Handle nama_kelompok and level based on activity type
            if ($request->jenis_kegiatan === 'Bimbel') {
                // Validate kelompok exists and belongs to shelter
                if (!$request->nama_kelompok) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Kelompok is required for Bimbel activities'
                    ], 400);
                }

                $kelompok = Kelompok::where('nama_kelompok', $request->nama_kelompok)
                    ->where('id_shelter', $shelterId)
                    ->first();

                if (!$kelompok) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid kelompok selected. Kelompok must belong to your shelter.'
                    ], 400);
                }

                $aktivitas->nama_kelompok = $request->nama_kelompok;
                
                // Auto-populate level from kelompok's kelas (array of IDs)
                $aktivitas->level = $kelompok->kelas ? implode(', ', $kelompok->kelas) : '';
                
                // Validate and set materi
                $aktivitas->id_materi = $request->id_materi;

                if ($request->id_materi) {
                    $materi = Materi::with(['mataPelajaran', 'kelas'])->find($request->id_materi);
                    if (!$materi) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Invalid materi selected'
                        ], 400);
                    }

                    // Validate materi compatibility with kelompok's kelas
                    if ($kelompok->kelas && !empty($kelompok->kelas)) {
                        $materiKelasId = $materi->id_kelas;
                        $kelompokKelasIds = $kelompok->kelas;
                        
                        if (!in_array($materiKelasId, $kelompokKelasIds)) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Selected materi is not compatible with kelompok\'s kelas. Please select appropriate materi.'
                            ], 400);
                        }
                    }

                    // Store materi as STRING (not object)
                    $aktivitas->materi = ($materi->mataPelajaran->nama_mata_pelajaran ?? '') . ' - ' . $materi->nama_materi;
                } else {
                    $aktivitas->materi = $request->materi ?? '';
                }
            } else {
                // For "Kegiatan" type, set empty values
                $aktivitas->nama_kelompok = '';
                $aktivitas->level = '';
                $aktivitas->id_materi = null;
                $aktivitas->materi = $request->materi ?? '';
            }
            
            $aktivitas->tanggal = $request->tanggal;
            
            // Add the missing time-related fields
            $aktivitas->start_time = $request->start_time;
            $aktivitas->end_time = $request->end_time;
            $aktivitas->late_threshold = $request->late_threshold;
            $aktivitas->late_minutes_threshold = $request->late_minutes_threshold ?? 15;
            
            // Set default status
            $aktivitas->status = 'draft';
            
            // Save the activity
            $aktivitas->save();
            
            // Load relationships for response (NOT materi relation)
            $aktivitas->load(['tutor']);
            
            // Add kurikulum info if materi exists (consistent with index method)
            if ($aktivitas->id_materi) {
                $materi = \App\Models\Materi::with(['mataPelajaran', 'kelas.jenjang'])
                    ->find($aktivitas->id_materi);
                
                if ($materi) {
                    $aktivitas->kurikulum_info = [
                        'mata_pelajaran' => $materi->mataPelajaran->nama_mata_pelajaran ?? null,
                        'kelas' => $materi->kelas->nama_kelas ?? null,
                        'jenjang' => $materi->kelas->jenjang->nama_jenjang ?? null,
                        'kategori' => $materi->mataPelajaran->kategori ?? null,
                        'is_from_template' => $materi->is_from_template ?? false,
                    ];
                } else {
                    $aktivitas->kurikulum_info = null;
                }
            } else {
                $aktivitas->kurikulum_info = null;
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Activity created successfully',
                'data' => $aktivitas
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Error in AktivitasController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat membuat aktivitas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified activity with attendees.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            // Get the authenticated admin_shelter
            $user = Auth::user();
            
            // Ensure the user has an admin_shelter profile
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            // Get shelter_id from the admin_shelter relationship
            $shelterId = $user->adminShelter->shelter->id_shelter;
            
            // Load relations BUT NOT 'materi' to avoid overriding string field
            $aktivitas = Aktivitas::with(['absen.absenUser.anak', 'absen.absenUser.tutor', 'tutor'])
                ->findOrFail($id);
            
            // Auto-update status for this specific activity
            $aktivitas->updateStatusByTime();
            
            // Verify access - only allow access to activities from user's shelter
            if ($aktivitas->id_shelter != $shelterId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this activity'
                ], 403);
            }
            
            // Add kurikulum info if materi exists (consistent with index method)
            if ($aktivitas->id_materi) {
                $materi = \App\Models\Materi::with(['mataPelajaran', 'kelas.jenjang'])
                    ->find($aktivitas->id_materi);
                
                if ($materi) {
                    $aktivitas->kurikulum_info = [
                        'mata_pelajaran' => $materi->mataPelajaran->nama_mata_pelajaran ?? null,
                        'kelas' => $materi->kelas->nama_kelas ?? null,
                        'jenjang' => $materi->kelas->jenjang->nama_jenjang ?? null,
                        'kategori' => $materi->mataPelajaran->kategori ?? null,
                        'is_from_template' => $materi->is_from_template ?? false,
                    ];
                } else {
                    $aktivitas->kurikulum_info = null;
                }
            } else {
                $aktivitas->kurikulum_info = null;
            }
            
            return response()->json([
                'success' => true,
                'data' => $aktivitas
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in AktivitasController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail aktivitas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified activity.
     *
     * @param  AktivitasRequest  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(AktivitasRequest $request, $id)
    {
        try {
            // Get the authenticated admin_shelter
            $user = Auth::user();
            
            // Ensure the user has an admin_shelter profile
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            // Get shelter_id from the admin_shelter relationship
            $shelterId = $user->adminShelter->shelter->id_shelter;
            
            $aktivitas = Aktivitas::findOrFail($id);
            
            // Verify access - only allow access to activities from user's shelter
            if ($aktivitas->id_shelter != $shelterId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this activity'
                ], 403);
            }
            
            // Validate tutor belongs to the same shelter if provided
            if ($request->id_tutor) {
                $tutor = Tutor::find($request->id_tutor);
                if (!$tutor || $tutor->id_shelter != $shelterId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid tutor selected. Tutor must belong to your shelter.'
                    ], 400);
                }
            }
            
            // Check for activity conflicts (tutor and kelompok overlap) - exclude current activity
            $conflictValidation = $this->validateActivityConflicts($request, $shelterId, $id);
            if (!$conflictValidation['success']) {
                return response()->json($conflictValidation, 400);
            }
            
            // Update activity data
            $aktivitas->id_tutor = $request->id_tutor;
            $aktivitas->jenis_kegiatan = $request->jenis_kegiatan;
            
            // Handle nama_kelompok and level based on activity type
            if ($request->jenis_kegiatan === 'Bimbel') {
                // Validate kelompok exists and belongs to shelter
                if (!$request->nama_kelompok) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Kelompok is required for Bimbel activities'
                    ], 400);
                }

                $kelompok = Kelompok::where('nama_kelompok', $request->nama_kelompok)
                    ->where('id_shelter', $shelterId)
                    ->first();

                if (!$kelompok) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid kelompok selected. Kelompok must belong to your shelter.'
                    ], 400);
                }

                $aktivitas->nama_kelompok = $request->nama_kelompok;
                
                // Auto-populate level from kelompok's kelas (array of IDs)
                $aktivitas->level = $kelompok->kelas ? implode(', ', $kelompok->kelas) : '';
                
                // Validate and set materi
                $aktivitas->id_materi = $request->id_materi;

                if ($request->id_materi) {
                    $materi = Materi::with(['mataPelajaran', 'kelas'])->find($request->id_materi);
                    if (!$materi) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Invalid materi selected'
                        ], 400);
                    }

                    // Validate materi compatibility with kelompok's kelas
                    if ($kelompok->kelas && !empty($kelompok->kelas)) {
                        $materiKelasId = $materi->id_kelas;
                        $kelompokKelasIds = $kelompok->kelas;
                        
                        if (!in_array($materiKelasId, $kelompokKelasIds)) {
                            return response()->json([
                                'success' => false,
                                'message' => 'Selected materi is not compatible with kelompok\'s kelas. Please select appropriate materi.'
                            ], 400);
                        }
                    }

                    // Store materi as STRING (not object)
                    $aktivitas->materi = ($materi->mataPelajaran->nama_mata_pelajaran ?? '') . ' - ' . $materi->nama_materi;
                } else {
                    $aktivitas->materi = $request->materi ?? '';
                }
            } else {
                $aktivitas->nama_kelompok = '';
                $aktivitas->level = '';
                $aktivitas->id_materi = null;
                $aktivitas->materi = $request->materi ?? '';
            }
            
            $aktivitas->tanggal = $request->tanggal;
            
            // Update the missing time-related fields
            $aktivitas->start_time = $request->start_time;
            $aktivitas->end_time = $request->end_time;
            $aktivitas->late_threshold = $request->late_threshold;
            $aktivitas->late_minutes_threshold = $request->late_minutes_threshold ?? $aktivitas->late_minutes_threshold ?? 15;
            
            // Don't update status in update method - it should be managed by the system
            
            $aktivitas->save();
            
            // Load relationships for response (NOT materi relation)
            $aktivitas->load(['tutor']);
            
            // Add kurikulum info if materi exists
            if ($aktivitas->id_materi) {
                $materi = \App\Models\Materi::with(['mataPelajaran', 'kelas.jenjang'])
                    ->find($aktivitas->id_materi);
                
                if ($materi) {
                    $aktivitas->kurikulum_info = [
                        'mata_pelajaran' => $materi->mataPelajaran->nama_mata_pelajaran ?? null,
                        'kelas' => $materi->kelas->nama_kelas ?? null,
                        'jenjang' => $materi->kelas->jenjang->nama_jenjang ?? null,
                        'kategori' => $materi->mataPelajaran->kategori ?? null,
                        'is_from_template' => $materi->is_from_template ?? false,
                    ];
                } else {
                    $aktivitas->kurikulum_info = null;
                }
            } else {
                $aktivitas->kurikulum_info = null;
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Activity updated successfully',
                'data' => $aktivitas
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AktivitasController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui aktivitas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateStatus(UpdateAktivitasStatusRequest $request, $id)
    {
        try {
            $user = Auth::user();

            if (!$user->adminShelter || !$user->adminShelter->shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelterId = $user->adminShelter->shelter->id_shelter;

            $relations = ['tutor', 'shelter', 'absen.absenUser.anak', 'absen.absenUser.tutor'];

            if (method_exists(Aktivitas::class, 'materiData')) {
                $relations[] = 'materiData';
            }

            $aktivitas = Aktivitas::with($relations)->findOrFail($id);

            if ($aktivitas->id_shelter != $shelterId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this activity'
                ], 403);
            }

            if ($aktivitas->status === 'completed') {
                $resourceData = (new AktivitasResource($aktivitas))->toArray($request);
                $resourceData['attendance_summary'] = [
                    'success' => true,
                    'message' => 'Activity already marked as completed. No changes applied.',
                    'activity_id' => $aktivitas->id_aktivitas,
                    'already_completed' => true,
                ];

                return response()->json([
                    'success' => true,
                    'message' => 'Activity already completed',
                    'data' => $resourceData
                ]);
            }

            $aktivitas->status = $request->status;
            $aktivitas->save();

            $aktivitas->refresh();
            $aktivitas->load($relations);

            $summary = null;

            if ($request->status === 'completed') {
                $summary = $this->attendanceService->finalizeActivityCompletion(
                    $aktivitas,
                    $request->input('notes'),
                    true
                );
            }

            $resourceData = (new AktivitasResource($aktivitas))->toArray($request);

            if (!is_null($summary)) {
                $resourceData['attendance_summary'] = $summary;
            }

            return response()->json([
                'success' => true,
                'message' => 'Activity status updated successfully',
                'data' => $resourceData
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AktivitasController@updateStatus: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui status aktivitas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified activity.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            // Get the authenticated admin_shelter
            $user = Auth::user();
            
            // Ensure the user has an admin_shelter profile
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            // Get shelter_id from the admin_shelter relationship
            $shelterId = $user->adminShelter->shelter->id_shelter;
            
            $aktivitas = Aktivitas::findOrFail($id);
            
            // Verify access - only allow access to activities from user's shelter
            if ($aktivitas->id_shelter != $shelterId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to this activity'
                ], 403);
            }
            
            // Delete associated photos
            if ($aktivitas->foto_1) {
                Storage::delete("Aktivitas/{$aktivitas->id_aktivitas}/{$aktivitas->foto_1}");
            }
            
            if ($aktivitas->foto_2) {
                Storage::delete("Aktivitas/{$aktivitas->id_aktivitas}/{$aktivitas->foto_2}");
            }
            
            if ($aktivitas->foto_3) {
                Storage::delete("Aktivitas/{$aktivitas->id_aktivitas}/{$aktivitas->foto_3}");
            }
            
            // Delete the activity folder
            Storage::deleteDirectory("Aktivitas/{$aktivitas->id_aktivitas}");
            
            // Delete the activity (this should cascade delete related absen records)
            $aktivitas->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Activity deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error in AktivitasController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghapus aktivitas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Store a photo for an activity.
     *
     * @param  \Illuminate\Http\UploadedFile  $file
     * @param  Aktivitas  $aktivitas
     * @return string
     */
    private function storePhoto($file, $aktivitas)
    {
        $fileName = time() . '_' . $file->getClientOriginalName();
        $file->storeAs("Aktivitas/{$aktivitas->id_aktivitas}", $fileName);
        return $fileName;
    }

    /**
     * Get aktivitas by semester (NEW METHOD)
     */
    public function getAktivitasBySemester($semesterId, Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelterId = $user->adminShelter->shelter->id_shelter;
            
            // Validate semester exists
            $semester = Semester::find($semesterId);
            if (!$semester) {
                return response()->json([
                    'success' => false,
                    'message' => 'Semester tidak ditemukan'
                ], 404);
            }

            // Get activities within semester date range
            $query = Aktivitas::where('id_shelter', $shelterId)
                ->whereBetween('tanggal', [$semester->tanggal_mulai, $semester->tanggal_selesai])
                ->with(['tutor']);

            // Apply additional filters
            if ($request->has('nama_kelompok')) {
                $query->where('nama_kelompok', $request->nama_kelompok);
            }

            if ($request->has('mata_pelajaran_id')) {
                $query->whereNotNull('id_materi')
                      ->whereHas('materiRelation', function($subQuery) use ($request) {
                          $subQuery->where('id_mata_pelajaran', $request->mata_pelajaran_id);
                      });
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $aktivitas = $query->orderBy('tanggal', 'desc')->paginate($perPage);

            // Add kurikulum info
            $aktivitas->getCollection()->transform(function ($activity) {
                if ($activity->id_materi) {
                    $materi = \App\Models\Materi::with(['mataPelajaran', 'kelas.jenjang'])
                        ->find($activity->id_materi);
                    
                    if ($materi) {
                        $activity->kurikulum_info = [
                            'mata_pelajaran' => $materi->mataPelajaran->nama_mata_pelajaran ?? null,
                            'kelas' => $materi->kelas->nama_kelas ?? null,
                            'jenjang' => $materi->kelas->jenjang->nama_jenjang ?? null,
                        ];
                    } else {
                        $activity->kurikulum_info = null;
                    }
                } else {
                    $activity->kurikulum_info = null;
                }
                return $activity;
            });

            return response()->json([
                'success' => true,
                'message' => 'Aktivitas semester berhasil diambil',
                'data' => [
                    'semester_info' => $semester,
                    'aktivitas' => $aktivitas
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AktivitasController@getAktivitasBySemester: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil aktivitas semester',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get aktivitas by materi (NEW METHOD)
     */
    public function getAktivitasByMateri($materiId, Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelterId = $user->adminShelter->shelter->id_shelter;
            
            // Validate materi exists and belongs to kacab
            $materi = Materi::find($materiId);
            if (!$materi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Materi tidak ditemukan'
                ], 404);
            }

            // Get activities using this materi
            $query = Aktivitas::where('id_shelter', $shelterId)
                ->where('id_materi', $materiId)
                ->with(['tutor']);

            // Apply date filter
            if ($request->has('date_from')) {
                $query->whereDate('tanggal', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('tanggal', '<=', $request->date_to);
            }

            // Pagination
            $perPage = $request->get('per_page', 15);
            $aktivitas = $query->orderBy('tanggal', 'desc')->paginate($perPage);

            // Usage statistics
            $stats = [
                'total_usage' => Aktivitas::where('id_shelter', $shelterId)
                    ->where('id_materi', $materiId)
                    ->count(),
                'unique_tutors' => Aktivitas::where('id_shelter', $shelterId)
                    ->where('id_materi', $materiId)
                    ->distinct('id_tutor')
                    ->count('id_tutor'),
                'unique_kelompok' => Aktivitas::where('id_shelter', $shelterId)
                    ->where('id_materi', $materiId)
                    ->distinct('nama_kelompok')
                    ->count('nama_kelompok'),
                'first_used' => Aktivitas::where('id_shelter', $shelterId)
                    ->where('id_materi', $materiId)
                    ->orderBy('tanggal', 'asc')
                    ->value('tanggal'),
                'last_used' => Aktivitas::where('id_shelter', $shelterId)
                    ->where('id_materi', $materiId)
                    ->orderBy('tanggal', 'desc')
                    ->value('tanggal')
            ];

            return response()->json([
                'success' => true,
                'message' => 'Usage tracking materi berhasil diambil',
                'data' => [
                    'materi_info' => $materi->load(['mataPelajaran', 'kelas.jenjang']),
                    'usage_stats' => $stats,
                    'aktivitas' => $aktivitas
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AktivitasController@getAktivitasByMateri: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil usage tracking materi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Duplicate existing aktivitas (NEW METHOD)
     */
    public function duplicateAktivitas($id, Request $request)
    {
        $payload = $request->all();

        $normalizedTimes = [];
        foreach (['start_time', 'end_time'] as $timeField) {
            if (array_key_exists($timeField, $payload)) {
                $value = $payload[$timeField];

                if ($value === '' || $value === null) {
                    $payload[$timeField] = null;
                    $normalizedTimes[$timeField] = null;
                    continue;
                }

                if (preg_match('/^\d{2}:\d{2}$/', $value)) {
                    $payload[$timeField] = $value . ':00';
                }

                $normalizedTimes[$timeField] = $payload[$timeField];
            }
        }

        $validator = Validator::make($payload, [
            'tanggal' => 'required|date',
            'start_time' => 'sometimes|nullable|date_format:H:i:s',
            'end_time' => 'sometimes|nullable|date_format:H:i:s',
            'nama_kelompok' => 'sometimes|string|max:255'
        ], [
            'start_time.date_format' => 'The start time must be in HH:MM:SS format.',
            'end_time.date_format' => 'The end time must be in HH:MM:SS format.'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        if (!empty($normalizedTimes)) {
            $request->merge($normalizedTimes);
        }

        DB::beginTransaction();
        try {
            $user = Auth::user();
            
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelterId = $user->adminShelter->shelter->id_shelter;

            // Get original aktivitas
            $originalAktivitas = Aktivitas::where('id_shelter', $shelterId)
                ->where('id_aktivitas', $id)
                ->first();

            if (!$originalAktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aktivitas tidak ditemukan'
                ], 404);
            }

            $parseTime = function ($time) {
                if (empty($time)) {
                    return null;
                }

                foreach (['H:i:s', 'H:i'] as $format) {
                    try {
                        return Carbon::createFromFormat($format, $time);
                    } catch (\Exception $e) {
                        continue;
                    }
                }

                return null;
            };

            $finalStartTime = $request->input('start_time', $originalAktivitas->start_time);
            $finalEndTime = $request->input('end_time', $originalAktivitas->end_time);

            $startTimeCarbon = $parseTime($finalStartTime);
            $endTimeCarbon = $parseTime($finalEndTime);

            if ($startTimeCarbon && $endTimeCarbon && $startTimeCarbon->diffInMinutes($endTimeCarbon) < 45) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => [
                        'end_time' => ['Durasi kegiatan minimal 45 menit.']
                    ]
                ], 422);
            }

            // Create duplicate aktivitas
            $duplicateAktivitas = $originalAktivitas->replicate();
            $duplicateAktivitas->tanggal = $request->tanggal;
            $duplicateAktivitas->start_time = $finalStartTime;
            $duplicateAktivitas->end_time = $finalEndTime;
            $duplicateAktivitas->nama_kelompok = $request->nama_kelompok ?? $originalAktivitas->nama_kelompok;
            
            // Clear photo fields (photos won't be duplicated)
            $duplicateAktivitas->foto_1 = null;
            $duplicateAktivitas->foto_2 = null;
            $duplicateAktivitas->foto_3 = null;
            
            $duplicateAktivitas->save();

            // Load relationships (NOT materi relation)
            $duplicateAktivitas->load(['tutor']);
            
            // Add kurikulum info if materi exists
            if ($duplicateAktivitas->id_materi) {
                $materi = \App\Models\Materi::with(['mataPelajaran', 'kelas.jenjang'])
                    ->find($duplicateAktivitas->id_materi);
                
                if ($materi) {
                    $duplicateAktivitas->kurikulum_info = [
                        'mata_pelajaran' => $materi->mataPelajaran->nama_mata_pelajaran ?? null,
                        'kelas' => $materi->kelas->nama_kelas ?? null,
                        'jenjang' => $materi->kelas->jenjang->nama_jenjang ?? null,
                        'kategori' => $materi->mataPelajaran->kategori ?? null,
                        'is_from_template' => $materi->is_from_template ?? false,
                    ];
                } else {
                    $duplicateAktivitas->kurikulum_info = null;
                }
            } else {
                $duplicateAktivitas->kurikulum_info = null;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Aktivitas berhasil diduplikasi',
                'data' => [
                    'original_id' => $originalAktivitas->id_aktivitas,
                    'duplicate' => $duplicateAktivitas
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in AktivitasController@duplicateAktivitas: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menduplikasi aktivitas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get aktivitas statistics (NEW METHOD)
     */
    public function getAktivitasStats(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelterId = $user->adminShelter->shelter->id_shelter;
            
            // Date range filter
            $dateFrom = $request->get('date_from', now()->subDays(30)->toDateString());
            $dateTo = $request->get('date_to', now()->toDateString());

            // Basic counts
            $totalAktivitas = Aktivitas::where('id_shelter', $shelterId)
                ->whereBetween('tanggal', [$dateFrom, $dateTo])
                ->count();

            $totalBimbel = Aktivitas::where('id_shelter', $shelterId)
                ->where('jenis_kegiatan', 'Bimbel')
                ->whereBetween('tanggal', [$dateFrom, $dateTo])
                ->count();

            $totalKegiatan = Aktivitas::where('id_shelter', $shelterId)
                ->where('jenis_kegiatan', 'Kegiatan')
                ->whereBetween('tanggal', [$dateFrom, $dateTo])
                ->count();

            // Statistics by mata pelajaran (using join to avoid loading relations)
            $statsByMataPelajaran = DB::table('aktivitas')
                ->join('materi', 'aktivitas.id_materi', '=', 'materi.id_materi')
                ->join('mata_pelajaran', 'materi.id_mata_pelajaran', '=', 'mata_pelajaran.id_mata_pelajaran')
                ->where('aktivitas.id_shelter', $shelterId)
                ->whereBetween('aktivitas.tanggal', [$dateFrom, $dateTo])
                ->whereNotNull('aktivitas.id_materi')
                ->select('mata_pelajaran.nama_mata_pelajaran', 
                        DB::raw('COUNT(*) as total_aktivitas'),
                        DB::raw('COUNT(DISTINCT aktivitas.nama_kelompok) as total_kelompok'))
                ->groupBy('mata_pelajaran.id_mata_pelajaran', 'mata_pelajaran.nama_mata_pelajaran')
                ->orderBy('total_aktivitas', 'desc')
                ->get();

            // Statistics by kelompok
            $statsByKelompok = Aktivitas::where('id_shelter', $shelterId)
                ->whereBetween('tanggal', [$dateFrom, $dateTo])
                ->whereNotNull('nama_kelompok')
                ->select('nama_kelompok',
                        DB::raw('COUNT(*) as total_aktivitas'),
                        DB::raw('COUNT(DISTINCT id_tutor) as total_tutors'),
                        DB::raw('COUNT(DISTINCT DATE(tanggal)) as active_days'))
                ->groupBy('nama_kelompok')
                ->orderBy('total_aktivitas', 'desc')
                ->get();

            // Statistics by tutor
            $statsByTutor = DB::table('aktivitas')
                ->join('tutor', 'aktivitas.id_tutor', '=', 'tutor.id_tutor')
                ->where('aktivitas.id_shelter', $shelterId)
                ->whereBetween('aktivitas.tanggal', [$dateFrom, $dateTo])
                ->select('tutor.nama as nama_tutor',
                        DB::raw('COUNT(*) as total_aktivitas'),
                        DB::raw('COUNT(DISTINCT aktivitas.nama_kelompok) as total_kelompok'))
                ->groupBy('tutor.id_tutor', 'tutor.nama')
                ->orderBy('total_aktivitas', 'desc')
                ->limit(10)
                ->get();

            // Activity trend (daily for last 30 days)
            $activityTrend = [];
            for ($i = 29; $i >= 0; $i--) {
                $date = now()->subDays($i)->toDateString();
                $count = Aktivitas::where('id_shelter', $shelterId)
                    ->whereDate('tanggal', $date)
                    ->count();
                
                $activityTrend[] = [
                    'date' => $date,
                    'count' => $count
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Statistik aktivitas berhasil diambil',
                'data' => [
                    'summary' => [
                        'total_aktivitas' => $totalAktivitas,
                        'total_bimbel' => $totalBimbel,
                        'total_kegiatan' => $totalKegiatan,
                        'date_range' => [
                            'from' => $dateFrom,
                            'to' => $dateTo
                        ]
                    ],
                    'by_mata_pelajaran' => $statsByMataPelajaran,
                    'by_kelompok' => $statsByKelompok,
                    'by_tutor' => $statsByTutor,
                    'activity_trend' => $activityTrend
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in AktivitasController@getAktivitasStats: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil statistik aktivitas',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Auto-update activities status based on current time
     */
    private function updateActivitiesStatus($shelterId)
    {
        try {
            // Find activities that need status update
            $activitiesToUpdate = Aktivitas::where('id_shelter', $shelterId)
                ->whereIn('status', ['draft', 'ongoing'])
                ->whereNotNull('start_time')
                ->get();
            
            foreach ($activitiesToUpdate as $activity) {
                $activity->updateStatusByTime();
            }
        } catch (\Exception $e) {
            Log::error('Error updating activities status: ' . $e->getMessage());
        }
    }
    
    /**
     * Validate activity conflicts (tutor and kelompok overlap)
     */
    private function validateActivityConflicts($request, $shelterId, $excludeId = null)
    {
        try {
            // Skip validation if no time is provided
            if (!$request->start_time || !$request->end_time) {
                return ['success' => true];
            }

            $conflicts = [];
            $tanggal = $request->tanggal;
            $startTime = $request->start_time;
            $endTime = $request->end_time;

            // Base query for existing activities on the same date
            $existingQuery = Aktivitas::where('id_shelter', $shelterId)
                ->whereDate('tanggal', $tanggal)
                ->whereNotNull('start_time')
                ->whereNotNull('end_time')
                ->with(['tutor']); // Load tutor relation for name display

            // Exclude current activity if updating
            if ($excludeId) {
                $existingQuery->where('id_aktivitas', '!=', $excludeId);
            }

            $existingActivities = $existingQuery->get();

            foreach ($existingActivities as $existing) {
                $existingStart = $existing->start_time;
                $existingEnd = $existing->end_time;

                // Check for time overlap
                $hasTimeOverlap = (
                    ($startTime < $existingEnd && $endTime > $existingStart)
                );

                if (!$hasTimeOverlap) {
                    continue;
                }

                // Check tutor conflict
                if ($request->id_tutor && $existing->id_tutor == $request->id_tutor) {
                    $tutorName = $existing->tutor ? $existing->tutor->nama : 'Unknown';
                    $conflicts[] = "Tutor {$tutorName} sudah dijadwalkan pada {$existingStart}-{$existingEnd} untuk {$existing->jenis_kegiatan}";
                }

                // Check kelompok conflict (only for Bimbel activities)
                if ($request->jenis_kegiatan === 'Bimbel' && 
                    $existing->jenis_kegiatan === 'Bimbel' &&
                    $request->nama_kelompok && 
                    $existing->nama_kelompok == $request->nama_kelompok) {
                    $conflicts[] = "Kelompok {$existing->nama_kelompok} sudah dijadwalkan pada {$existingStart}-{$existingEnd}";
                }
            }

            if (!empty($conflicts)) {
                return [
                    'success' => false,
                    'message' => 'Konflik jadwal ditemukan',
                    'conflicts' => $conflicts
                ];
            }

            return ['success' => true];

        } catch (\Exception $e) {
            Log::error('Error in validateActivityConflicts: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Terjadi kesalahan saat validasi konflik jadwal'
            ];
        }
    }
}