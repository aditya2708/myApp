<?php

namespace App\Http\Controllers\AdminPusat\Pemberdayaan\DataBinaan\DataSurvey;

use App\Models\Ibu;
use App\Models\Anak;
use App\Models\Ayah;
use App\Models\Wali;
use App\Models\Survey;
use App\Models\Keluarga;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DataValidasiSurveyController extends Controller
{
    public function index() {
        // Retrieve the survey data including related keluarga information
        $data_surveys = Survey::with('keluarga')->get();

        return view('AdminPusat.Pemberdayaan.DataBinaan.DataValidasiSurvey.index', compact('data_surveys'));
    }

    public function validasiSurveyShow($id_survey)
    {
        // Retrieve survey data based on id_survey
        $survey = Survey::with('keluarga.ayah', 'keluarga.ibu', 'keluarga.wali')->findOrFail($id_survey);
        
        // Get related keluarga, ayah, ibu, and wali data from survey
        $keluarga = $survey->keluarga ?? new Keluarga();
        $ayah = $keluarga->ayah ?? new Ayah();  
        $ibu = $keluarga->ibu ?? new Ibu();
        $wali = $keluarga->wali ?? new Wali();  // Menambahkan data wali
        $tab = request()->get('tab', 'data-keluargasurvey');
    
        return view('AdminPusat.Pemberdayaan.DataBinaan.DataValidasiSurvey.DataSurvey.showKeluarga', compact('keluarga', 'tab', 'survey', 'ayah', 'ibu', 'wali'));
    }
    

    public function storeValidation(Request $request, $id)
    {
        $survey = Survey::findOrFail($id);
        $survey->hasil_survey = $request->input('hasil_survey');
        $survey->keterangan_hasil = $request->input('keterangan_hasil');
        $survey->save();

        // Ambil ulang data survei untuk memastikan perubahan terbaru
        $updatedSurvey = Survey::where('id_survey', $id)->first();

        // Jika hasil survei menyatakan "Layak", ubah status_cpb anak menjadi "CPB"
        if ($updatedSurvey->hasil_survey === 'Layak') {
            Anak::where('id_keluarga', $updatedSurvey->id_keluarga)
                ->update(['status_cpb' => Anak::STATUS_CPB_CPB]);
        }

        return redirect()->route('validasisurveykeluarga')->with('success', 'Validasi survey berhasil disimpan.');
    }


    public function destroy($id_keluarga, $id_survey)
    {
        // Temukan data survey berdasarkan id_survey
        $survey = Survey::findOrFail($id_survey);

        // Hapus data survey
        $survey->delete();

        // Hapus data keluarga jika tidak ada survey lain yang terkait
        $keluarga = Keluarga::find($id_keluarga);
        if ($keluarga && $keluarga->surveys()->count() == 0) {
            $keluarga->delete();
        }

        // Redirect ke halaman validasi survey dengan pesan sukses
        return redirect()->route('validasisurveykeluarga')
                        ->with('success', 'Data Survey dan Keluarga berhasil dihapus');
    }
    
    
}
