<?php

namespace App\Http\Controllers;

use App\Models\Provinsi;
use App\Models\Kabupaten;
use App\Models\Kecamatan;
use App\Models\Kelurahan;
use Illuminate\Http\Request;

class GlobalApiDataWilayahIndonesiaController extends Controller
{
    // Mendapatkan data provinsi
    public function getProvinsi() {
        $provinsi = Provinsi::all(); // Mengambil semua data provinsi
        return response()->json($provinsi);
    }

    public function getKabupaten($id_prov) {
        $kabupaten = Kabupaten::where('id_prov', $id_prov)->whereIn('id_jenis', [1, 2])->get();
        return response()->json($kabupaten);
    }
    

    public function getKecamatan($id_kab) {
        $kecamatan = Kecamatan::where('id_kab', $id_kab)->get();
        return response()->json($kecamatan);
    }

    public function getKelurahan($id_kec) {
        $kelurahan = Kelurahan::where('id_kec', $id_kec)->whereIn('id_jenis', [3, 4])->get();
        return response()->json($kelurahan);
    }
}
