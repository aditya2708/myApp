<?php

namespace App\Console\Commands;

use App\Jobs\PurgeInvalidFcmTokens;
use App\Models\Aktivitas;
use App\Models\UserPushToken;
use App\Services\PushNotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendUpcomingActivityNotifications extends Command
{
    protected $signature = 'notifications:send-upcoming-activities
                            {--window-start=15 : Minutes from now to start the notification window}
                            {--window-end=30 : Minutes from now to end the notification window}';

    protected $description = 'Send push notifications for upcoming Admin Shelter activities.';

    public function __construct(private readonly PushNotificationService $pushNotificationService)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $now = now();
        $startMinutes = (int) $this->option('window-start');
        $endMinutes = (int) $this->option('window-end');

        if ($startMinutes < 0) {
            $startMinutes = 0;
        }

        if ($endMinutes <= $startMinutes) {
            $endMinutes = $startMinutes + 15;
        }

        $startWindow = $now->copy()->addMinutes($startMinutes);
        $endWindow = $now->copy()->addMinutes($endMinutes);

        Log::info('SendUpcomingActivityNotifications started', [
            'now' => $now->toIso8601String(),
            'window_start' => $startWindow->toIso8601String(),
            'window_end' => $endWindow->toIso8601String(),
        ]);

        $activities = Aktivitas::query()
            ->with(['shelter.adminShelters.user.pushTokens'])
            ->whereDate('tanggal', $now->toDateString())
            ->whereNull('notified_at')
            ->whereNotNull('start_time')
            ->get()
            ->filter(function (Aktivitas $activity) use ($startWindow, $endWindow) {
                $startDateTime = $this->resolveStartDateTime($activity);

                if (! $startDateTime) {
                    return false;
                }

                return $startDateTime->greaterThanOrEqualTo($startWindow)
                    && $startDateTime->lessThanOrEqualTo($endWindow);
            });

        if ($activities->isEmpty()) {
            $this->info('Tidak ada aktivitas yang perlu dikirim notifikasinya saat ini.');
            Log::info('SendUpcomingActivityNotifications finished - no activities to notify');

            return self::SUCCESS;
        }

        $sentCount = 0;
        $failedCount = 0;

        foreach ($activities as $activity) {
            $startDateTime = $this->resolveStartDateTime($activity);

            if (! $startDateTime) {
                Log::warning('Aktivitas dilewati karena tidak memiliki start_time yang valid', [
                    'activity_id' => $activity->id_aktivitas,
                ]);

                continue;
            }

            $adminShelters = $activity->shelter?->adminShelters ?? collect();

            if ($adminShelters->isEmpty()) {
                Log::warning('Tidak ada admin shelter terkait aktivitas', [
                    'activity_id' => $activity->id_aktivitas,
                ]);
                $this->warn("Tidak ada admin shelter untuk aktivitas ID {$activity->id_aktivitas}");

                continue;
            }

            $tokenModels = $adminShelters
                ->flatMap(function ($adminShelter) {
                    return $adminShelter->user?->pushTokens ?? collect();
                })
                ->filter(function ($token) {
                    return filled($token->fcm_token) && $token->invalidated_at === null;
                })
                ->unique('fcm_token')
                ->values();

            if ($tokenModels->isEmpty()) {
                Log::warning('Tidak ada token push untuk aktivitas', [
                    'activity_id' => $activity->id_aktivitas,
                ]);
                $this->warn("Tidak ada token push untuk aktivitas ID {$activity->id_aktivitas}");

                continue;
            }

            $tokens = $tokenModels->pluck('fcm_token')->values()->all();
            $activityTitle = $activity->materi ?: $activity->jenis_kegiatan ?: 'Aktivitas Shelter';
            $startTimeLabel = $startDateTime->timezone(config('app.timezone'))
                ->format('H:i');

            $payload = [
                'title' => 'Pengingat Aktivitas',
                'body' => sprintf('%s akan dimulai pada %s', $activityTitle, $startTimeLabel),
                'data' => [
                    'activity' => [
                        'id' => $activity->id_aktivitas,
                        'shelter_id' => $activity->id_shelter,
                        'title' => $activityTitle,
                        'tanggal' => optional($activity->tanggal)->toDateString(),
                        'start_time' => $startDateTime->toIso8601String(),
                        'jenis_kegiatan' => $activity->jenis_kegiatan,
                        'materi' => $activity->materi,
                    ],
                ],
            ];

            $this->info(sprintf(
                'Mengirim notifikasi aktivitas #%d ke %d token',
                $activity->id_aktivitas,
                count($tokens)
            ));

            $response = $this->pushNotificationService->send($tokens, $payload);

            $invalidTokens = $this->extractInvalidTokens($response['errors'] ?? []);

            if (! empty($invalidTokens)) {
                UserPushToken::query()
                    ->whereIn('fcm_token', $invalidTokens)
                    ->update([
                        'invalidated_at' => $now,
                    ]);

                Log::warning('Menandai token FCM invalid berdasarkan respons Firebase', [
                    'tokens' => $invalidTokens,
                ]);

                PurgeInvalidFcmTokens::dispatch();
            }

            $responseMeta = $response['response'] ?? [];
            $successCount = is_array($responseMeta) ? (int) ($responseMeta['successes'] ?? 0) : 0;
            $failureCount = is_array($responseMeta) ? (int) ($responseMeta['failures'] ?? 0) : 0;

            if ($successCount === 0) {
                $failedCount++;

                Log::error('Gagal mengirim notifikasi aktivitas', [
                    'activity_id' => $activity->id_aktivitas,
                    'tokens' => $tokens,
                    'errors' => $response['errors'],
                ]);

                $this->error(sprintf(
                    'Gagal mengirim notifikasi untuk aktivitas #%d. Lihat log untuk detailnya.',
                    $activity->id_aktivitas
                ));

                continue;
            }

            $activity->forceFill(['notified_at' => $now])->save();

            $deliveredTokens = array_diff($tokens, $invalidTokens);

            $tokenModels
                ->filter(function (UserPushToken $token) use ($deliveredTokens) {
                    return in_array($token->fcm_token, $deliveredTokens, true);
                })
                ->each(function (UserPushToken $token) use ($now) {
                    $token->forceFill(['last_used_at' => $now])->save();
                });

            $sentCount++;

            Log::info('Notifikasi aktivitas berhasil dikirim', [
                'activity_id' => $activity->id_aktivitas,
                'tokens' => $tokens,
                'successes' => $successCount,
                'failures' => $failureCount,
            ]);
        }

        $this->info(sprintf(
            'Selesai: %d aktivitas terkirim, %d gagal.',
            $sentCount,
            $failedCount
        ));

        Log::info('SendUpcomingActivityNotifications finished', [
            'sent' => $sentCount,
            'failed' => $failedCount,
        ]);

        return $failedCount > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function resolveStartDateTime(Aktivitas $activity): ?Carbon
    {
        if (! $activity->start_time) {
            return null;
        }

        $startTime = $activity->start_time;

        if (Str::contains($startTime, [' ', 'T'])) {
            return Carbon::parse($startTime, config('app.timezone'));
        }

        if (! $activity->tanggal) {
            return null;
        }

        return Carbon::parse(
            $activity->tanggal->format('Y-m-d') . ' ' . $startTime,
            config('app.timezone')
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $errors
     * @return array<int, string>
     */
    private function extractInvalidTokens(array $errors): array
    {
        $invalidTokens = [];

        foreach ($errors as $error) {
            if (! is_array($error)) {
                continue;
            }

            $token = $error['token'] ?? null;

            if (! is_string($token)) {
                continue;
            }

            if (! $this->isInvalidTokenError($error)) {
                continue;
            }

            $invalidTokens[] = $token;
        }

        return array_values(array_unique($invalidTokens));
    }

    /**
     * @param  array<string, mixed>  $error
     */
    private function isInvalidTokenError(array $error): bool
    {
        $code = isset($error['code']) ? (string) $error['code'] : '';
        $message = isset($error['message']) ? Str::lower((string) $error['message']) : '';

        $invalidCodes = [
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token',
            'messaging/mismatched-credential',
            'messaging/invalid-argument',
        ];

        if (in_array($code, $invalidCodes, true)) {
            return true;
        }

        if ($message === '') {
            return false;
        }

        return Str::contains($message, [
            'not registered',
            'invalid registration token',
            'mismatch sender id',
            'mismatch sender-id',
            'unregistered',
        ]);
    }
}
