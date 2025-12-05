<?php

namespace App\Http\Controllers\API\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Resources\SuperAdmin\ManagedUserResource;
use App\Models\User;
use App\Services\SsoUserDirectoryClient;
use App\Support\SsoContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SsoImportController extends Controller
{
    public function __construct(
        private readonly SsoUserDirectoryClient $directory
    ) {
    }

    public function index(Request $request, SsoContext $context): JsonResponse
    {
        $token = $context->token();

        if (!$token) {
            abort(403, 'Missing SSO access token.');
        }

        $payload = $this->directory->fetchList($token, [
            'search' => $request->query('search'),
            'status' => $request->query('status'),
            'per_page' => $request->query('per_page'),
        ]);

        $items = collect($payload['data'] ?? [])->map(function (array $user) {
            $local = User::where('token_api', (string) $user['sub'])->first();

            return [
                'sub' => $user['sub'],
                'name' => $user['name'],
                'email' => $user['email'],
                'status' => $user['status'],
                'apps_allowed' => $user['apps_allowed'],
                'exists_locally' => (bool) $local,
                'local_user' => $local ? [
                    'id' => $local->getKey(),
                    'level' => $local->level,
                    'status' => $local->status,
                ] : null,
            ];
        });

        return response()->json([
            'data' => $items,
            'meta' => $payload['meta'] ?? [],
        ]);
    }

    public function store(Request $request, SsoContext $context): ManagedUserResource
    {
        $token = $context->token();

        if (!$token) {
            abort(403, 'Missing SSO access token.');
        }

        $data = $request->validate([
            'sub' => ['required', 'integer', 'min:1'],
        ]);

        $remote = $this->directory->fetchUser($token, $data['sub']);

        if (($remote['status'] ?? null) !== 'active') {
            throw ValidationException::withMessages([
                'sub' => 'Cannot import inactive user.',
            ]);
        }

        $user = User::firstOrNew(['token_api' => (string) $remote['sub']]);

        if (! $user->exists) {
            $user->username = $remote['name'] ?? $remote['email'] ?? 'sso-user-' . $remote['sub'];
            $user->email = $remote['email'] ?? 'sso-user-' . $remote['sub'] . '@example.com';
            $user->password = Hash::make(Str::random(32));
            $user->level = User::DEFAULT_ROLE;
            $user->status = 'Aktif';
        } else {
            $user->fill([
                'username' => $remote['name'] ?? $user->username,
                'email' => $remote['email'] ?? $user->email,
            ]);
        }

        $user->save();

        return ManagedUserResource::make($user)->additional([
            'message' => 'User imported successfully.',
        ]);
    }
}
