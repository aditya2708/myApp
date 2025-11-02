<?php

namespace App\Http\Controllers\AdminPusat\Settings\UsersManagement\UsersAll;

use App\Models\Bank;
use App\Models\User;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

class UsersAllController extends Controller
{
    public function index() {
        // Mengambil semua data struktur
        $data_users = User::get(); // Menampilkan 10 data per halaman
        return view('AdminPusat.Settings.UsersManagement.Usersall.index', compact('data_users'));
    }

    public function searchEmail(Request $request)
    {
        $search = $request->get('search', ''); // Ambil parameter 'search'
        $users = User::query()
            ->where('email', 'LIKE', "%{$search}%") // Filter berdasarkan email
            ->get(['email', 'username']); // Ambil email dan username

        return response()->json($users); // Return JSON untuk Select2
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Aktif,Nonaktif', // Validasi status hanya bisa 'Aktif' atau 'Nonaktif'
        ]);

        $user = User::findOrFail($id);
        $user->status = $request->status;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Status berhasil diperbarui.',
            'status' => $user->status
        ]);
    }


    public function create() {
        $kacab = Kacab::all();
        $wilbin = Wilbin::all();
        $shelters = Shelter::all();
        $banks = Bank::all();
        return view('AdminPusat.Settings.UsersManagement.Usersall.create', compact('kacab', 'wilbin', 'shelters', 'banks'));
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                function ($attribute, $value, $fail) use ($request) {
                    $exists = User::where('email', $value)
                        ->where('level', $request->level)
                        ->exists();
                    if ($exists) {
                        $fail('Email sudah digunakan untuk level yang sama.');
                    }
                },
            ],
            'password' => 'required|string|min:8',
            'level' => 'required|string',
            'status' => 'required|string',
        ]);
    
        if ($request->level === 'admin_pusat') {
            $validated += $request->validate([
                'nama_lengkap_pusat' => 'required|string|max:255',
                'alamat_pusat' => 'nullable|string|max:255',
                'no_hp_pusat' => 'nullable|string|max:15',
                'foto_pusat' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
            $validated['nama_lengkap'] = $validated['nama_lengkap_pusat'];
            $validated['alamat'] = $validated['alamat_pusat'];
            $validated['no_hp'] = $validated['no_hp_pusat'];
        } elseif ($request->level === 'admin_cabang') {
            $validated += $request->validate([
                'id_kacab_cabang' => 'required',
                'nama_lengkap_cabang' => 'required|string|max:255',
                'alamat_cabang' => 'nullable|string|max:255',
                'no_hp_cabang' => 'nullable|string|max:15',
                'foto_cabang' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
            $validated['id_kacab'] = $validated['id_kacab_cabang'];
            $validated['nama_lengkap'] = $validated['nama_lengkap_cabang'];
            $validated['alamat'] = $validated['alamat_cabang'];
            $validated['no_hp'] = $validated['no_hp_cabang'];
        } elseif ($request->level === 'admin_shelter') {
            $validated += $request->validate([
                'id_kacab_shelter' => 'required',
                'id_wilbin_shelter' => 'required',
                'id_shelter_shelter' => 'required',
                'nama_lengkap_shelter' => 'required|string|max:255',
                'alamat_shelter' => 'nullable|string|max:255',
                'no_hp_shelter' => 'nullable|string|max:15',
                'foto_shelter' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
            $validated['id_kacab'] = $validated['id_kacab_shelter'];
            $validated['id_wilbin'] = $validated['id_wilbin_shelter'];
            $validated['id_shelter'] = $validated['id_shelter_shelter'];
            $validated['nama_lengkap'] = $validated['nama_lengkap_shelter'];
            $validated['alamat_adm'] = $validated['alamat_shelter'];
            $validated['no_hp'] = $validated['no_hp_shelter'];
        } elseif ($request->level === 'donatur') {
            $validated += $request->validate([
                'id_kacab_donatur' => 'required',
                'id_wilbin_donatur' => 'required',
                'id_shelter_donatur' => 'required',
                'nama_lengkap' => 'required|string|max:255',
                'alamat' => 'nullable|string|max:255',
                'no_hp' => 'nullable|string|max:15',
                'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
                'id_bank' => 'required',
                'no_rekening' => 'required|string|max:255',
                'diperuntukan' => 'required|string',
                'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            ]);
            $validated['id_kacab'] = $validated['id_kacab_donatur'];
            $validated['id_wilbin'] = $validated['id_wilbin_donatur'];
            $validated['id_shelter'] = $validated['id_shelter_donatur'];
        }
    
        $user = User::create([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'level' => $validated['level'],
            'status' => $validated['status'],
            'token' => Str::random(60)
        ]);

         // Kirim data ke API eksternal
        $response = Http::withHeaders(['Content-Type' => 'application/json'])
        ->post('https://kilauindonesia.org/kilau/api/createUser', [
            'nama' => $user->username,
            'email' => $user->email,
            'password' => bcrypt($validated['password']), 
            'token' => $user->token,
        ]);
    
        switch ($user->level) {
            case 'admin_pusat':
                // Buat instance AdminPusat terlebih dahulu
                $adminpusat = \App\Models\AdminPusat::create([
                    'id_users' => $user->id_users,
                    'nama_lengkap' => $validated['nama_lengkap'],
                    'alamat' => $validated['alamat'],
                    'no_hp' => $validated['no_hp'],
                ]);

                // Simpan foto jika ada
                if ($request->hasFile('foto_pusat')) {
                    $folderPath = 'AdminPusat/' . $adminpusat->id_admin_pusat;
                    $fileName = $request->file('foto_pusat')->getClientOriginalName();
                    $fotoPath = $request->file('foto_pusat')->storeAs($folderPath, $fileName, 'public');
                    $adminpusat->update(['foto' => $fileName]);
                }
            break;
            case 'admin_cabang':
                $adminCabang = \App\Models\AdminCabang::create([
                    'user_id' => $user->id_users,
                    'id_kacab' => $validated['id_kacab'],
                    'nama_lengkap' => $validated['nama_lengkap'],
                    'alamat' => $validated['alamat'],
                    'no_hp' => $validated['no_hp'],
                ]);
            
                // Simpan foto jika ada
                if ($request->hasFile('foto_cabang')) {
                    $folderPath = 'AdminCabang/' . $adminCabang->id_admin_cabang;
                    $fileName = $request->file('foto_cabang')->getClientOriginalName();
                    $fotoPath = $request->file('foto_cabang')->storeAs($folderPath, $fileName, 'public');
                    $adminCabang->update(['foto' => $fileName]);
                }
                break;
            case 'admin_shelter':
                $adminShelter = \App\Models\AdminShelter::create([
                    'user_id' => $user->id_users,
                    'id_kacab' => $validated['id_kacab'],
                    'id_wilbin' => $validated['id_wilbin'],
                    'id_shelter' => $validated['id_shelter'],
                    'nama_lengkap' => $validated['nama_lengkap'],
                    'alamat_adm' => $validated['alamat_adm'],
                    'no_hp' => $validated['no_hp'],
                ]);

                if ($request->hasFile('foto_shelter')) {
                    $folderPath = 'AdminShelter/' . $adminShelter->id_admin_shelter;
                    $fileName = $request->file('foto_shelter')->getClientOriginalName();
                    $fotoPath = $request->file('foto_shelter')->storeAs($folderPath, $fileName, 'public');
            
                    // Simpan path ke database
                    $adminShelter->update(['foto' => $fileName]);
                } else {
                    Log::warning('File foto_shelter tidak ditemukan.');
                }
                break;
            case 'donatur':
                $donatur = \App\Models\Donatur::create([
                    'id_users' => $user->id_users,
                    'id_kacab' => $validated['id_kacab'],
                    'id_wilbin' => $validated['id_wilbin'],
                    'id_shelter' => $validated['id_shelter'],
                    'nama_lengkap' => $user->username,
                    'nama_lengkap' => $validated['nama_lengkap'],
                    'alamat' => $validated['alamat'],
                    'no_hp' => $validated['no_hp'],
                    'id_bank' => $validated['id_bank'],
                    'no_rekening' => $validated['no_rekening'],
                    'diperuntukan' => $validated['diperuntukan'],
                ]);

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
                break;
        }
        
         // Periksa status respons
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
    
        // Menghitung halaman terakhir jika data bertambah
        /* $totalData = User::count();
        $perPage = 10;
        $lastPage = ceil($totalData / $perPage) - 1;
    
        return redirect()->route('usersall')
                         ->with('success', 'User berhasil ditambahkan')
                         ->with('currentPage', $lastPage); */
    }

    /* public function edit($id_users, Request $request)
    {
        $user = User::findOrFail($id_users);
        $kacab = Kacab::all();
        $wilbin = Wilbin::all();
        $shelters = Shelter::all();
        $banks = Bank::all();

        return view('AdminPusat.Settings.UsersManagement.Usersall.edit', compact('user', 'kacab', 'wilbin', 'shelters', 'banks'))
            ->with('currentPage', $request->query('current_page', 0));
    }

    public function update(Request $request, $id_users)
    {
        $user = User::findOrFail($id_users);
    
        // Validasi data umum
        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                function ($attribute, $value, $fail) use ($request, $id_users) {
                    $exists = User::where('email', $value)
                                  ->where('id_users', '!=', $id_users)
                                  ->where('level', $request->level)
                                  ->exists();
                    if ($exists) {
                        $fail('Email sudah digunakan untuk level yang sama.');
                    }
                },
            ],
            'level' => 'required|string',
            'status' => 'required|string',
        ]);
    
        // Validasi data tambahan berdasarkan level
        if ($request->level === 'admin_cabang') {
            $validated['id_kacab'] = $request->validate(['id_kacab_cabang' => 'required'])['id_kacab_cabang'];
        } elseif ($request->level === 'admin_shelter') {
            $validated += $request->validate([
                'id_kacab_shelter' => 'required',
                'id_wilbin_shelter' => 'required',
                'id_shelter_shelter' => 'required',
            ]);
            $validated['id_kacab'] = $validated['id_kacab_shelter'];
            $validated['id_wilbin'] = $validated['id_wilbin_shelter'];
            $validated['id_shelter'] = $validated['id_shelter_shelter'];
        } elseif ($request->level === 'donatur') {
            $validated += $request->validate([
                'id_kacab_donatur' => 'required',
                'id_wilbin_donatur' => 'required',
                'id_shelter_donatur' => 'required',
            ]);
            $validated['id_kacab'] = $validated['id_kacab_donatur'];
            $validated['id_wilbin'] = $validated['id_wilbin_donatur'];
            $validated['id_shelter'] = $validated['id_shelter_donatur'];
        }
    
        // Update data utama user
        $user->update([
            'username' => $validated['username'],
            'email' => $validated['email'],
            'level' => $validated['level'],
            'status' => $validated['status'],
        ]);
    
        // Update password jika ada input
        if ($request->password) {
            $user->update(['password' => Hash::make($request->password)]);
        }
    
        // Update atau buat data tambahan berdasarkan level
        switch ($user->level) {
            case 'admin_pusat':
                \App\Models\AdminPusat::updateOrCreate(
                    ['id_users' => $user->id_users],
                    [
                        'nama_lengkap' => $user->username,
                        'alamat' => $request->input('alamat', null),
                        'no_hp' => $request->input('no_hp', null),
                        'foto' => $request->input('foto', null),
                    ]
                );
                break;
        
            case 'admin_cabang':
                \App\Models\AdminCabang::updateOrCreate(
                    ['user_id' => $user->id_users],
                    [
                        'id_kacab' => $validated['id_kacab'],
                        'nama_lengkap' => $user->username,
                        'alamat' => $request->input('alamat', null),
                        'no_hp' => $request->input('no_hp', null),
                        'foto' => $request->input('foto', null),
                    ]
                );
                break;
        
            case 'admin_shelter':
                \App\Models\AdminShelter::updateOrCreate(
                    ['user_id' => $user->id_users],
                    [
                        'id_kacab' => $validated['id_kacab'],
                        'id_wilbin' => $validated['id_wilbin'],
                        'id_shelter' => $validated['id_shelter'],
                        'nama_lengkap' => $user->username,
                        'alamat_adm' => $request->input('alamat_adm', null),
                        'no_hp' => $request->input('no_hp', null),
                        'foto' => $request->input('foto', null),
                    ]
                );
                break;
        
            case 'donatur':
                \App\Models\Donatur::updateOrCreate(
                    ['id_users' => $user->id_users],
                    [
                        'id_kacab' => $validated['id_kacab'],
                        'id_wilbin' => $validated['id_wilbin'],
                        'id_shelter' => $validated['id_shelter'],
                        'nama_lengkap' => $user->username,
                        'alamat' => $request->input('alamat', null),
                        'no_hp' => $request->input('no_hp', null),
                        'id_bank' => $request->input('id_bank', null),
                        'no_rekening' => $request->input('no_rekening', null),
                        'foto' => $request->input('foto', null),
                        'diperuntukan' => $request->input('diperuntukan', null),
                    ]
                );
                break;
        }        
    
        return redirect()->route('usersall')
                         ->with('success', 'Data user berhasil diperbarui')
                         ->with('currentPage', $request->input('current_page', 0));
    } */

    public function destroy(Request $request, $id_users) {
        // Cari user berdasarkan ID
        $user = User::findOrFail($id_users);
        // Hapus user
        $user->delete();
    
        // Redirect ke halaman pagination yang sama setelah penghapusan
        return redirect()->route('usersall')
                         ->with('success', 'User berhasil dihapus')
                         ->with('currentPage', $request->input('current_page', 0));  // Biarkan seperti ini
    }
    
    
}
