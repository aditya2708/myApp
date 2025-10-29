<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use Illuminate\Http\JsonResponse;

class KegiatanController extends Controller
{
    public function index(): JsonResponse
    {
        $kegiatan = Kegiatan::orderBy('nama_kegiatan')
            ->get(['id_kegiatan', 'nama_kegiatan', 'created_at', 'updated_at']);

        return response()->json([
            'success' => true,
            'data' => $kegiatan,
        ]);
    }
}
