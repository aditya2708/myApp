<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, $role)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized access'
            ], 403);
        }

        $requiredRoles = array_filter(explode('|', (string) $role));
        $currentRole = $request->header('X-Current-Role');
        $scopeType = $request->header('X-Current-Scope-Type');
        $scopeId = $request->header('X-Current-Scope-Id');
        $scopeId = is_numeric($scopeId) ? (int) $scopeId : null;
        $companyContext = $request->attributes->get('current_company');
        $companyRole = $request->attributes->get('current_role');
        $companyRoleSlug = is_array($companyRole)
            ? ($companyRole['slug'] ?? null)
            : (is_string($companyRole) ? $companyRole : null);
        $companyId = is_object($companyContext) ? ($companyContext->id ?? null) : null;

        if ($currentRole && !in_array($currentRole, $requiredRoles, true)) {
            return response()->json([
                'message' => 'Current role does not match the required role for this endpoint'
            ], 403);
        }

        if (!$currentRole && $companyRoleSlug && in_array($companyRoleSlug, $requiredRoles, true)) {
            $currentRole = $companyRoleSlug;
        }

        $rolesToCheck = $currentRole ? [$currentRole] : $requiredRoles;
        $matchedRole = null;

        foreach ($rolesToCheck as $candidateRole) {
            if ($user->hasRole($candidateRole, $scopeType, $scopeId)) {
                $matchedRole = [
                    'slug' => $candidateRole,
                    'scope_type' => $scopeType,
                    'scope_id' => $scopeId,
                ];
                break;
            }

            if ($companyRoleSlug && $companyRoleSlug === $candidateRole) {
                $matchedRole = [
                    'slug' => $companyRoleSlug,
                    'scope_type' => $companyId ? 'company' : null,
                    'scope_id' => $companyId,
                ];
                break;
            }
        }

        if (!$matchedRole) {
            return response()->json([
                'message' => 'Unauthorized access'
            ], 403);
        }

        $request->attributes->set('current_role', $matchedRole);

        return $next($request);
    }
}
