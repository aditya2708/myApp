<?php

namespace App\Support;

use Illuminate\Support\Facades\Schema;
use App\Support\SsoContext;

trait AdminPusatScope
{
    /**
     * Ambil company id dari konteks SSO atau fallback.
     */
    protected function companyId(?int $fallback = null): ?int
    {
        if (app()->bound(SsoContext::class) && app(SsoContext::class)->company()) {
            return app(SsoContext::class)->company()->id;
        }

        return $fallback;
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
