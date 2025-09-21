<?php

namespace App\Http\Resources;

use App\Http\Resources\KacabResource;
use Illuminate\Http\Resources\Json\JsonResource;

use function optional;

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
        $loadedKacab = $this->resource->relationLoaded('kacab') ? $this->kacab : null;

        return [
            'id_wilbin'   => $this->id_wilbin,
            'id_kacab'    => $this->id_kacab
                ?? optional($loadedKacab)->id_kacab
                ?? null,
            'nama_wilbin' => $this->nama_wilbin
                ?? $this->nama
                ?? null,
            'nama_kacab'  => $this->nama_kacab
                ?? optional($loadedKacab)->nama_kacab
                ?? optional($loadedKacab)->nama
                ?? null,
            'nama_cabang' => $this->nama_cabang
                ?? optional($loadedKacab)->nama_cabang
                ?? optional($loadedKacab)->nama
                ?? optional($loadedKacab)->nama_kacab
                ?? null,
            'kacab'       => new KacabResource($this->whenLoaded('kacab')),
            'created_at'  => optional($this->created_at)->toISOString(),
            'updated_at'  => optional($this->updated_at)->toISOString(),
        ];
    }
}
