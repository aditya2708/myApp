<?php

namespace App\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

trait AdminShelterScope
{
    protected function companyId(): ?int
    {
        return app()->bound(SsoContext::class)
            ? app(SsoContext::class)->company()?->id
            : Auth::user()?->adminShelter?->company_id;
    }

    protected function shelterId(): ?int
    {
        return request()->attributes->get('adminShelter')?->id_shelter
            ?? Auth::user()?->adminShelter?->id_shelter;
    }

    protected function kacabId(): ?int
    {
        $adminShelter = request()->attributes->get('adminShelter') ?? Auth::user()?->adminShelter;

        if (!$adminShelter) {
            return null;
        }

        return $adminShelter->id_kacab
            ?? $adminShelter->shelter?->id_kacab
            ?? $adminShelter->shelter?->wilbin?->id_kacab;
    }

    protected function applyCompanyScope($query, ?int $companyId = null, ?string $table = null)
    {
        $companyId ??= $this->companyId();
        $table ??= method_exists($query, 'getModel') ? $query->getModel()->getTable() : null;

        if ($companyId && $table && Schema::hasColumn($table, 'company_id')) {
            $query->where($table . '.company_id', $companyId);
        }

        return $query;
    }
}
