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
        Schema::table('activity_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('activity_reports', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('foto_3');
            }

            if (!Schema::hasColumn('activity_reports', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }

            if (!Schema::hasColumn('activity_reports', 'location_accuracy')) {
                $table->decimal('location_accuracy', 8, 2)->nullable()->after('longitude');
            }

            if (!Schema::hasColumn('activity_reports', 'location_recorded_at')) {
                $table->timestamp('location_recorded_at')->nullable()->after('location_accuracy');
            }

            if (!Schema::hasColumn('activity_reports', 'auto_flag')) {
                $table->string('auto_flag', 100)->nullable()->after('location_recorded_at');
            }

            if (!Schema::hasColumn('activity_reports', 'auto_flag_payload')) {
                $table->json('auto_flag_payload')->nullable()->after('auto_flag');
            }

            if (!Schema::hasColumn('activity_reports', 'review_status')) {
                $table->string('review_status', 50)->default('clean')->after('auto_flag_payload');
            }

            if (!Schema::hasColumn('activity_reports', 'reviewed_at')) {
                $table->timestamp('reviewed_at')->nullable()->after('review_status');
            }

            if (!Schema::hasColumn('activity_reports', 'reviewed_by')) {
                $table->unsignedBigInteger('reviewed_by')->nullable()->after('reviewed_at');
                $table->foreign('reviewed_by')
                    ->references('id_users')
                    ->on('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('activity_reports', 'review_notes')) {
                $table->text('review_notes')->nullable()->after('reviewed_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_reports', function (Blueprint $table) {
            if (Schema::hasColumn('activity_reports', 'review_notes')) {
                $table->dropColumn('review_notes');
            }

            if (Schema::hasColumn('activity_reports', 'reviewed_by')) {
                $table->dropForeign(['reviewed_by']);
                $table->dropColumn('reviewed_by');
            }

            if (Schema::hasColumn('activity_reports', 'reviewed_at')) {
                $table->dropColumn('reviewed_at');
            }

            if (Schema::hasColumn('activity_reports', 'review_status')) {
                $table->dropColumn('review_status');
            }

            if (Schema::hasColumn('activity_reports', 'auto_flag_payload')) {
                $table->dropColumn('auto_flag_payload');
            }

            if (Schema::hasColumn('activity_reports', 'auto_flag')) {
                $table->dropColumn('auto_flag');
            }

            if (Schema::hasColumn('activity_reports', 'location_recorded_at')) {
                $table->dropColumn('location_recorded_at');
            }

            if (Schema::hasColumn('activity_reports', 'location_accuracy')) {
                $table->dropColumn('location_accuracy');
            }

            if (Schema::hasColumn('activity_reports', 'longitude')) {
                $table->dropColumn('longitude');
            }

            if (Schema::hasColumn('activity_reports', 'latitude')) {
                $table->dropColumn('latitude');
            }
        });
    }
};
