<?php

namespace App\Http\Controllers\LandingPage;

use App\Models\Anak;
use App\Models\Donatur;
use App\Models\Aktivitas;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class DonaturLandingPageController extends Controller
{
    public function donatur(Request $request) {
        // Ambil query pencarian dari input
        $search = $request->input('search');
    
        // Jika ada pencarian, ambil semua data yang cocok
        if ($search) {
            $donaturs = Donatur::where('nama_lengkap', 'like', '%' . $search . '%')->get(); // Semua data hasil pencarian
        } else {
            $donaturs = Donatur::paginate(3); // Default data dengan pagination
        }
    
        // Ambil semua nama donatur untuk dropdown Select2
        $allDonaturs = Donatur::select('id_donatur', 'nama_lengkap')->get();
    
        // Kirim data ke view
        return view('LandingPage.donatur', compact('donaturs', 'allDonaturs', 'search'));
    }
    

    public function donaturbyId($id)
    {
        if (Auth::user()->level === 'donatur') {
            $donatur = Donatur::with('kacab', 'wilbin', 'shelter', 'bank', 'user')
                ->where('id_users', Auth::user()->id_users)
                ->first();
        } elseif (Auth::user()->level === 'admin_shelter' || Auth::user()->level === 'admin_cabang' || Auth::user()->level === 'admin_pusat') {
            $donatur = Donatur::with('kacab', 'wilbin', 'shelter', 'bank', 'user')
                ->where('id_donatur', $id)
                ->first();
        } else {
            return redirect()->back()->withErrors(['error' => 'Anda tidak memiliki akses ke halaman ini.']);
        }

        if (!$donatur) {
            return redirect()->back()->withErrors(['error' => 'Data donatur tidak ditemukan.']);
        }

        $anak_asuh_list = Anak::with('anakPendidikan')
        ->where('id_donatur', $donatur->id_donatur)
        ->get()
        ->map(function ($anak) {
            $aktivitas_list = Aktivitas::where('id_shelter', $anak->id_shelter)
                ->get()
                ->map(function ($aktivitas) {
                    // Define folder path
                    $basePath = 'Aktivitas/' . $aktivitas->id_aktivitas . '/';
                    $defaultImage = asset('assets/img/image.webp'); // Default image if file not found

                    // Check for photo existence in the defined folder
                    $foto1Url = $aktivitas->foto_1 && Storage::exists($basePath . $aktivitas->foto_1)
                        ? asset('storage/' . $basePath . $aktivitas->foto_1)
                        : $defaultImage;

                    $foto2Url = $aktivitas->foto_2 && Storage::exists($basePath . $aktivitas->foto_2)
                        ? asset('storage/' . $basePath . $aktivitas->foto_2)
                        : $defaultImage;

                    $foto3Url = $aktivitas->foto_3 && Storage::exists($basePath . $aktivitas->foto_3)
                        ? asset('storage/' . $basePath . $aktivitas->foto_3)
                        : $defaultImage;

                    return [
                        'jenis_kegiatan' => $aktivitas->jenis_kegiatan,
                        'level_binaan' => $aktivitas->level,
                        'materi' => $aktivitas->materi,
                        'tanggal_aktivitas' => $aktivitas->tanggal,
                        'foto' => [
                            $foto1Url,
                            $foto2Url,
                            $foto3Url,
                        ],
                    ];
            });

                return [
                    'id' => $anak->id_anak,
                    'nama' => $anak->full_name,
                    'jenis_kelamin' => $anak->jenis_kelamin,
                    'agama' => $anak->agama,
                    'tanggal_lahir' => $anak->tanggal_lahir,
                    'kelas' => $anak->anakPendidikan->kelas ?? '-',
                    'aktivitas' => $aktivitas_list,
                ];
            });

        $anak_asuh_count = $anak_asuh_list->count();

        return view('LandingPage.donaturbyId', compact('donatur', 'anak_asuh_list', 'anak_asuh_count'));
    }

}
