<?php

namespace App\Http\Controllers\API\AdminCabang\Reports;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminCabang\Reports\ChildAttendance\ChildAttendanceDetailRequest;
use App\Http\Requests\AdminCabang\Reports\ChildAttendance\ChildAttendanceReportRequest;
use App\Http\Resources\AdminCabang\Reports\ChildAttendance\ChildAttendanceCollectionResource;
use App\Http\Resources\AdminCabang\Reports\ChildAttendance\ChildAttendanceDetailResource;
use App\Models\Anak;
use App\Services\AdminCabang\Reports\ChildAttendance\ChildAttendanceReportService;
use App\Support\AdminCabangScope;
use Illuminate\Http\JsonResponse;

class AdminCabangChildReportController extends Controller
{
    use AdminCabangScope;

    public function index(
        ChildAttendanceReportRequest $request,
        ChildAttendanceReportService $service
    ): JsonResponse {
        $adminCabang = $request->getAdminCabang();

        if (!$adminCabang) {
            return response()->json([
                'message' => __('Anda tidak memiliki akses sebagai admin cabang.'),
            ], 403);
        }

        $companyId = $this->companyId($adminCabang->company_id ?? null);

        if ($companyId && $adminCabang->company_id && $adminCabang->company_id !== $companyId) {
            return response()->json([
                'message' => __('Admin cabang tidak ditemukan untuk company ini.'),
            ], 404);
        }

        if ($companyId && !$adminCabang->company_id) {
            $adminCabang->company_id = $companyId;
        }

        $payload = $service->getSummaryAndList($adminCabang, array_filter($request->filters(), fn ($value) => $value !== null));

        return ChildAttendanceCollectionResource::make($payload)
            ->additional([
                'message' => __('Laporan kehadiran anak cabang berhasil diambil.'),
                'last_refreshed_at' => $payload['meta']['last_refreshed_at'] ?? null,
            ])
            ->response();
    }

    public function show(
        ChildAttendanceDetailRequest $request,
        Anak $child,
        ChildAttendanceReportService $service
    ): JsonResponse {
        $user = $request->user();
        $adminCabang = $user?->adminCabang;

        if (!$adminCabang) {
            return response()->json([
                'message' => __('Anda tidak memiliki akses sebagai admin cabang.'),
            ], 403);
        }

        $companyId = $this->companyId($adminCabang->company_id ?? null);

        if ($companyId && $adminCabang->company_id && $adminCabang->company_id !== $companyId) {
            return response()->json([
                'message' => __('Admin cabang tidak ditemukan untuk company ini.'),
            ], 404);
        }

        if ($companyId && !$adminCabang->company_id) {
            $adminCabang->company_id = $companyId;
        }

        $childRecord = $this->applyCompanyScope(Anak::query(), $companyId, 'anak')->find($child->id_anak);

        if (!$childRecord) {
            return response()->json([
                'message' => __('Data anak tidak ditemukan untuk company ini.'),
            ], 404);
        }

        $payload = $service->getChildDetail($adminCabang, $childRecord, array_filter($request->filters(), fn ($value) => $value !== null));

        return ChildAttendanceDetailResource::make($payload)
            ->additional([
                'message' => __('Detail laporan anak cabang berhasil diambil.'),
            ])
            ->response();
    }
}

