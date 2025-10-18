<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\ActivityReport;
use App\Models\Aktivitas;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ActivityReportController extends Controller
{
    protected AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        $this->attendanceService = $attendanceService;
    }

    /**
     * Create activity report
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

        try {
            DB::beginTransaction();

            // Check if activity exists and is completed
            $aktivitas = Aktivitas::find($request->id_aktivitas);
            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aktivitas tidak ditemukan'
                ], 404);
            }

            // Check if report already exists
            $existingReport = ActivityReport::where('id_aktivitas', $request->id_aktivitas)->first();
            if ($existingReport) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan untuk aktivitas ini sudah ada'
                ], 400);
            }

            // Validate at least one photo
            if (!$request->hasFile('foto_1') && !$request->hasFile('foto_2') && !$request->hasFile('foto_3')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Minimal satu foto harus diunggah'
                ], 422);
            }

            $reportData = ['id_aktivitas' => $request->id_aktivitas];

            // Handle photo uploads
            foreach (['foto_1', 'foto_2', 'foto_3'] as $photoField) {
                if ($request->hasFile($photoField)) {
                    $file = $request->file($photoField);
                    $filename = 'activity_report_' . $request->id_aktivitas . '_' . $photoField . '_' . time() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('activity_reports', $filename, 'public');
                    $reportData[$photoField] = $path;
                }
            }

            // Create report
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
                    // Ignore duplicate attendance records
                } elseif (!$attendanceResult['success']) {
                    DB::rollback();

                    if (($attendanceResult['message'] ?? '') === 'Tutor is not assigned to this activity') {
                        foreach (['foto_1', 'foto_2', 'foto_3'] as $photoField) {
                            if (isset($reportData[$photoField]) && Storage::disk('public')->exists($reportData[$photoField])) {
                                Storage::disk('public')->delete($reportData[$photoField]);
                            }
                        }
                        return response()->json([
                            'success' => false,
                            'message' => 'Tutor tidak terdaftar pada aktivitas ini'
                        ], 422);
                    }

                    throw new \Exception($attendanceResult['message'] ?? 'Gagal mencatat kehadiran tutor');
                }
            }

            // Update activity status to reported
            $aktivitas->update(['status' => 'reported']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Laporan kegiatan berhasil dibuat',
                'data' => $report->load('aktivitas')
            ], 201);

        } catch (\Exception $e) {
            DB::rollback();
            
            // Clean up uploaded files if any error occurs
            foreach (['foto_1', 'foto_2', 'foto_3'] as $photoField) {
                if (isset($reportData[$photoField]) && Storage::disk('public')->exists($reportData[$photoField])) {
                    Storage::disk('public')->delete($reportData[$photoField]);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat laporan kegiatan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get activity report by activity ID
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

    /**
     * Delete activity report
     */
    public function destroy($id)
    {
        try {
            $report = ActivityReport::find($id);
            if (!$report) {
                return response()->json([
                    'success' => false,
                    'message' => 'Laporan tidak ditemukan'
                ], 404);
            }

            DB::beginTransaction();

            // Delete photo files
            foreach (['foto_1', 'foto_2', 'foto_3'] as $photoField) {
                if ($report->$photoField && Storage::disk('public')->exists($report->$photoField)) {
                    Storage::disk('public')->delete($report->$photoField);
                }
            }

            // Update activity status back to completed
            $report->aktivitas->update(['status' => 'completed']);

            // Delete report
            $report->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Laporan berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus laporan: ' . $e->getMessage()
            ], 500);
        }
    }
}