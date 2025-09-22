<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\MissingValue;

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
        $wilbin = $this->whenLoaded('wilbin');
        $wilbinModel = $wilbin instanceof MissingValue ? null : $wilbin;

        $kacab = $wilbinModel && method_exists($wilbinModel, 'relationLoaded')
            ? ($wilbinModel->relationLoaded('kacab') ? $wilbinModel->kacab : null)
            : $this->whenLoaded('kacab');
        $kacabModel = $kacab instanceof MissingValue ? null : $kacab;

        return [
            'id_shelter'    => $this->id_shelter,
            'id_wilbin'     => $this->id_wilbin,
            'nama_shelter'  => $this->nama_shelter
                ?? $this->nama
                ?? null,
            'wilbin_name'   => $this->wilbin_name
                ?? optional($wilbinModel)->nama_wilbin
                ?? optional($wilbinModel)->nama
                ?? null,
            'nama_kacab'    => $this->nama_kacab
                ?? optional($kacabModel)->nama_kacab
                ?? optional($kacabModel)->nama
                ?? null,
            'wilbin'        => $wilbin instanceof MissingValue
                ? $wilbin
                : new WilbinResource($wilbinModel),
            'kacab'         => $kacab instanceof MissingValue
                ? $kacab
                : new KacabResource($kacabModel),
            'created_at'    => optional($this->created_at)->toISOString(),
            'updated_at'    => optional($this->updated_at)->toISOString(),
        ];
    }
}
