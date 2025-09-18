<?php

namespace App\Http\Controllers\API\AdminPusat;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Resources\UserResource;
use App\Http\Resources\UserCollection;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class AdminPusatUserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $request->validate(['level' => 'required|string|in:admin_pusat,admin_cabang,admin_shelter']);

        $users = User::with(['adminPusat', 'adminCabang', 'adminShelter'])
            ->where('level', $request->level)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return new UserCollection($users);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'level' => 'required|string|in:admin_pusat,admin_cabang,admin_shelter',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $validated = $validator->validated();
            $validated['password'] = bcrypt($validated['password']);

            $user = User::create($validated);

            $user->load(match ($user->level) {
                'admin_pusat' => 'adminPusat',
                'admin_cabang' => 'adminCabang',
                'admin_shelter' => 'adminShelter',
                default => []
            });

            return response()->json([
                'status' => true,
                'message' => 'User berhasil dibuat',
                'data' => (new UserResource($user))->resolve(),
            ], 201);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal membuat user',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified user.
     */
    public function show($id)
    {
        $user = User::with(['adminPusat', 'adminCabang', 'adminShelter'])->findOrFail($id);
        return new UserResource($user);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'username' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id_users . ',id_users',
            'password' => 'nullable|string|min:6',
            'level' => 'sometimes|required|string|in:admin_pusat,admin_cabang,admin_shelter',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $validated = $validator->validated();

            if (!empty($validated['password'])) {
                $validated['password'] = bcrypt($validated['password']);
            } else {
                unset($validated['password']);
            }

            $user->update($validated);
            $user->load(['adminPusat', 'adminCabang', 'adminShelter']);

            return response()->json([
                'status' => true,
                'message' => 'User berhasil diupdate',
                'data' => (new UserResource($user))->resolve(),
            ]);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal mengupdate user',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    /**
     * List all Kacab (for dropdown).
     */
    public function listKacab()
    {
        $kacabs = Kacab::all();
        return response()->json($kacabs);
    }

    /**
     * List Wilbin by Kacab ID.
     */
    public function listWilbinByKacab($id)
    {
        $wilbins = Wilbin::where('id_kacab', $id)->get();
        return response()->json($wilbins);
    }

    /**
     * List Shelter by Wilbin ID.
     */
    public function listShelterByWilbin($id)
    {
        $shelters = Shelter::where('id_wilbin', $id)->get();
        return response()->json($shelters);
    }
}
