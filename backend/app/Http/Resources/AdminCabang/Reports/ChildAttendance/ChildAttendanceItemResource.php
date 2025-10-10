<?php

namespace App\Http\Resources\AdminCabang\Reports\ChildAttendance;

use Illuminate\Http\Resources\Json\JsonResource;

class ChildAttendanceItemResource extends JsonResource
{
    public function toArray($request): array
    {
        $attendance = $this->resource['attendance'] ?? [];
        $streaks = $this->resource['streaks'] ?? [];

        return [
            'id' => $this->resource['id'] ?? null,
            'full_name' => $this->resource['full_name'] ?? null,
            'nick_name' => $this->resource['nick_name'] ?? null,
            'photo_url' => $this->resource['photo_url'] ?? null,
            'gender' => $this->resource['gender'] ?? null,
            'date_of_birth' => $this->resource['date_of_birth'] ?? null,
            'shelter' => [
                'id' => $this->resource['shelter']['id'] ?? null,
                'name' => $this->resource['shelter']['name'] ?? null,
            ],
            'group' => [
                'id' => $this->resource['group']['id'] ?? null,
                'name' => $this->resource['group']['name'] ?? null,
            ],
            'attendance' => [
                'present_count' => (int) ($attendance['present_count'] ?? 0),
                'late_count' => (int) ($attendance['late_count'] ?? 0),
                'absent_count' => (int) ($attendance['absent_count'] ?? 0),
                'total_sessions' => (int) ($attendance['total_sessions'] ?? 0),
                'attendance_percentage' => number_format((float) ($attendance['attendance_percentage'] ?? 0), 2, '.', ''),
                'attendance_band' => $attendance['attendance_band'] ?? null,
            ],
            'monthly_breakdown' => collect($this->resource['monthly_breakdown'] ?? [])
                ->map(function ($payload) {
                    return [
                        'month' => $payload['month'] ?? null,
                        'label' => $payload['label'] ?? null,
                        'activities_count' => (int) ($payload['activities_count'] ?? 0),
                        'attended_count' => (int) ($payload['attended_count'] ?? 0),
                        'late_count' => (int) ($payload['late_count'] ?? 0),
                        'absent_count' => (int) ($payload['absent_count'] ?? 0),
                        'attendance_percentage' => number_format((float) ($payload['attendance_percentage'] ?? 0), 2, '.', ''),
                    ];
                })
                ->values()
                ->all(),
            'last_activity' => $this->formatLastActivity($this->resource['last_activity'] ?? null),
            'streaks' => [
                'current_present_streak' => (int) ($streaks['current_present_streak'] ?? 0),
                'longest_present_streak' => (int) ($streaks['longest_present_streak'] ?? 0),
                'last_absent_on' => $streaks['last_absent_on'] ?? null,
            ],
            'flags' => collect($this->resource['flags'] ?? [])->values()->all(),
        ];
    }

    protected function formatLastActivity(?array $payload): ?array
    {
        if (!$payload) {
            return null;
        }

        return [
            'activity_id' => $payload['activity_id'] ?? null,
            'date' => $payload['date'] ?? null,
            'activity_name' => $payload['activity_name'] ?? null,
            'status' => $payload['status'] ?? null,
            'verified_at' => $payload['verified_at'] ?? null,
        ];
    }
}

