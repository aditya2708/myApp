<?php

namespace App\Http\Controllers\AdminCabang\SettingsCabang\DataWilayahCabang\Wilbin;

use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class WilayahBinaanCabangController extends Controller
{
    public function index() {
        // Ambil user yang sedang login
        $user_id = auth()->user()->id_users;

        // Ambil data AdminCabang yang terkait dengan user
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Ambil wilayah binaan yang sesuai dengan kantor cabang admin
        $data_wilbin = Wilbin::where('id_kacab', $adminCabang->id_kacab)->with('kacab')->get();

        return view('AdminCabang.Settings.DataWilayah.Wilbin.index', compact('data_wilbin'));
    }

    public function create() {
        // Ambil user yang sedang login
        $user_id = auth()->user()->id_users;

        // Ambil data AdminCabang yang terkait dengan user
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Ambil kantor cabang yang sesuai dengan AdminCabang
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();

        return view('AdminCabang.Settings.DataWilayah.Wilbin.create', compact('kacab'));
    }

    public function store(Request $request) {
        $request->validate([
            'nama_wilbin' => 'required',
            'id_kacab' => 'required',
        ]);

        // Menyimpan data wilayah binaan
        Wilbin::create([
            'nama_wilbin' => $request->nama_wilbin,
            'id_kacab' => $request->id_kacab
        ]);

        // Menghitung halaman terakhir jika data bertambah
        $totalData = Wilbin::count();
        $perPage = 10;
        $lastPage = ceil($totalData / $perPage) - 1;

        return redirect()->route('wilayah_binaan.cabang')
                         ->with('success', 'Data Wilayah Binaan berhasil ditambahkan')
                         ->with('currentPage', $lastPage);
    }

    public function edit($id_wilbin, Request $request) {
        // Ambil user yang sedang login
        $user_id = auth()->user()->id_users;

        // Ambil data AdminCabang yang terkait dengan user
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Cari Wilbin dan pastikan sesuai dengan kantor cabang AdminCabang
        $wilbin = Wilbin::where('id_wilbin', $id_wilbin)
                        ->where('id_kacab', $adminCabang->id_kacab)
                        ->firstOrFail();

        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();

        return view('AdminCabang.Settings.DataWilayah.Wilbin.edit', compact('wilbin', 'kacab'))
            ->with('currentPage', $request->query('current_page', 0));
    }

    public function update(Request $request, $id_wilbin) {
        $request->validate([
            'nama_wilbin' => 'required',
            'id_kacab' => 'required',
        ]);

        // Ambil user yang sedang login
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Update Wilbin jika sesuai dengan kantor cabang AdminCabang
        $wilbin = Wilbin::where('id_wilbin', $id_wilbin)
                        ->where('id_kacab', $adminCabang->id_kacab)
                        ->firstOrFail();

        $wilbin->update($request->all());

        return redirect()->route('wilayah_binaan.cabang')
                         ->with('success', 'Data Wilayah Binaan berhasil diperbarui')
                         ->with('currentPage', $request->input('current_page', 0));
    }

    public function destroy(Request $request, $id_wilbin) {
        // Ambil user yang sedang login
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Hapus Wilbin jika sesuai dengan kantor cabang AdminCabang
        $wilbin = Wilbin::where('id_wilbin', $id_wilbin)
                        ->where('id_kacab', $adminCabang->id_kacab)
                        ->firstOrFail();

        $wilbin->delete();

        return redirect()->route('wilayah_binaan.cabang')
                         ->with('success', 'Data Wilayah Binaan berhasil dihapus')
                         ->with('currentPage', $request->input('current_page', 0));
    }
}
