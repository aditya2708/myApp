<?php

namespace App\Http\Controllers\AdminPusat\Settings\UsersManagement\AdminShelter;

use App\Models\Bank;
use App\Models\User;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use Illuminate\Support\Str;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AdminShelterController extends Controller
{
    public function index(Request $request) {
        $query = AdminShelter::with('kacab', 'wilbin', 'shelter');
    
        if ($request->has('id_kacab') && $request->id_kacab != '') {
            $query->where('id_kacab', $request->id_kacab);
        }
    
        if ($request->has('id_wilbin') && $request->id_wilbin != '') {
            $query->where('id_wilbin', $request->id_wilbin);
        }
    
        if ($request->has('id_shelter') && $request->id_shelter != '') {
            $query->where('id_shelter', $request->id_shelter);
        }
    
        $data_admin_shelter = $query->get();
        $kacab = Kacab::all();
        
        return view('AdminPusat.Settings.UsersManagement.AdminShelter.index', compact('data_admin_shelter', 'kacab'));
    }   

    public function create() {
        $kacab = Kacab::all();
        $wilbin = Wilbin::all();
        $shelters = Shelter::all();
        return view('AdminPusat.Settings.UsersManagement.AdminShelter.create', compact('kacab', 'wilbin', 'shelters'));
    }

   /*  public function store(Request $request) {
        $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'id_kacab' => 'required',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'nama_lengkap' => 'required',
            'alamat_adm' => 'required',
            'no_hp' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        // Buat akun user untuk admin shelter
        $user = User::create([
            'username' => $request->nama_lengkap,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'level' => 'admin_shelter',
            'status' => 'aktif',
        ]);

        // Simpan foto jika ada
        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('AdminShelter/Shelter', 'public');
        }

        // Buat data admin shelter
        AdminShelter::create([
            'user_id' => $user->id_users,
            'id_kacab' => $request->id_kacab,
            'id_wilbin' => $request->id_wilbin,
            'id_shelter' => $request->id_shelter,
            'nama_lengkap' => $request->nama_lengkap,
            'alamat_adm' => $request->alamat_adm,
            'no_hp' => $request->no_hp,
            'foto' => $fotoPath
        ]);

        // Hitung jumlah total halaman dan kembalikan ke halaman terakhir
        $lastPage = ceil(AdminShelter::count() / 10) - 1;

        return redirect()->route('admin_shelter')
                         ->with('success', 'Admin Shelter berhasil ditambahkan')
                         ->with('currentPage', $lastPage);
    }
    */

    public function store(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'id_kacab' => 'required',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'nama_lengkap' => 'required',
            'alamat_adm' => 'required',
            'no_hp' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            // Buat akun user untuk admin shelter
            $user = User::create([
                'username' => $validated['nama_lengkap'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'level' => 'admin_shelter',
                'status' => 'aktif',
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

            // Buat data admin shelter
            $adminShelter = AdminShelter::create([
                'user_id' => $user->id_users,
                'id_kacab' => $validated['id_kacab'],
                'id_wilbin' => $validated['id_wilbin'],
                'id_shelter' => $validated['id_shelter'],
                'nama_lengkap' => $validated['nama_lengkap'],
                'alamat_adm' => $validated['alamat_adm'],
                'no_hp' => $validated['no_hp'],
            ]);

            if ($request->hasFile('foto')) {
                $folderPath = 'AdminShelter/' . $adminShelter->id_admin_shelter;
                $fileName = $request->file('foto')->getClientOriginalName();
                $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public');

                // Simpan path relatif ke database
                $adminShelter->update(['foto' => $fileName]);

                Log::info('File diterima: ' . $request->file('foto')->getClientOriginalName());
            } else {
                Log::warning('File foto tidak ditemukan.');
            }

            return response()->json([
                'message' => 'Admin Shelter created successfully!',
                'data' => $user,
            ], 201);

        } catch (\Exception $e) {
            // Rollback jika ada error
            return response()->json([
                'message' => 'An error occurred while creating the Admin Shelter',
                'error' => $e->getMessage(),
            ], 500);
        }
    }


    public function show($id_admin_shelter) {
        // Fetch Admin Shelter data with relationships
        $adminshelter = AdminShelter::with(['user', 'kacab', 'wilbin', 'shelter'])->findOrFail($id_admin_shelter);
        
        // Return the view with the data
        return view('AdminPusat.Settings.UsersManagement.AdminShelter.show', compact('adminshelter'));
    }

    public function edit($id_admin_shelter, Request $request) {
        // Temukan admin shelter berdasarkan ID
        $adminshelter = AdminShelter::with(['user', 'kacab', 'wilbin', 'shelter'])->findOrFail($id_admin_shelter);
        
        // Ambil semua data relasi yang diperlukan
        $kacab = Kacab::all();
        $wilbin = Wilbin::where('id_kacab', $adminshelter->id_kacab)->get();
        $shelters = Shelter::where('id_wilbin', $adminshelter->id_wilbin)->get();
        
        // Pastikan current_page diteruskan ke view dengan aman
        $currentPage = $request->query('current_page', 0); // Mengambil current_page dari query string
        
        // Kirim currentPage ke view bersama dengan data lainnya
        return view('AdminPusat.Settings.UsersManagement.AdminShelter.edit', compact('adminshelter', 'kacab', 'wilbin', 'shelters', 'currentPage'));
    }

    public function update(Request $request, $id_admin_shelter) {
        $adminshelter = AdminShelter::findOrFail($id_admin_shelter);
    
        // Validasi data
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $adminshelter->user->id_users . ',id_users',
            'password' => 'nullable|min:6',
            'id_kacab' => 'required',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'nama_lengkap' => 'required',
            'alamat_adm' => 'required',
            'no_hp' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
    
        try {
            // Generate token baru
            $newToken = Str::random(60);

            // Update data user
            $userData = [
                'email' => $request->email,
                'level' => 'admin_shelter', // Level user sebagai 'donatur'
                'status' => 'aktif', // Status otomatis aktif
                'token' => $newToken,
            ];

            // Update data user
            if (!empty($request->password)) {
                $userData['password'] = Hash::make($request->password);
            }
            
            $adminshelter->user->update($userData);
    
            // Simpan foto jika ada
            if ($request->hasFile('foto')) {
                $folderPath = 'AdminShelter/' . $adminshelter->id_admin_shelter;
                $fileName = $request->file('foto')->getClientOriginalName();
                $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public');

                // Simpan path relatif ke database
                $adminshelter->update(['foto' => $fileName]);
            }
        
            // Update data admin shelter
            $adminshelter->update([
                'id_kacab' => $request->id_kacab,
                'id_wilbin' => $request->id_wilbin,
                'id_shelter' => $request->id_shelter,
                'nama_lengkap' => $request->nama_lengkap,
                'alamat_adm' => $request->alamat_adm,
                'no_hp' => $request->no_hp,
            ]);
    
                // Kirim data ke API eksternal
                $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->post('https://kilauindonesia.org/kilau/api/updateUser', [
                    'email' => $adminshelter->user->email,
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
                'message' => 'Admin Shelter Updated Succesfully!',
                'data' => $adminshelter,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating Admin Shelter: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while creating the donatur',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, $id_admin_shelter) {
        $adminshelter = AdminShelter::findOrFail($id_admin_shelter);

        if ($adminshelter->foto) {
            Storage::disk('public')->delete($adminshelter->foto);
        }

        $adminshelter->delete();

        $currentPage = $request->input('current_page', 0);

        return redirect()->route('admin_shelter', ['page' => $currentPage])
                         ->with('success', 'Data Admin Shelter berhasil dihapus')
                         ->with('currentPage', $currentPage);
    }
        
}
