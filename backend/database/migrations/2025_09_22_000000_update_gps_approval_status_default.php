<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update the default value for gps_approval_status to "approved"
        if (Schema::hasColumn('shelter', 'gps_approval_status')) {
            DB::statement(
                "ALTER TABLE `shelter` MODIFY `gps_approval_status` VARCHAR(255) NOT NULL DEFAULT 'approved'"
            );
        }

        // Backfill existing rows where the approval data is missing
        DB::table('shelter')
            ->whereNull('gps_approval_data')
            ->update([
                'gps_approval_status' => 'approved',
                'gps_submitted_at' => null,
                'gps_approved_at' => null,
                'gps_approved_by' => null,
                'gps_rejection_reason' => null,
                'gps_approval_data' => null,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('shelter', 'gps_approval_status')) {
            DB::statement(
                "ALTER TABLE `shelter` MODIFY `gps_approval_status` VARCHAR(255) NOT NULL DEFAULT 'pending'"
            );
        }
    }
};
