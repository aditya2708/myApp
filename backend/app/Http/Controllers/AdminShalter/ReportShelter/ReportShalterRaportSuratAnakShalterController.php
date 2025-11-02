<?php

namespace App\Http\Controllers\AdminShalter\ReportShelter;

use App\Models\Kacab;
use App\Models\Raport;
use App\Models\Shelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\AdminShelter;
use Illuminate\Support\Facades\Storage;

class ReportShalterRaportSuratAnakShalterController extends Controller
{
    public function shelterRaportAnak(Request $request)
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
    
        // Data untuk Kantor Cabang yang hanya terkait dengan admin shelter yang login
        $kantorCabangOptions = Kacab::where('id_kacab', $adminShelter->id_kacab)->get();
    
        // Query untuk mengambil data Shelter sesuai filter dan hanya untuk admin shelter yang login
        $dataShelter = Shelter::with(['anak.raport' => function ($query) use ($tahun) {
            // Filter berdasarkan tahun jika ada
            if ($tahun) {
                $query->whereYear('tanggal', $tahun);
            }
        }])
        ->whereHas('wilbin', function ($query) use ($adminShelter, $kantorCabang, $wilayahBinaan) {
            // Filter berdasarkan kantor cabang yang login
            $query->where('id_kacab', $adminShelter->id_kacab);
    
            // Filter berdasarkan wilayah binaan jika ada
            if ($wilayahBinaan) {
                $query->where('id_wilbin', $wilayahBinaan);
            }
        })
        // Filter shelter berdasarkan admin shelter yang login
        ->where('id_shelter', $adminShelter->id_shelter)
        ->get();
    
        // Mengirim data ke view
        return view('AdminShalter.Report.ReportShalter.RaportAnak.raportanakshelter', compact('dataShelter', 'kantorCabangOptions'));
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
        
        return redirect()->route('shelterRaportAnak.shelter')->with('success', 'Raport berhasil dihapus.');
    }
}
