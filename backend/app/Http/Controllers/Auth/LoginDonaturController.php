<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class LoginDonaturController extends Controller
{
    public function login()
    {
        return view('Auth.logindonatur'); // Halaman login untuk donatur
    }

    /* public function loginproses(Request $request)
    {
        // Validasi input
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Tambahkan kriteria level untuk donatur
        $credentials['level'] = 'donatur';

        // Proses login
        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            // Validasi dan redirect berdasarkan level
            switch (Auth::user()->level) {
                case 'donatur':
                    return redirect()->route('donatur.byid', ['id' => Auth::user()->donatur->id_donatur])
                                    ->with('success', 'Login successful');
                default:
                    // Logout jika level tidak sesuai
                    Auth::logout();
                    return redirect('/login-donatur')->withErrors(['error' => 'Role not recognized.']);
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
        $user = User::where('token', $request->data)->with('donatur')->first();

        if ($user) {
            Auth::loginUsingId($user->id_users);

            // Validasi level user
            if ($user->level !== 'donatur') {
                Auth::logout();
                return response()->json(['error' => 'Role not recognized.'], 403);
            }

            // Pastikan data donatur ada
            if (!$user->donatur) {
                Auth::logout();
                return response()->json(['error' => 'Donatur data not found.'], 404);
            }

            // Redirect ke halaman donatur
            $redirectUrl = url('donatur/' . $user->donatur->id_donatur);
            return response()->json([
                'redirect_url' => $redirectUrl,
                'message' => 'Login successful',
            ]);
        }

        // Jika token tidak valid
        return response()->json(['error' => 'Invalid token.'], 401);
    }

    public function logout(Request $request)
    {
        if ($request->isMethod('post')) {
            Auth::logout();
    
            $request->session()->invalidate();
            $request->session()->regenerateToken();
    
            return redirect('/login-donatur')->with('success', 'Logout successful');
        }
    
        // Jika bukan POST
        return redirect('/login-donatur')->withErrors(['error' => 'Invalid request method.']);
    }
    


}
