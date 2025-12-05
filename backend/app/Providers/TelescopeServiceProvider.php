<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

class TelescopeServiceProvider extends TelescopeApplicationServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Telescope::night();

        $this->hideSensitiveRequestDetails();

        $isLocal = $this->app->environment('local');

        Telescope::filter(function (IncomingEntry $entry) use ($isLocal) {
            return $isLocal ||
                   $entry->isReportableException() ||
                   $entry->isFailedRequest() ||
                   $entry->isFailedJob() ||
                   $entry->isScheduledTask() ||
                   $entry->hasMonitoredTag();
        });
    }

    /**
     * Prevent sensitive request details from being logged by Telescope.
     */
    protected function hideSensitiveRequestDetails(): void
    {
        if ($this->app->environment('local')) {
            return;
        }

        Telescope::hideRequestParameters(['_token']);

        Telescope::hideRequestHeaders([
            'cookie',
            'x-csrf-token',
            'x-xsrf-token',
        ]);
    }

    /**
     * Register the Telescope gate.
     *
     * This gate determines who can access Telescope in non-local environments.
     */
    protected function gate(): void
    {
        Gate::define('viewTelescope', function ($user) {
            if (!$user) {
                return false;
            }

            $allowedEmails = array_filter(
                array_map('trim', explode(',', (string) env('TELESCOPE_ALLOWED_EMAILS', '')))
            );

            // Allow by explicit email whitelist
            if (!empty($allowedEmails) && in_array($user->email, $allowedEmails, true)) {
                return true;
            }

            // Allow specific roles if available on the user model
            $role = $user->role ?? null;
            if (in_array($role, ['super_admin', 'admin_pusat'], true)) {
                return true;
            }

            if (method_exists($user, 'hasRole')) {
                if ($user->hasRole('super_admin') || $user->hasRole('admin_pusat')) {
                    return true;
                }
            }

            return false;
        });
    }
}
