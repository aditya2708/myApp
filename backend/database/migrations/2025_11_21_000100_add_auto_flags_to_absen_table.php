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
        Schema::table('absen', function (Blueprint $table) {
            if (!Schema::hasColumn('absen', 'auto_flag')) {
                $table->string('auto_flag', 100)->nullable()->after('gps_validation_notes');
            }

            if (!Schema::hasColumn('absen', 'auto_flag_payload')) {
                $table->json('auto_flag_payload')->nullable()->after('auto_flag');
            }

            if (!Schema::hasColumn('absen', 'review_status')) {
                $table->string('review_status', 50)->default('clean')->after('auto_flag_payload');
            }

            if (!Schema::hasColumn('absen', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('review_status');
            }

            if (!Schema::hasColumn('absen', 'reviewed_by')) {
                $table->unsignedBigInteger('reviewed_by')->nullable()->after('reviewed_at');
                $table->foreign('reviewed_by')
                    ->references('id_users')
                    ->on('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('absen', 'review_notes')) {
                $table->text('review_notes')->nullable()->after('reviewed_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('absen', function (Blueprint $table) {
            if (Schema::hasColumn('absen', 'review_notes')) {
                $table->dropColumn('review_notes');
            }

            if (Schema::hasColumn('absen', 'reviewed_by')) {
                $table->dropForeign(['reviewed_by']);
                $table->dropColumn('reviewed_by');
            }

            if (Schema::hasColumn('absen', 'reviewed_at')) {
                $table->dropColumn('reviewed_at');
            }

            if (Schema::hasColumn('absen', 'review_status')) {
                $table->dropColumn('review_status');
            }

            if (Schema::hasColumn('absen', 'auto_flag_payload')) {
                $table->dropColumn('auto_flag_payload');
            }

            if (Schema::hasColumn('absen', 'auto_flag')) {
                $table->dropColumn('auto_flag');
            }
        });
    }
};
