<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * KacabResource
 *
 * Catatan:
 * - Primary key diasumsikan: id_kacab
 * - Nama cabang bisa saja disimpan di kolom berbeda; kita fallback berurutan.
 */
class KacabResource extends JsonResource
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
            'id_kacab'    => $this->id_kacab,
            'nama_cabang' => $this->nama_cabang
                ?? $this->nama
                ?? $this->nama_kacab
                ?? null,
            'created_at'  => optional($this->created_at)->toISOString(),
            'updated_at'  => optional($this->updated_at)->toISOString(),
        ];
    }
}
