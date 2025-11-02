<?php

namespace App\Http\Controllers\LandingPage;

use App\Models\Kacab;
use App\Models\Berita;
use App\Models\Wilbin;
use App\Models\Shelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class LandingPageController extends Controller
{
    public function index() {
        // Ambil data berita dengan pagination
        $berita = Berita::latest()->paginate(3);  // Menampilkan 3 berita per halaman
        return view('LandingPage.index', compact('berita'));
    }

    public function berita($id, Request $request) {
        $search = $request->get('search');  // Mendapatkan query pencarian jika ada
    
        // Jika ada parameter pencarian, filter berita berdasarkan judul
        if ($search) {
            // Menemukan berita berdasarkan pencarian judul
            $berita = Berita::where('judul', 'like', '%' . $search . '%')->first(); 
        } else {
            // Jika tidak ada pencarian, ambil berita berdasarkan ID
            $berita = Berita::findOrFail($id); 
        }
    
        // Ambil 5 berita terbaru untuk sidebar
        $recentBerita = Berita::latest()->take(3)->get();
    
        // Kirim data berita dan recentBerita ke view, serta parameter pencarian (search)
        return view('LandingPage.berita', compact('berita', 'recentBerita', 'search'));
    }

    public function shelter(Request $request)
    {
        // Ambil parameter pencarian dari query string
        $kacabId = $request->get('kacab_id');
        $wilbinId = $request->get('wilbin_id');

        // Ambil data Kacab dan Wilbin untuk ditampilkan sebagai filter di view
        $kacabs = Kacab::all();
        $wilbins = Wilbin::all();

        // Ambil data Shelter berdasarkan filter Kacab dan Wilbin
        $shelters = Shelter::when($kacabId, function ($query) use ($kacabId) {
            return $query->whereHas('wilbin', function ($query) use ($kacabId) {
                $query->where('id_kacab', $kacabId);
            });
        })
        ->when($wilbinId, function ($query) use ($wilbinId) {
            return $query->where('id_wilbin', $wilbinId);
        })
        ->latest()
        ->paginate(6);

        return view('LandingPage.shelter', compact('shelters', 'kacabs', 'wilbins'));
    }

    public function getWilbinByKacab($id_kacab)
    {
        $wilbin = Wilbin::where('id_kacab', $id_kacab)->get();
        return response()->json($wilbin);
    }


    public function getShelterByWilbin($id_wilbin) {
        $shelter = Shelter::where('id_wilbin', $id_wilbin)->get();
        return response()->json($shelter);
    }
    
}
