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
        Schema::table('survey', function (Blueprint $table) {
            $table->string('hasil_survey', 50)
                ->default('draft')
                ->change();
        });

        Schema::table('survey', function (Blueprint $table) {
            $table->unsignedBigInteger('submitted_by')
                ->nullable()
                ->after('approved_by');

            $table->foreign('submitted_by')
                ->references('id_users')
                ->on('users')
                ->onDelete('set null');

            $table->timestamp('submitted_at')
                ->nullable()
                ->after('submitted_by');
        });

        DB::table('survey')
            ->whereNull('hasil_survey')
            ->update(['hasil_survey' => 'pending']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('survey', function (Blueprint $table) {
            $table->dropForeign(['submitted_by']);
            $table->dropColumn(['submitted_by', 'submitted_at']);
        });

        Schema::table('survey', function (Blueprint $table) {
            $table->string('hasil_survey', 50)
                ->default('pending')
                ->change();
        });
    }
};
