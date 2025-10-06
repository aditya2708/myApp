<?php

namespace App\Http\Resources\AdminCabang\Reports\Attendance;

use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceMonthlyShelterResource extends JsonResource
{
    public function toArray($request): array
    {
        return (array) $this->resource;
    }
}
