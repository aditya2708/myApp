<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AdminCabang;
use App\Models\AdminShelter;

class AdminPusatController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'status' => true,
            'message' => 'Dashboard data',
            'data' => [
                'total_users' => User::count(),
                'total_admin_cabang' => AdminCabang::count(),
                'total_admin_shelter' => AdminShelter::count(),
            ],
        ]);
    }
}
