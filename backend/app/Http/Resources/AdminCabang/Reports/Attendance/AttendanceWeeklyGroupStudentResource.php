<?php

namespace App\Http\Resources\AdminCabang\Reports\Attendance;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceWeeklyGroupStudentResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = (array) $this->resource;

        $group = $data['group'] ?? [];
        $period = $data['period'] ?? [];
        $statusCounts = $data['status_counts'] ?? [];
        $students = $data['students'] ?? [];
        $pagination = $data['pagination'] ?? [];
        $filters = $data['filters'] ?? [];

        $formatStatusCounts = collect($statusCounts)
            ->map(function ($payload) {
                return [
                    'code' => $payload['code'] ?? null,
                    'label' => $payload['label'] ?? null,
                    'icon' => $payload['icon'] ?? null,
                    'count' => (int) ($payload['count'] ?? 0),
                ];
            })
            ->values()
            ->all();

        $studentsPayload = collect($students)
            ->map(function ($student) {
                $status = $student['status'] ?? [];

                return [
                    'id' => $student['id'] ?? null,
                    'name' => $student['name'] ?? null,
                    'nickname' => $student['nickname'] ?? null,
                    'gender' => $student['gender'] ?? null,
                    'avatar_url' => $student['avatar_url'] ?? null,
                    'status' => [
                        'code' => $status['code'] ?? null,
                        'label' => $status['label'] ?? null,
                        'icon' => $status['icon'] ?? null,
                    ],
                    'is_recorded' => (bool) ($student['is_recorded'] ?? false),
                    'arrival_time' => $student['arrival_time'] ?? null,
                    'arrival_time_label' => $student['arrival_time_label'] ?? null,
                    'activity_date' => $student['activity_date'] ?? null,
                    'notes' => $student['notes'] ?? null,
                    'verification_status' => $student['verification_status'] ?? null,
                ];
            })
            ->values()
            ->all();

        return [
            'group' => [
                'id' => $group['id'] ?? null,
                'name' => $group['name'] ?? null,
                'description' => $group['description'] ?? null,
                'shelter' => [
                    'id' => $group['shelter']['id'] ?? null,
                    'name' => $group['shelter']['name'] ?? null,
                ],
            ],
            'period' => [
                'start_date' => $period['start_date'] ?? null,
                'end_date' => $period['end_date'] ?? null,
            ],
            'status_counts' => $formatStatusCounts,
            'students' => $studentsPayload,
            'pagination' => [
                'total' => (int) ($pagination['total'] ?? 0),
                'per_page' => (int) ($pagination['per_page'] ?? 0),
                'current_page' => (int) ($pagination['current_page'] ?? 1),
                'last_page' => (int) ($pagination['last_page'] ?? 1),
            ],
            'filters' => [
                'start_date' => $filters['start_date'] ?? null,
                'end_date' => $filters['end_date'] ?? null,
                'status' => $filters['status'] ?? null,
                'search' => $filters['search'] ?? null,
                'per_page' => $filters['per_page'] ?? null,
                'page' => $filters['page'] ?? null,
            ],
            'generated_at' => $data['generated_at'] ?? null,
        ];
    }
}
