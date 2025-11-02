<?php

namespace App\Http\Controllers\AdminPusat\Pemberdayaan\DataBinaan\DataAnakNonBinaan;

use App\Models\Anak;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class DataAnakNonBinaanController extends Controller
{
     public function index() {
        // Ambil data anak yang sudah diaktifkan tetapi statusnya sekarang tidak aktif
        $data_anak = Anak::with('keluarga', 'shelter')
                         ->where('status_validasi', Anak::STATUS_NON_AKTIF)
                         ->get();

        return view('AdminPusat.Pemberdayaan.DataBinaan.DataNonBinaan.index', compact('data_anak'));
    }
    

    public function getNonAnakBinaanAjax(Request $request) {
        // Query awal
        $query = Anak::with('keluarga', 'shelter')
                     ->where('status_validasi', Anak::STATUS_NON_AKTIF);
    
        // Total data sebelum filtering
        $totalData = $query->count();
    
        // Pencarian
        if ($request->filled('search.value')) {
            $searchValue = $request->input('search.value');
            $query->where('full_name', 'like', "%{$searchValue}%");
        }
    
        // Total data setelah filtering
        $totalFiltered = $query->count();
    
        // Sorting dan Pagination
        $sortColumnIndex = $request->input('order.0.column');
        $sortColumnName = $request->input("columns.$sortColumnIndex.data", 'id_anak');
        $sortDirection = $request->input('order.0.dir', 'asc');
    
        if ($sortColumnName !== 'DT_RowIndex') {
            $query->orderBy($sortColumnName, $sortDirection);
        }
    
        $query->skip($request->input('start'))
              ->take($request->input('length'));
    
        // Ambil data dan mapping
        $data = $query->get()->map(function ($anak, $index) use ($request) {
            $showUrl = route('nonAnakBinaan.show', $anak->id_anak);
            $deleteAction = "confirmDelete('{$anak->full_name}', {$anak->id_anak})";
            $nonaktifAction = route('anak.nonbinaanactivasi', $anak->id_anak);
    
            return [
                'DT_RowIndex' => $request->input('start') + $index + 1,
                'nama' => $anak->full_name,
                'agama' => $anak->agama,
                'jenis_kelamin' => $anak->jenis_kelamin,
                'kepala_keluarga' => $anak->keluarga->kepala_keluarga ?? 'null',
                'status_binaan' => $anak->status_cpb ?? '-',
                'aksi' => '
                    <div class="action-buttons" style="display: flex; gap: 8px; align-items: center;">
                        <a href="' . $showUrl . '" class="btn btn-link btn-info btn-lg">
                            <i class="fa fa-eye"></i>
                        </a>
                        <form action="' . $nonaktifAction . '" method="POST" style="display: inline;">
                            ' . csrf_field() . method_field('PATCH') . '
                                <button type="submit" class="btn btn-link btn-primary btn-lg"
                                        style="text-decoration: none; border: none;">
                                        <i class="fa fa-check"></i> Aktifkan
                                </button>
                        </form>
                        <button type="button" class="btn btn-link btn-danger" onclick="' . $deleteAction . '">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                ',
            ];
        });
    
        return response()->json([
            'draw' => intval($request->input('draw')),
            'recordsTotal' => $totalData,
            'recordsFiltered' => $totalFiltered,
            'data' => $data,
        ]);
    }
    
    public function nonbinaanactivactivasi($id)
    {
        $anak = Anak::findOrFail($id);

        // Set status validasi ke "Aktif" menggunakan konstanta
        $anak->status_validasi = Anak::STATUS_AKTIF;
        $anak->save();

        // Redirect ke halaman Anak Binaan setelah aktivasi
        return redirect()->route('AnakBinaan')->with('success', 'Status validasi anak berhasil diaktifkan.');
    }

    public function show($id_anak)
    {
        // Ambil data anak beserta relasi keluarga, pendidikan, dan shelter
        $anak = Anak::with(['keluarga', 'anakPendidikan', 'shelter'])
                    ->findOrFail($id_anak);

        // Tentukan tab yang akan di-load
        $tab = request()->get('tab', 'data-anak');

        // Tampilkan halaman show dengan tab yang sesuai
        return view('AdminPusat.Pemberdayaan.DataBinaan.DataNonBinaan.show', compact('anak', 'tab'));
    }

    public function destroy($id)
    {
        try {
            // Temukan data Anak berdasarkan ID
            $anak = Anak::findOrFail($id);
    
            // Jika anak memiliki foto, hapus foto dari storage
            if ($anak->foto) {
                Storage::disk('public')->delete($anak->foto);
            }
    
            // Hapus data anak
            $anak->delete();
    
            return response()->json(['message' => 'Data Anak Binaan berhasil dihapus.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Terjadi kesalahan saat menghapus data.'], 500);
        }
    }
    
    

}
