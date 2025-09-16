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
        if (!Schema::hasTable('kurikulum')) {
            return;
        }

        Schema::table('kurikulum', function (Blueprint $table) {
            if (!Schema::hasColumn('kurikulum', 'jenis')) {
                $table->string('jenis')->nullable()->after('kode_kurikulum');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('kurikulum')) {
            return;
        }

        Schema::table('kurikulum', function (Blueprint $table) {
            if (Schema::hasColumn('kurikulum', 'jenis')) {
                $table->dropColumn('jenis');
            }
        });
    }
};
