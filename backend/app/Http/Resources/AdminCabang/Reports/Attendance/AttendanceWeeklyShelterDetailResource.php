<?php

namespace App\Http\Resources\AdminCabang\Reports\Attendance;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceWeeklyShelterDetailResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = (array) $this->resource;

        $formatPercentage = static fn ($value): string => number_format((float) ($value ?? 0), 2, '.', '');
        $formatVerification = static fn (array $verification): array => [
            'pending' => (int) ($verification['pending'] ?? 0),
            'verified' => (int) ($verification['verified'] ?? 0),
            'rejected' => (int) ($verification['rejected'] ?? 0),
            'manual' => (int) ($verification['manual'] ?? 0),
        ];
        $formatSchedules = static function ($schedules): array {
            return collect($schedules ?? [])->map(static function ($schedule) {
                return [
                    'date' => $schedule['date'] ?? null,
                    'start_time' => $schedule['start_time'] ?? null,
                    'end_time' => $schedule['end_time'] ?? null,
                ];
            })->values()->all();
        };

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

        $activities = collect($data['activities'] ?? [])->map(function ($activity) use ($formatPercentage, $formatVerification, $formatSchedules) {
            $metrics = $activity['metrics'] ?? [];
            $group = $activity['group'] ?? [];

            $payload = [
                'id' => $activity['id'] ?? null,
                'name' => $activity['name'] ?? null,
                'material' => $activity['material'] ?? null,
                'tutor' => $activity['tutor'] ?? null,
                'group' => [
                    'id' => $group['id'] ?? null,
                    'name' => $group['name'] ?? null,
                    'description' => $group['description'] ?? null,
                    'member_count' => isset($group['member_count']) ? (int) $group['member_count'] : null,
                ],
                'participant_count' => (int) ($activity['participant_count'] ?? 0),
                'schedules' => $formatSchedules($activity['schedules'] ?? []),
                'metrics' => [
                    'present_count' => (int) ($metrics['present_count'] ?? 0),
                    'late_count' => (int) ($metrics['late_count'] ?? 0),
                    'absent_count' => (int) ($metrics['absent_count'] ?? 0),
                    'attendance_rate' => $formatPercentage($metrics['attendance_rate'] ?? 0),
                    'verification' => $formatVerification($metrics['verification'] ?? []),
                ],
            ];

            $notes = collect($activity['notes'] ?? [])
                ->filter(static fn ($note) => $note !== null && $note !== '')
                ->values()
                ->all();

            if (!empty($notes)) {
                $payload['notes'] = $notes;
            }

            return $payload;
        })->values()->all();

        $notes = collect($data['notes'] ?? [])->filter(fn ($note) => filled($note))->values()->all();

        $period = $data['period'] ?? [];
        $filters = $data['filters'] ?? [];
        $pagination = $data['pagination'] ?? [];
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
                'page' => isset($filters['page']) ? (int) $filters['page'] : null,
                'per_page' => isset($filters['per_page']) ? (int) $filters['per_page'] : null,
                'search' => $filters['search'] ?? null,
                'activity_id' => isset($filters['activity_id']) ? (int) $filters['activity_id'] : null,
                'schedule_date' => $filters['schedule_date'] ?? null,
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
            'activities' => $activities,
            'pagination' => [
                'total' => (int) ($pagination['total'] ?? 0),
                'per_page' => (int) ($pagination['per_page'] ?? 0),
                'current_page' => (int) ($pagination['current_page'] ?? 1),
                'last_page' => (int) ($pagination['last_page'] ?? 1),
                'from' => isset($pagination['from']) ? (int) $pagination['from'] : null,
                'to' => isset($pagination['to']) ? (int) $pagination['to'] : null,
            ],
            'notes' => $notes,
            'generated_at' => $data['generated_at'] ?? null,
        ];
    }
}
