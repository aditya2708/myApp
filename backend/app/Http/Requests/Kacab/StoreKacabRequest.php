<?php

namespace App\Http\Requests\Kacab;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreKacabRequest extends FormRequest
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
        if ($this->filled('no_telpon') && !$this->filled('no_telp')) {
            $this->merge([
                'no_telp' => $this->input('no_telpon'),
            ]);
        }

        if ($this->filled('no_telp') && !$this->has('no_telpon')) {
            $this->merge([
                'no_telpon' => $this->input('no_telp'),
            ]);
        }

        if (!$this->filled('status')) {
            $this->merge([
                'status' => 'aktif',
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nama_kacab' => ['required', 'string', 'max:255'],
            'no_telp' => ['nullable', 'string', 'max:25'],
            'no_telpon' => ['nullable', 'string', 'max:25'],
            'alamat' => ['required', 'string'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', Rule::in(['aktif', 'nonaktif'])],
            'id_prov' => ['nullable', 'string', 'max:10'],
            'id_kab' => ['nullable', 'string', 'max:10'],
            'id_kec' => ['nullable', 'string', 'max:10'],
            'id_kel' => ['nullable', 'string', 'max:10'],
        ];
    }
}
