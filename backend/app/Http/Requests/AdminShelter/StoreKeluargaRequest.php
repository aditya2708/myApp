<?php

namespace App\Http\Requests\AdminShelter;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreKeluargaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = Auth::user();
        return $user && $user->adminShelter && $user->adminShelter->shelter;
    }

    public function rules(): array
    {
        $data = $this->all();
        
        $rules = KeluargaValidationRules::getBaseRules();
        
        // Add parent rules based on status_ortu
        if (isset($data['status_ortu'])) {
            $rules = array_merge($rules, KeluargaValidationRules::getParentRules($data['status_ortu']));
        }
        
        // Add education rules based on jenjang
        if (isset($data['jenjang'])) {
            $rules = array_merge($rules, KeluargaValidationRules::getEducationRules($data['jenjang']));
        }
        
        // Add survey rules
        $rules = array_merge($rules, KeluargaValidationRules::getSurveyRules());
        
        // Add conditional survey rules
        $rules = array_merge($rules, KeluargaValidationRules::getConditionalSurveyRules($data));
        
        // Add bank/phone rules
        $rules = array_merge($rules, KeluargaValidationRules::getBankPhoneRules($data));

        $bankSelected = (!empty($data['bank_choice']) && $data['bank_choice'] === 'yes')
            || !empty($data['id_bank'])
            || !empty($data['no_rek'])
            || !empty($data['an_rek']);

        $rules = array_merge($rules, [
            'id_bank' => $bankSelected ? 'required|exists:bank,id_bank' : 'nullable|exists:bank,id_bank',
            'no_rek' => $bankSelected ? 'required_with:id_bank|string|max:255' : 'nullable|string|max:255',
            'an_rek' => $bankSelected ? 'required_with:id_bank|string|max:255' : 'nullable|string|max:255',
        ]);

        return $rules;
    }

    public function messages(): array
    {
        return [
            'no_kk.required' => 'Nomor KK harus diisi',
            'no_kk.regex' => 'Nomor KK harus terdiri dari 16 digit angka',
            'kepala_keluarga.required' => 'Nama kepala keluarga harus diisi',
            'status_ortu.required' => 'Status orang tua harus dipilih',
            'status_ortu.in' => 'Status orang tua tidak valid',
            
            'nik_anak.required' => 'NIK anak harus diisi',
            'nik_anak.regex' => 'NIK anak harus terdiri dari 16 digit angka',
            'full_name.required' => 'Nama lengkap anak harus diisi',
            'nick_name.required' => 'Nama panggilan anak harus diisi',
            'agama.required' => 'Agama anak harus dipilih',
            'tempat_lahir.required' => 'Tempat lahir anak harus diisi',
            'tanggal_lahir.required' => 'Tanggal lahir anak harus diisi',
            'jenis_kelamin.required' => 'Jenis kelamin anak harus dipilih',
            
            'nama_ayah.required' => 'Nama ayah harus diisi',
            'nama_ibu.required' => 'Nama ibu harus diisi',
            'nik_ayah.required' => 'NIK ayah harus diisi',
            'nik_ayah.regex' => 'NIK ayah harus terdiri dari 16 digit angka',
            'nik_ibu.required' => 'NIK ibu harus diisi',
            'nik_ibu.regex' => 'NIK ibu harus terdiri dari 16 digit angka',
            
            'tanggal_kematian_ayah.required_if' => 'Tanggal kematian ayah harus diisi untuk status yatim/yatim piatu',
            'penyebab_kematian_ayah.required_if' => 'Penyebab kematian ayah harus diisi untuk status yatim/yatim piatu',
            'tanggal_kematian_ibu.required_if' => 'Tanggal kematian ibu harus diisi untuk status piatu/yatim piatu',
            'penyebab_kematian_ibu.required_if' => 'Penyebab kematian ibu harus diisi untuk status piatu/yatim piatu',
            
            'nik_wali.required' => 'NIK wali harus diisi untuk status yatim piatu',
            'nama_wali.required' => 'Nama wali harus diisi untuk status yatim piatu',
            
            'jenjang.required' => 'Jenjang pendidikan harus dipilih',
            'kelas.required' => 'Kelas harus diisi',
            'nama_sekolah.required' => 'Nama sekolah harus diisi',
            'semester.required' => 'Semester harus diisi',
            'nama_pt.required' => 'Nama perguruan tinggi harus diisi',
            
            'foto.image' => 'File foto harus berupa gambar',
            'foto.mimes' => 'Format foto harus jpg, jpeg, atau png',
            'foto.max' => 'Ukuran foto maksimal 2MB',
            
            'id_bank.exists' => 'Bank yang dipilih tidak valid',
            'no_rek.required_with' => 'Nomor rekening wajib diisi ketika bank dipilih.',
            'an_rek.required_with' => 'Atas nama rekening wajib diisi ketika bank dipilih.',
            'no_tlp.required' => 'Nomor telepon harus diisi jika memilih telepon',
            'an_tlp.required' => 'Atas nama telepon harus diisi jika memilih telepon',
        ];
    }

    public function prepareForValidation(): void
    {
        $normalized = array_map(function ($value) {
            if (is_string($value) && trim($value) === '') {
                return null;
            }

            return $value;
        }, $this->all());

        $this->merge($normalized);

        // Clean bank and phone data based on choices
        if ($this->has('bank_choice') && $this->bank_choice == 'no') {
            $this->merge([
                'id_bank' => null,
                'no_rek' => null,
                'an_rek' => null
            ]);
        }

        if (!$this->filled('id_bank') && !$this->filled('no_rek') && !$this->filled('an_rek')) {
            $this->merge([
                'id_bank' => null,
                'no_rek' => null,
                'an_rek' => null,
            ]);
        }

        if ($this->has('telp_choice') && $this->telp_choice == 'no') {
            $this->merge([
                'no_tlp' => null,
                'an_tlp' => null
            ]);
        }

        // Set default values for regional fields to prevent validation errors
        $this->merge([
            'id_prov_ayah' => $this->id_prov_ayah ?? '1',
            'id_kab_ayah' => $this->id_kab_ayah ?? '1',
            'id_kec_ayah' => $this->id_kec_ayah ?? '1',
            'id_kel_ayah' => $this->id_kel_ayah ?? '1',
            'id_prov_ibu' => $this->id_prov_ibu ?? '1',
            'id_kab_ibu' => $this->id_kab_ibu ?? '1',
            'id_kec_ibu' => $this->id_kec_ibu ?? '1',
            'id_kel_ibu' => $this->id_kel_ibu ?? '1',
        ]);
    }
}