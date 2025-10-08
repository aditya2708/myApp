<?php

namespace App\Http\Resources\AdminCabang\Reports\Attendance;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceWeeklyResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = (array) $this->resource;

        $formatPercentage = static fn ($value): string => number_format((float) ($value ?? 0), 2, '.', '');
        $formatDelta = static fn ($value): string => number_format((float) ($value ?? 0), 2, '.', '');

        $period = (array) ($data['period'] ?? []);
        $summary = (array) ($data['summary'] ?? []);
        $meta = (array) ($data['meta'] ?? []);
        $filters = (array) ($meta['filters'] ?? []);

        $shelters = collect($data['shelters'] ?? [])->map(function ($shelter) use ($formatPercentage, $formatDelta) {
            return [
                'id' => $shelter['id'] ?? null,
                'name' => $shelter['name'] ?? null,
                'total_students' => (int) ($shelter['total_students'] ?? 0),
                'present_count' => (int) ($shelter['present_count'] ?? 0),
                'late_count' => (int) ($shelter['late_count'] ?? 0),
                'absent_count' => (int) ($shelter['absent_count'] ?? 0),
                'attendance_percentage' => $formatPercentage($shelter['attendance_percentage'] ?? 0),
                'attendance_band' => $shelter['attendance_band'] ?? null,
                'trend_delta' => $formatDelta($shelter['trend_delta'] ?? 0),
                'groups_count' => (int) ($shelter['groups_count'] ?? 0),
            ];
        })->values()->all();

        $weeks = collect($data['weeks'] ?? [])->map(function ($week) use ($formatPercentage) {
            $metrics = (array) ($week['metrics'] ?? []);
            $verification = (array) ($metrics['verification'] ?? []);
            $dates = (array) ($week['dates'] ?? []);

            return [
                'id' => $week['id'] ?? null,
                'label' => $week['label'] ?? null,
                'dates' => [
                    'start' => $dates['start'] ?? ($week['start_date'] ?? null),
                    'end' => $dates['end'] ?? ($week['end_date'] ?? null),
                ],
                'metrics' => [
                    'present_count' => (int) ($metrics['present_count'] ?? 0),
                    'late_count' => (int) ($metrics['late_count'] ?? 0),
                    'absent_count' => (int) ($metrics['absent_count'] ?? 0),
                    'attendance_percentage' => $formatPercentage($metrics['attendance_rate'] ?? ($metrics['attendance_percentage'] ?? 0)),
                    'late_percentage' => $formatPercentage($metrics['late_rate'] ?? ($metrics['late_percentage'] ?? 0)),
                    'total_sessions' => (int) ($metrics['total_sessions'] ?? 0),
                    'total_activities' => (int) ($metrics['total_activities'] ?? 0),
                    'unique_children' => (int) ($metrics['unique_children'] ?? 0),
                    'verification' => [
                        'pending' => (int) ($verification['pending'] ?? 0),
                        'verified' => (int) ($verification['verified'] ?? 0),
                        'rejected' => (int) ($verification['rejected'] ?? 0),
                        'manual' => (int) ($verification['manual'] ?? 0),
                    ],
                ],
            ];
        })->values()->all();

        return [
            'period' => [
                'start_date' => $period['start_date'] ?? null,
                'end_date' => $period['end_date'] ?? null,
            ],
            'summary' => [
                'total_shelters' => (int) ($summary['total_shelters'] ?? 0),
                'total_groups' => (int) ($summary['total_groups'] ?? 0),
                'total_students' => (int) ($summary['total_students'] ?? 0),
                'present_count' => (int) ($summary['present_count'] ?? 0),
                'late_count' => (int) ($summary['late_count'] ?? 0),
                'absent_count' => (int) ($summary['absent_count'] ?? 0),
                'attendance_percentage' => $formatPercentage($summary['attendance_percentage'] ?? 0),
            ],
            'shelters' => $shelters,
            'weeks' => $weeks,
            'meta' => [
                'filters' => [
                    'start_date' => $filters['start_date'] ?? null,
                    'end_date' => $filters['end_date'] ?? null,
                    'attendance_band' => $filters['attendance_band'] ?? null,
                    'search' => $filters['search'] ?? null,
                    'week_id' => $filters['week_id'] ?? null,
                ],
                'last_refreshed_at' => $meta['last_refreshed_at'] ?? null,
            ],
        ];
    }
}
