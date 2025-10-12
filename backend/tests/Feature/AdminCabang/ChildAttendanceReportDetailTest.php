<?php

namespace Tests\Feature\AdminCabang;

use App\Models\Absen;
use App\Models\AbsenUser;
use App\Models\AdminCabang;
use App\Models\Aktivitas;
use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Kelompok;
use App\Models\Shelter;
use App\Models\User;
use App\Models\Wilbin;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ChildAttendanceReportDetailTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');

        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('users', function (Blueprint $table) {
            $table->id('id_users');
            $table->string('username');
            $table->string('password');
            $table->string('level');
            $table->timestamps();
        });

        Schema::create('kacab', function (Blueprint $table) {
            $table->id('id_kacab');
            $table->string('nama_kacab');
            $table->timestamps();
        });

        Schema::create('admin_cabang', function (Blueprint $table) {
            $table->id('id_admin_cabang');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('id_kacab');
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

        Schema::create('kelompok', function (Blueprint $table) {
            $table->id('id_kelompok');
            $table->unsignedBigInteger('id_shelter');
            $table->string('nama_kelompok');
            $table->timestamps();
        });

        Schema::create('anak', function (Blueprint $table) {
            $table->id('id_anak');
            $table->unsignedBigInteger('id_shelter');
            $table->unsignedBigInteger('id_kelompok')->nullable();
            $table->string('full_name');
            $table->string('status_validasi')->default('aktif');
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_shelter');
            $table->string('nama_kelompok')->nullable();
            $table->string('jenis_kegiatan')->nullable();
            $table->string('materi')->nullable();
            $table->date('tanggal');
            $table->string('start_time')->nullable();
            $table->string('end_time')->nullable();
            $table->timestamps();
        });

        Schema::create('absen_user', function (Blueprint $table) {
            $table->id('id_absen_user');
            $table->unsignedBigInteger('id_anak');
            $table->timestamps();
        });

        Schema::create('absen', function (Blueprint $table) {
            $table->id('id_absen');
            $table->unsignedBigInteger('id_absen_user');
            $table->unsignedBigInteger('id_aktivitas');
            $table->string('absen');
            $table->string('verification_status')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->time('time_arrived')->nullable();
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('anak');
        Schema::dropIfExists('kelompok');
        Schema::dropIfExists('shelter');
        Schema::dropIfExists('wilbin');
        Schema::dropIfExists('admin_cabang');
        Schema::dropIfExists('kacab');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_it_returns_child_attendance_detail(): void
    {
        $user = User::create([
            'username' => 'admin',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang Detail',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
        ]);

        $wilbin = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin Detail',
        ]);

        $shelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Detail',
        ]);

        $group = Kelompok::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => 'Kelompok Detail',
        ]);

        $child = Anak::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $group->id_kelompok,
            'full_name' => 'Anak Detail',
            'status_validasi' => 'aktif',
        ]);

        $attendanceUser = AbsenUser::create([
            'id_anak' => $child->id_anak,
        ]);

        $activityMarch = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => $group->nama_kelompok,
            'jenis_kegiatan' => 'Belajar',
            'materi' => 'Matematika',
            'tanggal' => '2024-03-10',
            'start_time' => '15:00',
            'end_time' => '17:00',
        ]);

        $activityLate = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => $group->nama_kelompok,
            'jenis_kegiatan' => 'Belajar',
            'materi' => 'IPA',
            'tanggal' => '2024-03-17',
            'start_time' => '15:00',
            'end_time' => '17:00',
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUser->id_absen_user,
            'id_aktivitas' => $activityMarch->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_VERIFIED,
            'is_verified' => true,
            'time_arrived' => '15:05:00',
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUser->id_absen_user,
            'id_aktivitas' => $activityLate->id_aktivitas,
            'absen' => Absen::TEXT_TERLAMBAT,
            'verification_status' => Absen::VERIFICATION_PENDING,
            'time_arrived' => '15:20:00',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson(sprintf(
            '/api/admin-cabang/laporan/attendance/children/%d?start_date=2024-03-01&end_date=2024-03-31',
            $child->id_anak
        ));

        $response->assertOk();
        $response->assertJsonFragment([
            'message' => 'Detail laporan anak cabang berhasil diambil.',
        ]);

        $data = $response->json('data');

        $this->assertSame('Anak Detail', $data['child']['full_name']);
        $this->assertSame('Shelter Detail', $data['child']['shelter']['name']);
        $this->assertSame('Kelompok Detail', $data['child']['group']['name']);
        $this->assertSame($group->id_kelompok, $data['child']['group']['id']);
        $this->assertSame($shelter->id_shelter, $data['child']['group']['shelter_id']);

        $this->assertSame(2, $data['summary']['total_sessions']);
        $this->assertSame('100.00', $data['summary']['attendance_percentage']);

        $this->assertCount(2, $data['attendance_timeline']);
        $this->assertCount(1, $data['monthly_breakdown']);

        $timelineEntry = $data['attendance_timeline'][0];
        $this->assertSame('Belajar', $timelineEntry['jenis_kegiatan']);
        $this->assertSame('Matematika', $timelineEntry['material']);
    }
}

