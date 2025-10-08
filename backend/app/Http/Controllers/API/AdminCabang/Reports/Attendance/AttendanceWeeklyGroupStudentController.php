<?php

namespace App\Http\Controllers\API\AdminCabang\Reports\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminCabang\Reports\Attendance\AttendanceWeeklyGroupStudentResource;
use App\Models\Kelompok;
use App\Services\AdminCabang\Reports\Attendance\WeeklyAttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceWeeklyGroupStudentController extends Controller
{
    public function __invoke(
        Request $request,
        Kelompok $group,
        WeeklyAttendanceService $service
    ): JsonResponse {
        $user = $request->user();
        $adminCabang = $user?->adminCabang;

        if (!$adminCabang) {
            return response()->json([
                'message' => __('Anda tidak memiliki akses sebagai admin cabang.'),
            ], 403);
        }

        $kacab = $adminCabang->loadMissing('kacab')->kacab;
        $accessibleShelterIds = $kacab
            ? $kacab->shelters()->pluck('shelter.id_shelter')->all()
            : [];

        if (!in_array($group->id_shelter, $accessibleShelterIds, true)) {
            return response()->json([
                'message' => __('Anda tidak memiliki akses ke kelompok ini.'),
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:present,late,absent'],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $validator->after(function ($validator) use ($request) {
            $start = $request->input('start_date');
            $end = $request->input('end_date');

            if ($start && $end && Carbon::parse($end)->lt(Carbon::parse($start))) {
                $validator->errors()->add('end_date', __('validation.after_or_equal', [
                    'attribute' => 'end date',
                    'date' => 'start date',
                ]));
            }
        });

        $validated = $validator->validate();

        $startDate = isset($validated['start_date'])
            ? Carbon::parse($validated['start_date'])->startOfDay()
            : Carbon::now()->startOfWeek(Carbon::MONDAY);

        $endDate = isset($validated['end_date'])
            ? Carbon::parse($validated['end_date'])->endOfDay()
            : $startDate->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();

        if ($endDate->lt($startDate)) {
            $endDate = $startDate->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
        }

        $report = $service->buildGroupWeeklyStudents(
            $adminCabang,
            $group->loadMissing(['shelter', 'levelAnakBinaan']),
            $startDate,
            $endDate,
            [
                'status' => $validated['status'] ?? null,
                'search' => $validated['search'] ?? null,
                'per_page' => $validated['per_page'] ?? null,
                'page' => $validated['page'] ?? null,
            ]
        );

        return AttendanceWeeklyGroupStudentResource::make($report)
            ->additional([
                'message' => __('Daftar kehadiran mingguan anak per kelompok berhasil diambil.'),
            ])
            ->toResponse($request);
    }
}
