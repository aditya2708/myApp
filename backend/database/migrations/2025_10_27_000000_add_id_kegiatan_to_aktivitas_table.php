<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('aktivitas', function (Blueprint $table) {
            if (!Schema::hasColumn('aktivitas', 'id_kegiatan')) {
                $table->unsignedBigInteger('id_kegiatan')->nullable()->after('jenis_kegiatan');
                $table->foreign('id_kegiatan')
                    ->references('id_kegiatan')
                    ->on('kegiatan')
                    ->onUpdate('cascade')
                    ->onDelete('restrict');
            }
        });

        $activityTypes = DB::table('aktivitas')
            ->select('jenis_kegiatan')
            ->whereNotNull('jenis_kegiatan')
            ->distinct()
            ->pluck('jenis_kegiatan');

        foreach ($activityTypes as $namaKegiatan) {
            if (!$namaKegiatan) {
                continue;
            }

            $existing = DB::table('kegiatan')
                ->where('nama_kegiatan', $namaKegiatan)
                ->first();

            if (!$existing) {
                $kegiatanId = DB::table('kegiatan')->insertGetId([
                    'nama_kegiatan' => $namaKegiatan,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $kegiatanId = $existing->id_kegiatan;
            }

            DB::table('aktivitas')
                ->where('jenis_kegiatan', $namaKegiatan)
                ->update(['id_kegiatan' => $kegiatanId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('aktivitas', function (Blueprint $table) {
            if (Schema::hasColumn('aktivitas', 'id_kegiatan')) {
                $table->dropForeign(['id_kegiatan']);
                $table->dropColumn('id_kegiatan');
            }
        });
    }
};
