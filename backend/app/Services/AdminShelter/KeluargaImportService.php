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

    /**
     * Parse spreadsheet rows and validate each line.
     *
     * @param  \Illuminate\Http\UploadedFile  $file
     * @param  array<string, mixed>           $context
     * @return array{summary: array<string, mixed>, rows: array<int, array<string, mixed>>, errors: array<int, array<string, mixed>>}
     */
    public function validateFile(UploadedFile $file, array $context): array
    {
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

            $key = Str::snake(trim((string) $header));

            if ($key === 'tanggal_lahir' && is_string($value) && Str::contains($value, ',')) {
                [$location, $datePart] = array_pad(array_map('trim', explode(',', $value, 2)), 2, null);
                if (!empty($location) && empty($normalized['tempat_lahir'])) {
                    $normalized['tempat_lahir'] = $location;
                }
                $value = $datePart ?? $value;
            }

            $normalized[$key] = $this->cleanValue($key, $value);
        }

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

        if (is_numeric($value) && in_array($key, ['no_kk', 'nik_ayah', 'nik_ibu', 'nik_wali', 'nik_anak'], true)) {
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
                $parsed = $this->parseFlexibleDateString($trimmed);
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
            'no_kk' => 'required|digits:16',
            'full_name' => 'required|string|max:255',
            'tanggal_lahir' => 'required|date_format:Y-m-d',
            'jenis_kelamin' => 'required|in:Laki-laki,Perempuan',
        ];

        $optionalRules = [
            'kepala_keluarga' => 'nullable|string|max:255',
            'status_ortu' => 'nullable|in:yatim,piatu,yatim piatu,dhuafa,non dhuafa',
            'nik_anak' => 'nullable|digits:16',
            'anak_ke' => 'nullable|integer|min:1',
            'dari_bersaudara' => 'nullable|integer|min:1',
            'nick_name' => 'nullable|string|max:255',
            'agama' => 'nullable|string|max:255',
            'tempat_lahir' => 'nullable|string|max:255',
            'tinggal_bersama' => 'nullable|string|max:255',
            'jenjang' => 'nullable|string|max:255',
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
            'kepala_keluarga.required' => 'Nama kepala keluarga wajib diisi.',
            'status_ortu.in' => 'Status orang tua tidak sesuai pilihan sistem.',
            'full_name.required' => 'Nama lengkap anak wajib diisi.',
            'nick_name.required' => 'Nama panggilan anak wajib diisi.',
            'tanggal_lahir.date_format' => 'Tanggal lahir harus berformat YYYY-MM-DD.',
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
        $baseData = [
            'id_kacab' => $payload['id_kacab'] ?? null,
            'id_wilbin' => $payload['id_wilbin'] ?? null,
            'id_shelter' => $payload['id_shelter'] ?? null,
            'no_kk' => $payload['no_kk'],
            'kepala_keluarga' => $payload['kepala_keluarga'] ?? null,
            'status_ortu' => $payload['status_ortu'] ?? null,
            'id_bank' => $payload['id_bank'] ?? null,
            'no_rek' => $payload['no_rek'] ?? null,
            'an_rek' => $payload['an_rek'] ?? null,
            'no_tlp' => $payload['no_tlp'] ?? null,
            'an_tlp' => $payload['an_tlp'] ?? null,
        ];

        $existingFamily = Keluarga::where('no_kk', $baseData['no_kk'])->first();

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
                $this->filterData([
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
                ])
            );
        }

        if (!empty($payload['nama_ibu'])) {
            Ibu::updateOrCreate(
                ['id_keluarga' => $familyId],
                $this->filterData([
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
                ])
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
                $this->filterData([
                    'id_keluarga' => $familyId,
                    'nik_wali' => $payload['nik_wali'] ?? null,
                    'nama_wali' => $payload['nama_wali'],
                    'agama' => $payload['agama_wali'] ?? null,
                    'tempat_lahir' => $payload['tempat_lahir_wali'] ?? null,
                    'tanggal_lahir' => $payload['tanggal_lahir_wali'] ?? null,
                    'alamat' => $payload['alamat_wali'] ?? null,
                    'penghasilan' => $payload['penghasilan_wali'] ?? null,
                    'hub_kerabat' => $payload['hub_kerabat_wali'] ?? null,
                ])
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
        $educationData = $this->filterData([
            'id_keluarga' => $familyId,
            'jenjang' => $payload['jenjang'] ?? null,
            'kelas' => $payload['kelas'] ?? null,
            'nama_sekolah' => $payload['nama_sekolah'] ?? null,
            'alamat_sekolah' => $payload['alamat_sekolah'] ?? null,
            'jurusan' => $payload['jurusan'] ?? null,
            'semester' => $payload['semester'] ?? null,
            'nama_pt' => $payload['nama_pt'] ?? null,
            'alamat_pt' => $payload['alamat_pt'] ?? null,
        ]);

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
            $incomingDate = $this->normalizeDateValue($payload['tanggal_lahir']);

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

        $data = $this->filterData([
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
            'tanggal_lahir' => $payload['tanggal_lahir'],
            'jenis_kelamin' => $payload['jenis_kelamin'],
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
        ]);

        if ($child) {
            $child->fill($data);
            $child->save();
            return 'updated';
        }

        Anak::create($data);
        return 'created';
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
