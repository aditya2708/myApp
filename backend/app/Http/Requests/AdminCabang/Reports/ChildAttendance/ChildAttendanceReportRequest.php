<?php

namespace App\Http\Requests\AdminCabang\Reports\ChildAttendance;

use App\Models\AdminCabang;
use App\Models\Kelompok;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class ChildAttendanceReportRequest extends FormRequest
{
    protected ?AdminCabang $adminCabang = null;

    public function authorize(): bool
    {
        $user = Auth::user();

        $this->adminCabang = $user?->adminCabang;

        return (bool) $this->adminCabang;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'shelter_id' => ['nullable', 'integer'],
            'group_id' => ['nullable', 'integer'],
            'attendance_band' => ['nullable', 'in:high,medium,low'],
            'search' => ['nullable', 'string', 'max:255'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $adminCabang = $this->getAdminCabang();

            if (!$adminCabang) {
                $validator->errors()->add('user', __('Anda tidak memiliki akses sebagai admin cabang.'));

                return;
            }

            $shelterId = $this->input('shelter_id');

            if ($shelterId && !in_array((int) $shelterId, $this->accessibleShelterIds(), true)) {
                $validator->errors()->add('shelter_id', __('Shelter tidak berada dalam cakupan cabang Anda.'));
            }

            $groupId = $this->input('group_id');

            if ($groupId && !in_array((int) $groupId, $this->accessibleGroupIds(), true)) {
                $validator->errors()->add('group_id', __('Kelompok tidak berada dalam cakupan cabang Anda.'));
            }
        });
    }

    public function filters(): array
    {
        return [
            'start_date' => $this->validated('start_date'),
            'end_date' => $this->validated('end_date'),
            'shelter_id' => $this->validated('shelter_id'),
            'group_id' => $this->validated('group_id'),
            'attendance_band' => $this->validated('attendance_band'),
            'search' => $this->validated('search'),
            'per_page' => $this->validated('per_page'),
            'page' => $this->validated('page'),
        ];
    }

    public function getAdminCabang(): ?AdminCabang
    {
        return $this->adminCabang ??= Auth::user()?->adminCabang;
    }

    protected function accessibleShelterIds(): array
    {
        $adminCabang = $this->getAdminCabang();

        return $adminCabang?->loadMissing('kacab')
            ->kacab?->shelters()
            ->pluck('shelter.id_shelter')
            ->map(fn ($value) => (int) $value)
            ->all() ?? [];
    }

    protected function accessibleGroupIds(): array
    {
        $shelterIds = $this->accessibleShelterIds();

        if (empty($shelterIds)) {
            return [];
        }

        return Kelompok::query()
            ->whereIn('id_shelter', $shelterIds)
            ->pluck('id_kelompok')
            ->map(fn ($value) => (int) $value)
            ->all();
    }
}

