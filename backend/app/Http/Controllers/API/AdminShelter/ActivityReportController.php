<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\ActivityReport;
use App\Models\Aktivitas;
use App\Models\Kegiatan;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ActivityReportController extends Controller
{
    protected AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    /**
     * List activity reports for the authenticated admin shelter.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            if (!$user || !$user->adminShelter || !$user->adminShelter->shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelterId = $user->adminShelter->shelter->id_shelter;

            $allowedJenisKegiatan = Kegiatan::whereIn('nama_kegiatan', ['Bimbel', 'Tahfidz', 'Lain-lain'])
                ->pluck('nama_kegiatan', 'id_kegiatan');

            $validator = Validator::make($request->all(), [
                'start_date' => 'nullable|date_format:Y-m-d',
                'end_date' => 'nullable|date_format:Y-m-d',
                'jenis_kegiatan_id' => [
                    'nullable',
                    'integer',
                    Rule::in($allowedJenisKegiatan->keys()->all())
                ],
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $validated = $validator->validated();

            $startDate = $validated['start_date'] ?? null;
            $endDate = $validated['end_date'] ?? null;

            if ($startDate && $endDate && Carbon::parse($endDate)->lt(Carbon::parse($startDate))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tanggal akhir harus lebih besar atau sama dengan tanggal mulai',
                    'errors' => [
                        'end_date' => ['Tanggal akhir harus lebih besar atau sama dengan tanggal mulai']
                    ]
                ], 422);
            }

            $jenisKegiatanId = $validated['jenis_kegiatan_id'] ?? null;
            $perPage = (int) ($validated['per_page'] ?? 10);

            $query = ActivityReport::query()
                ->with([
                    'aktivitas' => function ($aktivitasQuery) {
                        $aktivitasQuery->select([
                            'id_aktivitas',
                            'id_shelter',
                            'id_kegiatan',
                            'id_tutor',
                            'id_materi',
                            'pakai_materi_manual',
                            'mata_pelajaran_manual',
                            'materi_manual',
                            'materi',
                            'tanggal',
                            'jenis_kegiatan'
                        ]);
                    },
                    'aktivitas.kegiatan',
                    'aktivitas.materiRelation.mataPelajaran',
                    'aktivitas.tutor:id_tutor,nama'
                ])
                ->whereHas('aktivitas', function ($aktivitasQuery) use ($shelterId, $startDate, $endDate, $jenisKegiatanId) {
                    $aktivitasQuery->where('id_shelter', $shelterId);

                    if ($startDate && $endDate) {
                        $aktivitasQuery->whereBetween('tanggal', [$startDate, $endDate]);
                    } elseif ($startDate) {
                        $aktivitasQuery->whereDate('tanggal', '>=', $startDate);
                    } elseif ($endDate) {
                        $aktivitasQuery->whereDate('tanggal', '<=', $endDate);
                    }

                    if ($jenisKegiatanId) {
                        $aktivitasQuery->where('id_kegiatan', $jenisKegiatanId);
                    }
                });

            $reports = $query->orderByDesc('created_at')->paginate($perPage);

            $reports->setCollection(
                $reports->getCollection()->map(function (ActivityReport $report) use ($allowedJenisKegiatan) {
                    $aktivitas = $report->aktivitas;

                    $subjectName = null;
                    $materialName = null;

                    if ($aktivitas) {
                        if ($aktivitas->pakai_materi_manual) {
                            $subjectName = $aktivitas->mata_pelajaran_manual;
                            $materialName = $aktivitas->materi_manual ?: $aktivitas->materi;
                        } else {
                            $materiRelation = $aktivitas->relationLoaded('materiRelation')
                                ? $aktivitas->getRelation('materiRelation')
                                : null;

                            if ($materiRelation) {
                                $subjectName = $materiRelation->mataPelajaran->nama_mata_pelajaran ?? null;
                                $materialName = $materiRelation->nama_materi ?? $aktivitas->materi;
                            } else {
                                $materialName = $aktivitas->materi;
                            }
                        }
                    }

                    $tutorName = null;

                    if ($aktivitas && $aktivitas->relationLoaded('tutor')) {
                        $tutor = $aktivitas->getRelation('tutor');
                        $tutorName = $tutor?->full_name ?? $tutor?->nama;
                    }

                    $namaKegiatan = trim(collect([$subjectName, $materialName])->filter()->implode(' - '));

                    if ($namaKegiatan === '' && $aktivitas) {
                        $namaKegiatan = $aktivitas->materi_manual
                            ?: $aktivitas->materi
                            ?: ($aktivitas->kegiatan->nama_kegiatan ?? $aktivitas->jenis_kegiatan);
                    }

                    $formattedDate = null;
                    if ($aktivitas && $aktivitas->tanggal) {
                        $formattedDate = Carbon::parse($aktivitas->tanggal)
                            ->locale('id')
                            ->translatedFormat('d F Y');
                    }

                    $jenisKegiatan = null;
                    if ($aktivitas) {
                        $jenisKegiatan = $allowedJenisKegiatan[$aktivitas->id_kegiatan] ?? ($aktivitas->kegiatan->nama_kegiatan ?? $aktivitas->jenis_kegiatan);
                    }

                    return [
                        'id' => $report->id_activity_report,
                        'id_aktivitas' => $report->id_aktivitas,
                        'nama_kegiatan' => $namaKegiatan,
                        'jenis_kegiatan' => $jenisKegiatan,
                        'tanggal' => $formattedDate,
                        'nama_tutor' => $tutorName,
                        'foto_1' => $report->foto_1_url,
                        'foto_2' => $report->foto_2_url,
                        'foto_3' => $report->foto_3_url,
                    ];
                })
            );

            return response()->json([
                'success' => true,
                'message' => 'Daftar laporan kegiatan berhasil diambil',
                'data' => $reports->items(),
                'meta' => [
                    'current_page' => $reports->currentPage(),
                    'last_page' => $reports->lastPage(),
                    'per_page' => $reports->perPage(),
                    'total' => $reports->total()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil daftar laporan kegiatan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create activity report.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
            'foto_1' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'foto_2' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'foto_3' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $reportData = ['id_aktivitas' => $request->id_aktivitas];

        try {
            DB::beginTransaction();

            $aktivitas = Aktivitas::find($request->id_aktivitas);
            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aktivitas tidak ditemukan'
                ], 404);
            }

            $existingReport = ActivityReport::where('id_aktivitas', $request->id_aktivitas)->first();
            if ($existingReport) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan untuk aktivitas ini sudah ada'
                ], 400);
            }

            if (
                !$request->hasFile('foto_1') &&
                !$request->hasFile('foto_2') &&
                !$request->hasFile('foto_3')
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Minimal satu foto harus diunggah'
                ], 422);
            }

            foreach (['foto_1', 'foto_2', 'foto_3'] as $photoField) {
                if ($request->hasFile($photoField)) {
                    $file = $request->file($photoField);
                    $filename = 'activity_report_' . $request->id_aktivitas . '_' . $photoField . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('activity_reports', $filename, 'public');
                    $reportData[$photoField] = $path;
                }
            }

            $report = ActivityReport::create($reportData);

            if ($aktivitas->id_tutor) {
                $attendanceResult = $this->attendanceService->recordTutorAttendanceManually(
                    $aktivitas->id_tutor,
                    $aktivitas->id_aktivitas,
                    'present',
                    'Auto attendance via activity report',
                    Carbon::now()->toDateTimeString()
                );

                if (isset($attendanceResult['duplicate']) && $attendanceResult['duplicate'] === true) {
                    // Ignore duplicate attendance records.
                } elseif (!$attendanceResult['success']) {
                    DB::rollBack();

                    $this->cleanupUploadedPhotos($reportData);

                    if (($attendanceResult['message'] ?? '') === 'Tutor is not assigned to this activity') {
                        return response()->json([
                            'success' => false,
                            'message' => 'Tutor tidak terdaftar pada aktivitas ini'
                        ], 422);
                    }

                    throw new \Exception($attendanceResult['message'] ?? 'Gagal mencatat kehadiran tutor');
                }
            }

            $aktivitas->update(['status' => 'reported']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Laporan kegiatan berhasil dibuat',
                'data' => $report->load('aktivitas')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            $this->cleanupUploadedPhotos($reportData);

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat laporan kegiatan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get activity report by activity ID.
     */
    public function getByActivity($id_aktivitas)
    {
        try {
            $report = ActivityReport::where('id_aktivitas', $id_aktivitas)
                ->with('aktivitas')
                ->first();

            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $report
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil laporan: ' . $e->getMessage()
            ], 500);
        }
    }

    private function cleanupUploadedPhotos(array $reportData): void
    {
        foreach (['foto_1', 'foto_2', 'foto_3'] as $photoField) {
            if (isset($reportData[$photoField]) && Storage::disk('public')->exists($reportData[$photoField])) {
                Storage::disk('public')->delete($reportData[$photoField]);
            }
        }
    }
}
