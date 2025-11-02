<?php

namespace App\Http\Controllers\AdminPusat\Settings\MasterData\Konfigurasi;

use App\Models\Company;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

class KonfigurasiWebController extends Controller
{
    public function index() {
        $data_konfigurasi = Company::get();
        return view('AdminPusat.Settings.MasterData.Konfigurasi.index', compact('data_konfigurasi'));
    }

    public function create() {
        return view('AdminPusat.Settings.MasterData.Konfigurasi.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name_company' => 'required|string|max:255',
            'name_direktur' => 'required|string|max:255',
            'sk' => 'nullable|mimes:jpeg,png,jpg,pdf|max:2048',
            'npwp' => 'required|string|max:50',
            'no_hp' => 'required|string|max:20',
            'berdiri_tahun' => 'nullable|date',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'gambarbglogin' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'background_admin' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'icon' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'nama_web' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'keywords' => 'required|string|max:255',
            'metatext' => 'nullable|string',
            'alamat' => 'nullable|string',
            'peta' => 'nullable|string',
            'footer_web' => 'nullable|string',
            'footer_web2' => 'nullable|string',
            'nama_web_admin' => 'nullable|string',
        ]);

        $data = $validated;

        if ($request->hasFile('sk')) {
            $data['sk'] = $request->file('sk')->store('images/konfigurasi', 'public');
        }

        // Upload file jika ada
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('images/konfigurasi', 'public');
        }

        if ($request->hasFile('gambarbglogin')) {
            $data['gambarbglogin'] = $request->file('gambarbglogin')->store('images/konfigurasi', 'public');
        }

        if ($request->hasFile('background_admin')) {
            $data['background_admin'] = $request->file('background_admin')->store('images/konfigurasi', 'public');
        }

        if ($request->hasFile('icon')) {
            $data['icon'] = $request->file('icon')->store('images/konfigurasi', 'public');
        }

        // Simpan ke database
        Company::create($data);

        return redirect()->route('konfigurasiweb')->with('success', 'Konfigurasi berhasil ditambahkan.');
    }

    public function show($id_com) {
        $konfigurasi = Company::findOrFail($id_com);
        return view('AdminPusat.Settings.MasterData.Konfigurasi.show', compact('konfigurasi'));
    }
    
    public function edit($id_com)
    {
        $konfigurasi = Company::findOrFail($id_com);
        return view('AdminPusat.Settings.MasterData.Konfigurasi.edit', compact('konfigurasi'));
    }

    public function update(Request $request, $id_com)
    {
        $konfigurasi = Company::findOrFail($id_com);

        $validated = $request->validate([
            'name_company' => 'required|string|max:255',
            'name_direktur' => 'required|string|max:255',
            'sk' => 'nullable|mimes:jpeg,png,jpg,pdf|max:2048',
            'npwp' => 'required|string|max:50',
            'no_hp' => 'required|string|max:20',
            'berdiri_tahun' => 'nullable|date',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'gambarbglogin' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'background_admin' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'icon' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'nama_web' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'keywords' => 'required|string|max:255',
            'metatext' => 'nullable|string',
            'alamat' => 'nullable|string',
            'peta' => 'nullable|string',
            'footer_web' => 'nullable|string',
            'footer_web2' => 'nullable|string',
            'nama_web_admin' => 'nullable|string',
        ]);

        $data = $validated;

        // Perbarui file jika ada
        if ($request->hasFile('sk')) {
            if ($konfigurasi->sk) {
                Storage::disk('public')->delete($konfigurasi->sk);
            }
            $data['sk'] = $request->file('sk')->store('images/konfigurasi', 'public');
        }

        if ($request->hasFile('logo')) {
            if ($konfigurasi->logo) {
                Storage::disk('public')->delete($konfigurasi->logo);
            }
            $data['logo'] = $request->file('logo')->store('images/konfigurasi', 'public');
        }

        if ($request->hasFile('gambarbglogin')) {
            if ($konfigurasi->gambarbglogin) {
                Storage::disk('public')->delete($konfigurasi->gambarbglogin);
            }
            $data['gambarbglogin'] = $request->file('gambarbglogin')->store('images/konfigurasi', 'public');
        }

        if ($request->hasFile('background_admin')) {
            if ($konfigurasi->background_admin) {
                Storage::disk('public')->delete($konfigurasi->background_admin);
            }
            $data['background_admin'] = $request->file('background_admin')->store('images/konfigurasi', 'public');
        }

        if ($request->hasFile('icon')) {
            if ($konfigurasi->icon) {
                Storage::disk('public')->delete($konfigurasi->icon);
            }
            $data['icon'] = $request->file('icon')->store('images/konfigurasi', 'public');
        }

        // Perbarui data di database
        $konfigurasi->update($data);

        return redirect()->route('konfigurasiweb')->with('success', 'Konfigurasi berhasil diperbarui.');
    }

    public function delete($id_com)
    {
        $konfigurasi = Company::findOrFail($id_com);

        // Hapus file terkait jika ada
        if ($konfigurasi->sk) {
            Storage::disk('public')->delete($konfigurasi->sk);
        }
        if ($konfigurasi->logo) {
            Storage::disk('public')->delete($konfigurasi->logo);
        }
        if ($konfigurasi->gambarbglogin) {
            Storage::disk('public')->delete($konfigurasi->gambarbglogin);
        }
        if ($konfigurasi->background_admin) {
            Storage::disk('public')->delete($konfigurasi->background_admin);
        }
        if ($konfigurasi->icon) {
            Storage::disk('public')->delete($konfigurasi->icon);
        }

        // Hapus data di database
        $konfigurasi->delete();

        return response()->json([
            'message' => 'Konfigurasi berhasil dihapus.',
            'success' => true
        ]);
    }

}
