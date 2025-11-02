<?php

namespace App\Http\Controllers\AdminPusat\Report;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SuratAb;
use App\Models\Anak;
use App\Models\Shelter;
use App\Models\Kacab;
use App\Models\Wilbin;

class ReportShalterSuratAnakController extends Controller
{
    public function shalterSuratAnakReport(Request $request) {
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $bulan = $request->get('bulan');

        // Data untuk Kantor Cabang dan Wilayah Binaan
        $kantorCabangOptions = Kacab::all();

        // Query untuk mengambil data shelter berdasarkan filter
        $dataShelter = Shelter::with(['anak.suratAb' => function ($query) use ($tahun, $bulan) {
            if ($tahun) {
                $query->whereYear('tanggal', $tahun);
            }
            if ($bulan) {
                $query->whereMonth('tanggal', $bulan);
            }
        }])
        ->whereHas('wilbin', function ($query) use ($kantorCabang, $wilayahBinaan) {
            if ($kantorCabang) {
                $query->where('id_kacab', $kantorCabang);
            }
            if ($wilayahBinaan) {
                $query->where('id_wilbin', $wilayahBinaan);
            }
        })
        ->get();

        return view('AdminPusat.Report.ReportShalter.SuratAnak.suratanakreport', compact('dataShelter', 'kantorCabangOptions'));
    }

    public function showshelterSuratAnakReport($idShelter) {
        $suratAnak = SuratAb::where('id_shelter', $idShelter)->get();
        return view('AdminPusat.Report.ReportShalter.SuratAnak.suratDetail', compact('suratAnak'));
    }

    public function hapusshelterSuratAnakReport(Request $request) {
        $idSurat = $request->input('id_surat');
        
        $surat = SuratAb::find($idSurat);
        if ($surat) {
            $surat->delete();
            return redirect()->route('shalterSuratAnakReport')->with('success', 'Surat berhasil dihapus');
        }

        return redirect()->route('shalterSuratAnakReport')->with('error', 'Surat tidak ditemukan');
    }
}
