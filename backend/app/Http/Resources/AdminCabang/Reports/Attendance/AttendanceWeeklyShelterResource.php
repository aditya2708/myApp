<?php

namespace App\Http\Resources\AdminCabang\Reports\Attendance;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceWeeklyShelterResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = (array) $this->resource;

        $formatRate = static fn ($value): string => number_format((float) ($value ?? 0), 2, '.', '');

        $formatVerification = static fn (array $verification): array => [
            'pending' => (int) ($verification['pending'] ?? 0),
            'verified' => (int) ($verification['verified'] ?? 0),
            'rejected' => (int) ($verification['rejected'] ?? 0),
            'manual' => (int) ($verification['manual'] ?? 0),
        ];

        $formatGroup = static function ($group): array {
            $formatted = [
                'name' => $group['name'] ?? null,
                'info' => $group['info'] ?? null,
            ];

            return array_filter($formatted, static fn ($value) => $value !== null && $value !== '');
        };

        $formatSchedules = static function ($schedules): array {
            return collect($schedules ?? [])->map(static function ($schedule) {
                return [
                    'date' => $schedule['date'] ?? null,
                    'start_time' => $schedule['start_time'] ?? null,
                    'end_time' => $schedule['end_time'] ?? null,
                ];
            })->values()->all();
        };

        $formatActivity = static function ($activity, bool $includeShelter) use ($formatRate, $formatVerification, $formatGroup, $formatSchedules) {
            $metrics = $activity['metrics'] ?? [];

            $payload = [
                'id' => $activity['id'] ?? null,
                'name' => $activity['name'] ?? null,
                'tutor' => $activity['tutor'] ?? null,
                'group' => $formatGroup($activity['group'] ?? []),
                'participant_count' => (int) ($activity['participant_count'] ?? 0),
                'schedules' => $formatSchedules($activity['schedules'] ?? []),
                'metrics' => [
                    'present_count' => (int) ($metrics['present_count'] ?? 0),
                    'late_count' => (int) ($metrics['late_count'] ?? 0),
                    'absent_count' => (int) ($metrics['absent_count'] ?? 0),
                    'attendance_rate' => $formatRate($metrics['attendance_rate'] ?? 0),
                    'verification' => $formatVerification($metrics['verification'] ?? []),
                ],
            ];

            if ($includeShelter) {
                $payload['shelter_id'] = $activity['shelter_id'] ?? null;
                $payload['shelter_name'] = $activity['shelter_name'] ?? null;
            }

            return $payload;
        };

        $shelters = collect($data['shelters'] ?? [])->map(function ($shelter) use ($formatRate, $formatVerification, $formatActivity) {
            $metrics = $shelter['metrics'] ?? [];

            return [
                'id' => $shelter['id'] ?? null,
                'name' => $shelter['name'] ?? null,
                'activities' => collect($shelter['activities'] ?? [])->map(
                    static fn ($activity) => $formatActivity($activity, false)
                )->values()->all(),
                'metrics' => [
                    'present_count' => (int) ($metrics['present_count'] ?? 0),
                    'late_count' => (int) ($metrics['late_count'] ?? 0),
                    'absent_count' => (int) ($metrics['absent_count'] ?? 0),
                    'attendance_rate' => $formatRate($metrics['attendance_rate'] ?? 0),
                    'late_rate' => $formatRate($metrics['late_rate'] ?? 0),
                    'total_sessions' => (int) ($metrics['total_sessions'] ?? 0),
                    'total_activities' => (int) ($metrics['total_activities'] ?? 0),
                    'unique_children' => (int) ($metrics['unique_children'] ?? 0),
                    'verification' => $formatVerification($metrics['verification'] ?? []),
                ],
            ];
        })->values()->all();

        $activities = collect($data['activities'] ?? [])->map(
            static fn ($activity) => $formatActivity($activity, true)
        )->values()->all();

        $filters = $data['filters'] ?? [];
        $metadata = $data['metadata'] ?? [];
        $totals = $data['totals'] ?? [];

        return [
            'filters' => [
                'start_date' => $filters['start_date'] ?? null,
                'end_date' => $filters['end_date'] ?? null,
                'shelter_ids' => array_values($filters['shelter_ids'] ?? []),
            ],
            'metadata' => [
                'total_shelters' => (int) ($metadata['total_shelters'] ?? count($shelters)),
                'total_sessions' => (int) ($metadata['total_sessions'] ?? 0),
                'total_activities' => (int) ($metadata['total_activities'] ?? 0),
                'activity_count' => (int) ($metadata['activity_count'] ?? ($metadata['total_activities'] ?? 0)),
                'present_count' => (int) ($metadata['present_count'] ?? 0),
                'late_count' => (int) ($metadata['late_count'] ?? 0),
                'absent_count' => (int) ($metadata['absent_count'] ?? 0),
                'attendance_rate' => $formatRate($metadata['attendance_rate'] ?? 0),
                'late_rate' => $formatRate($metadata['late_rate'] ?? 0),
                'unique_children' => (int) ($metadata['unique_children'] ?? 0),
                'verification' => $formatVerification($metadata['verification'] ?? []),
            ],
            'shelters' => $shelters,
            'activities' => $activities,
            'totals' => [
                'sessions' => (int) ($totals['sessions'] ?? ($metadata['total_sessions'] ?? 0)),
                'activities' => (int) ($totals['activities'] ?? ($metadata['activity_count'] ?? ($metadata['total_activities'] ?? 0))),
            ],
            'generated_at' => $data['generated_at'] ?? null,
        ];
    }
}
