<?php

namespace App\Http\Controllers\API\AdminCabang\Reports;

use App\Http\Controllers\Controller;
use App\Services\AdminCabang\Reports\TutorFilterHierarchyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class AdminCabangTutorFilterController extends Controller
{
    public function wilayah(Request $request, TutorFilterHierarchyService $hierarchyService): JsonResponse
    {
        $validated = $request->validate([
            'search' => 'nullable|string|max:190',
        ]);

        $user = $request->user();
        $adminCabang = $user?->adminCabang;

        if (!$adminCabang) {
            return response()->json([
                'success' => false,
                'message' => 'Admin cabang tidak ditemukan untuk pengguna saat ini.',
            ], 404);
        }

        try {
            $wilayah = $hierarchyService->getWilayahOptions($adminCabang, $validated['search'] ?? null);
        } catch (RuntimeException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 404);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil daftar wilayah binaan: ' . $exception->getMessage(),
            ], 500);
        }

        $wilayahItems = $wilayah->values()->all();

        return response()->json([
            'success' => true,
            'message' => 'Daftar wilayah binaan berhasil diambil.',
            'data' => $wilayahItems,
            'meta' => [
                'total' => count($wilayahItems),
            ],
        ]);
    }

    public function shelters(Request $request, TutorFilterHierarchyService $hierarchyService): JsonResponse
    {
        $validated = $request->validate([
            'wilbin_id' => 'required|integer',
            'search' => 'nullable|string|max:190',
        ]);

        $user = $request->user();
        $adminCabang = $user?->adminCabang;

        if (!$adminCabang) {
            return response()->json([
                'success' => false,
                'message' => 'Admin cabang tidak ditemukan untuk pengguna saat ini.',
            ], 404);
        }

        try {
            $payload = $hierarchyService->getShelterOptions(
                $adminCabang,
                (int) $validated['wilbin_id'],
                $validated['search'] ?? null,
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 404);
        } catch (\Throwable $exception) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil daftar shelter: ' . $exception->getMessage(),
            ], 500);
        }

        $shelterItems = $payload['shelters']->values()->all();

        return response()->json([
            'success' => true,
            'message' => 'Daftar shelter berhasil diambil.',
            'data' => $shelterItems,
            'meta' => [
                'wilayah' => $payload['wilayah'],
                'total' => count($shelterItems),
            ],
        ]);
    }
}
