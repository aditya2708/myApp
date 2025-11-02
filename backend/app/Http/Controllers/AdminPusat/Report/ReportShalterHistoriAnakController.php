<?php

namespace App\Http\Controllers\AdminPusat\Report;

use App\Http\Controllers\Controller;
use App\Models\Histori;  // Mengimpor model Histori
use App\Models\Kacab;
use App\Models\Shelter;
use App\Models\SuratAb;
use Illuminate\Http\Request;

class ReportShalterHistoriAnakController extends Controller
{
    public function shelterReportHistoriAnak(Request $request) {
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $bulan = $request->get('bulan');

        // Data untuk Kantor Cabang dan Wilayah Binaan
        $kantorCabangOptions = Kacab::all();

        // Query untuk mengambil data shelter berdasarkan filter
        $dataShelter = Shelter::with(['anak.histori' => function ($query) use ($tahun, $bulan) {
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

        return view('AdminPusat.Report.ReportShalter.HistoriAnak.historianakshelter', compact('dataShelter', 'kantorCabangOptions'));
    }

    public function showshelterReportHistoriAnak($idShelter) {
        $historiAnak = Histori::where('id_shelter', $idShelter)->get();
        return view('AdminPusat.Report.ReportShalter.HistoriAnak.historianakshelter', compact('historiAnak'));
    }

    public function deleteshelterReportHistoriAnak(Request $request) {
        $idHistori = $request->input('id_histori');
        
        $histori = Histori::find($idHistori);
        if ($histori) {
            $histori->delete();
            return redirect()->route('shelterReportHistoriAnak')->with('success', 'Histori berhasil dihapus');
        }

        return redirect()->route('shelterReportHistoriAnak')->with('error', 'Histori tidak ditemukan');
    }
}
