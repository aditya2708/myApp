<?php

namespace App\Http\Requests\Kacab;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKacabRequest extends FormRequest
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
            'no_telp' => ['required_without:no_telpon', 'nullable', 'string', 'max:25'],
            'no_telpon' => ['required_without:no_telp', 'nullable', 'string', 'max:25'],
            'alamat' => ['required', 'string'],
            'email' => ['nullable', 'email', 'max:255'],
            'status' => ['required', 'string', 'max:50'],
            'id_prov' => ['nullable', 'integer'],
            'id_kab' => ['nullable', 'integer'],
            'id_kec' => ['nullable', 'integer'],
            'id_kel' => ['nullable', 'integer'],
        ];
    }
}
