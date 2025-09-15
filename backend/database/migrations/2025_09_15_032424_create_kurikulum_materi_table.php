<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kurikulum_materi', function (Blueprint $table) {
            $table->unsignedBigInteger('id_kurikulum');
            $table->unsignedBigInteger('id_mata_pelajaran');
            $table->unsignedBigInteger('id_materi');
            $table->unsignedInteger('urutan');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kurikulum_materi');
    }
};
