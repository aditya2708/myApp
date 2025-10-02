<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class NotificationTokenController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $input = $request->all();

        if (! isset($input['fcm_token']) && isset($input['token'])) {
            $input['fcm_token'] = $input['token'];
        }

        if (! isset($input['fcm_token']) && isset($input['expo_push_token'])) {
            $input['fcm_token'] = $input['expo_push_token'];
        }

        $validator = Validator::make($input, [
            'fcm_token' => 'required|string|max:8192',
            'platform' => 'nullable|string|max:64',
            'device_info' => 'nullable',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();
        $deviceInfo = $validated['device_info'] ?? null;

        if (is_string($deviceInfo)) {
            $decoded = json_decode($deviceInfo, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $deviceInfo = $decoded;
            } else {
                $deviceInfo = ['raw' => $deviceInfo];
            }
        }

        if ($deviceInfo !== null && ! is_array($deviceInfo)) {
            $deviceInfo = ['value' => $deviceInfo];
        }

        if (is_array($deviceInfo) && empty($deviceInfo)) {
            $deviceInfo = null;
        }

        $platform = $validated['platform'] ?? null;

        if (! $platform && is_array($deviceInfo) && isset($deviceInfo['platform']) && is_string($deviceInfo['platform'])) {
            $platform = $deviceInfo['platform'];
        }

        if (is_string($platform)) {
            $platform = trim(mb_substr($platform, 0, 64));

            if ($platform === '') {
                $platform = null;
            }
        } else {
            $platform = null;
        }

        $user = $request->user();

        $token = $user->pushTokens()->updateOrCreate(
            ['fcm_token' => $validated['fcm_token']],
            [
                'platform' => $platform,
                'device_info' => $deviceInfo,
                'last_used_at' => now(),
                'invalidated_at' => null,
            ]
        );

        Log::info('FCM push token stored for user', [
            'user_id' => $user->id_users,
            'token_id' => $token->id,
        ]);

        return response()->json([
            'message' => 'Push notification token stored successfully',
            'data' => $token,
        ], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $input = $request->all();

        if (! isset($input['fcm_token']) && isset($input['expo_push_token'])) {
            $input['fcm_token'] = $input['expo_push_token'];
        }

        $validator = Validator::make($input, [
            'fcm_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        $validated = $validator->validated();

        $deleted = $user->pushTokens()
            ->where('fcm_token', $validated['fcm_token'])
            ->delete();

        if (! $deleted) {
            return response()->json([
                'message' => 'Push notification token not found',
            ], 404);
        }

        Log::info('FCM push token removed for user', [
            'user_id' => $user->id_users,
            'fcm_token' => $validated['fcm_token'],
        ]);

        return response()->json([
            'message' => 'Push notification token removed successfully',
        ]);
    }
}
