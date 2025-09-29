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
        Schema::table('shelter', function (Blueprint $table) {
            if (!Schema::hasColumn('shelter', 'gps_approval_status')) {
                $table->string('gps_approval_status')->default('pending')->after('gps_accuracy_required');
            }

            if (!Schema::hasColumn('shelter', 'gps_approval_data')) {
                $table->json('gps_approval_data')->nullable()->after('gps_approval_status');
            }

            if (!Schema::hasColumn('shelter', 'gps_submitted_at')) {
                $table->timestamp('gps_submitted_at')->nullable()->after('gps_approval_data');
            }

            if (!Schema::hasColumn('shelter', 'gps_approved_at')) {
                $table->timestamp('gps_approved_at')->nullable()->after('gps_submitted_at');
            }

            if (!Schema::hasColumn('shelter', 'gps_approved_by')) {
                $table->unsignedBigInteger('gps_approved_by')->nullable()->after('gps_approved_at');
                $table->foreign('gps_approved_by')
                    ->references('id_users')
                    ->on('users')
                    ->nullOnDelete();
            }

            if (!Schema::hasColumn('shelter', 'gps_rejection_reason')) {
                $table->text('gps_rejection_reason')->nullable()->after('gps_approved_by');
            }

            if (!Schema::hasColumn('shelter', 'gps_change_history')) {
                $table->json('gps_change_history')->nullable()->after('gps_rejection_reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shelter', function (Blueprint $table) {
            if (Schema::hasColumn('shelter', 'gps_change_history')) {
                $table->dropColumn('gps_change_history');
            }

            if (Schema::hasColumn('shelter', 'gps_rejection_reason')) {
                $table->dropColumn('gps_rejection_reason');
            }

            if (Schema::hasColumn('shelter', 'gps_approved_by')) {
                $table->dropForeign(['gps_approved_by']);
                $table->dropColumn('gps_approved_by');
            }

            if (Schema::hasColumn('shelter', 'gps_approved_at')) {
                $table->dropColumn('gps_approved_at');
            }

            if (Schema::hasColumn('shelter', 'gps_submitted_at')) {
                $table->dropColumn('gps_submitted_at');
            }

            if (Schema::hasColumn('shelter', 'gps_approval_data')) {
                $table->dropColumn('gps_approval_data');
            }

            if (Schema::hasColumn('shelter', 'gps_approval_status')) {
                $table->dropColumn('gps_approval_status');
            }
        });
    }
};
