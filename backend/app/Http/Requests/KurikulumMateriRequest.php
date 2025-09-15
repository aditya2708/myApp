<?php

namespace App\Http\Requests;

use App\Models\Kurikulum;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class KurikulumMateriRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $kurikulum = $this->route('kurikulum');

        if ($kurikulum instanceof Kurikulum) {
            $this->merge(['id_kurikulum' => $kurikulum->id_kurikulum]);
        } elseif (is_numeric($kurikulum) && !$this->has('id_kurikulum')) {
            $this->merge(['id_kurikulum' => (int) $kurikulum]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $kurikulumId = $this->input('id_kurikulum');

        return [
            'id_kurikulum' => ['required', 'integer', 'exists:kurikulum,id_kurikulum'],
            'id_mata_pelajaran' => ['required', 'integer', 'exists:mata_pelajaran,id_mata_pelajaran'],
            'id_materi' => [
                'required',
                'integer',
                'exists:materi,id_materi',
                Rule::unique('kurikulum_materi', 'id_materi')->where(function ($query) use ($kurikulumId) {
                    if ($kurikulumId) {
                        $query->where('id_kurikulum', $kurikulumId);
                    }

                    return $query;
                }),
            ],
            'urutan' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'id_materi.unique' => 'Materi sudah terdaftar pada kurikulum ini.'
        ];
    }
}
