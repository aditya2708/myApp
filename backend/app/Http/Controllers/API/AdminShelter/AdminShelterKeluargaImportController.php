<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminShelter\KeluargaImportRequest;
use App\Services\AdminShelter\KeluargaImportService;
use App\Support\SsoContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminShelterKeluargaImportController extends Controller
{
    public function __construct(
        private readonly KeluargaImportService $importService
    ) {
    }

    public function template(): StreamedResponse
    {
        $headers = [
            'NO',
            'Shelter', 
            'Nomor KK',
            'Nama Ayah',
            'NIK Ayah',
            'Nama Ibu', 
            'NIK Ibu',
            'Status Anak',
            'Nama Lengkap Anak',
            'NIK Anak',
            'Jenis Kelamin',
            'Tanggal Lahir',
            'Kelas',
            'Jenjang',
            'Alamat'
        ];

        $sampleRow = [
            '1',
            'Shelter A',
            '3201012345678901',
            'Ahmad Wijaya',
            '3201012345678901',
            'Siti Nurhaliza',
            '3201012345678901',
            'dhuafa',
            'Budi Santoso',
            '3201012345678901',
            'Laki-laki',
            '15-01-2010',
            'V',
            'SD',
            'Jl. Merdeka No. 123'
        ];

        return response()->streamDownload(
            function () use ($headers, $sampleRow) {
                $handle = fopen('php://output', 'w');
                fputcsv($handle, $headers);
                fputcsv($handle, array_map(static fn ($value) => $value ?? '', $sampleRow));
                fclose($handle);
            },
            'template_import_keluarga.csv',
            [
                'Content-Type' => 'text/csv',
            ]
        );
    }

    public function import(KeluargaImportRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $dryRun = $validated['dry_run'] ?? true;

        $admin = Auth::user()->adminShelter;

        $context = [
            'id_kacab' => $validated['id_kacab'] ?? $admin?->id_kacab,
            'id_wilbin' => $validated['id_wilbin'] ?? $admin?->id_wilbin,
            'id_shelter' => $validated['id_shelter'] ?? $admin?->id_shelter,
            'company_id' => app()->bound(SsoContext::class)
                ? app(SsoContext::class)->company()?->id
                : ($admin?->company_id ?? null),
        ];

        if (!$context['id_kacab'] || !$context['id_wilbin'] || !$context['id_shelter']) {
            return response()->json([
                'success' => false,
                'message' => 'ID kacab, wilbin, dan shelter harus tersedia. Lengkapi kolom atau pastikan akun admin shelter memiliki relasi lengkap.',
            ], 422);
        }

        if (!$context['company_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Company untuk admin tidak ditemukan. Pastikan akun memiliki company_id.',
            ], 422);
        }

        $defaults = Arr::only(
            $validated,
            [
                'hafalan',
                'pelajaran_favorit',
                'hobi',
                'prestasi',
                'jarak_rumah',
                'transportasi',
                'status_validasi',
                'status_cpb',
                'status_keluarga',
                'jenjang',
                'kelas',
                'nama_sekolah',
                'alamat_sekolah',
                'jurusan',
                'semester',
                'nama_pt',
                'alamat_pt',
                'id_bank',
                'no_rek',
                'an_rek',
                'no_tlp',
                'an_tlp',
            ]
        );

        $context = array_merge($context, $defaults);

        try {
            $analysis = $this->importService->validateFile($request->file('file'), $context);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'dry_run' => $dryRun,
                'message' => $e->getMessage(),
            ], 422);
        }

        if (($analysis['summary']['total_rows'] ?? 0) === 0) {
            return response()->json([
                'success' => false,
                'dry_run' => $dryRun,
                'message' => 'File import tidak berisi data atau header tidak sesuai template.',
            ], 422);
        }

        if ($dryRun) {
            return response()->json([
                'success' => true,
                'dry_run' => true,
                'summary' => $analysis['summary'],
                'errors' => $analysis['errors'],
            ]);
        }

        $commitResult = $this->importService->commit($analysis['rows']);
        $hasInvalidRows = ($analysis['summary']['invalid_rows'] ?? 0) > 0;
        $hasCommitFailures = !empty($commitResult['failed_rows']);
        $statusCode = ($hasInvalidRows || $hasCommitFailures) ? 207 : 200;

        $response = [
            'success' => empty($commitResult['failed_rows']),
            'dry_run' => false,
            'summary' => $analysis['summary'],
            'result' => $commitResult,
            'errors' => $analysis['errors'],
        ];

        if ($hasInvalidRows && $hasCommitFailures) {
            $response['message'] = 'Sebagian baris tidak valid dan beberapa baris gagal diproses.';
        } elseif ($hasInvalidRows) {
            $response['message'] = 'Sebagian baris tidak valid dan dilewati saat import.';
        } elseif ($hasCommitFailures) {
            $response['message'] = 'Sebagian baris gagal diproses saat commit.';
        }

        return response()->json($response, $statusCode);
    }
}
