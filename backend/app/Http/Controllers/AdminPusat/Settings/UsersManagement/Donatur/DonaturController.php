<?php

namespace App\Http\Controllers\AdminPusat\Settings\UsersManagement\Donatur;

use App\Models\Anak;
use App\Models\Bank;
use App\Models\User;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Donatur;
use App\Models\Shelter;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class DonaturController extends Controller
{
    public function index(Request $request) {
        $query = Donatur::with('kacab', 'wilbin', 'shelter', 'bank'); // Tambahkan relasi ke bank
        
        if ($request->has('id_kacab') && $request->id_kacab != '') {
            $query->where('id_kacab', $request->id_kacab);
        }
    
        if ($request->has('id_wilbin') && $request->id_wilbin != '') {
            $query->where('id_wilbin', $request->id_wilbin);
        }
    
        if ($request->has('id_shelter') && $request->id_shelter != '') {
            $query->where('id_shelter', $request->id_shelter);
        }
    
        $data_donatur = $query->get();
        $kacab = Kacab::all();
    
        return view('AdminPusat.Settings.UsersManagement.Donatur.index', compact('data_donatur', 'kacab'));
    }
      
    public function create() {
        $kacab = Kacab::all();
        $wilbin = Wilbin::all();
        $banks = Bank::all();  // Ambil data bank dari model Bank
        return view('AdminPusat.Settings.UsersManagement.Donatur.create', compact('kacab', 'wilbin', 'banks'));
    }

    /* public function store(Request $request) {
        $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'id_kacab' => 'required',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'nama_lengkap' => 'required',
            'alamat' => 'required',
            'no_hp' => 'required',
            'id_bank' => 'nullable',
            'no_rekening' => 'nullable',
            'diperuntukan' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        // Buat akun user untuk donatur
        $user = User::create([
            'username' => $request->nama_lengkap,
            'email' => $request->email,
            'password' => Hash::make($validated['password']),
            'level' => 'donatur',  // Level user diset sebagai 'donatur'
            'status' => 'aktif',  // Status otomatis aktif
            'token_api' => Str::random(60)
        ]);

            // Kirim data ke API eksternal
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post('https://kilauindonesia.org/kilau/api/createUser', [
                'nama' => $user->username,
                'email' => $user->email,
                'password' => bcrypt($validated['password']), 
                'token' => $user->token_api,
            ]);

        // Save the photo if provided
        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('UsersManagement/Donatur/', 'public');
        }

        // Buat data donatur
        Donatur::create([
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
            'foto' => $fotoPath
        ]);

        // $lastPage = ceil(Donatur::count() / 10) - 1;

        // return redirect()->route('donatur')
        //                  ->with('success', 'Data Donatur dan Akun Pengguna berhasil ditambahkan')
        //                  ->with('currentPage', $lastPage);
        if ($response->successful()) {
                            return response()->json([
                                'message' => 'User created successfully!',
                                'data' => $user,
                                'api_response' => $response->json(),
                            ], 201);
        } else {
                            // Jika gagal, rollback lokal dan kembalikan pesan error
                 $user->delete();
                return response()->json([
                                'message' => 'Failed to create user in external API',
                                'error' => $response->json(),
                            ], 500);
                        }
    } */

    public function store(Request $request)
    {
        // Validasi langsung tanpa menyimpan ke variabel
        $validated = $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'id_kacab' => 'required',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'nama_lengkap' => 'required',
            'alamat' => 'required',
            'no_hp' => 'required',
            'id_bank' => 'nullable',
            'no_rekening' => 'nullable',
            'diperuntukan' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            // Buat akun user untuk donatur
            $user = User::create([
                'username' => $request->nama_lengkap,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'level' => 'donatur', // Level user sebagai 'donatur'
                'status' => 'aktif', // Status otomatis aktif
                'token' => Str::random(60),
            ]);

              // Kirim data ke API eksternal
              $response = Http::withHeaders(['Content-Type' => 'application/json'])
              ->post('https://kilauindonesia.org/kilau/api/createUser', [
                  'nama' => $user->username,
                  'email' => $user->email,
                  'password' => bcrypt($validated['password']),  // Password asli dikirim ke API eksternal
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

            // Buat data donatur terlebih dahulu
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


    public function show($id_donatur) {
        $donatur = Donatur::with(['user', 'kacab', 'wilbin', 'shelter', 'bank'])->findOrFail($id_donatur);
        
        // Cek apakah tab anak asuh dipilih
        if (request()->has('tab') && request()->get('tab') == 'anak-asuh') {
            // Ambil data anak asuh yang terkait dengan donatur ini
            $anak_asuh_list = Anak::with('anakPendidikan') // Menggunakan relasi untuk mengambil data pendidikan
                ->where('id_donatur', $id_donatur)
                ->get()
                ->map(function ($anak) {
                    return [
                        'id' => $anak->id_anak, // Tambahkan id untuk route
                        'nama' => $anak->full_name,
                        'jenis_kelamin' => $anak->jenis_kelamin,
                        'agama' => $anak->agama,
                        'tanggal_lahir' => $anak->tanggal_lahir,
                        'kelas' => $anak->anakPendidikan->kelas ?? '-' // Mengambil kelas dari relasi anakPendidikan
                    ];
                });
    
            $anak_asuh_count = $anak_asuh_list->count();
    
            return view('AdminPusat.Settings.UsersManagement.Donatur.show', compact('donatur', 'anak_asuh_count', 'anak_asuh_list'));
        }
        
        // Jika tab lain (informasi personal), kirim data donatur saja
        return view('AdminPusat.Settings.UsersManagement.Donatur.show', compact('donatur'));
    }
    

    public function edit($id_donatur, Request $request) {
        // Temukan donatur berdasarkan ID
        $donatur = Donatur::with(['user', 'kacab', 'wilbin', 'shelter', 'bank'])->findOrFail($id_donatur);
        
        // Ambil semua data relasi yang diperlukan
        $kacab = Kacab::all();
        $wilbin = Wilbin::where('id_kacab', $donatur->id_kacab)->get();
        $shelter = Shelter::where('id_wilbin', $donatur->id_wilbin)->get();
        $banks = Bank::all();
        
        // Pastikan current_page diteruskan ke view dengan aman
        $currentPage = $request->query('current_page', 0); // Mengambil current_page dari query string
        
        // Kirim currentPage ke view bersama dengan data lainnya
        return view('AdminPusat.Settings.UsersManagement.Donatur.edit', compact('donatur', 'kacab', 'wilbin', 'shelter', 'banks', 'currentPage'));
    }
    
    
    public function update(Request $request, $id_donatur)
    {
        $donatur = Donatur::findOrFail($id_donatur);

        // Validasi data
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $donatur->id_users . ',id_users',
            'password' => 'nullable|min:6',
            'id_kacab' => 'required',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'nama_lengkap' => 'required',
            'alamat' => 'required',
            'no_hp' => 'required',
            'id_bank' => 'nullable',
            'no_rekening' => 'nullable',
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
                $userData['password'] = Hash::make($request->password);
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

    
    
    public function destroy(Request $request, $id_donatur) {
        $donatur = Donatur::findOrFail($id_donatur);

        if ($donatur->foto) {
            Storage::disk('public')->delete($donatur->foto);
        }

        $donatur->delete();

        $currentPage = $request->input('current_page', 0);

        return redirect()->route('donatur', ['page' => $currentPage])
                         ->with('success', 'Data Donatur berhasil dihapus')
                         ->with('currentPage', $currentPage);
    }

}
