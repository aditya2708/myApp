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
        $validator = Validator::make($request->all(), [
            'expo_push_token' => 'required|string',
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

        $user = $request->user();

        $token = $user->pushTokens()->updateOrCreate(
            ['expo_push_token' => $validated['expo_push_token']],
            [
                'device_info' => $deviceInfo,
                'last_used_at' => now(),
            ]
        );

        Log::info('Expo push token stored for user', [
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
        $validator = Validator::make($request->all(), [
            'expo_push_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        $deleted = $user->pushTokens()
            ->where('expo_push_token', $validator->validated()['expo_push_token'])
            ->delete();

        if (! $deleted) {
            return response()->json([
                'message' => 'Push notification token not found',
            ], 404);
        }

        Log::info('Expo push token removed for user', [
            'user_id' => $user->id_users,
            'expo_push_token' => $validator->validated()['expo_push_token'],
        ]);

        return response()->json([
            'message' => 'Push notification token removed successfully',
        ]);
    }
}
