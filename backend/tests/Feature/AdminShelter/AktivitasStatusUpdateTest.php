<?php

namespace Tests\\Feature\\AdminShelter;

use App\\Models\\Absen;
use App\\Models\\AbsenUser;
use App\\Models\\AdminShelter;
use App\\Models\\Aktivitas;
use App\\Models\\Anak;
use App\\Models\\Kelompok;
use App\\Models\\Shelter;
use App\\Models\\User;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Carbon;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Schema;
use Laravel\\Sanctum\\Sanctum;
use Tests\\TestCase;

class AktivitasStatusUpdateTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:' . base64_encode(random_bytes(32))]);
        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => ':memory:']);

        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::dropAllTables();
        $this->createSchema();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        Schema::dropAllTables();

        parent::tearDown();
    }

    public function test_admin_can_finalize_activity_and_generate_absences(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-01-01 20:00:00'));

        $user = User::create([
            'username' => 'admin-shelter',
            'email' => 'admin-shelter@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_shelter',
        ]);

        $shelter = Shelter::create([
            'nama_shelter' => 'Shelter A',
        ]);

        AdminShelter::create([
            'user_id' => $user->id_users,
            'id_shelter' => $shelter->id_shelter,
            'nama_lengkap' => 'Admin Shelter',
        ]);

        $kelompok = Kelompok::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => 'Kelompok Hebat',
            'jumlah_anggota' => 3,
        ]);

        $students = collect([
            'Siswa Satu',
            'Siswa Dua',
            'Siswa Tiga',
        ])->map(function (string $name) use ($kelompok, $shelter) {
            return Anak::create([
                'full_name' => $name,
                'id_kelompok' => $kelompok->id_kelompok,
                'id_shelter' => $shelter->id_shelter,
            ]);
        });

        $aktivitas = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $kelompok->id_kelompok,
            'nama_kelompok' => $kelompok->nama_kelompok,
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-01-01'),
            'start_time' => '16:00:00',
            'end_time' => '18:00:00',
            'status' => 'scheduled',
        ]);

        Sanctum::actingAs($user, ['*']);

        $firstResponse = $this->withHeaders(['Accept' => 'application/json'])
            ->putJson("/api/admin-shelter/aktivitas/{$aktivitas->id_aktivitas}/status", [
                'status' => 'completed',
            ]);

        $firstResponse->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.attendance_summary.success', true)
            ->assertJsonPath('data.attendance_summary.total_members', $students->count())
            ->assertJsonPath('data.attendance_summary.created_count', $students->count());

        $this->assertSame($students->count(), Absen::count());
        $this->assertSame($students->count(), AbsenUser::count());

        // Reset status to re-run completion flow and ensure no duplicate attendance is created.
        $aktivitas->refresh();
        $aktivitas->update(['status' => 'scheduled']);

        $secondResponse = $this->withHeaders(['Accept' => 'application/json'])
            ->putJson("/api/admin-shelter/aktivitas/{$aktivitas->id_aktivitas}/status", [
                'status' => 'completed',
            ]);

        $secondResponse->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.attendance_summary.success', true)
            ->assertJsonPath('data.attendance_summary.total_members', $students->count())
            ->assertJsonPath('data.attendance_summary.created_count', 0)
            ->assertJsonPath('data.attendance_summary.already_marked', $students->count());

        $this->assertSame($students->count(), Absen::count());
    }

    public function test_activity_members_endpoint_resolves_kelompok_by_name(): void
    {
        $user = User::create([
            'username' => 'admin-shelter',
            'email' => 'admin-shelter@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_shelter',
        ]);

        $shelter = Shelter::create([
            'nama_shelter' => 'Shelter A',
        ]);

        AdminShelter::create([
            'user_id' => $user->id_users,
            'id_shelter' => $shelter->id_shelter,
            'nama_lengkap' => 'Admin Shelter',
        ]);

        $kelompok = Kelompok::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => 'Kelompok Hebat',
            'jumlah_anggota' => 3,
        ]);

        $students = collect([
            'Siswa Satu',
            'Siswa Dua',
            'Siswa Tiga',
        ])->map(function (string $name) use ($kelompok, $shelter) {
            return Anak::create([
                'full_name' => $name,
                'id_kelompok' => $kelompok->id_kelompok,
                'id_shelter' => $shelter->id_shelter,
            ]);
        });

        $aktivitas = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => null,
            'nama_kelompok' => $kelompok->nama_kelompok,
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::parse('2024-01-02'),
            'start_time' => '16:00:00',
            'end_time' => '18:00:00',
            'status' => 'scheduled',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->withHeaders(['Accept' => 'application/json'])
            ->getJson("/api/admin-shelter/attendance/activity/{$aktivitas->id_aktivitas}/members");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('summary.total_members', $students->count())
            ->assertJsonCount($students->count(), 'data');

        $students->each(function (Anak $student) use ($response) {
            $response->assertJsonFragment([
                'id_anak' => $student->id_anak,
                'full_name' => $student->full_name,
                'attendance_status' => null,
            ]);
        });
    }

    private function createSchema(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id_users');
            $table->string('username')->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->string('level')->nullable();
            $table->string('status')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('shelter', function (Blueprint $table) {
            $table->bigIncrements('id_shelter');
            $table->string('nama_shelter')->nullable();
            $table->timestamps();
        });

        Schema::create('admin_shelter', function (Blueprint $table) {
            $table->bigIncrements('id_admin_shelter');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('id_shelter')->nullable();
            $table->string('nama_lengkap')->nullable();
            $table->timestamps();
        });

        Schema::create('kelompok', function (Blueprint $table) {
            $table->bigIncrements('id_kelompok');
            $table->unsignedBigInteger('id_shelter')->nullable();
            $table->string('nama_kelompok')->nullable();
            $table->integer('jumlah_anggota')->default(0);
            $table->timestamps();
        });

        Schema::create('anak', function (Blueprint $table) {
            $table->bigIncrements('id_anak');
            $table->unsignedBigInteger('id_kelompok')->nullable();
            $table->unsignedBigInteger('id_shelter')->nullable();
            $table->string('full_name')->nullable();
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->bigIncrements('id_aktivitas');
            $table->unsignedBigInteger('id_shelter')->nullable();
            $table->unsignedBigInteger('id_kelompok')->nullable();
            $table->string('nama_kelompok')->nullable();
            $table->string('jenis_kegiatan')->nullable();
            $table->date('tanggal')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::create('absen_user', function (Blueprint $table) {
            $table->bigIncrements('id_absen_user');
            $table->unsignedBigInteger('id_anak')->nullable();
            $table->unsignedBigInteger('id_tutor')->nullable();
            $table->timestamps();
        });

        Schema::create('absen', function (Blueprint $table) {
            $table->bigIncrements('id_absen');
            $table->unsignedBigInteger('id_absen_user');
            $table->unsignedBigInteger('id_aktivitas');
            $table->string('absen');
            $table->boolean('is_read')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->string('verification_status')->nullable();
            $table->timestamp('time_arrived')->nullable();
            $table->timestamps();
        });
    }
}
