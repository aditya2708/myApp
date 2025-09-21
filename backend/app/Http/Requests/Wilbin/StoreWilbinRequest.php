<?php

namespace App\Http\Requests\Wilbin;

use Illuminate\Foundation\Http\FormRequest;

class StoreWilbinRequest extends FormRequest
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
            'nama_wilbin' => ['required', 'string'],
            'id_kacab' => ['required', 'exists:kacab,id_kacab'],
        ];
    }
}
