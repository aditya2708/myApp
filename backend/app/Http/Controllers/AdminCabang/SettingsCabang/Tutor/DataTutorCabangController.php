<?php

namespace App\Http\Controllers\AdminCabang\SettingsCabang\Tutor;

use App\Models\Kacab;
use App\Models\Tutor;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class DataTutorCabangController extends Controller
{
    public function index(Request $request)
    {
        $user_id = auth()->user()->id_users;

        // Admin Cabang berdasarkan User
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Filter data Tutor berdasarkan Cabang
        $query = Tutor::with('kacab', 'wilbin', 'shelter')
            ->where('id_kacab', $adminCabang->id_kacab);

        if ($request->has('id_wilbin') && $request->id_wilbin != '') {
            $query->where('id_wilbin', $request->id_wilbin);
        }

        if ($request->has('id_shelter') && $request->id_shelter != '') {
            $query->where('id_shelter', $request->id_shelter);
        }

        $data_tutor = $query->get();
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();

        // Pastikan $wilbins terdefinisi
        $wilbins = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();

        return view('AdminCabang.Settings.Tutor.index', compact('data_tutor', 'kacab', 'wilbins'));
    }

    public function getWilbinByKacabCabang($id_kacab) {
        $wilbin = Wilbin::where('id_kacab', $id_kacab)->get();
        return response()->json($wilbin);
    }

    public function getShelterByWilbinCabang($id_wilbin) {
        $shelter = Shelter::where('id_wilbin', $id_wilbin)->get();
        return response()->json($shelter);
    }
    

    public function create()
    {
        $user_id = auth()->user()->id_users;

        // Admin Cabang berdasarkan User
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();
        $wilbins = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();

        return view('AdminCabang.Settings.Tutor.create', compact('kacab', 'wilbins'));
    }

    public function store(Request $request)
    {
        $user_id = auth()->user()->id_users;

        $request->validate([
            'nama' => 'required',
            'pendidikan' => 'required',
            'alamat' => 'required',
            'email' => 'required|email|unique:tutor',
            'no_hp' => 'required',
            'id_kacab' => 'required',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'maple' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        // Admin Cabang berdasarkan User
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang || $adminCabang->id_kacab != $request->id_kacab) {
            return redirect()->back()->withErrors('Data Kacab tidak valid.');
        }

        // Buat data tutor baru
        $tutor = Tutor::create([
            'nama' => $request->nama,
            'pendidikan' => $request->pendidikan,
            'alamat' => $request->alamat,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
            'id_kacab' => $adminCabang->id_kacab,
            'id_wilbin' => $request->id_wilbin,
            'id_shelter' => $request->id_shelter,
            'maple' => $request->maple,
        ]);

        // Menyimpan foto jika ada
        if ($request->hasFile('foto')) {
            $folderPath = 'Tutor/' . $tutor->id_tutor; // Folder berdasarkan ID tutor
            $fileName = $request->file('foto')->getClientOriginalName(); // Nama asli file
            $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public'); // Simpan file
            $tutor->update(['foto' => $fileName]); // Simpan path file ke database
        }

        // Hitung lastPage berdasarkan total data
        $lastPage = ceil(Tutor::count() / 10) - 1;

        return redirect()->route('tutor.cabang')
            ->with('success', 'Data Tutor berhasil ditambahkan')
            ->with('currentPage', $lastPage);
    }

    public function edit($id_tutor, Request $request)
    {
        $tutor = Tutor::findOrFail($id_tutor);
        $adminCabang = AdminCabang::where('user_id', auth()->user()->id_users)->first();

        if (!$adminCabang || $tutor->id_kacab != $adminCabang->id_kacab) {
            abort(403, 'Data tidak valid untuk Admin Cabang ini.');
        }

        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();
        $wilbin = Wilbin::where('id_kacab', $tutor->id_kacab)->get();
        $shelter = Shelter::where('id_wilbin', $tutor->id_wilbin)->get();

        return view('AdminCabang.Settings.Tutor.edit', compact('tutor', 'kacab', 'wilbin', 'shelter'))
            ->with('currentPage', $request->query('current_page', 0));
    }


    public function update(Request $request, $id_tutor)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'pendidikan' => 'required|string|max:255',
            'alamat' => 'required|string|max:255',
            'email' => 'required|email|unique:tutor,email,' . $id_tutor . ',id_tutor', // Validasi unique untuk email
            'no_hp' => 'required|string|max:15',
            'id_kacab' => 'required|integer',
            'id_wilbin' => 'required|integer',
            'id_shelter' => 'required|integer',
            'maple' => 'required|string|max:255',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $tutor = Tutor::findOrFail($id_tutor);
        $adminCabang = AdminCabang::where('user_id', auth()->user()->id_users)->first();

        if (!$adminCabang || $tutor->id_kacab != $adminCabang->id_kacab) {
            return redirect()->back()->withErrors('Data tidak valid untuk Admin Cabang ini.');
        }

        // Update data tutor
        $tutor->update([
            'nama' => $validated['nama'],
            'pendidikan' => $validated['pendidikan'],
            'alamat' => $validated['alamat'],
            'email' => $validated['email'],
            'no_hp' => $validated['no_hp'],
            'id_kacab' => $validated['id_kacab'],
            'id_wilbin' => $validated['id_wilbin'],
            'id_shelter' => $validated['id_shelter'],
            'maple' => $validated['maple'],
        ]);
    
        // Periksa apakah ada file foto yang diunggah
        if ($request->hasFile('foto')) {
            $folderPath = 'Tutor/' . $tutor->id_tutor; // Folder berdasarkan ID tutor
            $fileName = $request->file('foto')->getClientOriginalName(); // Nama asli file
            $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public'); // Simpan file
    
            // Hapus file foto lama jika ada
            if ($tutor->foto) {
                Storage::disk('public')->delete($tutor->foto);
            }
    
            // Simpan path foto baru ke database
            $tutor->update(['foto' => $fileName]);
        }

        return redirect()->route('tutor.cabang')
            ->with('success', 'Data Tutor berhasil diperbarui')
            ->with('currentPage', $request->input('current_page', 0));
    }

    public function destroy(Request $request, $id_tutor)
    {
        $tutor = Tutor::findOrFail($id_tutor);

        // Pastikan hanya Admin Cabang yang memiliki akses
        $adminCabang = AdminCabang::where('user_id', auth()->user()->id_users)->first();
        if (!$adminCabang || $tutor->id_kacab != $adminCabang->id_kacab) {
            return redirect()->route('tutor.cabang')
                ->withErrors('Anda tidak memiliki akses untuk menghapus data ini.');
        }

        // Hapus foto jika ada
        if ($tutor->foto) {
            Storage::disk('public')->delete($tutor->foto);
        }

        // Hapus data
        $tutor->delete();

        return redirect()->route('tutor.cabang')
            ->with('success', 'Data Tutor berhasil dihapus.')
            ->with('currentPage', $request->input('current_page', 0));
    }


}
