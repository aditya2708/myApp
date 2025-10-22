<?php

namespace Tests\Feature\AdminShelter;

use App\Http\Requests\AdminShelter\KeluargaValidationRules;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class KeluargaSurveyValidationTest extends TestCase
{
    public function test_survey_optional_fields_can_be_absent(): void
    {
        $data = [
            'kepemilikan_tabungan' => 'Ada',
            'pengurus_organisasi' => 'Tidak',
            'kondisi_penerima_manfaat' => 'Sehat',
        ];

        $validator = Validator::make($data, KeluargaValidationRules::getSurveyRules());

        $this->assertTrue($validator->passes());
        $this->assertFalse($validator->errors()->has('pekerjaan_kepala_keluarga'));
        $this->assertFalse($validator->errors()->has('penghasilan'));
        $this->assertFalse($validator->errors()->has('pendidikan_kepala_keluarga'));
        $this->assertFalse($validator->errors()->has('jumlah_tanggungan'));
        $this->assertFalse($validator->errors()->has('kepemilikan_tanah'));
        $this->assertFalse($validator->errors()->has('perokok'));
        $this->assertFalse($validator->errors()->has('solat_lima_waktu'));
        $this->assertFalse($validator->errors()->has('membaca_alquran'));
        $this->assertFalse($validator->errors()->has('majelis_taklim'));
    }

    public function test_conditional_survey_fields_remain_optional_when_toggles_selected(): void
    {
        $data = [
            'jumlah_makan' => 3,
            'kepemilikan_tanah' => 'Milik Sendiri',
            'kepemilikan_rumah' => 'Milik Sendiri',
            'kondisi_rumah_dinding' => 'Tembok',
            'kondisi_rumah_lantai' => 'Keramik',
            'kepemilikan_kendaraan' => 'Sepeda',
            'kepemilikan_elektronik' => 'Televisi',
            'sumber_air_bersih' => 'PDAM',
            'jamban_limbah' => 'Septic Tank',
            'tempat_sampah' => 'Disediakan',
            'perokok' => 'Tidak',
            'konsumen_miras' => 'Tidak',
            'persediaan_p3k' => 'Ada',
            'makan_buah_sayur' => 'Selalu',
            'solat_lima_waktu' => 'Selalu',
            'membaca_alquran' => 'Selalu',
            'majelis_taklim' => 'Aktif',
            'membaca_koran' => 'Selalu',
            'pengurus_organisasi' => 'Ya',
            'kondisi_penerima_manfaat' => 'Sehat',
            'kondisi_fisik_anak' => 'Disabilitas',
            'bantuan_lembaga_formal_lain' => 'Ya',
        ];

        $rules = array_merge(
            KeluargaValidationRules::getSurveyRules(),
            KeluargaValidationRules::getConditionalSurveyRules($data)
        );

        $validator = Validator::make($data, $rules);

        $this->assertTrue($validator->passes());
        $this->assertFalse($validator->errors()->has('keterangan_disabilitas'));
        $this->assertFalse($validator->errors()->has('bantuan_lembaga_formal_lain_sebesar'));
        $this->assertFalse($validator->errors()->has('pengurus_organisasi_sebagai'));
    }
}
