<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('mata_pelajaran')
            ->select('id_mata_pelajaran', 'target_jenjang', 'target_kelas')
            ->orderBy('id_mata_pelajaran')
            ->chunkById(100, function ($records) {
                foreach ($records as $record) {
                    $updates = [];

                    $normalizedJenjang = $this->normalizeTargetValue($record->target_jenjang);
                    if ($normalizedJenjang !== null) {
                        $updates['target_jenjang'] = json_encode($normalizedJenjang);
                    } elseif ($record->target_jenjang !== null) {
                        $updates['target_jenjang'] = null;
                    }

                    $normalizedKelas = $this->normalizeTargetValue($record->target_kelas);
                    if ($normalizedKelas !== null) {
                        $updates['target_kelas'] = json_encode($normalizedKelas);
                    } elseif ($record->target_kelas !== null) {
                        $updates['target_kelas'] = null;
                    }

                    if (!empty($updates)) {
                        DB::table('mata_pelajaran')
                            ->where('id_mata_pelajaran', $record->id_mata_pelajaran)
                            ->update($updates);
                    }
                }
            }, 'id_mata_pelajaran');
    }

    public function down(): void
    {
        // No rollback action required for data normalization.
    }

    private function normalizeTargetValue($value): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof Collection) {
            $value = $value->toArray();
        }

        if (is_string($value)) {
            $decoded = json_decode($value, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $value = $decoded;
            }
        }

        if ($value === null) {
            return null;
        }

        if (!is_array($value)) {
            $value = [$value];
        }

        $value = array_values(array_filter($value, function ($item) {
            return $item !== null && $item !== '';
        }));

        if (empty($value)) {
            return null;
        }

        return array_map('intval', $value);
    }
};
