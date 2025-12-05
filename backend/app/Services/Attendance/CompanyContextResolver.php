<?php

namespace App\Services\Attendance;

use App\Models\Aktivitas;
use App\Models\Anak;
use App\Models\Tutor;
use App\Support\SsoContext;
use Illuminate\Support\Facades\Auth;

class CompanyContextResolver
{
    /**
     * Resolve company context from SSO, admin shelter, or related entities.
     */
    public function resolve(?Anak $anak = null, ?Aktivitas $aktivitas = null, ?Tutor $tutor = null): ?int
    {
        if (app()->bound(SsoContext::class)) {
            $company = app(SsoContext::class)->company();
            if ($company && $company->id) {
                return (int) $company->id;
            }
        }

        $authUser = Auth::user();
        if ($authUser?->adminShelter?->company_id) {
            return (int) $authUser->adminShelter->company_id;
        }

        if ($anak?->company_id) {
            return (int) $anak->company_id;
        }

        if ($tutor?->company_id) {
            return (int) $tutor->company_id;
        }

        if ($aktivitas?->company_id) {
            return (int) $aktivitas->company_id;
        }

        return null;
    }
}
