<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class KacabRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'nama_kacab' => ['required', 'string', 'max:255'],
            'alamat' => ['nullable', 'string', 'max:500'],
            'email' => ['nullable', 'email', 'max:255'],
            'no_telp' => ['nullable', 'string', 'max:20'],
            'no_telpon' => ['nullable', 'string', 'max:20'],
            'id_prov' => ['nullable', 'integer', 'exists:provinsi,id_prov'],
            'id_kab' => ['nullable', 'integer', 'exists:kabupaten,id_kab'],
            'id_kec' => ['nullable', 'integer', 'exists:kecamatan,id_kec'],
            'id_kel' => ['nullable', 'integer', 'exists:kelurahan,id_kel'],
            'status' => ['required', 'in:aktif,nonaktif'],
        ];

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            foreach ($rules as $attribute => $rule) {
                $rules[$attribute] = array_merge(['sometimes'], $rule);
            }
        }

        return $rules;
    }

    protected function prepareForValidation(): void
    {
        if ($this->isMethod('post') && !$this->filled('status')) {
            $this->merge(['status' => 'aktif']);
        }

        if ($this->missing('no_telp') && $this->filled('no_telpon')) {
            $this->merge(['no_telp' => $this->input('no_telpon')]);
        }

        if ($this->missing('no_telpon') && $this->filled('no_telp')) {
            $this->merge(['no_telpon' => $this->input('no_telp')]);
        }
    }
}
