<?php

namespace App\Http\Controllers\AdminShalter\ReportShelter;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Shelter;
use App\Models\SuratAb;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ReportShalterSuratAnakShalterController extends Controller
{
    public function shalterSuratAnakReport(Request $request)
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
        $dataShelter = Shelter::with(['anak.suratAb' => function ($query) use ($tahun, $bulan) {
            // Filter berdasarkan tahun dan bulan
            if ($tahun) {
                $query->whereYear('tanggal', $tahun);
            }
            if ($bulan) {
                $query->whereMonth('tanggal', $bulan);
            }
        }])
        ->where('id_shelter', $adminShelter->id_shelter)  // Filter shelter berdasarkan admin shelter yang login
        ->get();

        // Jika Anda ingin menampilkan hanya anak-anak yang terkait dengan shelter
        $dataAnak = Anak::where('id_shelter', $adminShelter->id_shelter)->get();

        return view('AdminShalter.Report.ReportShalter.SuratAnak.suratanakreport', compact('dataShelter', 'kantorCabangOptions', 'adminShelter', 'dataAnak'));
    }

    public function showshelterSuratAnakReport($idShelter) {
        $suratAnak = SuratAb::where('id_shelter', $idShelter)->get();
        return view('AdminShalter.Report.ReportShalter.SuratAnak.suratDetail', compact('suratAnak'));
    }

    public function hapusshelterSuratAnakReport(Request $request) {
        $idSurat = $request->input('id_surat');
        
        $surat = SuratAb::find($idSurat);
        if ($surat) {
            $surat->delete();
            return redirect()->route('shalterSuratAnakReport.shelter')->with('success', 'Surat berhasil dihapus');
        }

        return redirect()->route('shalterSuratAnakReport.shelter')->with('error', 'Surat tidak ditemukan');
    }
}
