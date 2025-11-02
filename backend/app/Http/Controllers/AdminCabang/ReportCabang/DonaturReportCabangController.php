<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Kacab;
use App\Models\Donatur;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DonaturReportCabangController extends Controller
{
    public function donaturReport() {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
    
        // Ambil Admin Cabang berdasarkan User
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Ambil data Kacab terkait dengan wilayah binaan admin cabang yang sedang login
        $dataKacab = Kacab::where('id_kacab', $adminCabang->id_kacab) // Filter berdasarkan id_kacab admin cabang
           ->with(['wilbins.shelters.donatur']) 
           ->get();

        return view('AdminCabang.Report.DonaturReport.donaturreport', compact('dataKacab'));
    }

    public function getShelterDonatur($idKacab)
    {
        $kacab = Kacab::with(['wilbins.shelters.donatur'])->findOrFail($idKacab);

        $shelterData = $kacab->wilbins->flatMap(function ($wilbin) {
            return $wilbin->shelters->map(function ($shelter) {
                return [
                    'id' => $shelter->id_shelter,
                    'shelter_name' => $shelter->nama_shelter,
                    'jumlah_donatur' => $shelter->donatur->count(),
                ];
            });
        });

        return response()->json(['status' => 'success', 'data' => $shelterData]);
    }

    public function getDonaturByShelter($idShelter)
    {
        try {
            $donaturData = Donatur::where('id_shelter', $idShelter)->get()->map(function ($donatur) {
                return [
                    'nama_lengkap' => $donatur->nama_lengkap,
                    'alamat' => $donatur->alamat,
                    'no_hp' => $donatur->no_hp,
                    'diperuntukan' => $donatur->diperuntukan,
                    'anak_asuh' => $donatur->anak()->count(), // Pastikan relasi anak tersedia
                    'foto_url' => $donatur->foto
                        ? asset('storage/Donatur/' . $donatur->id_donatur . '/' . $donatur->foto) // URL sesuai struktur di view
                        : asset('assets/img/image.webp'), // Default image path sama dengan view
                ];
            });

            return response()->json(['status' => 'success', 'data' => $donaturData]);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error', 'message' => 'Terjadi kesalahan saat memuat data donatur.'], 500);
        }
    }
}
