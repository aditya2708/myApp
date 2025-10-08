<?php

namespace App\Http\Resources\AdminCabang\Reports\Attendance;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceWeeklyShelterDetailResource extends JsonResource
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

        $formatMetrics = function (array $metrics) use ($formatRate, $formatVerification): array {
            return [
                'present_count' => (int) ($metrics['present_count'] ?? 0),
                'late_count' => (int) ($metrics['late_count'] ?? 0),
                'absent_count' => (int) ($metrics['absent_count'] ?? 0),
                'attendance_rate' => $formatRate($metrics['attendance_rate'] ?? 0),
                'late_rate' => $formatRate($metrics['late_rate'] ?? 0),
                'total_sessions' => (int) ($metrics['total_sessions'] ?? 0),
                'total_activities' => (int) ($metrics['total_activities'] ?? 0),
                'unique_children' => (int) ($metrics['unique_children'] ?? 0),
                'verification' => $formatVerification($metrics['verification'] ?? []),
            ];
        };

        $groups = collect($data['groups'] ?? [])->map(function ($group) use ($formatMetrics) {
            $activities = collect($group['activities'] ?? [])->map(function ($activity) use ($formatMetrics) {
                $metrics = $formatMetrics($activity['metrics'] ?? []);

                return [
                    'id' => $activity['id'] ?? null,
                    'date' => $activity['date'] ?? null,
                    'week' => $activity['week'] ?? null,
                    'group_name' => $activity['group_name'] ?? null,
                    'jenis_kegiatan' => $activity['jenis_kegiatan'] ?? null,
                    'materi' => $activity['materi'] ?? null,
                    'metrics' => $metrics,
                ];
            })->values()->all();

            return [
                'id' => $group['id'] ?? null,
                'name' => $group['name'] ?? null,
                'member_count' => isset($group['member_count']) ? (int) $group['member_count'] : null,
                'metrics' => $formatMetrics($group['metrics'] ?? []),
                'activities' => $activities,
            ];
        })->values()->all();

        $activities = collect($data['activities'] ?? [])->map(function ($activity) use ($formatMetrics) {
            return [
                'id' => $activity['id'] ?? null,
                'date' => $activity['date'] ?? null,
                'week' => $activity['week'] ?? null,
                'group_name' => $activity['group_name'] ?? null,
                'jenis_kegiatan' => $activity['jenis_kegiatan'] ?? null,
                'materi' => $activity['materi'] ?? null,
                'metrics' => $formatMetrics($activity['metrics'] ?? []),
            ];
        })->values()->all();

        $notes = collect($data['notes'] ?? [])->filter(fn ($note) => filled($note))->values()->all();

        $filters = $data['filters'] ?? [];
        $metrics = $data['metrics'] ?? [];
        $shelter = $data['shelter'] ?? [];

        return [
            'shelter' => [
                'id' => $shelter['id'] ?? null,
                'name' => $shelter['name'] ?? null,
                'wilbin' => $shelter['wilbin'] ?? null,
                'wilbin_id' => $shelter['wilbin_id'] ?? null,
            ],
            'filters' => [
                'week' => $filters['week'] ?? null,
                'start_date' => $filters['start_date'] ?? null,
                'end_date' => $filters['end_date'] ?? null,
            ],
            'metrics' => $formatMetrics($metrics),
            'groups' => $groups,
            'activities' => $activities,
            'notes' => $notes,
            'generated_at' => $data['generated_at'] ?? null,
        ];
    }
}
