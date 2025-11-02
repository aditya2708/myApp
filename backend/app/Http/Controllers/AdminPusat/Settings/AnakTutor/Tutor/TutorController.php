<?php

namespace App\Http\Controllers\AdminPusat\Settings\AnakTutor\Tutor;

use App\Http\Controllers\Controller;
use App\Models\Tutor;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class TutorController extends Controller
{
    public function index(Request $request) {
        $query = Tutor::with('kacab', 'wilbin', 'shelter');
    
        if ($request->has('id_kacab') && $request->id_kacab != '') {
            $query->where('id_kacab', $request->id_kacab);
        }
    
        if ($request->has('id_wilbin') && $request->id_wilbin != '') {
            $query->where('id_wilbin', $request->id_wilbin);
        }
    
        if ($request->has('id_shelter') && $request->id_shelter != '') {
            $query->where('id_shelter', $request->id_shelter);
        }
    
        $data_tutor = $query->get();
        $kacab = Kacab::all();
        
        return view('AdminPusat.Settings.AnakTutor.Tutor.index', compact('data_tutor', 'kacab'));
    }
    

    public function create() {
        $kacab = Kacab::all();
        $wilbin = Wilbin::all(); 
        return view('AdminPusat.Settings.AnakTutor.Tutor.create', compact('kacab', 'wilbin'));
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'pendidikan' => 'required|string|max:255',
            'alamat' => 'required|string|max:255',
            'email' => 'required|email|unique:tutor,email',
            'no_hp' => 'required|string|max:15',
            'id_kacab' => 'required|integer',
            'id_wilbin' => 'required|integer',
            'id_shelter' => 'required|integer',
            'maple' => 'required|string|max:255',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Menyimpan foto jika ada
        $tutor = Tutor::create([
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
    
        // Menyimpan foto jika ada
        if ($request->hasFile('foto')) {
            $folderPath = 'Tutor/' . $tutor->id_tutor; // Folder berdasarkan ID tutor
            $fileName = $request->file('foto')->getClientOriginalName(); // Nama asli file
            $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public'); // Simpan file
            $tutor->update(['foto' => $fileName]); // Simpan path file ke database
        }

        $lastPage = ceil(Tutor::count() / 10) - 1;

        return redirect()->route('tutor')
                         ->with('success', 'Data Tutor berhasil ditambahkan')
                         ->with('currentPage', $lastPage);
    }    

    public function edit($id_tutor, Request $request) {
        $tutor = Tutor::findOrFail($id_tutor);
        $kacab = Kacab::all();
        $wilbin = Wilbin::where('id_kacab', $tutor->id_kacab)->get(); 
        $shelter = Shelter::where('id_wilbin', $tutor->id_wilbin)->get();
        return view('AdminPusat.Settings.AnakTutor.Tutor.edit', compact('tutor', 'kacab', 'wilbin', 'shelter'))
            ->with('currentPage', $request->query('current_page', 0));
    }

    public function update(Request $request, $id_tutor) {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'pendidikan' => 'required|string|max:255',
            'alamat' => 'required|string|max:255',
            'email' => 'required|email|unique:tutor,email,' . $id_tutor . ',id_tutor', 
            'no_hp' => 'required|string|max:15',
            'id_kacab' => 'required|integer',
            'id_wilbin' => 'required|integer',
            'id_shelter' => 'required|integer',
            'maple' => 'required|string|max:255',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
    
        // Cari data tutor berdasarkan ID
        $tutor = Tutor::findOrFail($id_tutor);
    
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
    
        return redirect()->route('tutor')
                         ->with('success', 'Data Tutor berhasil diperbarui')
                         ->with('currentPage', $request->input('current_page', 0));
    }

    public function destroy(Request $request, $id_tutor) {
        $tutor = Tutor::findOrFail($id_tutor);
        if ($tutor->foto) {
            Storage::disk('public')->delete($tutor->foto);
        }
        $tutor->delete();

        return redirect()->route('tutor')
                         ->with('success', 'Data Tutor berhasil dihapus')
                         ->with('currentPage', $request->input('current_page', 0));
    }
    
    public function getWilbinByKacab($id_kacab) {
        $wilbin = Wilbin::where('id_kacab', $id_kacab)->get();
        return response()->json($wilbin);
    }

    public function getShelterByWilbin($id_wilbin) {
        $shelter = Shelter::where('id_wilbin', $id_wilbin)->get();
        return response()->json($shelter);
    }
}
