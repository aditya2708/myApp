<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Resources\UserResource;
use App\Http\Resources\UserCollection;
use App\Models\Kacab;
use App\Models\Wilbin;
use App\Models\Shelter;

class AdminCabangUserController extends Controller
{
    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $request->validate(['level' => 'required|string|in:admin_cabang,admin_shelter']);

        $users = User::with(['adminCabang', 'adminShelter'])
            ->where('level', $request->level)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return new UserCollection($users);
    }

    /**
     * Store a newly created user (only admin_cabang & admin_shelter).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'username' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'level' => 'required|string|in:admin_cabang,admin_shelter',
        ]);

        $validated['password'] = bcrypt($validated['password']);

        $user = User::create($validated);

        $user->load(match ($user->level) {
            'admin_cabang' => 'adminCabang',
            'admin_shelter' => 'adminShelter',
            default => []
        });

        return new UserResource($user);
    }

    /**
     * Display the specified user.
     */
    public function show($id)
    {
        $user = User::with(['adminCabang', 'adminShelter'])->findOrFail($id);
        return new UserResource($user);
    }

    /**
     * Update the specified user (cannot assign admin_pusat).
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'username' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id_users . ',id_users',
            'password' => 'nullable|string|min:6',
            'level' => 'sometimes|required|string|in:admin_cabang,admin_shelter',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = bcrypt($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        $user->load(['adminCabang', 'adminShelter']);

        return new UserResource($user);
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
