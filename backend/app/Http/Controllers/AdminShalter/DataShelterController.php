<?php

namespace App\Http\Controllers\AdminShalter;

use App\Models\Wilbin;
use App\Models\Shelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DataShelterController extends Controller
{
    public function getWilbinByKacabCabang($id_kacab) {
        $wilbin = Wilbin::where('id_kacab', $id_kacab)->get();
        return response()->json($wilbin);
    }

    public function getShelterByWilbinCabang($id_wilbin) {
        $shelter = Shelter::where('id_wilbin', $id_wilbin)->get();
        return response()->json($shelter);
    }
}
