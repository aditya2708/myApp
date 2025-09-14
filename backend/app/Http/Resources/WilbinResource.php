<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * WilbinResource
 *
 * Catatan:
 * - Primary key diasumsikan: id_wilbin
 * - Relasi ke kacab melalui id_kacab
 */
class WilbinResource extends JsonResource
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
            'id_wilbin'   => $this->id_wilbin,
            'id_kacab'    => $this->id_kacab,
            'nama_wilbin' => $this->nama_wilbin
                ?? $this->nama
                ?? null,
            'created_at'  => optional($this->created_at)->toISOString(),
            'updated_at'  => optional($this->updated_at)->toISOString(),
        ];
    }
}
