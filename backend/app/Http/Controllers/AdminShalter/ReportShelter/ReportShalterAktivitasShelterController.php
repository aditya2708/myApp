<?php

namespace App\Http\Controllers\AdminShalter\ReportShelter;

use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Aktivitas;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\AdminShelter;

class ReportShalterAktivitasShelterController extends Controller
{
    public function shelterreportAktivitasAnak(Request $request)
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
        
        // Ambil Admin Shelter berdasarkan User
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();
        
        if (!$adminShelter) {
            abort(403, 'Admin shelter tidak ditemukan.');
        }
        
        // Ambil data filter dari request
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang', $adminShelter->id_kacab); // Defaultkan kantor cabang berdasarkan admin
        $wilayahBinaan = $request->get('wilayah_binaan');
        $bulan = $request->get('bulan');
        
        // Data untuk Kantor Cabang dan Wilayah Binaan
        $kantorCabangOptions = Kacab::where('id_kacab', $adminShelter->id_kacab)->get(); // Ambil hanya kantor cabang yang terkait dengan admin shelter
        $wilayahBinaanOptions = Wilbin::where('id_kacab', $adminShelter->id_kacab)->get(); // Ambil wilayah binaan terkait dengan kantor cabang admin shelter
        
        // Query untuk mengambil data shelter berdasarkan filter
        $shelterOptions = Shelter::when($kantorCabang, function ($query, $kantorCabang) {
                return $query->whereHas('wilbin', function ($query) use ($kantorCabang) {
                    $query->where('id_kacab', $kantorCabang);
                });
            })
            ->when($wilayahBinaan, function ($query, $wilayahBinaan) {
                return $query->where('id_wilbin', $wilayahBinaan);
            })
            ->where('id_shelter', $adminShelter->id_shelter) // Hanya tampilkan shelter yang terkait dengan admin shelter yang login
            ->get();
        
        // Data jenis kegiatan untuk filter
        $jenisKegiatan = Aktivitas::select('jenis_kegiatan')->distinct()->get();
        
        // Query untuk mengambil data shelter beserta aktivitas sesuai dengan filter yang diterapkan
        $dataShelter = Shelter::with(['aktivitas' => function ($query) use ($tahun, $bulan) {
                if ($tahun) {
                    $query->whereYear('tanggal', $tahun);
                }
                if ($bulan) {
                    $query->whereMonth('tanggal', $bulan);
                }
            }])
            ->where('id_shelter', $adminShelter->id_shelter) // Filter berdasarkan shelter yang dimiliki oleh admin shelter yang login
            ->whereHas('wilbin', function ($query) use ($kantorCabang, $wilayahBinaan, $adminShelter) {
                // Memastikan hanya wilayah binaan yang terkait dengan kantor cabang yang login yang ditampilkan
                if ($kantorCabang) {
                    $query->where('id_kacab', $kantorCabang);
                }
                if ($wilayahBinaan) {
                    $query->where('id_wilbin', $wilayahBinaan);
                } else {
                    // Jika tidak ada filter wilayah binaan, hanya tampilkan wilayah binaan berdasarkan id_kacab admin cabang
                    $query->where('id_kacab', $adminShelter->id_kacab);
                }
            })
            ->get();
        
        // Kirim data ke view untuk ditampilkan
        return view('AdminShalter.Report.ReportShalter.AktivitasAnak.aktivitasanakshelter', 
                compact('dataShelter', 'kantorCabangOptions', 'shelterOptions', 'jenisKegiatan', 'wilayahBinaanOptions', 'kantorCabang'));
    }

    public function getAktivitasAnakAjax(Request $request)
    {

        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
        
        // Ambil Admin Shelter berdasarkan User
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();
        
        if (!$adminShelter) {
            abort(403, 'Admin shelter tidak ditemukan.');
        }

        $query = Aktivitas::with('shelter')
            ->where('id_shelter', $adminShelter->id_shelter);

        // Filter berdasarkan tahun dan bulan
        if ($request->filled('tahun')) {
            $query->whereYear('tanggal', $request->tahun);
        }
        if ($request->filled('bulan')) {
            $query->whereMonth('tanggal', $request->bulan);
        }

        // Filter berdasarkan kantor cabang dan wilayah binaan
        if ($request->filled('kantor_cabang')) {
            $query->whereHas('shelter.wilbin', function ($q) use ($request) {
                $q->where('id_kacab', $request->kantor_cabang);
            });
        }
        if ($request->filled('wilayah_binaan')) {
            $query->whereHas('shelter', function ($q) use ($request) {
                $q->where('id_wilbin', $request->wilayah_binaan);
            });
        }

        // Pencarian global DataTables
        if ($request->filled('search.value')) {
            $searchValue = $request->input('search.value');
            $query->where(function ($q) use ($searchValue) {
                $q->where('jenis_kegiatan', 'like', '%' . $searchValue . '%')
                ->orWhere('level', 'like', '%' . $searchValue . '%')
                ->orWhere('materi', 'like', '%' . $searchValue . '%')
                ->orWhereHas('shelter', function ($q) use ($searchValue) {
                    $q->where('nama_shelter', 'like', '%' . $searchValue . '%');
                });
            });
        }

        // Total data tanpa filter
        $totalData = $query->count();

        // Sorting dan pagination
        $query->orderBy(
            $request->input('columns.' . $request->input('order.0.column') . '.data', 'tanggal'),
            $request->input('order.0.dir', 'desc')
        )->skip($request->input('start', 0))->take($request->input('length', 10));

        // Ambil data
        $data = $query->get()->map(function ($aktivitas) {
            return [
                "jenis_kegiatan" => $aktivitas->jenis_kegiatan,
                "level" => $aktivitas->level,
                "materi" => $aktivitas->materi,
                "tanggal" => \Carbon\Carbon::parse($aktivitas->tanggal)->format('d-m-Y'),
                "id_aktivitas" => $aktivitas->id_aktivitas
            ];
        });

        return response()->json([
            "draw" => intval($request->input('draw')),
            "recordsTotal" => $totalData,
            "recordsFiltered" => $totalData,
            "data" => $data
        ]);
    }

    /* public function showshelterreportAktivitasAnakFoto($idAktivitas)
    {
        // Ambil data aktivitas berdasarkan id_aktivitas
        $aktivitas = Aktivitas::find($idAktivitas);
        if ($aktivitas) {
            return response()->json([
                'id_aktivitas' => $aktivitas->id_aktivitas, // Tambahkan id_aktivitas
                'foto_1' => $aktivitas->foto_1,
                'foto_2' => $aktivitas->foto_2,
                'foto_3' => $aktivitas->foto_3
            ]);            
        }
    
        return response()->json(['error' => 'Aktivitas tidak ditemukan'], 404);
    }   */  

    public function showshelterreportAktivitasAnakFoto($idAktivitas)
    {
        $aktivitas = Aktivitas::find($idAktivitas);

        if ($aktivitas) {
            // Path default gambar
            $defaultImage = asset('assets/img/image.webp');

            // Periksa keberadaan setiap gambar
            $foto1Path = public_path('storage/Aktivitas/' . $aktivitas->id_aktivitas . '/' . $aktivitas->foto_1);
            $foto2Path = public_path('storage/Aktivitas/' . $aktivitas->id_aktivitas . '/' . $aktivitas->foto_2);
            $foto3Path = public_path('storage/Aktivitas/' . $aktivitas->id_aktivitas . '/' . $aktivitas->foto_3);

            $foto1Url = file_exists($foto1Path) ? asset('storage/Aktivitas/' . $aktivitas->id_aktivitas . '/' . $aktivitas->foto_1) : $defaultImage;
            $foto2Url = file_exists($foto2Path) ? asset('storage/Aktivitas/' . $aktivitas->id_aktivitas . '/' . $aktivitas->foto_2) : $defaultImage;
            $foto3Url = file_exists($foto3Path) ? asset('storage/Aktivitas/' . $aktivitas->id_aktivitas . '/' . $aktivitas->foto_3) : $defaultImage;

            return response()->json([
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'foto_1' => $foto1Url,
                'foto_2' => $foto2Url,
                'foto_3' => $foto3Url,
            ]);
        }

        return response()->json(['error' => 'Aktivitas tidak ditemukan'], 404);
    }

    // Fungsi untuk menghapus laporan aktivitas anak
    public function deleteshelterreportAktivitasAnak(Request $request)
    {
        $idAktivitas = $request->input('id_aktivitas');
        
        $aktivitas = Aktivitas::find($idAktivitas);
        if ($aktivitas) {
            $aktivitas->delete();
            return redirect()->route('shelterreportAktivitasAnak.shelter')->with('success', 'Aktivitas berhasil dihapus');
        }

        return redirect()->route('shelterreportAktivitasAnak.shelter')->with('error', 'Aktivitas tidak ditemukan');
    }
}
