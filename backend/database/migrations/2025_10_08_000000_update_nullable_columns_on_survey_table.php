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
        Schema::table('survey', function (Blueprint $table) {
            $table->string('pekerjaan_kepala_keluarga')->nullable()->change();
            $table->string('pendidikan_kepala_keluarga')->nullable()->change();
            $table->integer('jumlah_tanggungan')->nullable()->change();
            $table->string('kepemilikan_tabungan')->nullable()->change();
            $table->integer('jumlah_makan')->nullable()->change();
            $table->string('kepemilikan_tanah')->nullable()->change();
            $table->string('kepemilikan_rumah')->nullable()->change();
            $table->string('kondisi_rumah_dinding')->nullable()->change();
            $table->string('kondisi_rumah_lantai')->nullable()->change();
            $table->string('kepemilikan_kendaraan')->nullable()->change();
            $table->string('kepemilikan_elektronik')->nullable()->change();
            $table->string('sumber_air_bersih')->nullable()->change();
            $table->string('jamban_limbah')->nullable()->change();
            $table->string('tempat_sampah')->nullable()->change();
            $table->string('perokok')->nullable()->change();
            $table->string('konsumen_miras')->nullable()->change();
            $table->string('persediaan_p3k')->nullable()->change();
            $table->string('makan_buah_sayur')->nullable()->change();
            $table->string('solat_lima_waktu')->nullable()->change();
            $table->string('membaca_alquran')->nullable()->change();
            $table->string('majelis_taklim')->nullable()->change();
            $table->string('membaca_koran')->nullable()->change();
            $table->string('pengurus_organisasi')->nullable()->change();
            $table->string('pengurus_organisasi_sebagai')->nullable()->change();
            $table->string('kondisi_fisik_anak')->nullable()->change();
            $table->string('keterangan_disabilitas')->nullable()->change();
            $table->string('kepribadian_anak')->nullable()->change();
            $table->unsignedInteger('biaya_pendidikan_perbulan')->nullable()->change();
            $table->string('bantuan_lembaga_formal_lain')->nullable()->change();
            $table->unsignedInteger('bantuan_lembaga_formal_lain_sebesar')->nullable()->change();
            $table->string('kondisi_penerima_manfaat')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey', function (Blueprint $table) {
            $table->string('pekerjaan_kepala_keluarga')->default('')->nullable(false)->change();
            $table->string('pendidikan_kepala_keluarga')->default('')->nullable(false)->change();
            $table->integer('jumlah_tanggungan')->default(0)->nullable(false)->change();
            $table->string('kepemilikan_tabungan')->default('')->nullable(false)->change();
            $table->integer('jumlah_makan')->default(0)->nullable(false)->change();
            $table->string('kepemilikan_tanah')->default('')->nullable(false)->change();
            $table->string('kepemilikan_rumah')->default('')->nullable(false)->change();
            $table->string('kondisi_rumah_dinding')->default('')->nullable(false)->change();
            $table->string('kondisi_rumah_lantai')->default('')->nullable(false)->change();
            $table->string('kepemilikan_kendaraan')->default('')->nullable(false)->change();
            $table->string('kepemilikan_elektronik')->default('')->nullable(false)->change();
            $table->string('sumber_air_bersih')->default('')->nullable(false)->change();
            $table->string('jamban_limbah')->default('')->nullable(false)->change();
            $table->string('tempat_sampah')->default('')->nullable(false)->change();
            $table->string('perokok')->default('')->nullable(false)->change();
            $table->string('konsumen_miras')->default('')->nullable(false)->change();
            $table->string('persediaan_p3k')->default('')->nullable(false)->change();
            $table->string('makan_buah_sayur')->default('')->nullable(false)->change();
            $table->string('solat_lima_waktu')->default('')->nullable(false)->change();
            $table->string('membaca_alquran')->default('')->nullable(false)->change();
            $table->string('majelis_taklim')->default('')->nullable(false)->change();
            $table->string('membaca_koran')->default('')->nullable(false)->change();
            $table->string('pengurus_organisasi')->default('')->nullable(false)->change();
            $table->string('pengurus_organisasi_sebagai')->default('')->nullable(false)->change();
            $table->string('kondisi_fisik_anak')->default('')->nullable(false)->change();
            $table->string('keterangan_disabilitas')->default('')->nullable(false)->change();
            $table->string('kepribadian_anak')->default('')->nullable(false)->change();
            $table->unsignedInteger('biaya_pendidikan_perbulan')->default(0)->nullable(false)->change();
            $table->string('bantuan_lembaga_formal_lain')->default('')->nullable(false)->change();
            $table->unsignedInteger('bantuan_lembaga_formal_lain_sebesar')->default(0)->nullable(false)->change();
            $table->string('kondisi_penerima_manfaat')->default('')->nullable(false)->change();
        });
    }
};
