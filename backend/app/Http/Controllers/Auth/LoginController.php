<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class LoginController extends Controller
{
    public function login()
    {
        return view('Auth.login'); // Halaman login untuk admin
    }

    /* public function loginproses(Request $request)
    {
        // Validasi input
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Tambahkan kriteria level untuk admin
        $credentials['level'] = ['admin_pusat', 'admin_cabang', 'admin_shelter'];

        // Proses login
        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            // Redirect sesuai dengan level
            switch (Auth::user()->level) {
                case 'admin_pusat':
                    return redirect()->route('dashboardApkShalterPusat')->with('success', 'Login successful');
                case 'admin_cabang':
                    return redirect()->route('dashboardApkShalterCabang')->with('success', 'Login successful');
                case 'admin_shelter':
                    return redirect()->route('dashboardApkShalter')->with('success', 'Login successful');
                default:
                    Auth::logout();
                    return redirect('/login')->withErrors(['error' => 'Role not recognized.']);
            }
        }

        // Jika gagal login
        return back()->withErrors([
            'email' => 'Email atau password salah.',
        ])->withInput($request->only('email'));
    } */


    public function loginproses(Request $request)
    {
        // Validasi input token
    // $request->validate([
    //     'data' => 'required|string',
    // ]);

    // Cari user berdasarkan token
    // return $request;
    $user = DB::table('users')->where('token', $request->data)->first();

    if ($user) {
        Auth::loginUsingId($user->id_users);

        // Pastikan level user valid
        $allowedLevels = ['admin_pusat', 'admin_cabang', 'admin_shelter'];
        if (!in_array($user->level, $allowedLevels)) {
            Auth::logout();
            return response()->json(['error' => 'Role not recognized.'], 403);
        }

        // Redirect sesuai level user
        switch ($user->level) {
            case 'admin_pusat':
                return response()->json([
                    'redirect_url' => url(Auth::user()->level . '/dashboard-menuapkshalterpusat'),
                    'message' => 'Login successful',
                ]);
            case 'admin_cabang':
                return response()->json([
                    'redirect_url' => url(Auth::user()->level . '/dashboard-menuapkshaltercabangs'),
                    'message' => 'Login successful',
                ]);
            case 'admin_shelter':
                return response()->json([
                    'redirect_url' => url(Auth::user()->level . '/dashboard-menuapkshalter'),
                    'message' => 'Login successful',
                ]);
            default:
                Auth::logout();
                return response()->json(['error' => 'Role not recognized.'], 403);
        }
    }

    // Jika token tidak valid
    return response()->json(['error' => 'Invalid token.'], 401);
}


    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login')->with('success', 'Logout successful');
    }
}
