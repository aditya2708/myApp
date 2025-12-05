<?php

namespace App\Services\AdminShelter;

use App\Imports\AdminShelter\KeluargaRowsImport;
use App\Models\Anak;
use App\Models\Ayah;
use App\Models\Ibu;
use App\Models\Keluarga;
use App\Models\AnakPendidikan;
use App\Models\Wali;
use Carbon\Carbon;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class KeluargaImportService
{
    private const STATUS_MAP = [
        'yatim' => 'yatim',
        'piatu' => 'piatu',
        'yatim piatu' => 'yatim piatu',
        'yatim-piatu' => 'yatim piatu',
        'yatim_piatu' => 'yatim piatu',
        'dhuafa' => 'dhuafa',
        'non dhuafa' => 'non dhuafa',
        'non-dhuafa' => 'non dhuafa',
        'non_dhuafa' => 'non dhuafa',
    ];

    private const GENDER_MAP = [
        'l' => 'Laki-laki',
        'laki-laki' => 'Laki-laki',
        'lakilaki' => 'Laki-laki',
        'male' => 'Laki-laki',
        'p' => 'Perempuan',
        'perempuan' => 'Perempuan',
        'female' => 'Perempuan',
    ];

    private const TINGGAL_MAP = [
        'ayah' => 'Ayah',
        'ibu' => 'Ibu',
        'ayah dan ibu' => 'Ayah dan Ibu',
        'ayah & ibu' => 'Ayah dan Ibu',
        'orang tua' => 'Ayah dan Ibu',
        'wali' => 'Wali',
    ];

    private const TEMPLATE_HEADERS = [
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

    /**
     * Parse spreadsheet rows and validate each line.
     *
     * @param  \Illuminate\Http\UploadedFile  $file
     * @param  array<string, mixed>           $context
     * @return array{summary: array<string, mixed>, rows: array<int, array<string, mixed>>, errors: array<int, array<string, mixed>>}
     */
    public function validateFile(UploadedFile $file, array $context): array
    {
        $this->assertValidTemplate($file);

        $rows = $this->readRows($file);

        $summary = [
            'total_rows' => 0,
            'valid_rows' => 0,
            'invalid_rows' => 0,
        ];

        $validRows = [];
        $errors = [];

        foreach ($rows as $index => $rawRow) {
            $summary['total_rows']++;
            $rowNumber = $index + 2; // heading row is 1

            $normalized = $this->normalizeRow($rawRow, $context);

            $validator = Validator::make(
                $normalized,
                $this->rules($normalized),
                $this->messages()
            );

            if ($validator->fails()) {
                $summary['invalid_rows']++;
                $errors[] = [
                    'row' => $rowNumber,
                    'messages' => $validator->errors()->all(),
                ];
                continue;
            }

            $summary['valid_rows']++;
            $validatedData = $validator->validated();
            $validRows[] = [
                'row' => $rowNumber,
                'data' => $this->prepareForPersistence($normalized, $validatedData, $context),
            ];
        }

        return [
            'summary' => $summary,
            'rows' => $validRows,
            'errors' => $errors,
        ];
    }

    /**
     * Persist validated rows into database.
     *
     * @param  array<int, array{row:int, data:array<string, mixed>}>  $validatedRows
     * @return array<string, mixed>
     */
    public function commit(array $validatedRows): array
    {
        $result = [
            'processed_rows' => count($validatedRows),
            'created_families' => 0,
            'updated_families' => 0,
            'created_children' => 0,
            'updated_children' => 0,
            'failed_rows' => [],
        ];

        $createdFamilyIds = [];
        $updatedFamilyIds = [];

        foreach ($validatedRows as $item) {
            $rowNumber = $item['row'];
            $payload = $item['data'];

            try {
                DB::transaction(function () use (&$result, &$createdFamilyIds, &$updatedFamilyIds, $payload) {
                    $family = $this->upsertFamily($payload);
                    $familyWasCreated = $family->wasRecentlyCreated;
                    $family->refresh();

                    $this->upsertParents($family->id_keluarga, $payload);
                    $this->upsertGuardian($family->id_keluarga, $payload);

                    $education = $this->upsertEducation($family->id_keluarga, $payload);

                    $childChange = $this->upsertChild(
                        $family->id_keluarga,
                        $payload,
                        $education?->id_anak_pend
                    );

                    if ($familyWasCreated) {
                        if (!in_array($family->id_keluarga, $createdFamilyIds, true)) {
                            $createdFamilyIds[] = $family->id_keluarga;
                            $result['created_families']++;
                        }
                    } else {
                        if (!in_array($family->id_keluarga, $createdFamilyIds, true)
                            && !in_array($family->id_keluarga, $updatedFamilyIds, true)
                        ) {
                            $updatedFamilyIds[] = $family->id_keluarga;
                            $result['updated_families']++;
                        }
                    }

                    if ($childChange === 'created') {
                        $result['created_children']++;
                    } elseif ($childChange === 'updated') {
                        $result['updated_children']++;
                    }
                });
            } catch (\Throwable $e) {
                $result['failed_rows'][] = [
                    'row' => $rowNumber,
                    'message' => $e->getMessage(),
                ];
            }
        }

        return $result;
    }

    private function assertValidTemplate(UploadedFile $file): void
    {
        $header = $this->readCsvHeaderRow($file);

        if (empty($header)) {
            throw new \InvalidArgumentException('File import tidak memiliki header atau tidak dapat dibaca.');
        }

        if (!$this->isTemplateHeaderMatch($header)) {
            throw new \InvalidArgumentException('Header file tidak sesuai template terbaru. Unduh ulang template dan pastikan kolom-kolomnya persis.');
        }
    }

    /**
     * @return array<int, string>
     */
    private function readCsvHeaderRow(UploadedFile $file): array
    {
        $path = $file->getRealPath();

        if ($path === false || !is_readable($path)) {
            return [];
        }

        $handle = fopen($path, 'rb');

        if ($handle === false) {
            return [];
        }

        $row = fgetcsv($handle);
        fclose($handle);

        if ($row === false) {
            return [];
        }

        return array_map([$this, 'cleanHeaderValue'], $row);
    }

    private function cleanHeaderValue(?string $header): string
    {
        if ($header === null) {
            return '';
        }

        $header = preg_replace('/^\xEF\xBB\xBF/', '', $header) ?? $header;

        return trim($header);
    }

    private function isTemplateHeaderMatch(array $header): bool
    {
        if (count($header) !== count(self::TEMPLATE_HEADERS)) {
            return false;
        }

        foreach ($header as $index => $value) {
            if ($this->normalizeHeaderForComparison($value) !== $this->normalizeHeaderForComparison(self::TEMPLATE_HEADERS[$index])) {
                return false;
            }
        }

        return true;
    }

    private function normalizeHeaderForComparison(string $header): string
    {
        $normalized = strtoupper($header);
        $normalized = str_replace(' / ', '/', $normalized);
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?? $normalized;

        return trim($normalized);
    }

    /**
     * Read rows from spreadsheet with heading row.
     *
     * @param  \Illuminate\Http\UploadedFile  $file
     * @return \Illuminate\Support\Collection<int, array<string, mixed>>
     */
    private function readRows(UploadedFile $file): Collection
    {
        $sheets = Excel::toCollection(new KeluargaRowsImport(), $file);
        $rows = $sheets->first() ?? collect();

        return $rows
            ->map(function ($row) {
                if ($row instanceof Collection) {
                    return $row->toArray();
                }

                if ($row instanceof Arrayable) {
                    return $row->toArray();
                }

                if ($row instanceof \Traversable) {
                    return iterator_to_array($row);
                }

                return $row;
            })
            ->filter(function ($row) {
                if (!is_array($row)) {
                    return false;
                }

                return collect($row)->filter(function ($value) {
                    if (is_null($value)) {
                        return false;
                    }

                    if (is_string($value) && trim($value) === '') {
                        return false;
                    }

                    return true;
                })->isNotEmpty();
            })
            ->values();
    }

    /**
     * Normalise header keys and clean raw values.
     *
     * @param  array<string, mixed>  $row
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function normalizeRow(array $row, array $context): array
    {
        $normalized = [];

        foreach ($row as $header => $value) {
            if ($header === null || $header === '') {
                continue;
            }

            $key = $this->normalizeHeaderKey((string) $header);

            // Skip ignored columns
            if (in_array($key, ['no', 'shelter'])) {
                continue;
            }

            if ($key === 'ttl') {
                $this->applyTtlValue($normalized, $value);
                continue;
            }

            if ($key === 'tanggal_lahir' && is_string($value) && Str::contains($value, ',')) {
                [$location, $datePart] = array_pad(array_map('trim', explode(',', $value, 2)), 2, null);
                if (!empty($location) && empty($normalized['tempat_lahir'])) {
                    $normalized['tempat_lahir'] = $location;
                }
                $value = $datePart ?? $value;
            }

            $normalized[$key] = $this->cleanValue($key, $value);
        }

        $normalized = $this->applyTemplateAliases($normalized);
        // Merge contextual defaults (shelter assignment etc.)
        $normalized['id_kacab'] = $context['id_kacab'] ?? null;
        $normalized['id_wilbin'] = $context['id_wilbin'] ?? null;
        $normalized['id_shelter'] = $context['id_shelter'] ?? null;

        if (!isset($normalized['status_validasi']) || $normalized['status_validasi'] === null) {
            $normalized['status_validasi'] = 'aktif';
        }

        if (!isset($normalized['status_cpb']) || $normalized['status_cpb'] === null) {
            $normalized['status_cpb'] = Anak::STATUS_CPB_BCPB;
        }

        if (!isset($normalized['status'])) {
            $normalized['status'] = null;
        }

        if (!isset($normalized['status_keluarga']) || $normalized['status_keluarga'] === null) {
            $normalized['status_keluarga'] = Anak::STATUS_KELUARGA_DENGAN;
        }

        // Support simplified Totoran template columns.
        if (!isset($normalized['full_name']) && isset($normalized['nama'])) {
            $normalized['full_name'] = $normalized['nama'];
        }

        if (!isset($normalized['nick_name']) && isset($normalized['nama'])) {
            $normalized['nick_name'] = $normalized['nama'];
        }

        if (!isset($normalized['anak_ke']) && isset($normalized['no']) && is_numeric($normalized['no'])) {
            $normalized['anak_ke'] = (int) $normalized['no'];
        }

        if (!isset($normalized['dari_bersaudara']) && isset($normalized['anak_ke'])) {
            $normalized['dari_bersaudara'] = $normalized['anak_ke'];
        }

        if (!isset($normalized['status_ortu']) && isset($normalized['status'])) {
            $statusValue = $this->cleanValue('status_ortu', $normalized['status']);
            if (in_array($statusValue, array_values(self::STATUS_MAP), true)) {
                $normalized['status_ortu'] = $statusValue;
            }
        }

        $normalized = $this->applyDefaultValues($normalized);

        return $normalized;
    }

    private function normalizeHeaderKey(string $header): string
    {
        $header = preg_replace('/^\xEF\xBB\xBF/', '', $header) ?? $header;
        $header = strtolower($header);
        $header = str_replace(['/', '\\'], ' ', $header);
        $header = preg_replace('/[^a-z0-9]+/', '_', $header) ?? $header;

        return trim($header, '_');
    }

    private function applyTtlValue(array &$row, $value): void
    {
        if ($value === null) {
            return;
        }

        if ($value instanceof \DateTimeInterface) {
            $row['tanggal_lahir'] = Carbon::instance($value)->format('Y-m-d');
            return;
        }

        $raw = is_string($value) ? trim($value) : trim((string) $value);

        if ($raw === '') {
            return;
        }

        $raw = preg_replace('/\s+/', ' ', $raw) ?? $raw;

        $location = null;
        $datePart = $raw;

        if (Str::contains($raw, ',')) {
            [$location, $datePart] = array_pad(explode(',', $raw, 2), 2, null);
        }

        $location = $location !== null ? trim($location) : null;
        $datePart = $datePart !== null ? trim($datePart) : null;

        if (!empty($location) && (empty($row['tempat_lahir']) || $row['tempat_lahir'] === '-')) {
            $row['tempat_lahir'] = $this->cleanValue('tempat_lahir', $location);
        }

        if ($datePart === null || $datePart === '') {
            return;
        }

        $cleanDate = $this->sanitizeDateComponent($datePart);
        $normalizedDate = $this->normalizeDateValue($cleanDate);

        if ($normalizedDate !== null) {
            $row['tanggal_lahir'] = $normalizedDate;
            return;
        }

        if (!isset($row['tanggal_lahir'])) {
            $row['tanggal_lahir'] = $cleanDate;
        }
    }

    private function sanitizeDateComponent(string $value): string
    {
        $value = trim($value);
        $value = preg_replace('/\s*([\\/\\-.])\s*/', '$1', $value) ?? $value;
        $value = preg_replace('/\s+/', ' ', $value) ?? $value;

        return $value;
    }

    private function applyTemplateAliases(array $row): array
    {
        // New template mappings
        if (isset($row['nomor_kk']) && $row['nomor_kk'] !== null && $row['nomor_kk'] !== '') {
            $row['no_kk'] = $row['nomor_kk'];
        }

        if (isset($row['nama_ayah']) && $row['nama_ayah'] !== null && $row['nama_ayah'] !== '') {
            if (!isset($row['kepala_keluarga']) || $row['kepala_keluarga'] === null || $row['kepala_keluarga'] === '') {
                $row['kepala_keluarga'] = $row['nama_ayah'];
            }
        }

        if (isset($row['nik_ayah']) && $row['nik_ayah'] !== null && $row['nik_ayah'] !== '') {
            // Keep as is, already mapped correctly
        }

        if (isset($row['nik_ibu']) && $row['nik_ibu'] !== null && $row['nik_ibu'] !== '') {
            // Keep as is, already mapped correctly
        }

        if (isset($row['status_anak']) && $row['status_anak'] !== null && $row['status_anak'] !== '') {
            $row['status_ortu'] = $this->cleanValue('status_ortu', $row['status_anak']);
        }

        if (isset($row['nama_lengkap_anak']) && $row['nama_lengkap_anak'] !== null && $row['nama_lengkap_anak'] !== '') {
            $row['full_name'] = $row['nama_lengkap_anak'];
            $row['nick_name'] = $row['nama_lengkap_anak'];
        }

        if (isset($row['nik_anak']) && $row['nik_anak'] !== null && $row['nik_anak'] !== '') {
            // Keep as is, already mapped correctly
        }

        if (isset($row['jenis_kelamin']) && $row['jenis_kelamin'] !== null && $row['jenis_kelamin'] !== '') {
            // Keep as is, already mapped correctly
        }

        if (isset($row['tanggal_lahir']) && $row['tanggal_lahir'] !== null && $row['tanggal_lahir'] !== '') {
            // Keep as is, already mapped correctly
        }

        if (isset($row['kelas']) && $row['kelas'] !== null && $row['kelas'] !== '') {
            // Keep as is, already mapped correctly
        }

        if (isset($row['jenjang']) && $row['jenjang'] !== null && $row['jenjang'] !== '') {
            // Keep as is, already mapped correctly
        }

        if (isset($row['alamat']) && $row['alamat'] !== null && $row['alamat'] !== '') {
            // Keep as is, already mapped correctly
        }

        // Legacy template mappings (keep for backward compatibility)
        if (isset($row['nama_anak']) && $row['nama_anak'] !== null && $row['nama_anak'] !== '') {
            if (!isset($row['full_name']) || $row['full_name'] === null || $row['full_name'] === '') {
                $row['full_name'] = $row['nama_anak'];
            }

            if (!isset($row['nick_name']) || $row['nick_name'] === null || $row['nick_name'] === '') {
                $row['nick_name'] = $row['nama_anak'];
            }
        }

        if (isset($row['nik']) && $row['nik'] !== null && $row['nik'] !== '') {
            if (!isset($row['nik_anak']) || $row['nik_anak'] === null || $row['nik_anak'] === '') {
                $row['nik_anak'] = $row['nik'];
            }
        }

        if (isset($row['jenjang_sekolah']) && $row['jenjang_sekolah'] !== null && $row['jenjang_sekolah'] !== '') {
            if (!isset($row['jenjang']) || $row['jenjang'] === null || $row['jenjang'] === '') {
                $row['jenjang'] = $row['jenjang_sekolah'];
            }
        }

        if (isset($row['dhuafa_non_dhuafa']) && $row['dhuafa_non_dhuafa'] !== null && $row['dhuafa_non_dhuafa'] !== '') {
            if (!isset($row['status_ortu']) || $row['status_ortu'] === null || $row['status_ortu'] === '') {
                $row['status_ortu'] = $this->cleanValue('status_ortu', $row['dhuafa_non_dhuafa']);
            }
        }

        return $row;
    }

    /**
     * Clean individual cell value.
     *
     * @param  string                $key
     * @param  mixed                 $value
     * @return mixed
     */
    private function cleanValue(string $key, $value)
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        if (is_numeric($value) && in_array($key, ['no_kk', 'nomor_kk', 'nik_ayah', 'nik_ibu', 'nik_wali', 'nik_anak'], true)) {
            return preg_replace('/[^0-9]/', '', (string) $value);
        }

        if (is_numeric($value) && Str::startsWith($key, 'anak_')) {
            return (int) $value;
        }

        if (is_numeric($value) && in_array($key, ['anak_ke', 'dari_bersaudara'], true)) {
            return (int) $value;
        }

        if (is_numeric($value) && $key === 'semester') {
            return (int) $value;
        }

        if (is_numeric($value)) {
            if ($this->isExcelSerialDateKey($key)) {
                return $this->excelSerialToDateString((float) $value);
            }

            if ($this->shouldCastNumericToString($key)) {
                return (string) $value;
            }

            return $value;
        }

        if (is_string($value)) {
            $trimmed = trim($value);

            if ($trimmed === '') {
                return null;
            }

            if ($key === 'status_ortu') {
                $lower = strtolower($trimmed);
                return self::STATUS_MAP[$lower] ?? $trimmed;
            }

            if ($key === 'jenis_kelamin') {
                $lower = strtolower($trimmed);
                return self::GENDER_MAP[$lower] ?? $trimmed;
            }

            if ($key === 'tinggal_bersama') {
                $lower = strtolower($trimmed);
                return self::TINGGAL_MAP[$lower] ?? Str::title($trimmed);
            }

            if ($this->looksLikePrefixedDate($key, $trimmed)) {
                return $this->parsePrefixedDate($trimmed);
            }

            if ($this->isExcelSerialDateString($trimmed)) {
                return $this->excelSerialToDateString((float) $trimmed);
            }

            if ($this->isExcelSerialDateKey($key)) {
                $parsed = $this->parseDDMMYYYYDateString($trimmed);
                if ($parsed !== null) {
                    return $parsed;
                }
            }

            if ($this->shouldCastNumericToString($key) && is_numeric($trimmed)) {
                return (string) $trimmed;
            }

            return $trimmed;
        }

        return $value;
    }

    private function isExcelSerialDateKey(string $key): bool
    {
        return Str::contains($key, 'tanggal');
    }

    private function isExcelSerialDateString(string $value): bool
    {
        return is_numeric($value) && (float) $value > 0 && (float) $value < 2958465;
    }

    private function shouldCastNumericToString(string $key): bool
    {
        $stringyKeys = [
            'kelas',
            'alamat',
            'status',
            'kepala_keluarga',
            'nama',
            'nama_ayah',
            'nama_ibu',
            'nama_wali',
            'nick_name',
            'full_name',
            'agama',
            'tempat_lahir',
            'tinggal_bersama',
            'status_validasi',
            'status_cpb',
            'status_keluarga',
            'nama_sekolah',
            'alamat_sekolah',
            'jurusan',
            'nama_pt',
            'alamat_pt',
            'an_rek',
            'an_tlp',
        ];

        return in_array($key, $stringyKeys, true);
    }

    private function applyDefaultValues(array $row): array
    {
        $defaults = [
            'agama' => 'Tidak diketahui',
            'tempat_lahir' => '-',
            'tinggal_bersama' => 'Ibu',
            'anak_ke' => $row['anak_ke'] ?? 1,
            'dari_bersaudara' => $row['dari_bersaudara'] ?? ($row['anak_ke'] ?? 1),
            'nick_name' => $row['full_name'] ?? null,
            'kelas' => isset($row['kelas']) ? (string) $row['kelas'] : null,
            'status_validasi' => $row['status_validasi'] ?? 'aktif',
            'status_cpb' => $row['status_cpb'] ?? Anak::STATUS_CPB_BCPB,
            'status_keluarga' => $row['status_keluarga'] ?? Anak::STATUS_KELUARGA_DENGAN,
        ];

        foreach ($defaults as $key => $value) {
            if (!isset($row[$key]) || $row[$key] === null || $row[$key] === '') {
                $row[$key] = $value;
            }
        }

        return $row;
    }

    private function excelSerialToDateString(float $serial): ?string
    {
        try {
            $date = ExcelDate::excelToDateTimeObject($serial);
            return Carbon::instance($date)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function looksLikePrefixedDate(string $key, string $value): bool
    {
        if (!$this->isExcelSerialDateKey($key)) {
            return false;
        }

        return Str::contains($value, ',');
    }

    private function parsePrefixedDate(string $value): ?string
    {
        $parts = explode(',', $value, 2);
        $datePart = count($parts) === 2 ? trim($parts[1]) : trim($value);

        $formats = ['Y-m-d', 'd-m-Y', 'd/m/Y', 'd.m.Y', 'd m Y'];

        foreach ($formats as $format) {
            try {
                $parsed = Carbon::createFromFormat($format, $datePart);
                if ($parsed !== false) {
                    return $parsed->format('Y-m-d');
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        return null;
    }

    private function parseDDMMYYYYDateString(string $value): ?string
    {
        // Try DD-MM-YYYY format first (new requirement)
        $formats = ['d-m-Y', 'd/m/Y', 'd.m.Y', 'd m Y', 'Y-m-d'];

        foreach ($formats as $format) {
            try {
                $parsed = Carbon::createFromFormat($format, $value);
                if ($parsed !== false) {
                    return $parsed->format('Y-m-d');
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        try {
            $parsed = Carbon::parse($value);
            return $parsed->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function parseFlexibleDateString(string $value): ?string
    {
        $formats = ['Y-m-d', 'd-m-Y', 'd/m/Y', 'd.m.Y', 'd m Y'];

        foreach ($formats as $format) {
            try {
                $parsed = Carbon::createFromFormat($format, $value);
                if ($parsed !== false) {
                    return $parsed->format('Y-m-d');
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        try {
            $parsed = Carbon::parse($value);
            return $parsed->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function normalizeDateValue($value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->format('Y-m-d');
        }

        if (is_numeric($value) && $this->isExcelSerialDateString((string) $value)) {
            return $this->excelSerialToDateString((float) $value);
        }

        $stringValue = trim((string) $value);
        if ($stringValue === '') {
            return null;
        }

        $normalized = $this->parseFlexibleDateString($stringValue);
        if ($normalized !== null) {
            return $normalized;
        }

        return null;
    }

    /**
     * Build validation rules for a given row.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function rules(array $data): array
    {
        $rules = [
            'id_kacab' => 'required|integer|exists:kacab,id_kacab',
            'id_wilbin' => 'required|integer|exists:wilbin,id_wilbin',
            'id_shelter' => 'required|integer|exists:shelter,id_shelter',
            'no_kk' => 'required|digits:16', // WAJIB 16 digit
            'full_name' => 'required|string|max:255', // WAJIB
            'jenjang' => 'required|string|max:255', // WAJIB
            'tanggal_lahir' => 'nullable|date_format:Y-m-d',
            'jenis_kelamin' => 'nullable|in:Laki-laki,Perempuan',
        ];

        $optionalRules = [
            'kepala_keluarga' => 'nullable|string|max:255',
            'status_ortu' => 'nullable|in:yatim,piatu,yatim piatu,dhuafa,non dhuafa',
            'nik_anak' => 'nullable|digits:16', // Optional tapi jika ada harus 16 digit
            'nik_ayah' => 'nullable|digits:16', // Optional tapi jika ada harus 16 digit
            'nik_ibu' => 'nullable|digits:16', // Optional tapi jika ada harus 16 digit
            'anak_ke' => 'nullable|integer|min:1',
            'dari_bersaudara' => 'nullable|integer|min:1',
            'nick_name' => 'nullable|string|max:255',
            'agama' => 'nullable|string|max:255',
            'tempat_lahir' => 'nullable|string|max:255',
            'tinggal_bersama' => 'nullable|string|max:255',
            'kelas' => 'nullable|string|max:255',
            'nama_sekolah' => 'nullable|string|max:255',
            'alamat_sekolah' => 'nullable|string|max:255',
            'jurusan' => 'nullable|string|max:255',
            'semester' => 'nullable|integer|min:0',
            'nama_pt' => 'nullable|string|max:255',
            'alamat_pt' => 'nullable|string|max:255',
            'nama_ayah' => 'nullable|string|max:255',
            'nama_ibu' => 'nullable|string|max:255',
            'alamat' => 'nullable|string|max:255',
            'status' => 'nullable|string|max:255',
            'nama_wali' => 'nullable|string|max:255',
            'hub_kerabat_wali' => 'nullable|string|max:255',
        ];

        $rules = array_merge($rules, $optionalRules);

        if (isset($data['status_ortu']) && $data['status_ortu'] === 'yatim piatu') {
            $rules = array_merge($rules, [
                'nama_wali' => 'nullable|string|max:255',
                'hub_kerabat_wali' => 'nullable|string|max:255',
            ]);
        }

        return $rules;
    }

    /**
     * Validation messages (minimal subset for clarity).
     *
     * @return array<string, string>
     */
    private function messages(): array
    {
        return [
            'id_kacab.required' => 'ID Kacab tidak boleh kosong (gunakan konteks admin atau isi kolom).',
            'id_wilbin.required' => 'ID Wilbin tidak boleh kosong.',
            'id_shelter.required' => 'ID Shelter tidak boleh kosong.',
            'no_kk.required' => 'Nomor KK wajib diisi.',
            'no_kk.digits' => 'Nomor KK harus 16 digit.',
            'nik_ayah.digits' => 'NIK Ayah harus 16 digit.',
            'nik_ibu.digits' => 'NIK Ibu harus 16 digit.',
            'nik_anak.digits' => 'NIK Anak harus 16 digit.',
            'full_name.required' => 'Nama lengkap anak wajib diisi.',
            'jenjang.required' => 'Jenjang wajib diisi.',
            'kepala_keluarga.required' => 'Nama kepala keluarga wajib diisi.',
            'status_ortu.in' => 'Status orang tua tidak sesuai pilihan sistem.',
            'nick_name.required' => 'Nama panggilan anak wajib diisi.',
            'tanggal_lahir.date_format' => 'Tanggal lahir harus berformat DD-MM-YYYY.',
            'jenis_kelamin.in' => 'Jenis kelamin hanya boleh Laki-laki atau Perempuan.',
            'nama_ayah.required' => 'Nama ayah wajib diisi.',
            'nama_ibu.required' => 'Nama ibu wajib diisi.',
            'nama_wali.required' => 'Nama wali wajib diisi untuk status yatim piatu.',
        ];
    }

    /**
     * Prepare validated payload for database write.
     *
     * @param  array<string, mixed>  $validated
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function prepareForPersistence(array $normalized, array $validated, array $context): array
    {
        $payload = $validated;
        $payload['no_kk'] = $normalized['no_kk'] ?? null;
        $payload['company_id'] = $context['company_id'] ?? null;

        // Keep additional optional columns
        $optionalKeys = [
            'nik_ayah', 'agama_ayah', 'tempat_lahir_ayah', 'tanggal_lahir_ayah', 'alamat_ayah', 'penghasilan_ayah',
            'tanggal_kematian_ayah', 'penyebab_kematian_ayah',
            'nik_ibu', 'agama_ibu', 'tempat_lahir_ibu', 'tanggal_lahir_ibu', 'alamat_ibu', 'penghasilan_ibu',
            'tanggal_kematian_ibu', 'penyebab_kematian_ibu',
            'nik_wali', 'agama_wali', 'tempat_lahir_wali', 'tanggal_lahir_wali', 'alamat_wali', 'penghasilan_wali',
            'hub_kerabat_wali',
            'hafalan', 'pelajaran_favorit', 'hobi', 'prestasi',
            'jarak_rumah', 'transportasi', 'alamat', 'status', 'status_validasi', 'status_cpb', 'status_keluarga',
            'jenjang', 'kelas', 'nama_sekolah', 'alamat_sekolah', 'jurusan', 'semester', 'nama_pt', 'alamat_pt',
            'id_bank', 'no_rek', 'an_rek', 'no_tlp', 'an_tlp',
        ];

        foreach ($optionalKeys as $key) {
            if (array_key_exists($key, $normalized)) {
                $payload[$key] = $normalized[$key];
                continue;
            }

            if (array_key_exists($key, $context) && !array_key_exists($key, $payload)) {
                $payload[$key] = $context[$key];
            }
        }

        return $payload;
    }

    /**
     * Create or update family record.
     *
     * @param  array<string, mixed>  $payload
     * @return \App\Models\Keluarga
     */
    private function upsertFamily(array $payload): Keluarga
    {
        $baseData = array_merge($this->companyIdPayload($payload, 'keluarga'), [
            'id_kacab' => $payload['id_kacab'] ?? null,
            'id_wilbin' => $payload['id_wilbin'] ?? null,
            'id_shelter' => $payload['id_shelter'] ?? null,
            'no_kk' => $payload['no_kk'] ?? null,
            'kepala_keluarga' => $payload['kepala_keluarga'] ?? null,
            'status_ortu' => $payload['status_ortu'] ?? null,
            'id_bank' => $payload['id_bank'] ?? null,
            'no_rek' => $payload['no_rek'] ?? null,
            'an_rek' => $payload['an_rek'] ?? null,
            'no_tlp' => $payload['no_tlp'] ?? null,
            'an_tlp' => $payload['an_tlp'] ?? null,
        ]);

        $existingFamily = null;

        if (!empty($baseData['no_kk'])) {
            $existingFamily = Keluarga::where('no_kk', $baseData['no_kk'])->first();
        }

        if ($existingFamily) {
            $updateData = $this->filterData($baseData);

            if (!array_key_exists('kepala_keluarga', $payload) || $payload['kepala_keluarga'] === null || $payload['kepala_keluarga'] === 'Tidak diketahui') {
                unset($updateData['kepala_keluarga']);
            }

            if (!array_key_exists('status_ortu', $payload) || $payload['status_ortu'] === null) {
                unset($updateData['status_ortu']);
            }

            unset($updateData['no_kk']);

            if (!empty($updateData)) {
                $existingFamily->fill($updateData);
                $existingFamily->save();
            }

            return $existingFamily;
        }

        if (empty($baseData['kepala_keluarga'])) {
            $baseData['kepala_keluarga'] = 'Tidak diketahui';
        }

        if (empty($baseData['status_ortu'])) {
            $baseData['status_ortu'] = 'dhuafa';
        }

        $createData = $this->filterData($baseData);

        return Keluarga::create($createData);
    }

    /**
     * Create or update parent records.
     *
     * @param  int                   $familyId
     * @param  array<string, mixed>  $payload
     */
    private function upsertParents(int $familyId, array $payload): void
    {
        if (!empty($payload['nama_ayah'])) {
            Ayah::updateOrCreate(
                ['id_keluarga' => $familyId],
                $this->filterData(array_merge($this->companyIdPayload($payload, 'ayah'), [
                    'id_keluarga' => $familyId,
                    'nik_ayah' => $payload['nik_ayah'] ?? null,
                    'nama_ayah' => $payload['nama_ayah'],
                    'agama' => $payload['agama_ayah'] ?? null,
                    'tempat_lahir' => $payload['tempat_lahir_ayah'] ?? null,
                    'tanggal_lahir' => $payload['tanggal_lahir_ayah'] ?? null,
                    'alamat' => $payload['alamat_ayah'] ?? null,
                    'penghasilan' => $payload['penghasilan_ayah'] ?? null,
                    'tanggal_kematian' => $payload['tanggal_kematian_ayah'] ?? null,
                    'penyebab_kematian' => $payload['penyebab_kematian_ayah'] ?? null,
                ]))
            );
        }

        if (!empty($payload['nama_ibu'])) {
            Ibu::updateOrCreate(
                ['id_keluarga' => $familyId],
                $this->filterData(array_merge($this->companyIdPayload($payload, 'ibu'), [
                    'id_keluarga' => $familyId,
                    'nik_ibu' => $payload['nik_ibu'] ?? null,
                    'nama_ibu' => $payload['nama_ibu'],
                    'agama' => $payload['agama_ibu'] ?? null,
                    'tempat_lahir' => $payload['tempat_lahir_ibu'] ?? null,
                    'tanggal_lahir' => $payload['tanggal_lahir_ibu'] ?? null,
                    'alamat' => $payload['alamat_ibu'] ?? null,
                    'penghasilan' => $payload['penghasilan_ibu'] ?? null,
                    'tanggal_kematian' => $payload['tanggal_kematian_ibu'] ?? null,
                    'penyebab_kematian' => $payload['penyebab_kematian_ibu'] ?? null,
                ]))
            );
        }
    }

    /**
     * Create or update guardian record for yatim piatu families.
     *
     * @param  int                   $familyId
     * @param  array<string, mixed>  $payload
     */
    private function upsertGuardian(int $familyId, array $payload): void
    {
        if (($payload['status_ortu'] ?? null) === 'yatim piatu' && !empty($payload['nama_wali'])) {
            Wali::updateOrCreate(
                ['id_keluarga' => $familyId],
                $this->filterData(array_merge($this->companyIdPayload($payload, 'wali'), [
                    'id_keluarga' => $familyId,
                    'nik_wali' => $payload['nik_wali'] ?? null,
                    'nama_wali' => $payload['nama_wali'],
                    'agama' => $payload['agama_wali'] ?? null,
                    'tempat_lahir' => $payload['tempat_lahir_wali'] ?? null,
                    'tanggal_lahir' => $payload['tanggal_lahir_wali'] ?? null,
                    'alamat' => $payload['alamat_wali'] ?? null,
                    'penghasilan' => $payload['penghasilan_wali'] ?? null,
                    'hub_kerabat' => $payload['hub_kerabat_wali'] ?? null,
                ]))
            );
        } else {
            Wali::where('id_keluarga', $familyId)->delete();
        }
    }

    /**
     * Create or update education data (anak_pend).
     *
     * @param  int                   $familyId
     * @param  array<string, mixed>  $payload
     * @return \App\Models\AnakPendidikan|null
     */
    private function upsertEducation(int $familyId, array $payload): ?AnakPendidikan
    {
        $educationData = $this->filterData(array_merge($this->companyIdPayload($payload, 'anak_pend'), [
            'id_keluarga' => $familyId,
            'jenjang' => $payload['jenjang'] ?? null,
            'kelas' => $payload['kelas'] ?? null,
            'nama_sekolah' => $payload['nama_sekolah'] ?? null,
            'alamat_sekolah' => $payload['alamat_sekolah'] ?? null,
            'jurusan' => $payload['jurusan'] ?? null,
            'semester' => $payload['semester'] ?? null,
            'nama_pt' => $payload['nama_pt'] ?? null,
            'alamat_pt' => $payload['alamat_pt'] ?? null,
        ]));

        // If only id_keluarga is present, skip creation/update.
        if (count($educationData) === 1 && array_key_exists('id_keluarga', $educationData)) {
            return AnakPendidikan::where('id_keluarga', $familyId)->first();
        }

        if (empty($educationData)) {
            return AnakPendidikan::where('id_keluarga', $familyId)->first();
        }

        return AnakPendidikan::updateOrCreate(
            ['id_keluarga' => $familyId],
            $educationData
        );
    }

    /**
     * Upsert child data.
     *
     * @param  int                   $familyId
     * @param  array<string, mixed>  $payload
     * @return string|null  created|updated|null
     */
    private function upsertChild(int $familyId, array $payload, ?int $educationId = null): ?string
    {
        $childQuery = Anak::where('id_keluarga', $familyId);

        $child = null;

        if (!empty($payload['nik_anak'])) {
            $child = $childQuery->where('nik_anak', $payload['nik_anak'])->first();
        } else {
            $normalizedName = Str::lower($payload['full_name']);
            $incomingDate = $this->normalizeDateValue($payload['tanggal_lahir'] ?? null);

            $candidates = $childQuery
                ->where(function ($query) {
                    $query
                        ->whereNull('nik_anak')
                        ->orWhere('nik_anak', '')
                        ->orWhere('nik_anak', '0');
                })
                ->whereRaw('LOWER(full_name) = ?', [$normalizedName])
                ->get();

            $child = $candidates->first(function ($candidate) use ($incomingDate) {
                $candidateDate = $this->normalizeDateValue($candidate->tanggal_lahir);
                return $candidateDate !== null && $incomingDate !== null && $candidateDate === $incomingDate;
            });

            if (!$child && $candidates->isNotEmpty()) {
                $child = $candidates->first();
            }
        }

        $data = $this->filterData(array_merge($this->companyIdPayload($payload, 'anak'), [
            'id_keluarga' => $familyId,
            'id_shelter' => $payload['id_shelter'],
            'id_anak_pend' => $educationId,
            'nik_anak' => $payload['nik_anak'] ?? null,
            'anak_ke' => $payload['anak_ke'] ?? null,
            'dari_bersaudara' => $payload['dari_bersaudara'] ?? null,
            'nick_name' => $payload['nick_name'] ?? null,
            'full_name' => $payload['full_name'],
            'agama' => $payload['agama'] ?? null,
            'tempat_lahir' => $payload['tempat_lahir'] ?? null,
            'tanggal_lahir' => $payload['tanggal_lahir'] ?? null,
            'jenis_kelamin' => $payload['jenis_kelamin'] ?? null,
            'tinggal_bersama' => $payload['tinggal_bersama'] ?? null,
            'hafalan' => $payload['hafalan'] ?? null,
            'pelajaran_favorit' => $payload['pelajaran_favorit'] ?? null,
            'hobi' => $payload['hobi'] ?? null,
            'prestasi' => $payload['prestasi'] ?? null,
            'jarak_rumah' => $payload['jarak_rumah'] ?? null,
            'transportasi' => $payload['transportasi'] ?? null,
            'alamat' => $payload['alamat'] ?? null,
            'status_validasi' => $payload['status_validasi'] ?? 'aktif',
            'status_cpb' => $payload['status_cpb'] ?? Anak::STATUS_CPB_BCPB,
            'status_keluarga' => $payload['status_keluarga'] ?? Anak::STATUS_KELUARGA_DENGAN,
            'status' => $payload['status'] ?? null,
        ]));

        if ($child) {
            $child->fill($data);
            $child->save();
            return 'updated';
        }

        Anak::create($data);
        return 'created';
    }

    private function companyIdPayload(array $payload, string $table): array
    {
        $companyId = $payload['company_id'] ?? null;

        if ($companyId && Schema::hasColumn($table, 'company_id')) {
            return ['company_id' => $companyId];
        }

        return [];
    }

    /**
     * Filter out null/empty values but keep zero-like strings.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function filterData(array $data): array
    {
        return array_filter($data, static function ($value) {
            if (is_string($value)) {
                $value = trim($value);
            }

            return $value !== null && $value !== '';
        });
    }
}
