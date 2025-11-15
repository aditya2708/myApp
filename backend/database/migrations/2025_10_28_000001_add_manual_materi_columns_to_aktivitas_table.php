<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('aktivitas', function (Blueprint $table) {
            if (!Schema::hasColumn('aktivitas', 'pakai_materi_manual')) {
                $table->boolean('pakai_materi_manual')
                    ->default(false)
                    ->after('id_materi');
            }

            if (!Schema::hasColumn('aktivitas', 'mata_pelajaran_manual')) {
                $table->string('mata_pelajaran_manual')
                    ->nullable()
                    ->after('pakai_materi_manual');
            }

            if (!Schema::hasColumn('aktivitas', 'materi_manual')) {
                $table->text('materi_manual')
                    ->nullable()
                    ->after('mata_pelajaran_manual');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aktivitas', function (Blueprint $table) {
            if (Schema::hasColumn('aktivitas', 'materi_manual')) {
                $table->dropColumn('materi_manual');
            }

            if (Schema::hasColumn('aktivitas', 'mata_pelajaran_manual')) {
                $table->dropColumn('mata_pelajaran_manual');
            }

            if (Schema::hasColumn('aktivitas', 'pakai_materi_manual')) {
                $table->dropColumn('pakai_materi_manual');
            }
        });
    }
};
