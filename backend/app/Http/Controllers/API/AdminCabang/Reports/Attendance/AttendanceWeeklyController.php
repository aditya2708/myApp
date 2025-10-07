<?php

namespace App\Http\Controllers\API\AdminCabang\Reports\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminCabang\Reports\Attendance\AttendanceWeeklyResource;
use App\Services\AdminCabang\Reports\Attendance\WeeklyAttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceWeeklyController extends Controller
{
    public function __invoke(Request $request, WeeklyAttendanceService $service): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $validator->after(function ($validator) use ($request) {
            $start = $request->input('start_date');
            $end = $request->input('end_date');

            if ($start && $end && Carbon::parse($end)->lt(Carbon::parse($start))) {
                $validator->errors()->add('end_date', __('validation.after_or_equal', ['attribute' => 'end date', 'date' => 'start date']));
            }
        });

        $validated = $validator->validate();

        $startDate = isset($validated['start_date'])
            ? Carbon::parse($validated['start_date'])->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = isset($validated['end_date'])
            ? Carbon::parse($validated['end_date'])->endOfDay()
            : Carbon::now()->endOfMonth();

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
        ]);

        return AttendanceWeeklyResource::make($report)->additional([
            'message' => __('Laporan kehadiran mingguan berhasil diambil.'),
        ]);
    }
}
