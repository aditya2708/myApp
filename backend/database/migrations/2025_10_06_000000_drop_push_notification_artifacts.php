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
        Schema::dropIfExists('user_push_tokens');

        if (Schema::hasTable('aktivitas') && Schema::hasColumn('aktivitas', 'notified_at')) {
            Schema::table('aktivitas', function (Blueprint $table) {
                $table->dropColumn('notified_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('user_push_tokens')) {
            Schema::create('user_push_tokens', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->text('fcm_token');
                $table->string('platform', 64)->nullable();
                $table->json('device_info')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('invalidated_at')->nullable();
                $table->timestamps();

                $table->foreign('user_id')
                    ->references('id_users')
                    ->on('users')
                    ->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('aktivitas') && ! Schema::hasColumn('aktivitas', 'notified_at')) {
            Schema::table('aktivitas', function (Blueprint $table) {
                $table->timestamp('notified_at')->nullable()->after('status');
            });
        }
    }
};
