<?php

namespace App\Http\Resources\AdminCabang\Reports\ChildAttendance;

use Illuminate\Http\Resources\Json\JsonResource;

class ChildAttendanceCollectionResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = (array) $this->resource;

        $summary = $data['summary'] ?? [];
        $pagination = $data['pagination'] ?? [];
        $filters = $data['filters'] ?? [];

        return [
            'period' => [
                'start_date' => $data['period']['start_date'] ?? null,
                'end_date' => $data['period']['end_date'] ?? null,
            ],
            'summary' => [
                'total_shelters' => (int) ($summary['total_shelters'] ?? 0),
                'total_groups' => (int) ($summary['total_groups'] ?? 0),
                'total_children' => (int) ($summary['total_children'] ?? 0),
                'total_activities' => (int) ($summary['total_activities'] ?? 0),
                'hadir_count' => (int) ($summary['hadir_count'] ?? 0),
                'tidak_hadir_count' => (int) ($summary['tidak_hadir_count'] ?? 0),
                'attendance_percentage' => number_format((float) ($summary['attendance_percentage'] ?? 0), 2, '.', ''),
                'low_band_children' => (int) ($summary['low_band_children'] ?? 0),
                'active_children' => (int) ($summary['active_children'] ?? $summary['activeChildren'] ?? 0),
                'inactive_children' => (int) ($summary['inactive_children'] ?? $summary['inactiveChildren'] ?? 0),
            ],
            'shelter_breakdown' => ShelterBreakdownResource::collection(collect($data['shelter_breakdown'] ?? []))->values()->all(),
            'shelter_attendance_chart' => collect($data['shelter_attendance_chart'] ?? [])->map(function ($payload) {
                return [
                    'shelter_id' => $payload['shelter_id'] ?? null,
                    'label' => $payload['label'] ?? null,
                    'attendance_percentage' => number_format((float) ($payload['attendance_percentage'] ?? 0), 2, '.', ''),
                ];
            })->values()->all(),
            'attendance_band_distribution' => [
                'high' => (int) (($data['attendance_band_distribution']['high'] ?? 0)),
                'medium' => (int) (($data['attendance_band_distribution']['medium'] ?? 0)),
                'low' => (int) (($data['attendance_band_distribution']['low'] ?? 0)),
            ],
            'children' => ChildAttendanceItemResource::collection(collect($data['children'] ?? []))->values()->all(),
            'pagination' => [
                'total' => (int) ($pagination['total'] ?? 0),
                'per_page' => (int) ($pagination['per_page'] ?? 0),
                'current_page' => (int) ($pagination['current_page'] ?? 0),
                'last_page' => (int) ($pagination['last_page'] ?? 0),
            ],
            'filters' => [
                'start_date' => $filters['start_date'] ?? null,
                'end_date' => $filters['end_date'] ?? null,
                'attendance_band' => $filters['attendance_band'] ?? null,
                'search' => $filters['search'] ?? null,
                'shelter_id' => $filters['shelter_id'] ?? null,
                'group_id' => $filters['group_id'] ?? null,
                'page' => $filters['page'] ?? null,
                'per_page' => $filters['per_page'] ?? null,
            ],
            'available_filters' => [
                'shelters' => collect($data['available_filters']['shelters'] ?? [])->map(function ($payload) {
                    return [
                        'id' => $payload['id'] ?? null,
                        'name' => $payload['name'] ?? null,
                    ];
                })->values()->all(),
                'groups' => collect($data['available_filters']['groups'] ?? [])->map(function ($payload) {
                    return [
                        'id' => $payload['id'] ?? null,
                        'name' => $payload['name'] ?? null,
                        'shelter_id' => $payload['shelter_id'] ?? null,
                    ];
                })->values()->all(),
                'attendance_bands' => collect($data['available_filters']['attendance_bands'] ?? [])->values()->all(),
            ],
            'meta' => [
                'generated_at' => $data['meta']['generated_at'] ?? null,
                'last_refreshed_at' => $data['meta']['last_refreshed_at'] ?? null,
            ],
        ];
    }
}

