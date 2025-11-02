<?php

namespace App\Http\Controllers\AdminPusat\Report;

use App\Models\Kacab;
use App\Models\Donatur;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DonaturReportController extends Controller
{
    public function donaturReport() {
        // Mengambil data shelter, donatur, dan informasi yang diperlukan
        $dataKacab = Kacab::with(['wilbins.shelters.donatur'])->get();

        return view('AdminPusat.Report.DonaturReport.donaturreport', compact('dataKacab'));
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
