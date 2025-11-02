<?php

namespace App\Http\Controllers\AdminPusat\Settings\PengajuanDonatur\PB;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Survey;
use App\Models\Wilbin;
use App\Models\Donatur;
use App\Models\Shelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class PenerimaBeasiswaController extends Controller
{
    public function pengajuanDonatur(Request $request)
    {
        // Mengambil data Anak dengan status CPB dan PB serta donatur yang sesuai
        $query = Anak::with(['donatur.kacab', 'donatur.wilbin', 'donatur.shelter'])
            ->whereIn('status_cpb', ['CPB', 'PB']); 
    
        // Filter berdasarkan atribut dari Donatur
        if ($request->has('id_kacab') && $request->id_kacab != '') {
            $query->whereHas('donatur', function ($q) use ($request) {
                $q->where('id_kacab', $request->id_kacab);
            });
        }
    
        if ($request->has('id_wilbin') && $request->id_wilbin != '') {
            $query->whereHas('donatur', function ($q) use ($request) {
                $q->where('id_wilbin', $request->id_wilbin);
            });
        }
    
        if ($request->has('id_shelter') && $request->id_shelter != '') {
            $query->whereHas('donatur', function ($q) use ($request) {
                $q->where('id_shelter', $request->id_shelter);
            });
        }
    
        // Mendapatkan data anak setelah filter
        $data_penerima_beasiswa = $query->get()->map(function ($anak) {
            $survey = Survey::where('id_keluarga', $anak->id_keluarga)->first();
            $hasil_survey = $survey ? $survey->hasil_survey : 'Tidak Layak';
    
            return [
                'id' => $anak->id_anak,
                'nama_lengkap' => $anak->full_name,
                'agama' => $anak->agama,
                'status_cpb' => $anak->status_cpb,
                'jk' => $anak->jenis_kelamin,
                'anak_ke' => $anak->anak_ke,
                'hasil_survey' => $hasil_survey,
                'donatur' => $anak->donatur ? $anak->donatur->nama_lengkap : 'Belum ada Donatur',
                'id_donatur' => $anak->donatur ? $anak->donatur->id_donatur : null
            ];
        });
    
        // Filter hanya donatur yang sesuai untuk dropdown
        $donaturs = Donatur::where('diperuntukan', 'Pengajuan Donatur (Calon Anak Penerima Beasiswa)')->get();
    
        // Memuat data untuk dropdown filter
        $kacabs = Kacab::all();
        $wilbins = $request->filled('id_kacab') ? Wilbin::where('id_kacab', $request->id_kacab)->get() : [];
        $shelters = $request->filled('id_wilbin') ? Shelter::where('id_wilbin', $request->id_wilbin)->get() : [];
    
        return view('AdminPusat.Settings.PengajuanDonatur.PenerimaBeasiswa.index', compact('data_penerima_beasiswa', 'donaturs', 'kacabs', 'wilbins', 'shelters'));
    }
    
    

    public function update(Request $request, $id_anak) {
        $anak = Anak::findOrFail($id_anak);
        $anak->id_donatur = $request->id_donatur;
        $anak->status_cpb = Anak::STATUS_CPB_PB;  // Menggunakan konstanta dari model Anak
        $anak->save();
    
        // Redirect ke halaman pengajuan donatur dengan parameter untuk mempertahankan filter yang diperlukan
        return redirect()->route('pengajuan_donatur', [
            'id_kacab' => $request->input('id_kacab'), 
            'id_wilbin' => $request->input('id_wilbin'), 
            'id_shelter' => $request->input('id_shelter')
        ])->with('success', 'Donatur berhasil ditambahkan');
    }
    

    public function destroy($id_anak) {
        $anak = Anak::find($id_anak);
        if (!$anak) {
            return redirect()->route('pengajuan_donatur')->with('error', 'Data tidak ditemukan.');
        }
        $anak->id_donatur = null;
        $anak->status_cpb = 'CPB';
        $anak->save();
        return redirect()->route('pengajuan_donatur')->with('success', 'Donatur berhasil dihapus');
    }
    
}
