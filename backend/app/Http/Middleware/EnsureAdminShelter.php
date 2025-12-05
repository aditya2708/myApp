<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiExceptionHandler;
use App\Support\SsoContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminShelter
{
    /**
     * Guard admin-shelter routes from null relations to prevent 500s.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return ApiExceptionHandler::businessRuleError(
                'Unauthenticated request',
                'AUTHENTICATION_ERROR',
                401
            );
        }

        $adminShelter = $user->adminShelter;

        if (!$adminShelter) {
            return ApiExceptionHandler::businessRuleError(
                'Account is not registered as an Admin Shelter',
                'ADMIN_SHELTER_NOT_FOUND',
                403
            );
        }

        if (!$adminShelter->shelter) {
            return ApiExceptionHandler::businessRuleError(
                'Admin Shelter profile is missing its shelter assignment',
                'SHELTER_NOT_ASSIGNED',
                422
            );
        }

        if (app()->bound(SsoContext::class) && app(SsoContext::class)->company()) {
            $companyId = app(SsoContext::class)->company()->id;
            if ((int) $adminShelter->company_id !== (int) $companyId) {
                return ApiExceptionHandler::businessRuleError(
                    'Admin Shelter company mismatch with current SSO context',
                    'COMPANY_SCOPE_MISMATCH',
                    403
                );
            }
        }

        $adminShelter->loadMissing(['shelter', 'wilbin', 'kacab']);
        $request->attributes->set('adminShelter', $adminShelter);

        return $next($request);
    }
}
