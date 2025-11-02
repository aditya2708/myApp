<?php

namespace App\Http\Controllers\AdminCabang\PembedayaanCabang\DataBinaan\DataAnakNonBinaan;

use App\Models\Anak;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class DataAnakNonBinaanCabangController extends Controller
{
    public function index()
    {
        $user_id = auth()->user()->id_users;

        // Cari admin cabang berdasarkan user yang login
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Ambil data anak non-aktif berdasarkan cabang admin
        $data_anak = Anak::with('keluarga', 'shelter')
            ->whereHas('keluarga', function ($query) use ($adminCabang) {
                $query->where('id_kacab', $adminCabang->id_kacab);
            })
            ->where('status_validasi', Anak::STATUS_NON_AKTIF) // Filter anak dengan status non-aktif
            ->get();

        return view('AdminCabang.Pemberdayaan.DataBinaan.DataNonBinaan.index', compact('data_anak'));
    }

    public function nonbinaanactivactivasi($id)
    {
        $anak = Anak::findOrFail($id);

        // Set status validasi ke "Aktif" menggunakan konstanta
        $anak->status_validasi = Anak::STATUS_AKTIF;
        $anak->save();

        // Redirect ke halaman Anak Binaan setelah aktivasi
        return redirect()->route('AnakBinaan.cabang')->with('success', 'Status validasi anak berhasil diaktifkan.');
    }

    public function show($id_anak)
    {
        // Ambil data anak beserta relasi keluarga, pendidikan, dan shelter
        $anak = Anak::with(['keluarga', 'anakPendidikan', 'shelter'])
                    ->findOrFail($id_anak);

        // Tentukan tab yang akan di-load
        $tab = request()->get('tab', 'data-anak');

        // Tampilkan halaman show dengan tab yang sesuai
        return view('AdminCabang.Pemberdayaan.DataBinaan.DataNonBinaan.show', compact('anak', 'tab'));
    }

    public function destroy(Request $request, $id_anak)
    {
        // Temukan data Anak berdasarkan id
        $anak = Anak::findOrFail($id_anak);

        // Jika anak memiliki foto, hapus foto dari storage
        if ($anak->foto) {
            Storage::disk('public')->delete($anak->foto);
        }

        // Hapus data anak
        $anak->delete();

        // Ambil halaman saat ini dari request
        $currentPage = $request->input('current_page', 0);

        // Redirect ke halaman Non Anak Binaan dengan pesan sukses
        return redirect()->route('NonAnakBinaan.cabang', ['page' => $currentPage])
                        ->with('success', 'Data Non Anak Binaan berhasil dihapus')
                        ->with('currentPage', $currentPage);
    }

}
