<?php

namespace App\Http\Controllers\API\AdminCabang\Reports;

use App\Http\Controllers\Controller;
use App\Services\AdminCabang\Reports\TutorAttendanceReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use RuntimeException;

class AdminCabangTutorReportController extends Controller
{
    public function index(Request $request, TutorAttendanceReportService $reportService): JsonResponse
    {
        $validated = $request->validate([
            'date_from' => 'nullable|date_format:Y-m-d',
            'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from',
            'jenis_kegiatan' => 'nullable|string',
            'shelter_id' => 'nullable|integer',
            'wilbin_id' => 'nullable|integer',
        ]);

        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $adminCabang = $user->adminCabang;

        if (!$adminCabang) {
            return response()->json([
                'success' => false,
                'message' => 'Admin cabang tidak ditemukan',
            ], 404);
        }

        $adminCabang->loadMissing('kacab');
        $branch = $adminCabang->kacab;
        $branchMetadata = $branch ? [
            'id' => $branch->id_kacab,
            'name' => $branch->nama_kacab,
        ] : null;

        $filters = collect($validated)
            ->reject(fn($value) => $value === null || $value === '' || $value === 'all')
            ->map(function ($value, $key) {
                if (in_array($key, ['shelter_id', 'wilbin_id'], true)) {
                    return (int) $value;
                }

                return $value;
            })
            ->all();

        try {
            $report = $reportService->build($adminCabang, $filters);
        } catch (RuntimeException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 404);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil laporan tutor: ' . $exception->getMessage(),
            ], 500);
        }

        $serviceMetadata = [];
        $tutorCollection = collect();

        if ($report instanceof Collection) {
            $tutorCollection = $report;
        } elseif (is_array($report)) {
            $serviceMetadata = $report['metadata'] ?? [];

            $tutorData = $report['tutors'] ?? $report['data'] ?? null;

            if ($tutorData === null && array_values($report) === $report) {
                $tutorData = $report;
            }

            if ($tutorData instanceof Collection) {
                $tutorCollection = $tutorData;
            } elseif ($tutorData !== null) {
                $tutorCollection = collect($tutorData);
            }
        } elseif (!empty($report)) {
            $tutorCollection = collect($report);
        }

        $categoryLabels = [
            'high' => 'Baik',
            'medium' => 'Sedang',
            'low' => 'Rendah',
            'no_data' => 'Tidak Ada Data',
        ];

        $distribution = collect(array_fill_keys(array_keys($categoryLabels), 0));

        $tutors = $tutorCollection->map(function (array $record) use (&$distribution, $categoryLabels) {
            $attendance = $record['attendance'] ?? null;

            if (!is_array($attendance)) {
                $presentCount = (int) ($record['present_count'] ?? 0);
                $lateCount = (int) ($record['late_count'] ?? 0);
                $absentCount = (int) ($record['absent_count'] ?? 0);
                $totalActivities = (int) ($record['total_activities'] ?? 0);
                $attendanceTotal = (int) ($record['attendance_total'] ?? ($presentCount + $lateCount + $absentCount));
                $attendedCount = $presentCount + $lateCount;

                $attendanceRate = $totalActivities > 0
                    ? round(($attendedCount / $totalActivities) * 100, 2)
                    : 0;

                $attendance = [
                    'totals' => [
                        'activities' => $totalActivities,
                        'records' => $attendanceTotal,
                        'attended' => $attendedCount,
                    ],
                    'breakdown' => [
                        'present' => $presentCount,
                        'late' => $lateCount,
                        'absent' => $absentCount,
                    ],
                    'verified' => [
                        'total' => (int) ($record['verified_attendance_count'] ?? $attendanceTotal),
                        'present' => $presentCount,
                        'late' => $lateCount,
                        'absent' => $absentCount,
                        'attended' => $attendedCount,
                    ],
                    'rate' => $totalActivities > 0 ? $attendanceRate : 0,
                ];
            }

            $category = $record['category'] ?? [];
            $categoryKey = is_array($category) ? ($category['key'] ?? null) : null;

            if (!$categoryKey || !array_key_exists($categoryKey, $categoryLabels)) {
                $hasActivities = (int) ($attendance['totals']['activities'] ?? 0) > 0;
                $categoryKey = $hasActivities
                    ? (($attendance['rate'] ?? 0) >= 80
                        ? 'high'
                        : (($attendance['rate'] ?? 0) >= 60 ? 'medium' : 'low'))
                    : 'no_data';
            }

            $distribution[$categoryKey] = ($distribution[$categoryKey] ?? 0) + 1;

            $record['attendance'] = $attendance;
            $record['category'] = [
                'key' => $categoryKey,
                'label' => $categoryLabels[$categoryKey],
            ];

            return $record;
        });

        $totalTutors = $tutors->count();
        $rates = $tutors->pluck('attendance.rate')->filter(fn($rate) => $rate !== null);
        $averageRate = $rates->isEmpty() ? null : round($rates->avg(), 2);

        $distributionSummary = $distribution->map(function ($count, $key) use ($totalTutors, $categoryLabels) {
            return [
                'count' => $count,
                'percentage' => $totalTutors > 0 ? round(($count / $totalTutors) * 100, 2) : 0,
                'label' => $categoryLabels[$key],
            ];
        })->all();

        $collections = [
            'wilbins' => $serviceMetadata['wilbins'] ?? [],
            'wilbin_shelters' => $serviceMetadata['wilbin_shelters'] ?? [],
            'wilbins_shelters' => $serviceMetadata['wilbin_shelters'] ?? [],
            'shelters' => $serviceMetadata['shelters'] ?? [],
        ];

        return response()->json([
            'success' => true,
            'message' => 'Laporan tutor berhasil diambil.',
            'data' => $tutors->values(),
            'summary' => [
                'total_tutors' => $totalTutors,
                'average_attendance_rate' => $averageRate,
                'distribution' => $distributionSummary,
            ],
            'meta' => [
                'branch' => $branchMetadata,
                'filters' => $filters,
                'collections' => $collections,
                'metadata' => $serviceMetadata,
            ],
        ]);
    }
}
