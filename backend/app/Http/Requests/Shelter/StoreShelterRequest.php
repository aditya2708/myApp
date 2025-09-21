<?php

namespace App\Http\Requests\Shelter;

use Illuminate\Foundation\Http\FormRequest;

class StoreShelterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nama_shelter' => ['required', 'string', 'max:255'],
            'id_wilbin' => ['required', 'exists:wilbin,id_wilbin'],
            'require_gps' => ['nullable', 'boolean'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'max_distance_meters' => ['nullable', 'integer', 'min:0'],
            'gps_accuracy_required' => ['nullable', 'integer', 'min:0'],
            'location_name' => ['nullable', 'string', 'max:255'],
            'gps_approval_status' => ['nullable', 'string', 'max:255'],
            'gps_approval_data' => ['nullable', 'array'],
            'gps_submitted_at' => ['nullable', 'date'],
            'gps_approved_at' => ['nullable', 'date'],
            'gps_approved_by' => ['nullable', 'exists:users,id_users'],
            'gps_rejection_reason' => ['nullable', 'string'],
            'gps_change_history' => ['nullable', 'array'],
        ];
    }
}
