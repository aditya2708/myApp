<?php

namespace App\Http\Resources\AdminCabang\Reports\ChildAttendance;

use Illuminate\Http\Resources\Json\JsonResource;

class ShelterBreakdownResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->resource['id'] ?? null,
            'name' => $this->resource['name'] ?? null,
            'total_children' => (int) ($this->resource['total_children'] ?? 0),
            'present_count' => (int) ($this->resource['present_count'] ?? 0),
            'late_count' => (int) ($this->resource['late_count'] ?? 0),
            'absent_count' => (int) ($this->resource['absent_count'] ?? 0),
            'total_sessions' => (int) ($this->resource['total_sessions'] ?? 0),
            'attendance_percentage' => number_format((float) ($this->resource['attendance_percentage'] ?? 0), 2, '.', ''),
            'attendance_band' => $this->resource['attendance_band'] ?? null,
            'trend_delta' => number_format((float) ($this->resource['trend_delta'] ?? 0), 2, '.', ''),
            'low_band_children' => (int) ($this->resource['low_band_children'] ?? 0),
        ];
    }
}

