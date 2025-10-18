<?php

namespace Tests\Feature\AdminShelter\Attendance;

use App\Models\Absen;
use App\Models\AbsenUser;
use App\Models\Aktivitas;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GetTutorAttendanceForActivityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');

        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('tutor');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id('id_users');
            $table->string('username');
            $table->string('email')->nullable();
            $table->string('password');
            $table->string('level');
            $table->string('status')->nullable();
            $table->string('token_api')->nullable();
            $table->string('token')->nullable();
            $table->timestamps();
        });

        Schema::create('tutor', function (Blueprint $table) {
            $table->id('id_tutor');
            $table->string('nama');
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_shelter')->nullable();
            $table->unsignedBigInteger('id_tutor')->nullable();
            $table->string('jenis_kegiatan')->nullable();
            $table->date('tanggal');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::create('absen_user', function (Blueprint $table) {
            $table->id('id_absen_user');
            $table->unsignedBigInteger('id_anak')->nullable();
            $table->unsignedBigInteger('id_tutor')->nullable();
            $table->timestamps();
        });

        Schema::create('absen', function (Blueprint $table) {
            $table->id('id_absen');
            $table->string('absen');
            $table->unsignedBigInteger('id_absen_user');
            $table->unsignedBigInteger('id_aktivitas');
            $table->unsignedBigInteger('id_donatur')->nullable();
            $table->boolean('is_read')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->string('verification_status')->nullable();
            $table->timestamp('time_arrived')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->decimal('gps_accuracy', 8, 2)->nullable();
            $table->timestamp('gps_recorded_at')->nullable();
            $table->decimal('distance_from_activity', 8, 2)->nullable();
            $table->boolean('gps_valid')->nullable();
            $table->string('location_name')->nullable();
            $table->text('gps_validation_notes')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('tutor');
        Schema::dropIfExists('users');

        Carbon::setTestNow();

        parent::tearDown();
    }

    protected function actingAsAdminShelter(): User
    {
        $user = User::create([
            'username' => 'admin-shelter',
            'email' => 'admin-shelter@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_shelter',
        ]);

        Sanctum::actingAs($user, ['*']);

        return $user;
    }

    public function test_it_returns_tutor_attendance_record_for_activity(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-06-01 15:00:00'));
        $this->actingAsAdminShelter();

        $tutor = Tutor::create([
            'nama' => 'Jane Tutor',
        ]);

        $aktivitas = Aktivitas::create([
            'id_tutor' => $tutor->id_tutor,
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-06-01'),
            'start_time' => '14:00:00',
            'end_time' => '16:00:00',
            'status' => 'scheduled',
        ]);

        $absenUser = AbsenUser::create([
            'id_tutor' => $tutor->id_tutor,
        ]);

        Absen::create([
            'absen' => 'Ya',
            'id_absen_user' => $absenUser->id_absen_user,
            'id_aktivitas' => $aktivitas->id_aktivitas,
            'is_verified' => true,
            'verification_status' => 'verified',
            'time_arrived' => Carbon::parse('2024-06-01 15:05:00'),
        ]);

        $response = $this->getJson('/api/admin-shelter/attendance/activity/' . $aktivitas->id_aktivitas . '/tutor');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $response->assertJsonPath('data.absen', 'Ya');
        $response->assertJsonPath('data.time_arrived', '2024-06-01 15:05:00');
        $response->assertJsonPath('data.absen_user.tutor.nama', 'Jane Tutor');
    }

    public function test_it_returns_null_when_no_tutor_attendance_record_exists(): void
    {
        $this->actingAsAdminShelter();

        $tutor = Tutor::create([
            'nama' => 'John Tutor',
        ]);

        $aktivitas = Aktivitas::create([
            'id_tutor' => $tutor->id_tutor,
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-06-02'),
            'start_time' => '14:00:00',
            'end_time' => '16:00:00',
            'status' => 'scheduled',
        ]);

        $response = $this->getJson('/api/admin-shelter/attendance/activity/' . $aktivitas->id_aktivitas . '/tutor');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data' => null,
            ]);
    }
}
