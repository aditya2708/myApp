<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('mata_pelajaran')
            ->whereNotNull('target_jenjang')
            ->where(function ($query) {
                $query->where('target_jenjang', '[]')
                      ->orWhereJsonLength('target_jenjang', 0);
            })
            ->update(['target_jenjang' => null]);

        DB::table('mata_pelajaran')
            ->whereNotNull('target_kelas')
            ->where(function ($query) {
                $query->where('target_kelas', '[]')
                      ->orWhereJsonLength('target_kelas', 0);
            })
            ->update(['target_kelas' => null]);
    }

    public function down(): void
    {
        // No rollback needed because original intent cannot be reliably restored.
    }
};
