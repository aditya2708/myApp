<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Aktivitas;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class ReportShalterAktivitasAnakCabangController extends Controller
{
    public function shelterreportAktivitasAnak(Request $request)
    {
        // Ambil ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
    
        // Ambil Admin Cabang berdasarkan User
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Ambil data filter dari request
        $tahun = $request->get('tahun');
        $kantorCabang = $request->get('kantor_cabang', $adminCabang->id_kacab); // Defaultkan kantor cabang berdasarkan admin
        $wilayahBinaan = $request->get('wilayah_binaan');
        $bulan = $request->get('bulan');
    
        // Data untuk Kantor Cabang dan Wilayah Binaan
        $kantorCabangOptions = Kacab::all(); // Anda bisa menyesuaikan query ini jika ingin lebih spesifik
        $wilayahBinaanOptions = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();
    
        // Query untuk mengambil data shelter berdasarkan filter
        $shelterOptions = Shelter::when($kantorCabang, function ($query, $kantorCabang) {
                return $query->whereHas('wilbin', function ($query) use ($kantorCabang) {
                    $query->where('id_kacab', $kantorCabang);
                });
            })
            ->when($wilayahBinaan, function ($query, $wilayahBinaan) {
                return $query->where('id_wilbin', $wilayahBinaan);
            })
            ->get();
    
        // Data jenis kegiatan untuk filter
        $jenisKegiatan = Aktivitas::select('jenis_kegiatan')->distinct()->get();
    
        // Query untuk mengambil data shelter beserta aktivitas
        $dataShelter = Shelter::with(['aktivitas' => function ($query) use ($tahun, $bulan) {
                if ($tahun) {
                    $query->whereYear('tanggal', $tahun);
                }
                if ($bulan) {
                    $query->whereMonth('tanggal', $bulan);
                }
            }])
            ->whereHas('wilbin', function ($query) use ($kantorCabang, $wilayahBinaan, $adminCabang) {
                // Memastikan hanya wilayah binaan yang terkait dengan kantor cabang yang login yang ditampilkan
                if ($kantorCabang) {
                    $query->where('id_kacab', $kantorCabang);
                }
                if ($wilayahBinaan) {
                    $query->where('id_wilbin', $wilayahBinaan);
                } else {
                    // Jika tidak ada filter wilayah binaan, hanya tampilkan wilayah binaan berdasarkan id_kacab admin cabang
                    $query->where('id_kacab', $adminCabang->id_kacab);
                }
            })
            ->get();
    
        // Kirim data ke view untuk ditampilkan
        return view('AdminCabang.Report.ReportShalter.AktivitasAnak.aktivitasanakshelter', 
                   compact('dataShelter', 'kantorCabangOptions', 'shelterOptions', 'jenisKegiatan', 'wilayahBinaanOptions', 'kantorCabang'));
    }    

    public function getAktivitasAnakAjax(Request $request)
    {
        $query = Aktivitas::with('shelter');

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


    public function showshelterreportAktivitasAnakFoto($idAktivitas)
    {
        $aktivitas = Aktivitas::find($idAktivitas);

        if ($aktivitas) {
            // Path default gambar
            $defaultImage = asset('assets/img/image.webp');

            // Folder base path untuk aktivitas
            $basePath = 'Aktivitas/' . $aktivitas->id_aktivitas . '/';

            // Periksa keberadaan setiap gambar menggunakan Storage::disk
            $foto1Url = Storage::disk('public')->exists($basePath . $aktivitas->foto_1)
                ? asset('storage/' . $basePath . $aktivitas->foto_1)
                : $defaultImage;

            $foto2Url = Storage::disk('public')->exists($basePath . $aktivitas->foto_2)
                ? asset('storage/' . $basePath . $aktivitas->foto_2)
                : $defaultImage;

            $foto3Url = Storage::disk('public')->exists($basePath . $aktivitas->foto_3)
                ? asset('storage/' . $basePath . $aktivitas->foto_3)
                : $defaultImage;

            // Mengembalikan respons JSON dengan URL gambar
            return response()->json([
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'foto_1' => $foto1Url,
                'foto_2' => $foto2Url,
                'foto_3' => $foto3Url,
            ]);
        }

        // Respons jika aktivitas tidak ditemukan
        return response()->json(['error' => 'Aktivitas tidak ditemukan'], 404);
    }

   /*  public function showshelterreportAktivitasAnakFoto($idAktivitas)
    {
        // Ambil data aktivitas berdasarkan id_aktivitas
        $aktivitas = Aktivitas::find($idAktivitas);
        if ($aktivitas) {
            return response()->json([
                'foto_1' => $aktivitas->foto_1,
                'foto_2' => $aktivitas->foto_2,
                'foto_3' => $aktivitas->foto_3
            ]);            
        }
    
        return response()->json(['error' => 'Aktivitas tidak ditemukan'], 404);
    }     */

    // Fungsi untuk menghapus laporan aktivitas anak
    public function deleteshelterreportAktivitasAnak(Request $request)
    {
        $idAktivitas = $request->input('id_aktivitas');
        
        $aktivitas = Aktivitas::find($idAktivitas);
        if ($aktivitas) {
            $aktivitas->delete();
            return redirect()->route('shelterreportAktivitasAnak.cabang')->with('success', 'Aktivitas berhasil dihapus');
        }

        return redirect()->route('shelterreportAktivitasAnak.cabang')->with('error', 'Aktivitas tidak ditemukan');
    }
}
