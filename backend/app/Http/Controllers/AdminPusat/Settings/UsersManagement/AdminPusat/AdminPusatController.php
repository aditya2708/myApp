<?php

namespace App\Http\Controllers\AdminPusat\Settings\UsersManagement\AdminPusat;

use App\Models\User;
use App\Models\AdminPusat;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AdminPusatController extends Controller
{
    public function index(Request $request) {
        $data_admin_pusat = AdminPusat::with('user')->get(); // Load relasi user
        return view('AdminPusat.Settings.UsersManagement.AdminPusat.index', compact('data_admin_pusat'));
    }

    public function create() {
        return view('AdminPusat.Settings.UsersManagement.AdminPusat.create');
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'nama_lengkap' => 'required',
            'alamat' => 'required',
            'no_hp' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
 
        try {
        // Buat akun user untuk admin pusat
        $user = User::create([
            'username' => $validated['nama_lengkap'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'level' => 'admin_pusat',
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

        // Buat data admin pusat
        $adminpusat = AdminPusat::create([
            'id_users' => $user->id_users, // Gunakan 'id_users' dari user yang baru dibuat
            'nama_lengkap' => $request->nama_lengkap,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
        ]);

        if ($request->hasFile('foto')) {
            $folderPath = 'AdminPusat/' . $adminpusat->id_admin_pusat;
            $fileName = $request->file('foto')->getClientOriginalName();
            $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public');

            // Simpan path relatif ke database
            $adminpusat->update(['foto' => $fileName]);

            Log::info('File diterima: ' . $request->file('foto')->getClientOriginalName());
        } else {
            Log::warning('File foto tidak ditemukan.');
        }

        return response()->json([
            'message' => 'Admin Pusat created successfully!',
            'data' => $user,
        ], 201);

        } catch (\Exception $e) {
            // Rollback jika ada error
            return response()->json([
                'message' => 'An error occurred while creating the Admin Shelter',
                'error' => $e->getMessage(),
            ], 500);
        }

        // Hitung jumlah total halaman dan kembalikan ke halaman terakhir
        /* $lastPage = ceil(AdminPusat::count() / 10) - 1;

        return redirect()->route('admin_pusat')
                         ->with('success', 'Admin Pusat berhasil ditambahkan')
                         ->with('currentPage', $lastPage); */
    }

    public function show($id_admin_pusat) {
        // Mengambil data admin pusat berdasarkan id_admin_pusat
        $adminpusat = AdminPusat::with(['user'])->findOrFail($id_admin_pusat);
        
        // Mengembalikan view dengan data yang diambil
        return view('AdminPusat.Settings.UsersManagement.AdminPusat.show', compact('adminpusat'));
    }

    public function edit($id_admin_pusat, Request $request)
    {
        // Temukan admin pusat berdasarkan ID
        $adminpusat = AdminPusat::with(['user'])->findOrFail($id_admin_pusat);
        
        // Current page untuk keperluan navigasi
        $currentPage = $request->query('current_page', 0);
        
        return view('AdminPusat.Settings.UsersManagement.AdminPusat.edit', compact('adminpusat', 'currentPage'));
    }
    
    public function update(Request $request, $id_admin_pusat)
    {
        $adminpusat = AdminPusat::findOrFail($id_admin_pusat);
    
        // Validasi data
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $adminpusat->user->id_users . ',id_users',
            'password' => 'nullable|min:6',
            'nama_lengkap' => 'required',
            'alamat' => 'required',
            'no_hp' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
    
        try {
            // Generate token baru
            $newToken = Str::random(60);

            // Update data user
            $userData = [
                'email' => $request->email,
                'level' => 'admin_pusat', // Level user sebagai 'donatur'
                'status' => 'aktif', // Status otomatis aktif
                'token' => $newToken,
            ];

            // Update data user
            if (!empty($request->password)) {
                $userData['password'] = Hash::make($request->password);
            }

            $adminpusat->user->update($userData);
    
            // Simpan foto jika ada
            if ($request->hasFile('foto')) {
                $folderPath = 'AdminPusat/' . $adminpusat->id_admin_pusat;
                $fileName = $request->file('foto')->getClientOriginalName();
                $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public');

                // Simpan path relatif ke database
                $adminpusat->update(['foto' => $fileName]);

                Log::info('File diterima: ' . $request->file('foto')->getClientOriginalName());
            } else {
                Log::warning('File foto tidak ditemukan.');
            }
        
            // Update data admin pusat
            $adminpusat->update([
                'nama_lengkap' => $request->nama_lengkap,
                'alamat' => $request->alamat,
                'no_hp' => $request->no_hp,
            ]);
        
            // Kirim data ke API eksternal
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post('https://kilauindonesia.org/kilau/api/updateUser', [
                'email' => $adminpusat->user->email,
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
                'message' => 'Admin Pusat Updated Succesfully!',
                'data' => $adminpusat,
            ], 201);

            } catch (\Exception $e) {
                Log::error('Error creating Admin Pusat: ' . $e->getMessage());
                return response()->json([
                    'message' => 'An error occurred while creating the pusat',
                    'error' => $e->getMessage(),
                ], 500);
            }
        }

    public function destroy(Request $request, $id_admin_pusat) {
        $adminpusat = AdminPusat::findOrFail($id_admin_pusat);

        if ($adminpusat->foto) {
            Storage::disk('public')->delete($adminpusat->foto);
        }

        $adminpusat->delete();

        $currentPage = $request->input('current_page', 0);

        return redirect()->route('admin_pusat', ['page' => $currentPage])
                         ->with('success', 'Data Admin Pusat berhasil dihapus')
                         ->with('currentPage', $currentPage);
    }
}
