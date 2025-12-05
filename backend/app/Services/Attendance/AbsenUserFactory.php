<?php

namespace App\Services\Attendance;

use App\Models\AbsenUser;
use Illuminate\Support\Facades\Schema;

class AbsenUserFactory
{
    public function forAnak(int $idAnak, ?int $companyId): AbsenUser
    {
        $this->ensureCompanyContext($companyId);

        return $this->requiresCompanyColumn()
            ? AbsenUser::updateOrCreate(['id_anak' => $idAnak], ['company_id' => $companyId])
            : AbsenUser::firstOrCreate(['id_anak' => $idAnak]);
    }

    public function forTutor(int $idTutor, ?int $companyId): AbsenUser
    {
        $this->ensureCompanyContext($companyId);

        return $this->requiresCompanyColumn()
            ? AbsenUser::updateOrCreate(['id_tutor' => $idTutor], ['company_id' => $companyId])
            : AbsenUser::firstOrCreate(['id_tutor' => $idTutor]);
    }

    public function requiresCompanyColumn(): bool
    {
        return Schema::hasColumn('absen_user', 'company_id');
    }

    protected function ensureCompanyContext(?int $companyId): void
    {
        if ($this->requiresCompanyColumn() && !$companyId) {
            throw new \Exception('Company context is required for attendance.');
        }
    }
}
