<?php

namespace App\Http\Requests\Shelter;

use Illuminate\Foundation\Http\FormRequest;

class UpdateShelterRequest extends FormRequest
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
            'nama_shelter' => ['sometimes', 'required', 'string', 'max:255'],
            'id_wilbin' => ['sometimes', 'required', 'exists:wilbin,id_wilbin'],
            'require_gps' => ['sometimes', 'nullable', 'boolean'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'max_distance_meters' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'gps_accuracy_required' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'location_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'gps_approval_status' => ['sometimes', 'nullable', 'string', 'max:255'],
            'gps_approval_data' => ['sometimes', 'nullable', 'array'],
            'gps_submitted_at' => ['sometimes', 'nullable', 'date'],
            'gps_approved_at' => ['sometimes', 'nullable', 'date'],
            'gps_approved_by' => ['sometimes', 'nullable', 'exists:users,id_users'],
            'gps_rejection_reason' => ['sometimes', 'nullable', 'string'],
            'gps_change_history' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
