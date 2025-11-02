<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Kacab;
use App\Models\Shelter;
use App\Models\SuratAb;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ReportShalterSuratAnakCabangController extends Controller
{
    public function shalterSuratAnakReport(Request $request)
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
        $dataShelter = Shelter::with(['anak.suratAb' => function ($query) use ($tahun, $bulan) {
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

        return view('AdminCabang.Report.ReportShalter.SuratAnak.suratanakreport', compact('dataShelter', 'kantorCabangOptions'));
    }

    public function showshelterSuratAnakReport($idShelter) {
        $suratAnak = SuratAb::where('id_shelter', $idShelter)->get();
        return view('AdminCabang.Report.ReportShalter.SuratAnak.suratDetail', compact('suratAnak'));
    }

    public function hapusshelterSuratAnakReport(Request $request) {
        $idSurat = $request->input('id_surat');
        
        $surat = SuratAb::find($idSurat);
        if ($surat) {
            $surat->delete();
            return redirect()->route('shalterSuratAnakReport.cabang')->with('success', 'Surat berhasil dihapus');
        }

        return redirect()->route('shalterSuratAnakReport.cabang')->with('error', 'Surat tidak ditemukan');
    }
}
