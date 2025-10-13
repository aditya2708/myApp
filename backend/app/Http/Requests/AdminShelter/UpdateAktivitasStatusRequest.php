<?php

namespace App\Http\Requests\AdminShelter;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateAktivitasStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();

        return $user && $user->adminShelter && $user->adminShelter->shelter;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|string|in:completed',
            'notes' => 'nullable|string',
        ];
    }
}
