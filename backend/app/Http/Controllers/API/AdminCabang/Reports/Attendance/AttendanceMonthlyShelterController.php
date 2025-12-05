<?php

namespace App\Http\Controllers\API\AdminCabang\Reports\Attendance;

use App\Http\Controllers\Controller;
use App\Services\AdminCabang\Reports\Attendance\MonthlyShelterAttendanceService;
use App\Support\SsoContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceMonthlyShelterController extends Controller
{
    public function __invoke(Request $request, MonthlyShelterAttendanceService $service): JsonResponse
    {
        $user = $request->user();
        $adminCabang = $user?->adminCabang;

        if (!$adminCabang) {
            return response()->json([
                'success' => false,
                'message' => 'Admin cabang tidak ditemukan.',
            ], 404);
        }

        $companyId = $this->companyId($adminCabang->company_id ?? null);

        if ($companyId && $adminCabang->company_id && $adminCabang->company_id !== $companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Admin cabang tidak ditemukan untuk company ini.',
            ], 404);
        }

        if ($companyId && !$adminCabang->company_id) {
            $adminCabang->company_id = $companyId;
        }

        $filters = $request->all();
        $filters['company_id'] = $companyId;

        $payload = $service->build($adminCabang, $filters);

        return response()->json([
            'success' => true,
            'message' => 'Laporan kehadiran bulanan per shelter berhasil diambil.',
            'data' => $payload,
        ]);
    }

    /**
     * Ambil company id dari SSO context atau fallback.
     */
    private function companyId(?int $fallback = null): ?int
    {
        if (app()->bound(SsoContext::class) && app(SsoContext::class)->company()) {
            return app(SsoContext::class)->company()->id;
        }

        return $fallback;
    }
}
