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

class ChildAttendanceReportTest extends TestCase
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
            $table->string('nick_name')->nullable();
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
            $table->unsignedBigInteger('id_anak')->nullable();
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

    public function test_it_returns_child_attendance_summary_and_list(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang Besar',
            'status' => 'aktif',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
            'nama_lengkap' => 'Admin Cabang',
        ]);

        $wilbin = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin A',
        ]);

        $shelterAlpha = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Alpha',
        ]);

        $shelterBeta = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Beta',
        ]);

        $groupAlpha = Kelompok::create([
            'id_shelter' => $shelterAlpha->id_shelter,
            'nama_kelompok' => 'Kelompok Alpha',
        ]);

        $groupBeta = Kelompok::create([
            'id_shelter' => $shelterBeta->id_shelter,
            'nama_kelompok' => 'Kelompok Beta',
        ]);

        $anakAlpha = Anak::create([
            'id_shelter' => $shelterAlpha->id_shelter,
            'id_kelompok' => $groupAlpha->id_kelompok,
            'full_name' => 'Anak Alpha',
            'nick_name' => 'Alpha',
            'status_validasi' => 'aktif',
        ]);

        $anakBeta = Anak::create([
            'id_shelter' => $shelterBeta->id_shelter,
            'id_kelompok' => $groupBeta->id_kelompok,
            'full_name' => 'Anak Beta',
            'nick_name' => 'Beta',
            'status_validasi' => 'aktif',
        ]);

        $activityAlpha = Aktivitas::create([
            'id_shelter' => $shelterAlpha->id_shelter,
            'nama_kelompok' => $groupAlpha->nama_kelompok,
            'jenis_kegiatan' => 'Belajar',
            'materi' => 'Matematika',
            'tanggal' => '2024-03-05',
            'start_time' => '15:00',
            'end_time' => '17:00',
        ]);

        $activityAlphaLate = Aktivitas::create([
            'id_shelter' => $shelterAlpha->id_shelter,
            'nama_kelompok' => $groupAlpha->nama_kelompok,
            'jenis_kegiatan' => 'Belajar',
            'materi' => 'IPA',
            'tanggal' => '2024-03-12',
            'start_time' => '15:00',
            'end_time' => '17:00',
        ]);

        $activityBeta = Aktivitas::create([
            'id_shelter' => $shelterBeta->id_shelter,
            'nama_kelompok' => $groupBeta->nama_kelompok,
            'jenis_kegiatan' => 'Belajar',
            'materi' => 'Bahasa',
            'tanggal' => '2024-03-08',
            'start_time' => '15:00',
            'end_time' => '17:00',
        ]);

        $userAlpha = AbsenUser::create(['id_anak' => $anakAlpha->id_anak]);
        $userBeta = AbsenUser::create(['id_anak' => $anakBeta->id_anak]);

        Absen::create([
            'id_absen_user' => $userAlpha->id_absen_user,
            'id_aktivitas' => $activityAlpha->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_VERIFIED,
            'is_verified' => true,
            'time_arrived' => '15:05:00',
        ]);

        Absen::create([
            'id_absen_user' => $userAlpha->id_absen_user,
            'id_aktivitas' => $activityAlphaLate->id_aktivitas,
            'absen' => Absen::TEXT_TERLAMBAT,
            'verification_status' => Absen::VERIFICATION_PENDING,
            'time_arrived' => '15:20:00',
        ]);

        Absen::create([
            'id_absen_user' => $userBeta->id_absen_user,
            'id_aktivitas' => $activityBeta->id_aktivitas,
            'absen' => Absen::TEXT_TIDAK,
            'verification_status' => Absen::VERIFICATION_REJECTED,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/attendance/children?start_date=2024-03-01&end_date=2024-03-31');

        $response->assertOk();
        $response->assertJsonFragment([
            'message' => 'Laporan kehadiran anak cabang berhasil diambil.',
        ]);

        $data = $response->json('data');

        $this->assertSame('2024-03-01', $data['period']['start_date']);
        $this->assertSame('2024-03-31', $data['period']['end_date']);

        $this->assertSame(2, $data['summary']['total_children']);
        $this->assertSame('66.67', $data['summary']['attendance_percentage']);

        $this->assertCount(2, $data['children']);

        $alphaPayload = collect($data['children'])->firstWhere('full_name', 'Anak Alpha');
        $this->assertSame(2, $alphaPayload['attendance']['hadir_count']);
        $this->assertSame(0, $alphaPayload['attendance']['tidak_hadir_count']);
        $this->assertSame('100.00', $alphaPayload['attendance']['attendance_percentage']);

        $betaPayload = collect($data['children'])->firstWhere('full_name', 'Anak Beta');
        $this->assertSame(0, $betaPayload['attendance']['hadir_count']);
        $this->assertSame(1, $betaPayload['attendance']['tidak_hadir_count']);
        $this->assertSame('0.00', $betaPayload['attendance']['attendance_percentage']);

        $distribution = $data['attendance_band_distribution'];
        $this->assertSame(1, $distribution['high']);
        $this->assertSame(0, $distribution['medium']);
        $this->assertSame(1, $distribution['low']);

        $this->assertSame(2, $data['pagination']['total']);
        $this->assertSame(20, $data['pagination']['per_page']);
    }
}

