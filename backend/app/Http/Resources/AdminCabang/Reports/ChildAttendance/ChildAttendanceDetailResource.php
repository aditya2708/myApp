<?php

namespace App\Http\Resources\AdminCabang\Reports\ChildAttendance;

use Illuminate\Http\Resources\Json\JsonResource;

class ChildAttendanceDetailResource extends JsonResource
{
    public function toArray($request): array
    {
        $summary = $this->resource['summary'] ?? [];

        return [
            'period' => [
                'start_date' => $this->resource['period']['start_date'] ?? null,
                'end_date' => $this->resource['period']['end_date'] ?? null,
            ],
            'child' => [
                'id' => $this->resource['child']['id'] ?? null,
                'full_name' => $this->resource['child']['full_name'] ?? null,
                'nick_name' => $this->resource['child']['nick_name'] ?? null,
                'gender' => $this->resource['child']['gender'] ?? null,
                'date_of_birth' => $this->resource['child']['date_of_birth'] ?? null,
                'photo_url' => $this->resource['child']['photo_url'] ?? null,
                'shelter' => [
                    'id' => $this->resource['child']['shelter']['id'] ?? null,
                    'name' => $this->resource['child']['shelter']['name'] ?? null,
                ],
                'group' => $this->resource['child']['group'] ?? null,
                'guardian_contact' => $this->resource['child']['guardian_contact'] ?? null,
            ],
            'summary' => [
                'total_activities' => (int) ($summary['total_activities'] ?? 0),
                'hadir_count' => (int) ($summary['hadir_count'] ?? 0),
                'tidak_hadir_count' => (int) ($summary['tidak_hadir_count'] ?? 0),
                'attendance_percentage' => number_format((float) ($summary['attendance_percentage'] ?? 0), 2, '.', ''),
                'attendance_band' => $summary['attendance_band'] ?? null,
                'last_present_on' => $summary['last_present_on'] ?? null,
                'consecutive_absent' => (int) ($summary['consecutive_absent'] ?? 0),
            ],
            'verification_summary' => [
                'pending' => (int) (($this->resource['verification_summary']['pending'] ?? 0)),
                'verified' => (int) (($this->resource['verification_summary']['verified'] ?? 0)),
                'rejected' => (int) (($this->resource['verification_summary']['rejected'] ?? 0)),
                'manual' => (int) (($this->resource['verification_summary']['manual'] ?? 0)),
            ],
            'monthly_breakdown' => collect($this->resource['monthly_breakdown'] ?? [])->map(function ($payload) {
                return [
                    'month' => $payload['month'] ?? null,
                    'label' => $payload['label'] ?? null,
                    'total_activities' => (int) ($payload['total_activities'] ?? 0),
                    'hadir_count' => (int) ($payload['hadir_count'] ?? 0),
                    'tidak_hadir_count' => (int) ($payload['tidak_hadir_count'] ?? 0),
                    'attendance_percentage' => number_format((float) ($payload['attendance_percentage'] ?? 0), 2, '.', ''),
                ];
            })->values()->all(),
            'attendance_timeline' => collect($this->resource['attendance_timeline'] ?? [])->map(function ($payload) {
                return [
                    'activity_id' => $payload['activity_id'] ?? null,
                    'date' => $payload['date'] ?? null,
                    'activity_name' => $payload['activity_name'] ?? null,
                    'jenis_kegiatan' => $payload['jenis_kegiatan'] ?? null,
                    'shelter_id' => $payload['shelter_id'] ?? null,
                    'group_id' => $payload['group_id'] ?? null,
                    'status' => $payload['status'] ?? null,
                    'time_arrived' => $payload['time_arrived'] ?? null,
                    'is_verified' => (bool) ($payload['is_verified'] ?? false),
                    'tutor' => $payload['tutor'] ?? null,
                    'material' => $payload['material'] ?? null,
                    'start_time' => $payload['start_time'] ?? null,
                    'end_time' => $payload['end_time'] ?? null,
                    'notes' => $payload['notes'] ?? [],
                ];
            })->values()->all(),
            'streaks' => $this->resource['streaks'] ?? [
                'present' => ['current' => 0, 'longest' => 0],
                'absent' => ['current' => 0, 'longest' => 0],
            ],
            'filters' => [
                'start_date' => $this->resource['filters']['start_date'] ?? null,
                'end_date' => $this->resource['filters']['end_date'] ?? null,
                'jenis_kegiatan' => $this->resource['filters']['jenis_kegiatan'] ?? null,
            ],
            'meta' => [
                'generated_at' => $this->resource['meta']['generated_at'] ?? null,
                'export_available' => (bool) ($this->resource['meta']['export_available'] ?? false),
            ],
        ];
    }
}

