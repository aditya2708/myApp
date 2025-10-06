<?php

namespace App\Http\Controllers\API\AdminCabang\Reports\Attendance;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AttendanceWeeklyController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'message' => 'Laporan kehadiran mingguan belum tersedia.',
            'data' => [],
        ]);
    }
}
