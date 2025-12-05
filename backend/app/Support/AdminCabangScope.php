<?php

namespace App\Support;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

trait AdminCabangScope
{
    /**
     * Ambil company ID dari SSO context atau fallback ke admin cabang aktif.
     */
    protected function companyId(?int $fallback = null): ?int
    {
        if (app()->bound(SsoContext::class) && app(SsoContext::class)->company()) {
            return app(SsoContext::class)->company()->id;
        }

        return $fallback ?? Auth::user()?->adminCabang?->company_id;
    }

    /**
     * Terapkan filter company_id jika kolom tersedia pada tabel terkait.
     */
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
