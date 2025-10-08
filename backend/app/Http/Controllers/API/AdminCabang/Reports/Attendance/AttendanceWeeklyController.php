<?php

namespace App\Http\Controllers\API\AdminCabang\Reports\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminCabang\Reports\Attendance\AttendanceWeeklyResource;
use App\Services\AdminCabang\Reports\Attendance\WeeklyAttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class AttendanceWeeklyController extends Controller
{
    public function __invoke(Request $request, WeeklyAttendanceService $service): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'attendance_band' => ['nullable', 'string', Rule::in(['high', 'medium', 'low'])],
            'search' => ['nullable', 'string'],
            'week_id' => ['nullable', 'string'],
        ]);

        $validator->after(function ($validator) use ($request) {
            $start = $request->input('start_date');
            $end = $request->input('end_date');
            $weekId = $request->input('week_id');

            if ($start && $end && Carbon::parse($end)->lt(Carbon::parse($start))) {
                $validator->errors()->add('end_date', __('validation.after_or_equal', ['attribute' => 'end date', 'date' => 'start date']));
            }

            if ($weekId !== null && $weekId !== '') {
                try {
                    $this->resolveWeekIdentifier($weekId);
                } catch (InvalidArgumentException $exception) {
                    $validator->errors()->add('week_id', __('validation.date_format', ['attribute' => 'week id', 'format' => 'YYYY-Www']));
                }
            }
        });

        $validated = $validator->validate();

        $baseStartDate = isset($validated['start_date'])
            ? Carbon::parse($validated['start_date'])->startOfDay()
            : Carbon::now()->startOfMonth();

        $baseEndDate = isset($validated['end_date'])
            ? Carbon::parse($validated['end_date'])->endOfDay()
            : Carbon::now()->endOfMonth();

        $startDate = $baseStartDate->copy();
        $endDate = $baseEndDate->copy();

        $weekId = $validated['week_id'] ?? null;
        $weeksRangeStart = $baseStartDate->copy();
        $weeksRangeEnd = $baseEndDate->copy();

        if ($weekId) {
            [$resolvedWeekStart, $resolvedWeekEnd] = $this->resolveWeekIdentifier($weekId);

            $startDate = $resolvedWeekStart->copy()->startOfDay();
            $endDate = $resolvedWeekEnd->copy()->endOfDay();

            if (!isset($validated['start_date']) && !isset($validated['end_date'])) {
                $weeksRangeStart = $resolvedWeekStart->copy()->startOfMonth();
                $weeksRangeEnd = $resolvedWeekStart->copy()->endOfMonth();
            }
        }

        $user = $request->user();
        $adminCabang = $user?->adminCabang;

        if (!$adminCabang) {
            return response()->json([
                'message' => __('Anda tidak memiliki akses sebagai admin cabang.'),
            ], 403);
        }

        $report = $service->build($adminCabang, [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'attendance_band' => $validated['attendance_band'] ?? null,
            'search' => $validated['search'] ?? null,
            'week_id' => $weekId,
            'weeks_range_start' => $weeksRangeStart,
            'weeks_range_end' => $weeksRangeEnd,
        ]);

        return AttendanceWeeklyResource::make($report)
            ->additional([
                'message' => __('Laporan kehadiran mingguan berhasil diambil.'),
                'last_refreshed_at' => $report['meta']['last_refreshed_at'] ?? null,
            ])
            ->toResponse($request);
    }

    /**
     * @throws InvalidArgumentException
     */
    protected function resolveWeekIdentifier(string $weekId): array
    {
        if (!preg_match('/^(\d{4})-W(\d{2})$/', $weekId, $matches)) {
            throw new InvalidArgumentException('Invalid week identifier format.');
        }

        $year = (int) $matches[1];
        $week = (int) $matches[2];

        $weekStart = Carbon::now()->setISODate($year, $week, 1)->startOfDay();

        if ($weekStart->isoWeek() !== $week || $weekStart->isoWeekYear() !== $year) {
            throw new InvalidArgumentException('Invalid ISO week identifier.');
        }

        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);

        return [$weekStart, $weekEnd];
    }
}
