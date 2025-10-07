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

class AttendanceWeeklyReportTest extends TestCase
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
            $table->boolean('is_verified')->default(false);
            $table->string('verification_status')->nullable();
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

    public function test_it_returns_weekly_attendance_report(): void
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

        $adminCabang = AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
            'nama_lengkap' => 'Admin Cabang',
        ]);

        $wilbin = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin 1',
        ]);

        $secondShelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Beta',
        ]);

        $shelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Alpha',
        ]);

        $activityWeekOne = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'tanggal' => '2024-01-02',
        ]);

        $activityWeekThree = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'tanggal' => '2024-01-15',
        ]);

        $attendanceUsers = [
            AbsenUser::create(['id_anak' => 101]),
            AbsenUser::create(['id_anak' => 102]),
            AbsenUser::create(['id_anak' => 103]),
            AbsenUser::create(['id_anak' => 104]),
            AbsenUser::create(['id_anak' => 105]),
        ];

        Absen::create([
            'id_absen_user' => $attendanceUsers[0]->id_absen_user,
            'id_aktivitas' => $activityWeekOne->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_VERIFIED,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[1]->id_absen_user,
            'id_aktivitas' => $activityWeekOne->id_aktivitas,
            'absen' => Absen::TEXT_TERLAMBAT,
            'verification_status' => Absen::VERIFICATION_MANUAL,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[2]->id_absen_user,
            'id_aktivitas' => $activityWeekOne->id_aktivitas,
            'absen' => Absen::TEXT_TIDAK,
            'verification_status' => Absen::VERIFICATION_REJECTED,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[3]->id_absen_user,
            'id_aktivitas' => $activityWeekThree->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_PENDING,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[4]->id_absen_user,
            'id_aktivitas' => $activityWeekThree->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_PENDING,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/attendance/weekly?start_date=2024-01-01&end_date=2024-01-31');

        $response->assertOk();

        $payload = $response->json('data');

        $this->assertSame('2024-01-01', $payload['filters']['start_date']);
        $this->assertSame('2024-01-31', $payload['filters']['end_date']);
        $this->assertCount(2, $payload['filters']['shelter_ids']);

        $this->assertSame(2, $payload['metadata']['total_activities']);
        $this->assertSame(5, $payload['metadata']['total_sessions']);
        $this->assertSame(3, $payload['metadata']['present_count']);
        $this->assertSame(1, $payload['metadata']['late_count']);
        $this->assertSame(1, $payload['metadata']['absent_count']);
        $this->assertSame('80.00', $payload['metadata']['attendance_rate']);
        $this->assertSame('20.00', $payload['metadata']['late_rate']);
        $this->assertSame(5, $payload['metadata']['unique_children']);
        $this->assertSame(2, $payload['metadata']['verification']['pending']);
        $this->assertSame(1, $payload['metadata']['verification']['verified']);
        $this->assertSame(1, $payload['metadata']['verification']['manual']);
        $this->assertSame(1, $payload['metadata']['verification']['rejected']);

        $weeks = collect($payload['weeks']);
        $this->assertCount(5, $weeks);

        $weekOne = $weeks->firstWhere('week', '2024-W01');
        $this->assertNotNull($weekOne);
        $this->assertSame(1, $weekOne['metrics']['total_activities']);
        $this->assertSame(3, $weekOne['metrics']['total_sessions']);
        $this->assertSame(1, $weekOne['metrics']['present_count']);
        $this->assertSame(1, $weekOne['metrics']['late_count']);
        $this->assertSame(1, $weekOne['metrics']['absent_count']);
        $this->assertSame('66.67', $weekOne['metrics']['attendance_rate']);
        $this->assertSame('33.33', $weekOne['metrics']['late_rate']);
        $this->assertSame(3, $weekOne['metrics']['unique_children']);
        $this->assertSame(1, $weekOne['metrics']['verification']['verified']);
        $this->assertSame(1, $weekOne['metrics']['verification']['manual']);
        $this->assertSame(1, $weekOne['metrics']['verification']['rejected']);

        $weekThree = $weeks->firstWhere('week', '2024-W03');
        $this->assertNotNull($weekThree);
        $this->assertSame(1, $weekThree['metrics']['total_activities']);
        $this->assertSame(2, $weekThree['metrics']['total_sessions']);
        $this->assertSame(2, $weekThree['metrics']['present_count']);
        $this->assertSame('100.00', $weekThree['metrics']['attendance_rate']);
        $this->assertSame('0.00', $weekThree['metrics']['late_rate']);
        $this->assertSame(2, $weekThree['metrics']['unique_children']);
        $this->assertSame(2, $weekThree['metrics']['verification']['pending']);
    }

    public function test_it_validates_date_filters(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/attendance/weekly?start_date=invalid&end_date=2024-01-01');
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['start_date']);

        $response = $this->getJson('/api/admin-cabang/laporan/attendance/weekly?start_date=2024-02-01&end_date=2024-01-01');
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['end_date']);
    }

    public function test_it_returns_empty_dataset_when_no_activities_found(): void
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

        $wilbin = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin 1',
        ]);

        Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Alpha',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/attendance/weekly?start_date=2024-01-01&end_date=2024-01-31');
        $response->assertOk();

        $payload = $response->json('data');

        $this->assertSame(0, $payload['metadata']['total_activities']);
        $this->assertSame(0, $payload['metadata']['total_sessions']);
        $this->assertSame('0.00', $payload['metadata']['attendance_rate']);
        $this->assertSame('0.00', $payload['metadata']['late_rate']);

        foreach ($payload['weeks'] as $week) {
            $this->assertSame(0, $week['metrics']['total_sessions']);
            $this->assertSame('0.00', $week['metrics']['attendance_rate']);
        }
    }
}
