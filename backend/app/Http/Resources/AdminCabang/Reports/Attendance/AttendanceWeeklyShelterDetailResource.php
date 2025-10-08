<?php

namespace App\Http\Resources\AdminCabang\Reports\Attendance;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceWeeklyShelterDetailResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = (array) $this->resource;

        $formatPercentage = static fn ($value): string => number_format((float) ($value ?? 0), 2, '.', '');

        $groups = collect($data['groups'] ?? [])->map(function ($group) use ($formatPercentage) {
            return [
                'id' => $group['id'] ?? null,
                'name' => $group['name'] ?? null,
                'description' => $group['description'] ?? null,
                'member_count' => isset($group['member_count']) ? (int) $group['member_count'] : null,
                'present_count' => (int) ($group['present_count'] ?? 0),
                'late_count' => (int) ($group['late_count'] ?? 0),
                'absent_count' => (int) ($group['absent_count'] ?? 0),
                'attendance_percentage' => $formatPercentage($group['attendance_percentage'] ?? 0),
            ];
        })->values()->all();

        $notes = collect($data['notes'] ?? [])->filter(fn ($note) => filled($note))->values()->all();

        $period = $data['period'] ?? [];
        $filters = $data['filters'] ?? [];
        $summary = $data['summary'] ?? [];
        $shelter = $data['shelter'] ?? [];

        return [
            'shelter' => [
                'id' => $shelter['id'] ?? null,
                'name' => $shelter['name'] ?? null,
                'wilbin' => $shelter['wilbin'] ?? null,
                'wilbin_id' => $shelter['wilbin_id'] ?? null,
            ],
            'period' => [
                'week' => $period['week'] ?? null,
                'start_date' => $period['start_date'] ?? null,
                'end_date' => $period['end_date'] ?? null,
            ],
            'filters' => [
                'start_date' => $filters['start_date'] ?? null,
                'end_date' => $filters['end_date'] ?? null,
                'week' => $filters['week'] ?? null,
            ],
            'summary' => [
                'total_students' => (int) ($summary['total_students'] ?? 0),
                'present_count' => (int) ($summary['present_count'] ?? 0),
                'late_count' => (int) ($summary['late_count'] ?? 0),
                'absent_count' => (int) ($summary['absent_count'] ?? 0),
                'attendance_percentage' => $formatPercentage($summary['attendance_percentage'] ?? 0),
                'attendance_band' => $summary['attendance_band'] ?? null,
            ],
            'groups' => $groups,
            'notes' => $notes,
            'generated_at' => $data['generated_at'] ?? null,
        ];
    }
}
