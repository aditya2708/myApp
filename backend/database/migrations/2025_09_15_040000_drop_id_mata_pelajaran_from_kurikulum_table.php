<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('kurikulum', 'id_mata_pelajaran')) {
            Schema::table('kurikulum', function (Blueprint $table) {
                try {
                    $table->dropConstrainedForeignId('id_mata_pelajaran');
                } catch (\Throwable $exception) {
                    $table->dropColumn('id_mata_pelajaran');
                }
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('kurikulum', 'id_mata_pelajaran')) {
            Schema::table('kurikulum', function (Blueprint $table) {
                $table->foreignId('id_mata_pelajaran')
                    ->after('id_jenjang')
                    ->constrained('mata_pelajaran', 'id_mata_pelajaran');
            });
        }
    }
};
