<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\AdminPusat;
use App\Models\AdminCabang;
use App\Models\AdminShelter;
use App\Models\Donatur;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Support\SsoContext;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        return response()->json([
            'message' => 'Login telah dipusatkan di aplikasi Manajemen (SSO).',
            'sso_login_url' => config('sso.management_base_url').'/admin/login',
        ], 410);
    }

    

    // The rest of the controller remains the same
    public function logout(Request $request)
    {
        return response()->json([
            'message' => 'Logout dilakukan melalui IdP. Token tenant otomatis tidak dipakai lagi setelah dicabut di pusat.',
        ]);
    }

    public function user(Request $request, SsoContext $context)
    {
        $user = $request->user();

        $user->load([
            'adminPusat',
            'adminCabang.kacab',
            'adminShelter.kacab',
            'adminShelter.wilbin.kacab',
            'adminShelter.shelter.wilbin',
            'adminShelter.shelter.kacab',
            'donatur.kacab',
            'donatur.wilbin.kacab',
            'donatur.shelter.wilbin',
            'donatur.shelter.kacab',
            'donatur.bank',
            'donatur.anak',
        ]);

        $profile = $this->resolveProfilePayload($user);

        return response()->json([
            'user' => [
                'id' => $user->id_users,
                'username' => $user->username,
                'email' => $user->email,
                'level' => $user->level,
                'status' => $user->status,
                'profile' => $profile,
            ],
            'profile' => $profile,
            'sso' => $context->raw(),
        ]);
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => [
                    'current_password' => ['Password saat ini tidak sesuai.'],
                ],
            ], 422);
        }

        $user->password = Hash::make($request->input('new_password'));
        $user->save();

        return response()->json([
            'message' => 'Password berhasil diperbarui',
        ]);
    }

    // Helper method for file uploads
    private function handleFileUpload($file, $folder, $userId)
    {
        $fileName = time() . '_' . $file->getClientOriginalName();
        $file->storeAs("public/{$folder}/{$userId}", $fileName);
        return $fileName;
    }

    protected function resolveProfilePayload(User $user): ?array
    {
        return match ($user->level) {
            User::ROLE_SUPER_ADMIN => [
                'display_name' => $user->username,
                'email' => $user->email,
                'scope' => User::ROLE_SUPER_ADMIN,
            ],
            User::ROLE_ADMIN_PUSAT => $user->adminPusat?->toArray(),
            User::ROLE_ADMIN_CABANG => $user->adminCabang?->toArray(),
            User::ROLE_ADMIN_SHELTER => $user->adminShelter?->toArray(),
            User::ROLE_DONATUR => $user->donatur?->toArray(),
            default => null,
        };
    }
}
