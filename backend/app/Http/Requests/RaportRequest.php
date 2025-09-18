<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RaportRequest extends FormRequest
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
                Rule::unique('raport')->where(function ($query) {
                    return $query->where('id_semester', $this->id_semester);
                })->ignore($this->route('id'), 'id_raport')
            ],
            'id_semester' => 'required|exists:semester,id_semester',
            'catatan_wali_kelas' => 'nullable|string|max:2000'
        ];

        // Additional rules for update
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            $rules = [
                'catatan_wali_kelas' => 'nullable|string|max:2000',
                'status' => 'sometimes|in:draft,published,archived'
            ];
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
            'id_anak.unique' => 'Raport untuk anak dan semester ini sudah ada',
            'id_semester.required' => 'Semester wajib dipilih',
            'id_semester.exists' => 'Semester tidak ditemukan',
            'catatan_wali_kelas.max' => 'Catatan wali kelas maksimal 2000 karakter',
            'status.in' => 'Status tidak valid'
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
            'catatan_wali_kelas' => 'catatan wali kelas',
            'status' => 'status'
        ];
    }
}

class RaportDetailRequest extends FormRequest
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
        return [
            'nilai_akhir' => 'sometimes|required|numeric|min:0|max:100',
            'nilai_huruf' => 'sometimes|required|in:A,B,C,D,E',
            'kkm' => 'sometimes|required|numeric|min:0|max:100',
            'keterangan' => 'nullable|string|max:255'
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'nilai_akhir.required' => 'Nilai akhir wajib diisi',
            'nilai_akhir.numeric' => 'Nilai akhir harus berupa angka',
            'nilai_akhir.min' => 'Nilai akhir minimal 0',
            'nilai_akhir.max' => 'Nilai akhir maksimal 100',
            'nilai_huruf.required' => 'Nilai huruf wajib diisi',
            'nilai_huruf.in' => 'Nilai huruf harus A, B, C, D, atau E',
            'kkm.required' => 'KKM wajib diisi',
            'kkm.numeric' => 'KKM harus berupa angka',
            'kkm.min' => 'KKM minimal 0',
            'kkm.max' => 'KKM maksimal 100',
            'keterangan.max' => 'Keterangan maksimal 255 karakter'
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
            'nilai_akhir' => 'nilai akhir',
            'nilai_huruf' => 'nilai huruf',
            'kkm' => 'KKM',
            'keterangan' => 'keterangan'
        ];
    }
}
