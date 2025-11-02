<?php

namespace App\Http\Controllers\AdminCabang\SettingsCabang\UsersManagement\Shelter;

use App\Models\User;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\AdminCabang;
use Illuminate\Support\Str;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class ShelterCabangController extends Controller
{
    public function index(Request $request) {
        $user_id = auth()->user()->id_users;

        // Dapatkan admin cabang berdasarkan user ID
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();

        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }

        // Query untuk mengambil data admin shelter berdasarkan kacab admin yang login
        $query = AdminShelter::with('kacab', 'wilbin', 'shelter')
            ->where('id_kacab', $adminCabang->id_kacab);

        if ($request->has('id_wilbin') && $request->id_wilbin != '') {
            $query->where('id_wilbin', $request->id_wilbin);
        }

        if ($request->has('id_shelter') && $request->id_shelter != '') {
            $query->where('id_shelter', $request->id_shelter);
        }

        $data_admin_shelter = $query->get();

        // Ambil data kacab dan wilbin sesuai admin yang login
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();
        $wilbins = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();

        return view('AdminCabang.Settings.UsersManagement.Shelter.index', compact('data_admin_shelter', 'kacab', 'wilbins'));
    }

    public function create() {
        $user_id = auth()->user()->id_users;
    
        // Dapatkan admin cabang berdasarkan user ID
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Data Kacab berdasarkan admin yang login
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->first();
    
        // Wilayah Binaan dan Shelter berdasarkan id_kacab admin yang login
        $wilbin = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();
        $shelters = Shelter::whereIn('id_wilbin', $wilbin->pluck('id_wilbin'))->get();
    
        return view('AdminCabang.Settings.UsersManagement.Shelter.create', compact('kacab', 'wilbin', 'shelters'));
    }
    
    
    public function store(Request $request) {
        // Validasi data yang masuk
        $validated =  $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'id_wilbin' => 'required',
            'id_shelter' => 'required',
            'nama_lengkap' => 'required',
            'alamat_adm' => 'required',
            'no_hp' => 'required',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);
    
        // Ambil admin cabang yang login
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
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
    
        // Buat data admin shelter
        $adminShelter = AdminShelter::create([
            'user_id' => $user->id_users,
            'id_kacab' => $adminCabang->id_kacab, // Otomatis dari admin cabang yang login
            'id_wilbin' => $request->id_wilbin,
            'id_shelter' => $request->id_shelter,
            'nama_lengkap' => $request->nama_lengkap,
            'alamat_adm' => $request->alamat_adm,
            'no_hp' => $request->no_hp,
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
    
        // Hitung jumlah total halaman dan kembalikan ke halaman terakhir
       /*  $lastPage = ceil(AdminShelter::count() / 10) - 1;
    
        return redirect()->route('admin_shelter.cabang')
                         ->with('success', 'Admin Shelter berhasil ditambahkan')
                         ->with('currentPage', $lastPage); */
    }

    public function show($id_admin_shelter) {
          // Fetch Admin Shelter data with relationships
          $adminshelter = AdminShelter::with(['user', 'kacab', 'wilbin', 'shelter'])->findOrFail($id_admin_shelter);
        
          // Return the view with the data
          return view('AdminCabang.Settings.UsersManagement.Shelter.show', compact('adminshelter'));
    }

    public function edit($id_admin_shelter, Request $request) {
        // Ambil user ID admin cabang yang login
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Pastikan admin shelter yang diakses sesuai dengan kacab admin cabang yang login
        $adminshelter = AdminShelter::with(['user', 'kacab', 'wilbin', 'shelter'])
            ->where('id_kacab', $adminCabang->id_kacab)
            ->findOrFail($id_admin_shelter);
    
        // Ambil data wilayah binaan dan shelter berdasarkan kacab admin cabang yang login
        $wilbin = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();
        $shelters = Shelter::where('id_wilbin', $adminshelter->id_wilbin)->get();
    
        // Ambil current page dari query string
        $currentPage = $request->query('current_page', 0);
    
        return view('AdminCabang.Settings.UsersManagement.Shelter.edit', compact('adminshelter', 'wilbin', 'shelters', 'currentPage'));
    }
    
    public function update(Request $request, $id_admin_shelter) {
        // Ambil user ID admin cabang yang login
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Pastikan admin shelter yang di-update sesuai dengan kacab admin cabang yang login
        $adminshelter = AdminShelter::where('id_kacab', $adminCabang->id_kacab)
            ->findOrFail($id_admin_shelter);
    
        // Validasi data
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email,' . $adminshelter->user->id_users . ',id_users',
            'password' => 'nullable|min:6',
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
        // Ambil user ID admin cabang yang login
        $user_id = auth()->user()->id_users;
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
    
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Cari admin shelter berdasarkan ID dan pastikan kacab sesuai dengan admin cabang yang login
        $adminshelter = AdminShelter::where('id_kacab', $adminCabang->id_kacab)
            ->findOrFail($id_admin_shelter);
    
        // Hapus foto jika ada
        if ($adminshelter->foto) {
            Storage::disk('public')->delete($adminshelter->foto);
        }
    
        // Hapus data admin shelter dan user terkait
        $adminshelter->user->delete();
        $adminshelter->delete();
    
        // Ambil current_page dari request untuk tetap di halaman yang sama setelah penghapusan
        $currentPage = $request->input('current_page', 0);
    
        return redirect()->route('admin_shelter.cabang', ['page' => $currentPage])
                         ->with('success', 'Data Admin Shelter berhasil dihapus');
    }
    
        
}
