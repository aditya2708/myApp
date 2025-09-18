<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NilaiSikapRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $rules = [
            'id_anak' => [
                'required',
                'exists:anak,id_anak',
                Rule::unique('nilai_sikap')->where(function ($query) {
                    return $query->where('id_semester', $this->id_semester);
                })->ignore($this->route('id'), 'id_nilai_sikap')
            ],
            'id_semester' => 'required|exists:semester,id_semester',
            'kedisiplinan' => 'required|numeric|min:0|max:100',
            'kerjasama' => 'required|numeric|min:0|max:100',
            'tanggung_jawab' => 'required|numeric|min:0|max:100',
            'sopan_santun' => 'required|numeric|min:0|max:100',
            'catatan_sikap' => 'nullable|string|max:1000'
        ];

        // Additional rules for update
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $rules = array_map(function ($rule) {
                if (is_array($rule)) {
                    array_unshift($rule, 'sometimes');
                    return $rule;
                }
                return 'sometimes|' . $rule;
            }, $rules);
        }

        return $rules;
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'id_anak.required' => 'Anak wajib dipilih',
            'id_anak.exists' => 'Anak tidak ditemukan',
            'id_anak.unique' => 'Nilai sikap untuk anak dan semester ini sudah ada',
            'id_semester.required' => 'Semester wajib dipilih',
            'id_semester.exists' => 'Semester tidak ditemukan',
            'kedisiplinan.required' => 'Nilai kedisiplinan wajib diisi',
            'kedisiplinan.numeric' => 'Nilai kedisiplinan harus berupa angka',
            'kedisiplinan.min' => 'Nilai kedisiplinan minimal 0',
            'kedisiplinan.max' => 'Nilai kedisiplinan maksimal 100',
            'kerjasama.required' => 'Nilai kerjasama wajib diisi',
            'kerjasama.numeric' => 'Nilai kerjasama harus berupa angka',
            'kerjasama.min' => 'Nilai kerjasama minimal 0',
            'kerjasama.max' => 'Nilai kerjasama maksimal 100',
            'tanggung_jawab.required' => 'Nilai tanggung jawab wajib diisi',
            'tanggung_jawab.numeric' => 'Nilai tanggung jawab harus berupa angka',
            'tanggung_jawab.min' => 'Nilai tanggung jawab minimal 0',
            'tanggung_jawab.max' => 'Nilai tanggung jawab maksimal 100',
            'sopan_santun.required' => 'Nilai sopan santun wajib diisi',
            'sopan_santun.numeric' => 'Nilai sopan santun harus berupa angka',
            'sopan_santun.min' => 'Nilai sopan santun minimal 0',
            'sopan_santun.max' => 'Nilai sopan santun maksimal 100',
            'catatan_sikap.max' => 'Catatan sikap maksimal 1000 karakter'
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array
     */
    public function attributes()
    {
        return [
            'id_anak' => 'anak',
            'id_semester' => 'semester',
            'kedisiplinan' => 'kedisiplinan',
            'kerjasama' => 'kerjasama',
            'tanggung_jawab' => 'tanggung jawab',
            'sopan_santun' => 'sopan santun',
            'catatan_sikap' => 'catatan sikap'
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        // Convert nilai to float if they're strings
        $fields = ['kedisiplinan', 'kerjasama', 'tanggung_jawab', 'sopan_santun'];
        $merge = [];

        foreach ($fields as $field) {
            if ($this->has($field) && is_string($this->$field)) {
                $merge[$field] = floatval($this->$field);
            }
        }

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }
}

