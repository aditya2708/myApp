<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Exception\FirebaseException;
use Kreait\Firebase\Exception\MessagingException;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Throwable;

class PushNotificationService
{
    public function __construct(private readonly Messaging $messaging)
    {
    }

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
                'errors' => ['No push tokens supplied'],
            ];
        }

        $title = isset($message['title']) ? (string) $message['title'] : null;
        $body = isset($message['body']) ? (string) $message['body'] : null;
        $data = [];

        if (isset($message['data']) && is_array($message['data'])) {
            foreach ($message['data'] as $key => $value) {
                if (! is_scalar($value) && $value !== null) {
                    $encoded = json_encode($value);
                    $value = $encoded !== false ? $encoded : null;
                }

                $data[$key] = $value === null ? null : (string) $value;
            }

            $data = array_filter($data, static fn ($value) => $value !== null);
        }

        $cloudMessage = CloudMessage::new();

        if ($title !== null || $body !== null) {
            $cloudMessage = $cloudMessage->withNotification(Notification::create($title, $body));
        }

        if (! empty($data)) {
            $cloudMessage = $cloudMessage->withData($data);
        }

        try {
            $report = $this->messaging->sendMulticast($cloudMessage, $tokens);

            $errors = [];

            foreach ($report->responses() as $index => $response) {
                if ($response->isSuccess()) {
                    continue;
                }

                $error = $response->error();
                $target = $response->target();

                $token = $tokens[$index] ?? null;

                if (is_string($target)) {
                    $token = $target;
                } elseif (is_object($target) && method_exists($target, 'value')) {
                    $token = $target->value();
                }

                $errors[] = array_filter([
                    'token' => $token,
                    'code' => is_object($error) && method_exists($error, 'getCode') ? $error->getCode() : null,
                    'message' => $error?->getMessage(),
                ], static fn ($value) => $value !== null);
            }

            if (! empty($errors)) {
                Log::warning('Firebase push notification delivered with errors', [
                    'tokens' => $tokens,
                    'errors' => $errors,
                ]);
            }

            return [
                'success' => empty($errors),
                'response' => [
                    'successes' => $report->successes()->count(),
                    'failures' => $report->failures()->count(),
                ],
                'errors' => $errors,
            ];
        } catch (MessagingException|FirebaseException $exception) {
            Log::error('Firebase push notification failed to send', [
                'tokens' => $tokens,
                'message' => $message,
                'exception' => $exception->getMessage(),
            ]);

            return [
                'success' => false,
                'response' => null,
                'errors' => [$exception->getMessage()],
            ];
        } catch (Throwable $exception) {
            Log::error('Unexpected error while sending Firebase push notification', [
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
