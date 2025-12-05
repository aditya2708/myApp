<?php

namespace App\Http\Controllers\API\AdminCabang\Reports;

use App\Http\Controllers\Controller;
use App\Services\AdminCabang\Reports\ReportSummaryService;
use App\Support\AdminCabangScope;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use RuntimeException;

class AdminCabangReportSummaryController extends Controller
{
    use AdminCabangScope;

    public function getSummary(Request $request, ReportSummaryService $reportSummaryService): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 401);
        }

        $adminCabang = $user->adminCabang;

        if (!$adminCabang) {
            return response()->json([
                'message' => 'Admin cabang tidak ditemukan'
            ], 404);
        }

        $companyId = $this->companyId($adminCabang->company_id ?? null);

        if ($companyId && $adminCabang->company_id && $adminCabang->company_id !== $companyId) {
            return response()->json([
                'message' => 'Admin cabang tidak ditemukan untuk company ini',
            ], 404);
        }

        if ($companyId && !$adminCabang->company_id) {
            $adminCabang->company_id = $companyId;
        }

        $startDateInput = $request->query('start_date');
        $endDateInput = $request->query('end_date');

        try {
            $startDate = $startDateInput
                ? Carbon::parse($startDateInput)->startOfDay()
                : now()->subDays(30)->startOfDay();

            $endDate = $endDateInput
                ? Carbon::parse($endDateInput)->endOfDay()
                : now()->endOfDay();
        } catch (\Exception $exception) {
            return response()->json([
                'message' => 'Format tanggal tidak valid',
                'errors' => [
                    'date' => [$exception->getMessage()],
                ],
            ], 422);
        }

        if ($startDate->gt($endDate)) {
            return response()->json([
                'message' => 'Rentang tanggal tidak valid',
                'errors' => [
                    'start_date' => ['Tanggal mulai harus lebih kecil atau sama dengan tanggal akhir.'],
                ],
            ], 422);
        }

        try {
            $summary = $reportSummaryService->build($adminCabang, $startDate, $endDate);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 404);
        }

        return response()->json([
            'message' => 'Ringkasan laporan admin cabang berhasil diambil',
            'data' => $summary,
        ]);
    }
}
