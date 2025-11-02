<?php

namespace App\Http\Controllers\AdminShalter\ReportShelter;

use App\Models\Kacab;
use App\Models\Histori;
use App\Models\Shelter;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\AdminShelter;

class ReportShalterHistoriShelterController extends Controller
{
    public function shelterReportHistoriAnak(Request $request)
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
    
        // Ambil Admin Shelter berdasarkan User
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();
    
        if (!$adminShelter) {
            abort(403, 'Admin shelter tidak ditemukan.');
        }
    
        // Mendapatkan parameter dari request
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');
        $bulan = $request->get('bulan');
    
        // Data untuk Kantor Cabang yang hanya terkait dengan admin shelter yang login
        $kantorCabangOptions = Kacab::where('id_kacab', $adminShelter->id_kacab)->get();
    
        // Query untuk mengambil data Shelter sesuai filter dan hanya untuk admin shelter yang login
        $dataShelter = Shelter::with(['anak.histori' => function ($query) use ($tahun, $bulan) {
            // Filter berdasarkan tahun dan bulan jika ada
            if ($tahun) {
                $query->whereYear('tanggal', $tahun);
            }
            if ($bulan) {
                $query->whereMonth('tanggal', $bulan);
            }
        }])
        ->where('id_shelter', $adminShelter->id_shelter) // Filter berdasarkan shelter yang dimiliki admin shelter yang login
        ->whereHas('wilbin', function ($query) use ($adminShelter, $kantorCabang, $wilayahBinaan) {
            // Filter berdasarkan kantor cabang yang login
            $query->where('id_kacab', $adminShelter->id_kacab);
    
            // Filter berdasarkan wilayah binaan jika ada
            if ($wilayahBinaan) {
                $query->where('id_wilbin', $wilayahBinaan);
            }
        })
        ->get();
    
        // Mengirim data ke view
        return view('AdminShalter.Report.ReportShalter.HistoriAnak.historianakshelter', compact('dataShelter', 'kantorCabangOptions'));
    }
    

    public function showshelterReportHistoriAnak($idShelter) {
        $historiAnak = Histori::where('id_shelter', $idShelter)->get();
        return view('AdminShalter.Report.ReportShalter.HistoriAnak.historianakshelter', compact('historiAnak'));
    }

    public function deleteshelterReportHistoriAnak(Request $request) {
        $idHistori = $request->input('id_histori');
        
        $histori = Histori::find($idHistori);
        if ($histori) {
            $histori->delete();
            return redirect()->route('shelterReportHistoriAnak.shelter')->with('success', 'Histori berhasil dihapus');
        }

        return redirect()->route('shelterReportHistoriAnak.shelter')->with('error', 'Histori tidak ditemukan');
    }
}
