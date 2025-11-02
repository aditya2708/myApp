<?php

namespace App\Http\Controllers\AdminPusat\Settings\UsersManagement\AdminCabang;

use App\Models\User;
use App\Models\Kacab;
use App\Models\AdminCabang;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class AdminCabangController extends Controller
{
    public function index(Request $request) {
        $query = AdminCabang::with('kacab', 'user');
    
        // Filter berdasarkan kacab jika dipilih
        if ($request->has('id_kacab') && $request->id_kacab != '') {
            $query->where('id_kacab', $request->id_kacab);
        }
    
        $data_admin_cabang = $query->get();
        $kacab = Kacab::all();
        
        return view('AdminPusat.Settings.UsersManagement.AdminCabang.index', compact('data_admin_cabang', 'kacab'));
    }

    public function create() {
        $kacab = Kacab::all();
        return view('AdminPusat.Settings.UsersManagement.AdminCabang.create', compact('kacab'));
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'id_kacab' => 'required',
            'nama_lengkap' => 'required',
            'alamat' => 'required',
            'no_hp' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        try {
        // Buat akun user untuk admin cabang
        $user = User::create([
            'username' => $validated['nama_lengkap'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'level' => 'admin_cabang',
            'status' => 'aktif',
            'token' => Str::random(60), // Token API acak
        ]);

         // Kirim data ke API eksternal
         $response = Http::withHeaders(['Content-Type' => 'application/json'])
         ->post('https://kilauindonesia.org/kilau/api/createUser', [
             'nama' => $user->username,
             'email' => $user->email,
             'password' => $validated['password'], // Password asli dikirim ke API eksternal
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

        // Buat data admin cabang
        $admincabang =  AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $request->id_kacab,
            'nama_lengkap' => $request->nama_lengkap,
            'alamat' => $request->alamat,
            'no_hp' => $request->no_hp,
        ]);

        if ($request->hasFile('foto')) {
            $folderPath = 'AdminCabang/' . $admincabang->id_admin_cabang;
            $fileName = $request->file('foto')->getClientOriginalName();
            $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public');

            // Simpan path relatif ke database
            $admincabang->update(['foto' => $fileName]);

            Log::info('File diterima: ' . $request->file('foto')->getClientOriginalName());
        } else {
            Log::warning('File foto tidak ditemukan.');
        }

        return response()->json([
            'message' => 'Admin Cabang created successfully!',
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
        /* $lastPage = ceil(AdminCabang::count() / 10) - 1;

        return redirect()->route('admin_cabang')
                         ->with('success', 'Admin Cabang berhasil ditambahkan')
                         ->with('currentPage', $lastPage); */
    }

    public function show($id_admin_cabang) {
        // Mengambil data admin cabang berdasarkan id_admin_cabang
        $admincabang = AdminCabang::with(['user', 'kacab'])->findOrFail($id_admin_cabang);
        
        // Mengembalikan view dengan data yang diambil
        return view('AdminPusat.Settings.UsersManagement.AdminCabang.show', compact('admincabang'));
    }

    public function edit($id_admin_cabang, Request $request) {
        // Temukan admin cabang berdasarkan ID
        $admincabang = AdminCabang::with(['user', 'kacab'])->findOrFail($id_admin_cabang);
        
        // Ambil data Kacab saja
        $kacab = Kacab::all();
        
        // Current page untuk keperluan navigasi
        $currentPage = $request->query('current_page', 0);
        
        return view('AdminPusat.Settings.UsersManagement.AdminCabang.edit', compact('admincabang', 'kacab', 'currentPage'));
    }
    
    public function update(Request $request, $id_admin_cabang) {
        $admincabang = AdminCabang::findOrFail($id_admin_cabang);
    
        // Validasi data
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $admincabang->user->id_users . ',id_users',
            'password' => 'nullable|min:6',
            'id_kacab' => 'required',
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
                'level' => 'admin_cabang', // Level user sebagai 'donatur'
                'status' => 'aktif', // Status otomatis aktif
                'token' => $newToken,
            ];
    
            // Jika password diisi, update password
            if (!empty($request->password)) {
                $admincabang->user->update(['password' => Hash::make($request->password)]);
            }

            $admincabang->user->update($userData);
    
            // Simpan foto jika ada
            if ($request->hasFile('foto')) {
                $folderPath = 'AdminCabang/' . $admincabang->id_admin_cabang;
                $fileName = $request->file('foto')->getClientOriginalName();
                $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public');

                // Simpan path relatif ke database
                $admincabang->update(['foto' => $fileName]);

                Log::info('File diterima: ' . $request->file('foto')->getClientOriginalName());
            } else {
                Log::warning('File foto tidak ditemukan.');
            }
        
            // Update data admin cabang
            $admincabang->update([
                'id_kacab' => $request->id_kacab,
                'nama_lengkap' => $request->nama_lengkap,
                'alamat' => $request->alamat,
                'no_hp' => $request->no_hp,
            ]);
        
            // Kirim data ke API eksternal
            $response = Http::withHeaders(['Content-Type' => 'application/json'])
            ->post('https://kilauindonesia.org/kilau/api/updateUser', [
                'email' => $admincabang->user->email,
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
                'message' => 'Admin Cabang Updated Succesfully!',
                'data' => $admincabang,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating Admin Cabang: ' . $e->getMessage());
            return response()->json([
                'message' => 'An error occurred while creating the Admin Cabang',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
    public function destroy(Request $request, $id_admin_cabang) {
        $admincabang = AdminCabang::findOrFail($id_admin_cabang);

        if ($admincabang->foto) {
            Storage::disk('public')->delete($admincabang->foto);
        }

        $admincabang->delete();

        $currentPage = $request->input('current_page', 0);

        return redirect()->route('admin_cabang', ['page' => $currentPage])
                         ->with('success', 'Data Admin Cabang berhasil dihapus')
                         ->with('currentPage', $currentPage);
    }
    
}
