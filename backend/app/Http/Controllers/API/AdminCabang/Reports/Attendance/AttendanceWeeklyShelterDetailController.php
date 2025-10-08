<?php

namespace App\Http\Controllers\API\AdminCabang\Reports\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminCabang\Reports\Attendance\AttendanceWeeklyShelterDetailResource;
use App\Models\Shelter;
use App\Services\AdminCabang\Reports\Attendance\WeeklyAttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use InvalidArgumentException;

class AttendanceWeeklyShelterDetailController extends Controller
{
    public function __invoke(
        Request $request,
        Shelter $shelter,
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

        if (!in_array($shelter->id_shelter, $accessibleShelterIds, true)) {
            return response()->json([
                'message' => __('Anda tidak memiliki akses ke shelter ini.'),
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'week' => ['nullable', 'string', 'regex:/^\d{4}-W\d{2}$/'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $validator->after(function ($validator) use ($request) {
            $week = $request->input('week');
            if ($week) {
                [$year, $weekNumber] = array_pad(explode('-W', $week), 2, null);
                if (!is_numeric($year) || !is_numeric($weekNumber)) {
                    $validator->errors()->add('week', __('Format minggu tidak valid.'));
                    return;
                }

                try {
                    Carbon::now()->setISODate((int) $year, (int) $weekNumber);
                } catch (InvalidArgumentException $exception) {
                    $validator->errors()->add('week', __('Format minggu tidak valid.'));
                    return;
                }
            }

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

        $weekKey = $validated['week'] ?? null;

        if ($weekKey) {
            [$year, $weekNumber] = array_pad(explode('-W', $weekKey), 2, null);
            $startDate = Carbon::now()->setISODate((int) $year, (int) $weekNumber)->startOfDay();
            $endDate = $startDate->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
        } else {
            $startDate = isset($validated['start_date'])
                ? Carbon::parse($validated['start_date'])->startOfDay()
                : Carbon::now()->startOfWeek(Carbon::MONDAY);

            $endDate = isset($validated['end_date'])
                ? Carbon::parse($validated['end_date'])->endOfDay()
                : $startDate->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
        }

        if ($endDate->lt($startDate)) {
            $endDate = $startDate->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
        }

        $report = $service->buildShelterWeeklyDetail(
            $adminCabang,
            $shelter,
            $startDate,
            $endDate,
            [
                'week' => $weekKey,
            ]
        );

        return AttendanceWeeklyShelterDetailResource::make($report)
            ->additional([
                'message' => __('Detail laporan kehadiran mingguan shelter berhasil diambil.'),
            ])
            ->toResponse($request);
    }
}
