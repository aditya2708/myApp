<?php

namespace App\Http\Controllers\AdminShalter\PemberdayaanShelter\DataBinaan\DataAnakNonBinaan;

use App\Models\Anak;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class DataAnakNonBinaanShelterController extends Controller
{
    public function index()
    {
        $user_id = auth()->user()->id_users;

        // Cari admin shelter berdasarkan user yang login
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();

        if (!$adminShelter) {
            abort(403, 'Admin shelter tidak ditemukan.');
        }

        // Ambil data anak non-aktif berdasarkan cabang dan shelter admin yang login
        $data_anak = Anak::with('keluarga', 'shelter')
            ->whereHas('keluarga', function ($query) use ($adminShelter) {
                // Filter berdasarkan id_kacab dari admin shelter
                $query->where('id_kacab', $adminShelter->id_kacab);
            })
            ->where('status_validasi', Anak::STATUS_NON_AKTIF) // Filter hanya anak dengan status non-aktif
            ->where('id_shelter', $adminShelter->id_shelter) // Filter berdasarkan shelter yang terkait dengan admin shelter
            ->get();

        // Kembalikan data ke view
        return view('AdminShalter.Pemberdayaan.DataBinaan.DataNonBinaan.index', compact('data_anak'));
    }

    public function nonbinaanactivactivasi($id)
    {
        $anak = Anak::findOrFail($id);

        // Set status validasi ke "Aktif" menggunakan konstanta
        $anak->status_validasi = Anak::STATUS_AKTIF;
        $anak->save();

        // Redirect ke halaman Anak Binaan setelah aktivasi
        return redirect()->route('AnakBinaan.shelter')->with('success', 'Status validasi anak berhasil diaktifkan.');
    }

    public function show($id_anak)
    {
        // Ambil data anak beserta relasi keluarga, pendidikan, dan shelter
        $anak = Anak::with(['keluarga', 'anakPendidikan', 'shelter'])
                    ->findOrFail($id_anak);

        // Tentukan tab yang akan di-load
        $tab = request()->get('tab', 'data-anak');

        // Tampilkan halaman show dengan tab yang sesuai
        return view('AdminShalter.Pemberdayaan.DataBinaan.DataNonBinaan.show', compact('anak', 'tab'));
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
        return redirect()->route('NonAnakBinaan.shelter', ['page' => $currentPage])
                        ->with('success', 'Data Non Anak Binaan berhasil dihapus')
                        ->with('currentPage', $currentPage);
    }

}
