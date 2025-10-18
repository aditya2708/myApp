<?php

namespace Tests\Feature\AdminShelter;

use App\Models\Absen;
use App\Models\ActivityReport;
use App\Models\Aktivitas;
use App\Models\AttendanceVerification;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ActivityReportControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');

        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::dropIfExists('attendance_verifications');
        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('activity_reports');
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

        Schema::create('tutor', function (Blueprint $table) {
            $table->id('id_tutor');
            $table->string('nama');
            $table->timestamps();
        });

        Schema::create('activity_reports', function (Blueprint $table) {
            $table->id('id_activity_report');
            $table->unsignedBigInteger('id_aktivitas');
            $table->string('foto_1')->nullable();
            $table->string('foto_2')->nullable();
            $table->string('foto_3')->nullable();
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

        Schema::create('attendance_verifications', function (Blueprint $table) {
            $table->id('id_verification');
            $table->unsignedBigInteger('id_absen');
            $table->string('verification_method');
            $table->boolean('is_verified')->default(false);
            $table->text('verification_notes')->nullable();
            $table->string('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('attendance_verifications');
        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('activity_reports');
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('tutor');
        Schema::dropIfExists('users');

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

    public function test_store_allows_submission_before_activity_end_time(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-07-01 16:00:00'));
        Storage::fake('public');
        $this->actingAsAdminShelter();

        $aktivitas = Aktivitas::create([
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-07-01'),
            'end_time' => '18:00:00',
            'status' => 'completed',
        ]);

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/admin-shelter/activity-reports', [
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'foto_1' => UploadedFile::fake()->image('before.jpg'),
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertSame(1, ActivityReport::count());
        $aktivitas->refresh();
        $this->assertSame('reported', $aktivitas->status);
    }

    public function test_store_allows_submission_after_activity_end_time(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-07-01 20:00:00'));
        Storage::fake('public');
        $this->actingAsAdminShelter();

        $aktivitas = Aktivitas::create([
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-07-01'),
            'end_time' => '18:00:00',
            'status' => 'completed',
        ]);

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/admin-shelter/activity-reports', [
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'foto_1' => UploadedFile::fake()->image('after.jpg'),
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertSame(1, ActivityReport::count());
        $aktivitas->refresh();
        $this->assertSame('reported', $aktivitas->status);
    }

    public function test_store_requires_at_least_one_photo(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-07-01 16:00:00'));
        Storage::fake('public');
        $this->actingAsAdminShelter();

        $aktivitas = Aktivitas::create([
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-07-01'),
            'end_time' => '18:00:00',
            'status' => 'completed',
        ]);

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/admin-shelter/activity-reports', [
                'id_aktivitas' => $aktivitas->id_aktivitas,
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Minimal satu foto harus diunggah');

        $this->assertSame(0, ActivityReport::count());
    }

    public function test_store_prevents_duplicate_reports_for_same_activity(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-07-01 16:00:00'));
        Storage::fake('public');
        $this->actingAsAdminShelter();

        $aktivitas = Aktivitas::create([
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-07-01'),
            'end_time' => '18:00:00',
            'status' => 'completed',
        ]);

        $firstResponse = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/admin-shelter/activity-reports', [
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'foto_1' => UploadedFile::fake()->image('first.jpg'),
            ]);

        $firstResponse->assertCreated();

        $secondResponse = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/admin-shelter/activity-reports', [
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'foto_1' => UploadedFile::fake()->image('second.jpg'),
            ]);

        $secondResponse->assertStatus(400)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Laporan untuk aktivitas ini sudah ada');

        $this->assertSame(1, ActivityReport::count());
    }

    public function test_store_creates_tutor_attendance_when_activity_has_assigned_tutor(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-07-01 16:00:00'));
        Storage::fake('public');
        $this->actingAsAdminShelter();

        $tutor = Tutor::create([
            'nama' => 'Tutor Satu',
        ]);

        $aktivitas = Aktivitas::create([
            'id_tutor' => $tutor->id_tutor,
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-07-01'),
            'start_time' => '15:00:00',
            'end_time' => '18:00:00',
            'status' => 'completed',
        ]);

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/admin-shelter/activity-reports', [
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'foto_1' => UploadedFile::fake()->image('tutor.jpg'),
            ]);

        $response->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertSame(1, ActivityReport::count());
        $this->assertSame(1, Absen::count());

        $absen = Absen::first();
        $this->assertSame('Ya', $absen->absen);
        $this->assertTrue($absen->is_verified);
        $this->assertSame(Absen::VERIFICATION_MANUAL, $absen->verification_status);

        $this->assertSame(1, AttendanceVerification::count());
        $verification = AttendanceVerification::first();
        $this->assertSame($absen->id_absen, $verification->id_absen);
        $this->assertSame(AttendanceVerification::METHOD_MANUAL, $verification->verification_method);
    }

    public function test_store_ignores_duplicate_tutor_attendance_records(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-07-01 16:00:00'));
        Storage::fake('public');
        $this->actingAsAdminShelter();

        $tutor = Tutor::create([
            'nama' => 'Tutor Dua',
        ]);

        $aktivitas = Aktivitas::create([
            'id_tutor' => $tutor->id_tutor,
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-07-01'),
            'start_time' => '15:00:00',
            'end_time' => '18:00:00',
            'status' => 'completed',
        ]);

        $firstResponse = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/admin-shelter/activity-reports', [
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'foto_1' => UploadedFile::fake()->image('first-tutor.jpg'),
            ]);

        $firstResponse->assertCreated();
        $this->assertSame(1, Absen::count());

        ActivityReport::query()->delete();
        $aktivitas->update(['status' => 'completed']);

        $secondResponse = $this->withHeaders(['Accept' => 'application/json'])
            ->post('/api/admin-shelter/activity-reports', [
                'id_aktivitas' => $aktivitas->id_aktivitas,
                'foto_1' => UploadedFile::fake()->image('second-tutor.jpg'),
            ]);

        $secondResponse->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertSame(1, ActivityReport::count());
        $this->assertSame(1, Absen::count());
        $this->assertSame(1, AttendanceVerification::count());
    }
}

