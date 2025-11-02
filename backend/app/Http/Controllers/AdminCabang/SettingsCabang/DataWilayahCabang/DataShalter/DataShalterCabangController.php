<?php

namespace App\Http\Controllers\AdminCabang\SettingsCabang\DataWilayahCabang\DataShalter;

use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DataShalterCabangController extends Controller
{
    public function index() {
        // Ambil user yang sedang login
        $user_id = auth()->user()->id_users;

        // Ambil data AdminCabang yang terkait dengan user
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Ambil data Shelter yang terkait dengan Wilayah Binaan dari kantor cabang
        $data_shelter = Shelter::whereHas('wilbin', function($query) use ($adminCabang) {
            $query->where('id_kacab', $adminCabang->id_kacab);
        })->with('wilbin')->get();

        return view('AdminCabang.Settings.DataWilayah.Shelter.index', compact('data_shelter'));
    }

    public function create() {
        // Ambil user yang sedang login
        $user_id = auth()->user()->id_users;

        // Ambil data AdminCabang yang terkait dengan user
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Ambil Wilayah Binaan yang terkait dengan kantor cabang
        $wilbin = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();

        return view('AdminCabang.Settings.DataWilayah.Shelter.create', compact('wilbin'));
    }

    public function store(Request $request) {
        $request->validate([
            'nama_shelter' => 'required',
            'nama_kordinator' => 'required',
            'no_telpon' => 'required',
            'alamat' => 'required',
            'id_wilbin' => 'required',
        ]);

        Shelter::create($request->all());

        // Menghitung halaman terakhir jika data bertambah
        $totalData = Shelter::count();
        $perPage = 10;
        $lastPage = ceil($totalData / $perPage) - 1;

        return redirect()->route('data_shalter.cabang')
                         ->with('success', 'Data Shelter berhasil ditambahkan')
                         ->with('currentPage', $lastPage);
    }

    public function edit($id_shelter) {
        // Find the shelter to edit
        $shelter = Shelter::findOrFail($id_shelter);
    
        // Get the logged-in user's ID
        $user_id = auth()->user()->id_users;
    
        // Retrieve the AdminCabang data for the logged-in user
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Get Wilayah Binaan related to the AdminCabang's branch
        $wilbin = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();
    
        return view('AdminCabang.Settings.DataWilayah.Shelter.edit', compact('shelter', 'wilbin'));
    }
    

    // Memperbarui data shelter yang ada
    public function update(Request $request, $id_shelter) {
        $request->validate([
            'nama_shelter' => 'required',
            'nama_kordinator' => 'required',
            'no_telpon' => 'required',
            'alamat' => 'required',
            'id_wilbin' => 'required',
        ]);
    
        // Get the logged-in user's ID
        $user_id = auth()->user()->id_users;
    
        // Retrieve the AdminCabang data for the logged-in user
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Check if the shelter belongs to the AdminCabang's branch
        $shelter = Shelter::where('id_shelter', $id_shelter)
                          ->whereHas('wilbin', function($query) use ($adminCabang) {
                              $query->where('id_kacab', $adminCabang->id_kacab);
                          })
                          ->firstOrFail();
    
        // Update the shelter with validated data
        $shelter->update($request->all());
    
        // Retrieve the current page from the form or default to 0
        $currentPage = $request->input('current_page', 0);
    
        // Redirect back to the Data Shelter page with the correct page position
        return redirect()->route('data_shalter.cabang')
                         ->with('success', 'Data Shelter berhasil diperbarui')
                         ->with('currentPage', $currentPage);
    }
    

    public function destroy(Request $request, $id_shelter) {
        $shelter = Shelter::findOrFail($id_shelter);
        $shelter->delete();

        $currentPage = $request->input('current_page', 0);

        return redirect()->route('data_shalter.cabang')
                         ->with('success', 'Data Shelter berhasil dihapus')
                         ->with('currentPage', $currentPage);
    }
}
