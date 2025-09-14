<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * ShelterResource
 *
 * Catatan:
 * - Primary key diasumsikan: id_shelter
 * - Relasi ke wilbin melalui id_wilbin
 */
class ShelterResource extends JsonResource
{
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        return [
            'id_shelter'    => $this->id_shelter,
            'id_wilbin'     => $this->id_wilbin,
            'nama_shelter'  => $this->nama_shelter
                ?? $this->nama
                ?? null,
            'created_at'    => optional($this->created_at)->toISOString(),
            'updated_at'    => optional($this->updated_at)->toISOString(),
        ];
    }
}
