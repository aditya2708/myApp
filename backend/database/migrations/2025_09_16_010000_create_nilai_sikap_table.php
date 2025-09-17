<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nilai_sikap', function (Blueprint $table) {
            $table->bigIncrements('id_nilai_sikap');
            $table->unsignedBigInteger('id_anak');
            $table->unsignedBigInteger('id_semester');
            $table->decimal('kedisiplinan', 5, 2);
            $table->decimal('kerjasama', 5, 2);
            $table->decimal('tanggung_jawab', 5, 2);
            $table->decimal('sopan_santun', 5, 2);
            $table->string('catatan_sikap', 1000)->nullable();
            $table->timestamps();

            $table->unique(['id_anak', 'id_semester']);
            $table->foreign('id_anak')->references('id_anak')->on('anak')->onUpdate('cascade')->onDelete('cascade');
            $table->foreign('id_semester')->references('id_semester')->on('semester')->onUpdate('cascade')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nilai_sikap');
    }
};
