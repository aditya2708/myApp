<?php

namespace App\Jobs;

use App\Models\UserPushToken;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PurgeInvalidFcmTokens implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private readonly int $graceMinutes = 60)
    {
    }

    public function handle(): void
    {
        $threshold = now()->subMinutes($this->graceMinutes);
        $totalDeleted = 0;

        UserPushToken::query()
            ->whereNotNull('invalidated_at')
            ->where('invalidated_at', '<=', $threshold)
            ->chunkById(500, function ($tokens) use (&$totalDeleted) {
                $ids = $tokens->pluck('id')->all();

                if (empty($ids)) {
                    return false;
                }

                $deleted = UserPushToken::query()->whereIn('id', $ids)->delete();
                $totalDeleted += $deleted;
            });

        if ($totalDeleted > 0) {
            Log::info('PurgeInvalidFcmTokens removed invalidated tokens', [
                'deleted' => $totalDeleted,
                'grace_minutes' => $this->graceMinutes,
            ]);
        }
    }
}
