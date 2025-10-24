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

        $filters = collect($validated)
            ->reject(fn($value) => $value === null || $value === '' || $value === 'all')
            ->map(function ($value, $key) {
                if ($key === 'shelter_id') {
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

        /** @var Collection $tutorCollection */
        $tutorCollection = $report['tutors'] instanceof Collection
            ? $report['tutors']
            : collect($report['tutors']);

        $categoryLabels = [
            'high' => 'Baik',
            'medium' => 'Sedang',
            'low' => 'Rendah',
            'no_data' => 'Tidak Ada Data',
        ];

        $distribution = collect(array_fill_keys(array_keys($categoryLabels), 0));

        $tutors = $tutorCollection->map(function (array $record) use (&$distribution, $categoryLabels) {
            $totalActivities = (int) ($record['total_activities'] ?? 0);
            $presentCount = (int) ($record['present_count'] ?? 0);
            $lateCount = (int) ($record['late_count'] ?? 0);
            $absentCount = (int) ($record['absent_count'] ?? 0);
            $verifiedAttendanceCount = (int) ($record['verified_attendance_count'] ?? 0);
            $attendanceTotal = (int) ($record['attendance_total'] ?? ($presentCount + $lateCount + $absentCount));
            $attendedCount = $presentCount + $lateCount;

            if ($verifiedAttendanceCount === 0) {
                $verifiedAttendanceCount = $attendanceTotal;
            }

            if ($totalActivities > 0) {
                $attendanceRate = $totalActivities > 0
                    ? round(($attendedCount / $totalActivities) * 100, 2)
                    : 0;

                if ($attendanceRate >= 80) {
                    $categoryKey = 'high';
                } elseif ($attendanceRate >= 60) {
                    $categoryKey = 'medium';
                } else {
                    $categoryKey = 'low';
                }
            } else {
                $attendanceRate = null;
                $categoryKey = 'no_data';
            }

            $distribution[$categoryKey] = $distribution[$categoryKey] + 1;

            $shelter = $record['shelter'] ?? null;

            return array_merge($record, [
                'present_count' => $presentCount,
                'late_count' => $lateCount,
                'absent_count' => $absentCount,
                'verified_present_count' => $presentCount,
                'verified_late_count' => $lateCount,
                'verified_absent_count' => $absentCount,
                'verified_attendance_count' => $verifiedAttendanceCount,
                'attendance_total' => $attendanceTotal,
                'attended_count' => $attendedCount,
                'verified_attended_count' => $attendedCount,
                'attendance_rate' => $attendanceRate,
                'category' => $categoryKey,
                'category_label' => $categoryLabels[$categoryKey],
                'shelter' => $shelter,
            ]);
        });

        $totalTutors = $tutors->count();
        $rates = $tutors->pluck('attendance_rate')->filter(fn($rate) => $rate !== null);
        $averageRate = $rates->isEmpty() ? null : round($rates->avg(), 2);

        $distributionSummary = $distribution->map(function ($count, $key) use ($totalTutors, $categoryLabels) {
            return [
                'count' => $count,
                'percentage' => $totalTutors > 0 ? round(($count / $totalTutors) * 100, 2) : 0,
                'label' => $categoryLabels[$key],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $tutors->values(),
            'summary' => [
                'total_tutors' => $totalTutors,
                'average_attendance_rate' => $averageRate,
                'distribution' => $distributionSummary,
            ],
            'metadata' => array_merge(
                $report['metadata'] ?? [],
                [
                    'filters' => $filters,
                    'category_labels' => $categoryLabels,
                ]
            ),
        ]);
    }
}
