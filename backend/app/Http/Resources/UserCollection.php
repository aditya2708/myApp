<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

/**
 * UserCollection
 *
 * - Menggunakan UserResource untuk memformat setiap item.
 * - Jika sumber data adalah paginator, meta & links otomatis ikut.
 * - Pastikan controller melakukan eager-load relasi yang diperlukan
 *   (adminPusat, adminCabang, adminShelter) sebelum me-return koleksi ini.
 */
class UserCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
  public function toArray($request)
    {
        return [
            'status' => true,
            'data'   => $this->collection->map(function ($user) use ($request) {
                return (new UserResource($user))->toArray($request);
            }),
        ];
    }

    /**
     * Tambahkan informasi pagination (jika applicable) di response.
     */
    public function with($request)
    {
        $resource = $this->resource;

        if ($resource instanceof LengthAwarePaginator) {
            return [
                'meta' => [
                    'current_page' => $resource->currentPage(),
                    'from'         => $resource->firstItem(),
                    'last_page'    => $resource->lastPage(),
                    'path'         => $resource->path(),
                    'per_page'     => $resource->perPage(),
                    'to'           => $resource->lastItem(),
                    'total'        => $resource->total(),
                ],
                'links' => [
                    'first' => $resource->url(1),
                    'last'  => $resource->url($resource->lastPage()),
                    'prev'  => $resource->previousPageUrl(),
                    'next'  => $resource->nextPageUrl(),
                ],
            ];
        }

        return [];
    }
}
