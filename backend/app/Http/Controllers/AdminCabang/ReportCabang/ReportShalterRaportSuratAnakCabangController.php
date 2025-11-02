<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Kacab;
use App\Models\Raport;
use App\Models\Shelter;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class ReportShalterRaportSuratAnakCabangController extends Controller
{
    public function shelterRaportAnak(Request $request)
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

        // Data untuk Kantor Cabang yang hanya terkait dengan admin cabang yang login
        $kantorCabangOptions = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();

        // Query untuk mengambil data Shelter sesuai filter dan hanya untuk admin cabang yang login
        $dataShelter = Shelter::with(['anak.raport' => function ($query) use ($tahun) {
            if ($tahun) {
                $query->whereYear('tanggal', $tahun);
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

        return view('AdminCabang.Report.ReportShalter.RaportAnak.raportanakshelter', compact('dataShelter', 'kantorCabangOptions'));
    }

   
    public function showshelterRaportAnak($idShelter)
    {
        // Ambil data raport berdasarkan shelter dan juga foto raport yang terkait
        $raports = Raport::with(['fotoRapor', 'anak'])->where('id_shelter', $idShelter)->get();

        // Return data dalam format JSON
        return response()->json(['raports' => $raports]);
    }

    public function deleteRaport($id)
    {
        // Hapus Raport berdasarkan ID
        $raport = Raport::findOrFail($id);
        
        // Hapus foto raport terkait sebelum menghapus raport
        if ($raport->fotoRapor) {
            foreach ($raport->fotoRapor as $foto) {
                // Pastikan untuk menghapus file foto dari storage jika diperlukan
                Storage::delete($foto->nama);
                $foto->delete();
            }
        }

        $raport->delete();
        
        return redirect()->route('shelterRaportAnak.cabang')->with('success', 'Raport berhasil dihapus.');
    }
}
