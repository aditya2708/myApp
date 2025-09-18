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
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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
            'nama_lengkap' => 'required|string|max:255',
            'alamat' => 'nullable|string|max:500',
            'no_hp' => 'nullable|string|max:20',
            'id_kacab' => 'required_if:level,admin_cabang,admin_shelter|integer|exists:kacab,id_kacab',
            'id_wilbin' => 'required_if:level,admin_shelter|integer|exists:wilbin,id_wilbin',
            'id_shelter' => 'required_if:level,admin_shelter|integer|exists:shelter,id_shelter',
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

            return response()->json([
                'status' => true,
                'message' => 'User berhasil dibuat',
                'data' => (new UserResource($user))->resolve(),
            ], 201);
        } catch (ValidationException $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $exception->errors(),
            ], 422);
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
            'nama_lengkap' => 'sometimes|required|string|max:255',
            'alamat' => 'sometimes|nullable|string|max:500',
            'no_hp' => 'sometimes|nullable|string|max:20',
            'id_kacab' => 'sometimes|integer|exists:kacab,id_kacab',
            'id_wilbin' => 'sometimes|integer|exists:wilbin,id_wilbin',
            'id_shelter' => 'sometimes|integer|exists:shelter,id_shelter',
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

            $targetLevel = $validated['level'] ?? $user->level;

            $user->loadMissing(['adminPusat', 'adminCabang', 'adminShelter']);
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

            return response()->json([
                'status' => true,
                'message' => 'User berhasil diupdate',
                'data' => (new UserResource($user))->resolve(),
            ]);
        } catch (ValidationException $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Validasi gagal',
                'errors' => $exception->errors(),
            ], 422);
        } catch (\Throwable $th) {
            return response()->json([
                'status' => false,
                'message' => 'Gagal mengupdate user',
                'error' => $th->getMessage(),
            ], 500);
        }
    }

    private function relationsForLevel(string $level): array
    {
        return match ($level) {
            'admin_pusat' => ['adminPusat'],
            'admin_cabang' => ['adminCabang'],
            'admin_shelter' => ['adminShelter'],
            default => [],
        };
    }

    private function syncAdminProfile(User $user, string $targetLevel, array $profileData): void
    {
        if ($targetLevel === 'admin_pusat') {
            $payload = $this->extractProfilePayload($profileData, ['nama_lengkap', 'alamat', 'no_hp']);

            $user->adminPusat()->updateOrCreate(
                ['id_users' => $user->id_users],
                $payload
            );

            if ($user->level !== 'admin_pusat') {
                $user->adminCabang()->delete();
                $user->adminShelter()->delete();
            }
        } elseif ($targetLevel === 'admin_cabang') {
            $payload = $this->extractProfilePayload($profileData, ['id_kacab', 'nama_lengkap', 'alamat', 'no_hp']);

            $user->adminCabang()->updateOrCreate(
                ['user_id' => $user->id_users],
                $payload
            );

            if ($user->level !== 'admin_cabang') {
                $user->adminPusat()->delete();
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
                $user->adminPusat()->delete();
                $user->adminCabang()->delete();
            }
        }
    }

    private function ensureRequiredProfileData(User $user, string $targetLevel, array $profileData): void
    {
        if ($targetLevel === 'admin_pusat') {
            $namaLengkap = array_key_exists('nama_lengkap', $profileData)
                ? $profileData['nama_lengkap']
                : $user->adminPusat?->nama_lengkap;

            if ($namaLengkap === null) {
                throw ValidationException::withMessages([
                    'nama_lengkap' => 'The nama_lengkap field is required.',
                ]);
            }
        } elseif ($targetLevel === 'admin_cabang') {
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
