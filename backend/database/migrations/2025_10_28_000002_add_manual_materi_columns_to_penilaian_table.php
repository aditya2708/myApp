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
        Schema::table('penilaian', function (Blueprint $table) {
            if (!Schema::hasColumn('penilaian', 'mata_pelajaran_manual')) {
                $table->string('mata_pelajaran_manual')
                    ->nullable()
                    ->after('materi_text');
            }

            if (!Schema::hasColumn('penilaian', 'materi_manual')) {
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
        Schema::table('penilaian', function (Blueprint $table) {
            if (Schema::hasColumn('penilaian', 'materi_manual')) {
                $table->dropColumn('materi_manual');
            }

            if (Schema::hasColumn('penilaian', 'mata_pelajaran_manual')) {
                $table->dropColumn('mata_pelajaran_manual');
            }
        });
    }
};
