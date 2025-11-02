<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Kacab;
use App\Models\Histori;
use App\Models\Shelter;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ReportShalterHistoriAnakCabangController extends Controller
{
    public function shelterReportHistoriAnak(Request $request)
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;

        // Ambil Admin Cabang berdasarkan User
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Mendapatkan parameter dari request
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $bulan = $request->get('bulan');

        // Data untuk Kantor Cabang yang hanya terkait dengan admin cabang yang login
        $kantorCabangOptions = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();

        // Query untuk mengambil data Shelter sesuai filter dan hanya untuk admin cabang yang login
        $dataShelter = Shelter::with(['anak.histori' => function ($query) use ($tahun, $bulan) {
            if ($tahun) {
                $query->whereYear('tanggal', $tahun);
            }
            if ($bulan) {
                $query->whereMonth('tanggal', $bulan);
            }
        }])
        ->whereHas('wilbin', function ($query) use ($adminCabang, $kantorCabang, $wilayahBinaan) {
            // Filter berdasarkan kantor cabang yang login
            $query->where('id_kacab', $adminCabang->id_kacab);

            // Filter berdasarkan wilayah binaan jika ada
            if ($wilayahBinaan) {
                $query->where('id_wilbin', $wilayahBinaan);
            }
        })
        ->get();

        return view('AdminCabang.Report.ReportShalter.HistoriAnak.historianakshelter', compact('dataShelter', 'kantorCabangOptions'));
    }

    public function showshelterReportHistoriAnak($idShelter) {
        $historiAnak = Histori::where('id_shelter', $idShelter)->get();
        return view('AdminCabang.Report.ReportShalter.HistoriAnak.historianakshelter', compact('historiAnak'));
    }

    public function deleteshelterReportHistoriAnak(Request $request) {
        $idHistori = $request->input('id_histori');
        
        $histori = Histori::find($idHistori);
        if ($histori) {
            $histori->delete();
            return redirect()->route('shelterReportHistoriAnak.cabang')->with('success', 'Histori berhasil dihapus');
        }

        return redirect()->route('shelterReportHistoriAnak.cabang')->with('error', 'Histori tidak ditemukan');
    }
}
