<?php

namespace App\Http\Requests\Wilbin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWilbinRequest extends FormRequest
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
            'nama_wilbin' => ['sometimes', 'required', 'string'],
            'id_kacab' => ['sometimes', 'required', 'exists:kacab,id_kacab'],
        ];
    }
}
