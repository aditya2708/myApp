<?php

namespace Tests\Feature\AdminCabang;

use App\Models\Absen;
use App\Models\AbsenUser;
use App\Models\AdminCabang;
use App\Models\Aktivitas;
use App\Models\Kacab;
use App\Models\Shelter;
use App\Models\User;
use App\Models\Wilbin;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCabangAttendanceSummaryTest extends TestCase
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
        Schema::dropIfExists('shelter');
        Schema::dropIfExists('wilbin');
        Schema::dropIfExists('admin_cabang');
        Schema::dropIfExists('kacab');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id('id_users');
            $table->string('username');
            $table->string('email')->nullable();
            $table->string('password');
            $table->string('level');
            $table->timestamps();
        });

        Schema::create('kacab', function (Blueprint $table) {
            $table->id('id_kacab');
            $table->string('nama_kacab');
            $table->string('status')->default('aktif');
            $table->timestamps();
        });

        Schema::create('admin_cabang', function (Blueprint $table) {
            $table->id('id_admin_cabang');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('id_kacab');
            $table->string('nama_lengkap')->nullable();
            $table->timestamps();
        });

        Schema::create('wilbin', function (Blueprint $table) {
            $table->id('id_wilbin');
            $table->unsignedBigInteger('id_kacab');
            $table->string('nama_wilbin');
            $table->timestamps();
        });

        Schema::create('shelter', function (Blueprint $table) {
            $table->id('id_shelter');
            $table->unsignedBigInteger('id_wilbin');
            $table->string('nama_shelter');
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_shelter');
            $table->date('tanggal');
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
            $table->unsignedBigInteger('id_absen_user')->nullable();
            $table->unsignedBigInteger('id_aktivitas');
            $table->string('absen');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('shelter');
        Schema::dropIfExists('wilbin');
        Schema::dropIfExists('admin_cabang');
        Schema::dropIfExists('kacab');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_it_returns_attendance_summary_for_cabang(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang A',
            'status' => 'aktif',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
            'nama_lengkap' => 'Admin Cabang',
        ]);

        $wilbinOne = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin 1',
        ]);

        $wilbinTwo = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin 2',
        ]);

        $shelterOne = Shelter::create([
            'id_wilbin' => $wilbinOne->id_wilbin,
            'nama_shelter' => 'Shelter Alpha',
        ]);

        $shelterTwo = Shelter::create([
            'id_wilbin' => $wilbinTwo->id_wilbin,
            'nama_shelter' => 'Shelter Beta',
        ]);

        $shelterThree = Shelter::create([
            'id_wilbin' => $wilbinTwo->id_wilbin,
            'nama_shelter' => 'Shelter Gamma',
        ]);

        $activityOne = Aktivitas::create([
            'id_shelter' => $shelterOne->id_shelter,
            'tanggal' => '2024-05-10',
        ]);

        $activityTwo = Aktivitas::create([
            'id_shelter' => $shelterOne->id_shelter,
            'tanggal' => '2024-05-12',
        ]);

        $activityThree = Aktivitas::create([
            'id_shelter' => $shelterTwo->id_shelter,
            'tanggal' => '2024-05-15',
        ]);

        $activityOutsideMonth = Aktivitas::create([
            'id_shelter' => $shelterTwo->id_shelter,
            'tanggal' => '2024-04-20',
        ]);

        $absenUserOne = AbsenUser::create(['id_anak' => null, 'id_tutor' => null]);
        $absenUserTwo = AbsenUser::create(['id_anak' => null, 'id_tutor' => null]);

        Absen::create([
            'id_absen_user' => $absenUserOne->id_absen_user,
            'id_aktivitas' => $activityOne->id_aktivitas,
            'absen' => 'Ya',
        ]);

        Absen::create([
            'id_absen_user' => $absenUserOne->id_absen_user,
            'id_aktivitas' => $activityTwo->id_aktivitas,
            'absen' => 'Tidak',
        ]);

        Absen::create([
            'id_absen_user' => $absenUserTwo->id_absen_user,
            'id_aktivitas' => $activityThree->id_aktivitas,
            'absen' => 'Terlambat',
        ]);

        Absen::create([
            'id_absen_user' => $absenUserTwo->id_absen_user,
            'id_aktivitas' => $activityOutsideMonth->id_aktivitas,
            'absen' => 'Ya',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson("/api/admin-cabang/{$kacab->id_kacab}/attendance-summary?month=5&year=2024");

        $response->assertOk();

        $payload = $response->json();

        $this->assertSame('2024-05', $payload['month']);
        $this->assertCount(3, $payload['shelters']);

        $this->assertSame($shelterOne->id_shelter, $payload['shelters'][0]['id']);
        $this->assertSame('Shelter Alpha', $payload['shelters'][0]['name']);
        $this->assertSame(50.0, $payload['shelters'][0]['attendance_avg']);
        $this->assertSame(1, $payload['shelters'][0]['present_count']);
        $this->assertSame(2, $payload['shelters'][0]['total_count']);

        $this->assertSame($shelterTwo->id_shelter, $payload['shelters'][1]['id']);
        $this->assertSame('Shelter Beta', $payload['shelters'][1]['name']);
        $this->assertSame(100.0, $payload['shelters'][1]['attendance_avg']);
        $this->assertSame(1, $payload['shelters'][1]['present_count']);
        $this->assertSame(1, $payload['shelters'][1]['total_count']);

        $this->assertSame($shelterThree->id_shelter, $payload['shelters'][2]['id']);
        $this->assertSame('Shelter Gamma', $payload['shelters'][2]['name']);
        $this->assertSame(0.0, $payload['shelters'][2]['attendance_avg']);
        $this->assertSame(0, $payload['shelters'][2]['present_count']);
        $this->assertSame(0, $payload['shelters'][2]['total_count']);
    }

    public function test_it_returns_404_when_cabang_not_found(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/999/attendance-summary?month=5&year=2024');

        $response->assertStatus(404);
        $response->assertJson([
            'message' => 'Cabang tidak ditemukan',
        ]);
    }

    public function test_it_returns_validation_errors_for_invalid_month_or_year(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang A',
            'status' => 'aktif',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson("/api/admin-cabang/{$kacab->id_kacab}/attendance-summary?month=13&year=2024");
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['month']);

        $response = $this->getJson("/api/admin-cabang/{$kacab->id_kacab}/attendance-summary?month=5&year=1999");
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['year']);
    }
}
