<?php

namespace App\Imports\AdminShelter;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;

/**
 * Import helper that keeps long numeric strings (e.g. NIK/KK) as text
 * so they are not truncated or converted to scientific notation.
 */
class KeluargaRowsImport extends DefaultValueBinder implements ToCollection, WithHeadingRow, WithCustomValueBinder
{
    /**
     * Ensure numeric IDs with >=12 digits are treated as strings.
     */
    public function bindValue(Cell $cell, $value): bool
    {
        if (is_numeric($value) && strlen((string) $value) >= 12) {
            $cell->setValueExplicit((string) $value, DataType::TYPE_STRING);
            return true;
        }

        return parent::bindValue($cell, $value);
    }

    /**
     * Required by interface; actual processing happens via Excel::toCollection.
     *
     * @param  \Illuminate\Support\Collection<int, array<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        // Intentionally left blank.
    }
}
