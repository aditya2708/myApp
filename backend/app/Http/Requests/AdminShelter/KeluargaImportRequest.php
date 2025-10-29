<?php

namespace App\Http\Requests\AdminShelter;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class KeluargaImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();

        return (bool) ($user && $user->adminShelter);
    }

    public function rules(): array
    {
        return [
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240',
            'dry_run' => 'sometimes|boolean',
            'id_kacab' => 'sometimes|nullable|integer|exists:kacab,id_kacab',
            'id_wilbin' => 'sometimes|nullable|integer|exists:wilbin,id_wilbin',
            'id_shelter' => 'sometimes|nullable|integer|exists:shelter,id_shelter',

            // Optional defaults for child/family data (used when column kosong)
            'hafalan' => 'sometimes|nullable|string|max:255',
            'pelajaran_favorit' => 'sometimes|nullable|string|max:255',
            'hobi' => 'sometimes|nullable|string|max:255',
            'prestasi' => 'sometimes|nullable|string|max:255',
            'jarak_rumah' => 'sometimes|nullable|string|max:255',
            'transportasi' => 'sometimes|nullable|string|max:255',
            'status_validasi' => 'sometimes|nullable|string|max:255',
            'status_cpb' => 'sometimes|nullable|string|max:255',
            'status_keluarga' => 'sometimes|nullable|string|max:255',
            'jenjang' => 'sometimes|nullable|string|max:255',
            'kelas' => 'sometimes|nullable|string|max:255',
            'nama_sekolah' => 'sometimes|nullable|string|max:255',
            'alamat_sekolah' => 'sometimes|nullable|string|max:255',
            'jurusan' => 'sometimes|nullable|string|max:255',
            'semester' => 'sometimes|nullable|integer|min:0',
            'nama_pt' => 'sometimes|nullable|string|max:255',
            'alamat_pt' => 'sometimes|nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'File import wajib diunggah.',
            'file.mimes' => 'Format file harus CSV atau Excel (.xlsx/.xls).',
            'file.max' => 'Ukuran file maksimal 10MB.',
        ];
    }

    public function validated($key = null, $default = null)
    {
        $data = parent::validated($key, $default);

        // Normalise boolean flag
        $dryRun = filter_var($this->input('dry_run', true), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $data['dry_run'] = $dryRun ?? true;

        return $data;
    }
}
