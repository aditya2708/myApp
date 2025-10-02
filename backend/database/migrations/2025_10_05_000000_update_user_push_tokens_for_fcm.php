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
        Schema::table('user_push_tokens', function (Blueprint $table) {
            $table->text('fcm_token')->after('user_id');
            $table->string('platform', 64)->nullable()->after('fcm_token');
            $table->timestamp('invalidated_at')->nullable()->after('last_used_at');
        });

        DB::table('user_push_tokens')->select('id', 'expo_push_token')->chunkById(100, function ($tokens) {
            foreach ($tokens as $token) {
                DB::table('user_push_tokens')
                    ->where('id', $token->id)
                    ->update(['fcm_token' => $token->expo_push_token]);
            }
        });

        Schema::table('user_push_tokens', function (Blueprint $table) {
            $table->dropUnique(['expo_push_token']);
            $table->dropColumn('expo_push_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_push_tokens', function (Blueprint $table) {
            $table->string('expo_push_token')->after('user_id');
        });

        DB::table('user_push_tokens')->select('id', 'fcm_token')->chunkById(100, function ($tokens) {
            foreach ($tokens as $token) {
                DB::table('user_push_tokens')
                    ->where('id', $token->id)
                    ->update(['expo_push_token' => $token->fcm_token]);
            }
        });

        Schema::table('user_push_tokens', function (Blueprint $table) {
            $table->unique('expo_push_token');
            $table->dropColumn(['fcm_token', 'platform', 'invalidated_at']);
        });
    }
};
