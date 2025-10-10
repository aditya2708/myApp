<?php

namespace App\Http\Requests\AdminCabang\Reports\ChildAttendance;

use Illuminate\Foundation\Http\FormRequest;

class ChildAttendanceDetailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'jenis_kegiatan' => ['nullable', 'string', 'max:150'],
        ];
    }

    public function filters(): array
    {
        return [
            'start_date' => $this->validated('start_date'),
            'end_date' => $this->validated('end_date'),
            'jenis_kegiatan' => $this->validated('jenis_kegiatan'),
        ];
    }
}

