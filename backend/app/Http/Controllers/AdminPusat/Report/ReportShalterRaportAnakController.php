<?php

namespace App\Http\Controllers\AdminPusat\Report;


use App\Models\Kacab;
use App\Models\Raport;
use App\Models\Shelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class ReportShalterRaportAnakController extends Controller
{
    public function shelterRaportAnak(Request $request) {
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang');
        $wilayahBinaan = $request->get('wilayah_binaan');

        // Data untuk Kantor Cabang dan Wilayah Binaan
        $kantorCabangOptions = Kacab::all();

        // Query untuk mengambil data shelter berdasarkan filter
        $dataShelter = Shelter::with(['anak.raport' => function ($query) use ($tahun) {
            if ($tahun) {
                $query->whereYear('tanggal', $tahun);
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

        return view('AdminPusat.Report.ReportShalter.RaportAnak.raportanakshelter', compact('dataShelter', 'kantorCabangOptions'));
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
        
        return redirect()->route('shelterRaportAnak')->with('success', 'Raport berhasil dihapus.');
    }
}
