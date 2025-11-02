<?php

namespace App\Http\Controllers\AdminCabang\SettingsCabang\UsersManagement\Donatur;

use App\Models\Anak;
use App\Models\Bank;
use App\Models\User;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Donatur;
use App\Models\Shelter;
use App\Models\AdminCabang;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class DonaturCabangController extends Controller
{
    public function index(Request $request) {
        $user_id = auth()->user()->id_users;

        // Mendapatkan admin cabang berdasarkan user ID
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Hanya mengambil donatur yang terkait dengan admin cabang yang login
        $query = Donatur::with('kacab', 'wilbin', 'shelter', 'bank')
            ->where('id_kacab', $adminCabang->id_kacab);

        // Filter tambahan jika diperlukan
        if ($request->has('id_wilbin') && $request->id_wilbin != '') {
            $query->where('id_wilbin', $request->id_wilbin);
        }

        if ($request->has('id_shelter') && $request->id_shelter != '') {
            $query->where('id_shelter', $request->id_shelter);
        }

        $data_donatur = $query->get();

        // Data untuk dropdown
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();
        $wilbins = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();

        return view('AdminCabang.Settings.UsersManagement.Donatur.index', compact('data_donatur', 'kacab', 'wilbins'));
    }

    public function create() {
        $user_id = auth()->user()->id_users;
    
        // Mendapatkan admin cabang berdasarkan user ID
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Hanya kacab dan wilayah binaan yang sesuai dengan admin cabang yang login
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();
        $wilbin = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();
        $banks = Bank::all(); // Data bank tetap global
    
        return view('AdminCabang.Settings.UsersManagement.Donatur.create', compact('kacab', 'wilbin', 'banks'));
    }
    

    public function store(Request $request) {
        $user_id = auth()->user()->id_users;
    
        // Mendapatkan admin cabang berdasarkan user ID
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        $validated = $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'nama_lengkap' => 'required',
            'alamat' => 'required',
            'no_hp' => 'required',
            'id_bank' => 'required',
            'no_rekening' => 'required',
            'diperuntukan' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
    
        try {
        // Buat akun user untuk donatur
        $user = User::create([
            'username' => $validated['nama_lengkap'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'level' => 'donatur',
            'status' => 'aktif',
            'token' => Str::random(60),
        ]);

        // Kirim data ke API eksternal
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
        ->post('https://kilauindonesia.org/kilau/api/createUser', [
            'nama' => $user->username,
            'email' => $user->email,
            'password' => bcrypt($validated['password']), // Password asli dikirim ke API eksternal
            'token' => $user->token,
        ]);

       if (!$response->successful()) {
           // Hapus user jika gagal membuat di API eksternal
           $user->delete();
           return response()->json([
               'message' => 'Failed to create user in external API',
               'error' => $response->json(),
           ], 500);
       }
    
        $donatur = Donatur::create([
            'id_users' => $user->id_users,
            'id_kacab' => $request->id_kacab,
            'id_wilbin' => $request->id_wilbin,
            'id_shelter' => $request->id_shelter,
            'nama_lengkap' => $request->nama_lengkap,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
            'id_bank' => $request->id_bank,
            'no_rekening' => $request->no_rekening,
            'diperuntukan' => $request->diperuntukan,
        ]);

        // Simpan foto jika ada
        if ($request->hasFile('foto')) {
            // Tentukan path folder berdasarkan ID donatur
            $folderPath = 'Donatur/' . $donatur->id_donatur;
            $fileName = $request->file('foto')->getClientOriginalName();
            $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public'); 

            // Simpan path relatif ke database
            $donatur->update(['foto' => $fileName]);

            Log::info('File diterima: ' . $request->file('foto')->getClientOriginalName());
        } else {
            // Log jika file foto tidak ditemukan
            Log::warning('File foto tidak ditemukan.');
        }

        return response()->json([
            'message' => 'Donatur created successfully!',
            'data' => $user,
        ], 201);

        } catch (\Exception $e) {
            // Rollback jika ada error
            return response()->json([
                'message' => 'An error occurred while creating the Admin Shelter',
                'error' => $e->getMessage(),
            ], 500);
        }
    
        /* $lastPage = ceil(Donatur::where('id_kacab', $adminCabang->id_kacab)->count() / 10);
    
        return redirect()->route('donatur.cabang')
                         ->with('success', 'Data Donatur dan Akun Pengguna berhasil ditambahkan')
                         ->with('currentPage', $lastPage); */
    }

    public function show($id_donatur) {
        $user_id = auth()->user()->id_users;
    
        // Mendapatkan admin cabang berdasarkan user ID
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Pastikan donatur hanya bisa diakses jika sesuai dengan id_kacab admin cabang yang login
        $donatur = Donatur::with(['user', 'kacab', 'wilbin', 'shelter', 'bank'])
            ->where('id_kacab', $adminCabang->id_kacab)
            ->findOrFail($id_donatur);
    
        if (request()->has('tab') && request()->get('tab') == 'anak-asuh') {
            // Ambil data anak asuh yang terkait dengan donatur ini
            $anak_asuh_list = Anak::with('anakPendidikan') // Menggunakan relasi untuk mengambil data pendidikan
                ->where('id_donatur', $id_donatur)
                ->get()
                ->map(function ($anak) {
                    return [
                        'id' => $anak->id_anak,
                        'nama' => $anak->full_name,
                        'jenis_kelamin' => $anak->jenis_kelamin,
                        'agama' => $anak->agama,
                        'tanggal_lahir' => $anak->tanggal_lahir,
                        'kelas' => $anak->anakPendidikan->kelas ?? '-' // Mengambil kelas dari relasi anakPendidikan
                    ];
                });
    
            $anak_asuh_count = $anak_asuh_list->count();
    
            return view('AdminCabang.Settings.UsersManagement.Donatur.show', compact('donatur', 'anak_asuh_count', 'anak_asuh_list'));
        }
    
        // Jika tab lain (informasi personal), kirim data donatur saja
        return view('AdminCabang.Settings.UsersManagement.Donatur.show', compact('donatur'));
    }
    
    public function edit($id_donatur, Request $request) {
        $user_id = auth()->user()->id_users;
    
        // Mendapatkan admin cabang berdasarkan user ID
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Pastikan donatur hanya bisa diakses jika sesuai dengan id_kacab admin cabang yang login
        $donatur = Donatur::with(['user', 'kacab', 'wilbin', 'shelter', 'bank'])
            ->where('id_kacab', $adminCabang->id_kacab)
            ->findOrFail($id_donatur);
    
        // Ambil data relasi yang relevan
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();
        $wilbin = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();
        $shelter = Shelter::where('id_wilbin', $donatur->id_wilbin)->get();
        $banks = Bank::all();
    
        // Menyimpan current_page untuk navigasi kembali setelah update
        $currentPage = $request->query('current_page', 0);
    
        return view('AdminCabang.Settings.UsersManagement.Donatur.edit', compact('donatur', 'kacab', 'wilbin', 'shelter', 'banks', 'currentPage'));
    }
    
    public function update(Request $request, $id_donatur) {
        $user_id = auth()->user()->id_users;
    
        // Mendapatkan admin cabang berdasarkan user ID
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Pastikan donatur hanya bisa diakses jika sesuai dengan id_kacab admin cabang yang login
        $donatur = Donatur::where('id_kacab', $adminCabang->id_kacab)->findOrFail($id_donatur);
    
        // Validasi data
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $donatur->user->id_users . ',id_users',
            'password' => 'nullable|min:6',
            'id_kacab' => 'required',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'nama_lengkap' => 'required',
            'alamat' => 'required',
            'no_hp' => 'required',
            'id_bank' => 'required',
            'no_rekening' => 'required',
            'diperuntukan' => 'required',
            'status' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
    
        try {
            // Generate token baru
            $newToken = Str::random(60);

            // Update data user
            $userData = [
                'email' => $request->email,
                'level' => 'donatur', // Level user sebagai 'donatur'
                'status' => 'aktif', // Status otomatis aktif
                'token' => $newToken,
            ];
    
            // Jika password diisi, update password
            if (!empty($request->password)) {
                $donatur->user->update(['password' => Hash::make($request->password)]);
            }

            $donatur->user->update($userData);
    
            // Simpan foto jika ada
            if ($request->hasFile('foto')) {
                $folderPath = 'Donatur/' . $donatur->id_donatur; // Tentukan folder path sesuai ID donatur
                $fileName = $request->file('foto')->getClientOriginalName();
                $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public'); 

                // Simpan path relatif ke database
                $donatur->update(['foto' => $fileName]);
            }
        
            // Update data donatur
            $donatur->update([
                'id_kacab' => $request->id_kacab,
                'id_wilbin' => $request->id_wilbin,
                'id_shelter' => $request->id_shelter,
                'nama_lengkap' => $request->nama_lengkap,
                'alamat' => $request->alamat,
                'no_hp' => $request->no_hp,
                'id_bank' => $request->id_bank,
                'no_rekening' => $request->no_rekening,
                'diperuntukan' => $request->diperuntukan,
            ]);
        
            // Kirim data ke API eksternal
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post('https://kilauindonesia.org/kilau/api/updateUser', [
                'email' => $donatur->user->email,
                'token' => !empty($request->password) ? bcrypt($request->password) : null, // Password bcrypt
                'password' => $newToken,
            ]);

            // Cek apakah API eksternal berhasil
            if (!$response->successful()) {
                return response()->json([
                    'message' => 'Failed to update user in external API',
                    'error' => $response->json(),
                ], 500);
            }

            return response()->json([
                'message' => 'Donatur Updated Succesfully!',
                'data' => $donatur,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating donatur: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while creating the donatur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, $id_donatur)
    {
        $user_id = auth()->user()->id_users;

        // Validasi admin cabang yang login
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Pastikan donatur terkait dengan cabang admin yang login
        $donatur = Donatur::where('id_kacab', $adminCabang->id_kacab)->findOrFail($id_donatur);

        // Hapus file foto jika ada
        if ($donatur->foto && Storage::disk('public')->exists($donatur->foto)) {
            Storage::disk('public')->delete($donatur->foto);
        }

        // Hapus data pengguna terkait
        if ($donatur->user) {
            $donatur->user->delete();
        }

        // Hapus data donatur
        $donatur->delete();

        // Ambil halaman saat ini untuk navigasi
        $currentPage = $request->input('current_page', 0);

        return redirect()->route('donatur.cabang', ['page' => $currentPage])
                        ->with('success', 'Data Donatur berhasil dihapus');
    }

    
}
