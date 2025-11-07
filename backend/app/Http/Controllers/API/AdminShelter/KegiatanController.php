<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use Illuminate\Http\JsonResponse;

class KegiatanController extends Controller
{
    private const ALLOWED_NAMES = ['Bimbel', 'Tahfidz', 'Lain-lain'];

    public function index(): JsonResponse
    {
        $kegiatan = Kegiatan::whereIn('nama_kegiatan', self::ALLOWED_NAMES)
            ->get(['id_kegiatan', 'nama_kegiatan', 'created_at', 'updated_at'])
            ->sortBy(function ($item) {
                $index = array_search($item->nama_kegiatan, self::ALLOWED_NAMES, true);
                return $index === false ? PHP_INT_MAX : $index;
            })
            ->values();

        return response()->json([
            'success' => true,
            'data' => $kegiatan,
        ]);
    }
}
