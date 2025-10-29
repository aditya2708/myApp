<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminShelter\KeluargaImportRequest;
use App\Services\AdminShelter\KeluargaImportService;
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
            'no_kk',
            'kepala_keluarga',
            'status_ortu',
            'nik_ayah',
            'nama_ayah',
            'agama_ayah',
            'tempat_lahir_ayah',
            'tanggal_lahir_ayah',
            'alamat_ayah',
            'penghasilan_ayah',
            'tanggal_kematian_ayah',
            'penyebab_kematian_ayah',
            'nik_ibu',
            'nama_ibu',
            'agama_ibu',
            'tempat_lahir_ibu',
            'tanggal_lahir_ibu',
            'alamat_ibu',
            'penghasilan_ibu',
            'tanggal_kematian_ibu',
            'penyebab_kematian_ibu',
            'nik_wali',
            'nama_wali',
            'agama_wali',
            'tempat_lahir_wali',
            'tanggal_lahir_wali',
            'alamat_wali',
            'penghasilan_wali',
            'hub_kerabat_wali',
            'nik_anak',
            'full_name',
            'nick_name',
            'agama',
            'tempat_lahir',
            'tanggal_lahir',
            'jenis_kelamin',
            'tinggal_bersama',
            'anak_ke',
            'dari_bersaudara',
            'hafalan',
            'jarak_rumah',
            'transportasi',
            'pelajaran_favorit',
            'hobi',
            'prestasi',
            'alamat',
            'jenjang',
            'kelas',
            'nama_sekolah',
            'alamat_sekolah',
            'jurusan',
            'semester',
            'nama_pt',
            'alamat_pt',
            'status_validasi',
            'status_cpb',
            'status_keluarga',
            'id_bank',
            'no_rek',
            'an_rek',
            'no_tlp',
            'an_tlp',
        ];

        $sampleRow = [
            '3201122012345678',
            'Budi Santoso',
            'yatim',
            '3175091501800001',
            'Sutrisno',
            'Islam',
            'Jakarta',
            '1970-05-14',
            'Jl. Melati No. 5',
            '2500000',
            null,
            null,
            '3175096403810002',
            'Siti Aminah',
            'Islam',
            'Jakarta',
            '1975-03-22',
            'Jl. Melati No. 5',
            '1500000',
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            '3175091507150003',
            'Andi Santoso',
            'Andi',
            'Islam',
            'Jakarta',
            '2010-07-15',
            'Laki-laki',
            'Ibu',
            1,
            3,
            'Tahfidz',
            '2',
            'Sepeda',
            'Matematika',
            'Sepak Bola',
            'Juara 1 Lomba Tahfidz',
            'Jl. Melati No. 5',
            'smp',
            '8',
            'SMPN 12 Jakarta',
            'Jl. Pendidikan No. 3',
            null,
            2,
            null,
            null,
            'aktif',
            'BCPB',
            'dengan_keluarga',
            null,
            null,
            null,
            '081211223344',
            'Siti Aminah',
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
        ];

        if (!$context['id_kacab'] || !$context['id_wilbin'] || !$context['id_shelter']) {
            return response()->json([
                'success' => false,
                'message' => 'ID kacab, wilbin, dan shelter harus tersedia. Lengkapi kolom atau pastikan akun admin shelter memiliki relasi lengkap.',
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

        $analysis = $this->importService->validateFile($request->file('file'), $context);

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

        if ($analysis['summary']['invalid_rows'] > 0) {
            return response()->json([
                'success' => false,
                'dry_run' => false,
                'message' => 'Masih ada baris yang tidak valid. Perbaiki terlebih dahulu sebelum import final.',
                'summary' => $analysis['summary'],
                'errors' => $analysis['errors'],
            ], 422);
        }

        $commitResult = $this->importService->commit($analysis['rows']);

        return response()->json([
            'success' => empty($commitResult['failed_rows']),
            'dry_run' => false,
            'result' => $commitResult,
        ], empty($commitResult['failed_rows']) ? 200 : 207);
    }
}
