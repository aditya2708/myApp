<?php

namespace App\Http\Controllers\API\AdminCabang\Reports\Attendance;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminCabang\Reports\Attendance\AttendanceWeeklyShelterResource;
use App\Services\AdminCabang\Reports\Attendance\WeeklyAttendanceService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AttendanceWeeklyShelterController extends Controller
{
    public function __invoke(Request $request, WeeklyAttendanceService $service): JsonResponse
    {
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

        $validator = Validator::make($request->all(), [
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
            'shelter_ids' => ['nullable', 'array'],
            'shelter_ids.*' => ['integer'],
        ]);

        $validator->after(function ($validator) use ($request, $accessibleShelterIds) {
            $start = $request->input('start_date');
            $end = $request->input('end_date');

            if ($start && $end && Carbon::parse($end)->lt(Carbon::parse($start))) {
                $validator->errors()->add('end_date', __('validation.after_or_equal', [
                    'attribute' => 'end date',
                    'date' => 'start date',
                ]));
            }

            $shelterIds = $request->input('shelter_ids', []);
            if (!empty($shelterIds)) {
                $invalidShelters = collect($shelterIds)
                    ->filter(fn ($id) => !in_array((int) $id, $accessibleShelterIds, true));

                if ($invalidShelters->isNotEmpty()) {
                    $validator->errors()->add('shelter_ids', __('Salah satu shelter tidak dapat diakses.'));
                }
            }
        });

        $validated = $validator->validate();

        $startDate = isset($validated['start_date'])
            ? Carbon::parse($validated['start_date'])->startOfDay()
            : Carbon::now()->startOfMonth();

        $endDate = isset($validated['end_date'])
            ? Carbon::parse($validated['end_date'])->endOfDay()
            : Carbon::now()->endOfMonth();

        $requestedShelterIds = array_map('intval', $validated['shelter_ids'] ?? []);
        $filteredShelterIds = !empty($requestedShelterIds)
            ? array_values(array_intersect($requestedShelterIds, $accessibleShelterIds))
            : $accessibleShelterIds;

        $report = $service->buildShelterReport($adminCabang, [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'shelter_ids' => $filteredShelterIds,
        ]);

        return AttendanceWeeklyShelterResource::make($report)->additional([
            'message' => __('Laporan kehadiran mingguan per shelter berhasil diambil.'),
        ]);
    }
}
