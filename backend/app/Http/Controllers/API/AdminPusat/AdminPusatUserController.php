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
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'level' => 'required|string|in:admin_pusat,admin_cabang,admin_shelter',
            'nama_lengkap' => 'required|string|max:255',
            'alamat' => 'required|string|max:500',
            'no_hp' => 'required|string|max:20',
            'id_kacab' => 'required_if:level,admin_cabang,admin_shelter|integer|exists:kacab,id_kacab',
            'id_wilbin' => 'required_if:level,admin_shelter|integer|exists:wilbin,id_wilbin',
            'id_shelter' => 'required_if:level,admin_shelter|integer|exists:shelter,id_shelter',
        ], $this->validationMessages());

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
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $user->id_users . ',id_users',
            'email' => 'sometimes|required|email|unique:users,email,' . $user->id_users . ',id_users',
            'password' => 'nullable|string|min:6',
            'level' => 'sometimes|required|string|in:admin_pusat,admin_cabang,admin_shelter',
            'nama_lengkap' => 'sometimes|required|string|max:255',
            'alamat' => 'sometimes|required|string|max:500',
            'no_hp' => 'sometimes|required|string|max:20',
            'id_kacab' => 'sometimes|integer|exists:kacab,id_kacab',
            'id_wilbin' => 'sometimes|integer|exists:wilbin,id_wilbin',
            'id_shelter' => 'sometimes|integer|exists:shelter,id_shelter',
        ], $this->validationMessages());

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
            $existing = $user->adminPusat;

            $namaLengkap = array_key_exists('nama_lengkap', $profileData)
                ? $profileData['nama_lengkap']
                : $existing?->nama_lengkap;
            $alamat = array_key_exists('alamat', $profileData)
                ? $profileData['alamat']
                : $existing?->alamat;
            $noHp = array_key_exists('no_hp', $profileData)
                ? $profileData['no_hp']
                : $existing?->no_hp;

            $messages = [];

            if ($this->isBlank($namaLengkap)) {
                $messages['nama_lengkap'] = __('Nama lengkap wajib diisi.');
            }

            if ($this->isBlank($alamat)) {
                $messages['alamat'] = __('Alamat wajib diisi.');
            }

            if ($this->isBlank($noHp)) {
                $messages['no_hp'] = __('Nomor HP wajib diisi.');
            }

            if (!empty($messages)) {
                throw ValidationException::withMessages($messages);
            }
        } elseif ($targetLevel === 'admin_cabang') {
            $existing = $user->adminCabang;

            $idKacab = array_key_exists('id_kacab', $profileData)
                ? $profileData['id_kacab']
                : $existing?->id_kacab;
            $namaLengkap = array_key_exists('nama_lengkap', $profileData)
                ? $profileData['nama_lengkap']
                : $existing?->nama_lengkap;
            $alamat = array_key_exists('alamat', $profileData)
                ? $profileData['alamat']
                : $existing?->alamat;
            $noHp = array_key_exists('no_hp', $profileData)
                ? $profileData['no_hp']
                : $existing?->no_hp;

            $messages = [];

            if ($idKacab === null) {
                $messages['id_kacab'] = __('Cabang wajib dipilih.');
            }

            if ($this->isBlank($namaLengkap)) {
                $messages['nama_lengkap'] = __('Nama lengkap wajib diisi.');
            }

            if ($this->isBlank($alamat)) {
                $messages['alamat'] = __('Alamat wajib diisi.');
            }

            if ($this->isBlank($noHp)) {
                $messages['no_hp'] = __('Nomor HP wajib diisi.');
            }

            if (!empty($messages)) {
                throw ValidationException::withMessages($messages);
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
            $namaLengkap = array_key_exists('nama_lengkap', $profileData)
                ? $profileData['nama_lengkap']
                : $existing?->nama_lengkap;
            $alamat = array_key_exists('alamat', $profileData)
                ? $profileData['alamat']
                : $existing?->alamat_adm;
            $noHp = array_key_exists('no_hp', $profileData)
                ? $profileData['no_hp']
                : $existing?->no_hp;

            $messages = [];

            if ($idKacab === null) {
                $messages['id_kacab'] = __('Cabang wajib dipilih.');
            }

            if ($idWilbin === null) {
                $messages['id_wilbin'] = __('Wilayah binaan wajib dipilih.');
            }

            if ($idShelter === null) {
                $messages['id_shelter'] = __('Shelter wajib dipilih.');
            }

            if ($this->isBlank($namaLengkap)) {
                $messages['nama_lengkap'] = __('Nama lengkap wajib diisi.');
            }

            if ($this->isBlank($alamat)) {
                $messages['alamat'] = __('Alamat wajib diisi.');
            }

            if ($this->isBlank($noHp)) {
                $messages['no_hp'] = __('Nomor HP wajib diisi.');
            }

            if (!empty($messages)) {
                throw ValidationException::withMessages($messages);
            }
        }
    }

    private function isBlank($value): bool
    {
        if ($value === null) {
            return true;
        }

        if (is_string($value) && trim($value) === '') {
            return true;
        }

        return false;
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

    private function validationMessages(): array
    {
        return [
            'username.required' => __('Username wajib diisi.'),
            'username.string' => __('Username harus berupa teks.'),
            'username.max' => __('Username maksimal 255 karakter.'),
            'username.unique' => __('Username sudah digunakan.'),
            'email.required' => __('Email wajib diisi.'),
            'email.email' => __('Format email tidak valid.'),
            'email.unique' => __('Email sudah digunakan.'),
            'password.required' => __('Password wajib diisi.'),
            'password.string' => __('Password harus berupa teks.'),
            'password.min' => __('Password minimal 6 karakter.'),
            'level.required' => __('Level pengguna wajib dipilih.'),
            'level.string' => __('Level pengguna harus berupa teks.'),
            'level.in' => __('Level pengguna tidak valid.'),
            'nama_lengkap.required' => __('Nama lengkap wajib diisi.'),
            'nama_lengkap.string' => __('Nama lengkap harus berupa teks.'),
            'nama_lengkap.max' => __('Nama lengkap maksimal 255 karakter.'),
            'alamat.required' => __('Alamat wajib diisi.'),
            'alamat.required_if' => __('Alamat wajib diisi sesuai level pengguna.'),
            'alamat.string' => __('Alamat harus berupa teks.'),
            'alamat.max' => __('Alamat maksimal 500 karakter.'),
            'no_hp.required' => __('Nomor HP wajib diisi.'),
            'no_hp.required_if' => __('Nomor HP wajib diisi sesuai level pengguna.'),
            'no_hp.string' => __('Nomor HP harus berupa teks.'),
            'no_hp.max' => __('Nomor HP maksimal 20 karakter.'),
            'id_kacab.required_if' => __('Cabang wajib dipilih ketika level admin cabang atau admin shelter.'),
            'id_kacab.integer' => __('Cabang harus berupa angka.'),
            'id_kacab.exists' => __('Cabang tidak ditemukan.'),
            'id_wilbin.required_if' => __('Wilayah binaan wajib dipilih ketika level admin shelter.'),
            'id_wilbin.integer' => __('Wilayah binaan harus berupa angka.'),
            'id_wilbin.exists' => __('Wilayah binaan tidak ditemukan.'),
            'id_shelter.required_if' => __('Shelter wajib dipilih ketika level admin shelter.'),
            'id_shelter.integer' => __('Shelter harus berupa angka.'),
            'id_shelter.exists' => __('Shelter tidak ditemukan.'),
        ];
    }

    /**
     * List all Kacab (for dropdown).
     */
    public function listKacab(): JsonResponse
    {
        $kacabs = Kacab::query()
            ->select(['id_kacab', 'nama_kacab'])
            ->orderBy('nama_kacab')
            ->get()
            ->map(function ($kacab) {
                $kacab->nama_cabang = $kacab->nama_kacab;
                return $kacab;
            });

        return response()->json([
            'status' => true,
            'data' => $kacabs,
        ]);
    }

    /**
     * List Wilbin by Kacab ID.
     */
    public function listWilbinByKacab($id): JsonResponse
    {
        $wilbins = Wilbin::query()
            ->where('id_kacab', $id)
            ->select(['id_wilbin', 'id_kacab', 'nama_wilbin'])
            ->orderBy('nama_wilbin')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $wilbins,
        ]);
    }

    /**
     * List Shelter by Wilbin ID.
     */
    public function listShelterByWilbin($id): JsonResponse
    {
        $shelters = Shelter::query()
            ->where('id_wilbin', $id)
            ->select(['id_shelter', 'id_wilbin', 'nama_shelter'])
            ->orderBy('nama_shelter')
            ->get();

        return response()->json([
            'status' => true,
            'data' => $shelters,
        ]);
    }
}
