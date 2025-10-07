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

        $shelters = collect($data['shelters'] ?? [])->map(function ($shelter) use ($formatRate, $formatVerification) {
            $metrics = $shelter['metrics'] ?? [];

            return [
                'id' => $shelter['id'] ?? null,
                'name' => $shelter['name'] ?? null,
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

        $filters = $data['filters'] ?? [];
        $metadata = $data['metadata'] ?? [];

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
                'present_count' => (int) ($metadata['present_count'] ?? 0),
                'late_count' => (int) ($metadata['late_count'] ?? 0),
                'absent_count' => (int) ($metadata['absent_count'] ?? 0),
                'attendance_rate' => $formatRate($metadata['attendance_rate'] ?? 0),
                'late_rate' => $formatRate($metadata['late_rate'] ?? 0),
                'unique_children' => (int) ($metadata['unique_children'] ?? 0),
                'verification' => $formatVerification($metadata['verification'] ?? []),
            ],
            'shelters' => $shelters,
            'generated_at' => $data['generated_at'] ?? null,
        ];
    }
}
