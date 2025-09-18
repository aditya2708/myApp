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
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

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
            'nama_lengkap' => 'required|string|max:255',
            'alamat' => 'nullable|string|max:500',
            'no_hp' => 'nullable|string|max:20',
            'id_kacab' => 'required|integer|exists:kacab,id_kacab',
            'id_wilbin' => 'required_if:level,admin_shelter|integer|exists:wilbin,id_wilbin',
            'id_shelter' => 'required_if:level,admin_shelter|integer|exists:shelter,id_shelter',
        ]);

        $userData = Arr::only($validated, ['username', 'email', 'password', 'level']);
        $userData['password'] = bcrypt($userData['password']);

        $profileData = Arr::only($validated, [
            'nama_lengkap',
            'alamat',
            'no_hp',
            'id_kacab',
            'id_wilbin',
            'id_shelter',
        ]);

        $user = User::create($userData);

        $this->syncAdminProfile($user, $user->level, $profileData);

        $relations = $this->relationsForLevel($user->level);
        if (!empty($relations)) {
            $user->load($relations);
        }

        return new UserResource($user);
    }

    /**
     * Display the specified user.
     */
    public function show($id)
    {
        $user = User::with(['adminCabang', 'adminShelter'])->findOrFail($id);

        if (!in_array($user->level, ['admin_cabang', 'admin_shelter'], true)) {
            abort(404);
        }

        return new UserResource($user);
    }

    /**
     * Update the specified user (cannot assign admin_pusat).
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $levelInput = $request->input('level', $user->level);

        $validated = $request->validate([
            'username' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id_users . ',id_users',
            'password' => 'nullable|string|min:6',
            'level' => 'sometimes|required|string|in:admin_cabang,admin_shelter',
            'nama_lengkap' => 'sometimes|required|string|max:255',
            'alamat' => 'sometimes|nullable|string|max:500',
            'no_hp' => 'sometimes|nullable|string|max:20',
            'id_kacab' => 'sometimes|integer|exists:kacab,id_kacab',
            'id_wilbin' => 'sometimes|integer|exists:wilbin,id_wilbin',
            'id_shelter' => 'sometimes|integer|exists:shelter,id_shelter',
        ]);

        if (array_key_exists('password', $validated)) {
            if (!empty($validated['password'])) {
                $validated['password'] = bcrypt($validated['password']);
            } else {
                unset($validated['password']);
            }
        }

        $profileData = Arr::only($validated, [
            'nama_lengkap',
            'alamat',
            'no_hp',
            'id_kacab',
            'id_wilbin',
            'id_shelter',
        ]);

        $targetLevel = $validated['level'] ?? $levelInput;

        $user->loadMissing(['adminCabang', 'adminShelter']);
        $this->ensureRequiredProfileData($user, $targetLevel, $profileData);

        $this->syncAdminProfile($user, $targetLevel, $profileData);

        $userData = Arr::only($validated, ['username', 'email', 'password', 'level']);
        if (!empty($userData)) {
            $user->update($userData);
        }

        $user->refresh();

        $relations = $this->relationsForLevel($user->level);
        if (!empty($relations)) {
            $user->load($relations);
        }

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

    private function relationsForLevel(string $level): array
    {
        return match ($level) {
            'admin_cabang' => ['adminCabang'],
            'admin_shelter' => ['adminShelter'],
            default => [],
        };
    }

    private function syncAdminProfile(User $user, string $targetLevel, array $profileData): void
    {
        if ($targetLevel === 'admin_cabang') {
            $payload = $this->extractProfilePayload($profileData, ['id_kacab', 'nama_lengkap', 'alamat', 'no_hp']);

            $user->adminCabang()->updateOrCreate(
                ['user_id' => $user->id_users],
                $payload
            );

            if ($user->level !== 'admin_cabang') {
                $user->adminShelter()->delete();
            }
        } elseif ($targetLevel === 'admin_shelter') {
            $payload = $this->extractProfilePayload($profileData, ['id_kacab', 'id_wilbin', 'id_shelter', 'nama_lengkap', 'no_hp']);

            if (array_key_exists('alamat', $profileData)) {
                $payload['alamat_adm'] = $profileData['alamat'];
            }

            $user->adminShelter()->updateOrCreate(
                ['user_id' => $user->id_users],
                $payload
            );

            if ($user->level !== 'admin_shelter') {
                $user->adminCabang()->delete();
            }
        }
    }

    private function ensureRequiredProfileData(User $user, string $targetLevel, array $profileData): void
    {
        if ($targetLevel === 'admin_cabang') {
            $idKacab = array_key_exists('id_kacab', $profileData)
                ? $profileData['id_kacab']
                : $user->adminCabang?->id_kacab;

            if ($idKacab === null) {
                throw ValidationException::withMessages([
                    'id_kacab' => 'The id_kacab field is required.',
                ]);
            }
        } elseif ($targetLevel === 'admin_shelter') {
            $existing = $user->adminShelter;

            $idKacab = array_key_exists('id_kacab', $profileData)
                ? $profileData['id_kacab']
                : $existing?->id_kacab;
            $idWilbin = array_key_exists('id_wilbin', $profileData)
                ? $profileData['id_wilbin']
                : $existing?->id_wilbin;
            $idShelter = array_key_exists('id_shelter', $profileData)
                ? $profileData['id_shelter']
                : $existing?->id_shelter;

            $messages = [];

            if ($idKacab === null) {
                $messages['id_kacab'] = 'The id_kacab field is required.';
            }

            if ($idWilbin === null) {
                $messages['id_wilbin'] = 'The id_wilbin field is required.';
            }

            if ($idShelter === null) {
                $messages['id_shelter'] = 'The id_shelter field is required.';
            }

            if (!empty($messages)) {
                throw ValidationException::withMessages($messages);
            }
        }
    }

    private function extractProfilePayload(array $data, array $allowedKeys): array
    {
        $payload = [];

        foreach ($allowedKeys as $key) {
            if (array_key_exists($key, $data)) {
                $payload[$key] = $data[$key];
            }
        }

        return $payload;
    }
}
