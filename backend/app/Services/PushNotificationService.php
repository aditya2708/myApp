<?php

namespace App\Services;

use ExponentPhpSDK\Expo;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Log;
use Throwable;

class PushNotificationService
{
    /**
     * Send a push notification to the provided Expo tokens.
     *
     * @param  array<int, string>  $tokens
     * @param  array<string, mixed>  $message
     * @return array{success: bool, response: mixed, errors: array<int, mixed>}
     */
    public function send(array $tokens, array $message): array
    {
        $tokens = array_values(array_filter(array_unique($tokens)));

        if (empty($tokens)) {
            return [
                'success' => false,
                'response' => null,
                'errors' => ['No Expo push tokens supplied'],
            ];
        }

        try {
            $response = Expo::send($message, $tokens);

            $errors = [];

            if (is_array($response)) {
                foreach ($response as $result) {
                    $status = Arr::get($result, 'status');
                    if ($status !== null && $status !== 'ok') {
                        $errors[] = $result;
                    }
                }
            }

            if (! empty($errors)) {
                Log::warning('Expo push notification delivered with errors', [
                    'tokens' => $tokens,
                    'errors' => $errors,
                ]);
            }

            return [
                'success' => empty($errors),
                'response' => $response,
                'errors' => $errors,
            ];
        } catch (Throwable $exception) {
            Log::error('Expo push notification failed to send', [
                'tokens' => $tokens,
                'message' => $message,
                'exception' => $exception->getMessage(),
            ]);

            return [
                'success' => false,
                'response' => null,
                'errors' => [$exception->getMessage()],
            ];
        }
    }
}
