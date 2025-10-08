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

class AttendanceWeeklyShelterDetailReportTest extends TestCase
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
        Schema::dropIfExists('anak');
        Schema::dropIfExists('kelompok');
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

        Schema::create('kelompok', function (Blueprint $table) {
            $table->id('id_kelompok');
            $table->unsignedBigInteger('id_shelter');
            $table->unsignedBigInteger('id_level_anak_binaan')->nullable();
            $table->string('nama_kelompok');
            $table->unsignedInteger('jumlah_anggota')->nullable();
            $table->json('kelas_gabungan')->nullable();
            $table->timestamps();
        });

        Schema::create('anak', function (Blueprint $table) {
            $table->id('id_anak');
            $table->unsignedBigInteger('id_shelter');
            $table->unsignedBigInteger('id_kelompok')->nullable();
            $table->string('full_name');
            $table->string('nick_name')->nullable();
            $table->string('jenis_kelamin')->nullable();
            $table->string('status_validasi')->default('aktif');
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_shelter');
            $table->unsignedBigInteger('id_tutor')->nullable();
            $table->string('nama_kelompok')->nullable();
            $table->string('jenis_kegiatan')->nullable();
            $table->string('materi')->nullable();
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
            $table->string('verification_status')->nullable();
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

    public function test_it_returns_weekly_shelter_detail_with_group_descriptors(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang Utama',
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

        $shelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Alpha',
        ]);

        $kelompokAlpha = Kelompok::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => 'Kelompok Alpha',
            'jumlah_anggota' => 15,
            'kelas_gabungan' => ['Gabungan A'],
        ]);

        $kelompokBeta = Kelompok::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => 'Kelompok Beta',
            'jumlah_anggota' => 12,
            'kelas_gabungan' => ['Gabungan B'],
        ]);

        $alphaOne = Anak::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $kelompokAlpha->id_kelompok,
            'full_name' => 'Alpha One',
            'status_validasi' => 'aktif',
        ]);

        $alphaTwo = Anak::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $kelompokAlpha->id_kelompok,
            'full_name' => 'Alpha Two',
            'status_validasi' => 'aktif',
        ]);

        $betaOne = Anak::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $kelompokBeta->id_kelompok,
            'full_name' => 'Beta One',
            'status_validasi' => 'aktif',
        ]);

        $betaTwo = Anak::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $kelompokBeta->id_kelompok,
            'full_name' => 'Beta Two',
            'status_validasi' => 'aktif',
        ]);

        $unmappedChild = Anak::create([
            'id_shelter' => $shelter->id_shelter,
            'full_name' => 'Unmapped Child',
            'status_validasi' => 'aktif',
        ]);

        $activityAlpha = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => $kelompokAlpha->nama_kelompok,
            'jenis_kegiatan' => 'Pertemuan Rutin',
            'materi' => 'Matematika',
            'tanggal' => '2024-01-03',
        ]);

        $activityBeta = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => $kelompokBeta->nama_kelompok,
            'jenis_kegiatan' => 'Kelas Tambahan',
            'materi' => 'Bahasa',
            'tanggal' => '2024-01-04',
        ]);

        $activityOther = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => 'Kelompok Gamma',
            'jenis_kegiatan' => 'Sesi Khusus',
            'materi' => 'Seni',
            'tanggal' => '2024-01-05',
        ]);

        $attendanceUsers = collect([
            $alphaOne,
            $alphaTwo,
            $betaOne,
            $betaTwo,
            $unmappedChild,
        ])->map(fn (Anak $student) => AbsenUser::create(['id_anak' => $student->id_anak]))->values();

        Absen::create([
            'id_absen_user' => $attendanceUsers[0]->id_absen_user,
            'id_aktivitas' => $activityAlpha->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_VERIFIED,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[1]->id_absen_user,
            'id_aktivitas' => $activityAlpha->id_aktivitas,
            'absen' => Absen::TEXT_TERLAMBAT,
            'verification_status' => Absen::VERIFICATION_MANUAL,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[2]->id_absen_user,
            'id_aktivitas' => $activityBeta->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_PENDING,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[3]->id_absen_user,
            'id_aktivitas' => $activityBeta->id_aktivitas,
            'absen' => Absen::TEXT_TIDAK,
            'verification_status' => Absen::VERIFICATION_REJECTED,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[4]->id_absen_user,
            'id_aktivitas' => $activityOther->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_VERIFIED,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson(sprintf(
            '/api/admin-cabang/laporan/attendance/weekly/shelters/%d?week=2024-W01',
            $shelter->id_shelter
        ));

        $response->assertOk();
        $response->assertJsonFragment([
            'message' => 'Detail laporan kehadiran mingguan shelter berhasil diambil.',
        ]);

        $payload = $response->json('data');

        $this->assertSame($shelter->id_shelter, $payload['shelter']['id']);
        $this->assertSame('Shelter Alpha', $payload['shelter']['name']);
        $this->assertSame('Wilbin 1', $payload['shelter']['wilbin']);

        $this->assertSame('2024-W01', $payload['period']['week']);
        $this->assertSame('2024-01-01', $payload['period']['start_date']);
        $this->assertSame('2024-01-07', $payload['period']['end_date']);

        $this->assertSame('2024-W01', $payload['filters']['week']);

        $this->assertSame(5, $payload['summary']['total_students']);
        $this->assertSame(3, $payload['summary']['present_count']);
        $this->assertSame(1, $payload['summary']['late_count']);
        $this->assertSame(1, $payload['summary']['absent_count']);
        $this->assertSame('80.00', $payload['summary']['attendance_percentage']);
        $this->assertSame('medium', $payload['summary']['attendance_band']);

        $groups = collect($payload['groups']);
        $this->assertCount(3, $groups);

        $alphaGroup = $groups->firstWhere('id', $kelompokAlpha->id_kelompok);
        $this->assertSame('Kelompok Alpha', $alphaGroup['name']);
        $this->assertSame('Gabungan A', $alphaGroup['description']);
        $this->assertSame(15, $alphaGroup['member_count']);
        $this->assertSame(1, $alphaGroup['present_count']);
        $this->assertSame(1, $alphaGroup['late_count']);
        $this->assertSame(0, $alphaGroup['absent_count']);
        $this->assertSame('100.00', $alphaGroup['attendance_percentage']);

        $betaGroup = $groups->firstWhere('id', $kelompokBeta->id_kelompok);
        $this->assertSame('Kelompok Beta', $betaGroup['name']);
        $this->assertSame('Gabungan B', $betaGroup['description']);
        $this->assertSame(12, $betaGroup['member_count']);
        $this->assertSame(1, $betaGroup['present_count']);
        $this->assertSame(0, $betaGroup['late_count']);
        $this->assertSame(1, $betaGroup['absent_count']);
        $this->assertSame('50.00', $betaGroup['attendance_percentage']);

        $unmappedGroup = $groups->firstWhere('id', null);
        $this->assertSame('Kelompok Gamma', $unmappedGroup['name']);
        $this->assertNull($unmappedGroup['description']);
        $this->assertNull($unmappedGroup['member_count']);
        $this->assertSame(1, $unmappedGroup['present_count']);
        $this->assertSame(0, $unmappedGroup['late_count']);
        $this->assertSame(0, $unmappedGroup['absent_count']);
        $this->assertSame('100.00', $unmappedGroup['attendance_percentage']);

        $this->assertNotEmpty($payload['notes']);
        $this->assertTrue(collect($payload['notes'])->contains(fn ($note) => str_contains($note, 'Beberapa aktivitas')));
        $this->assertNotNull($payload['generated_at']);
    }

    public function test_it_denies_access_to_foreign_shelter(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacabA = Kacab::create([
            'nama_kacab' => 'Cabang A',
            'status' => 'aktif',
        ]);

        $kacabB = Kacab::create([
            'nama_kacab' => 'Cabang B',
            'status' => 'aktif',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacabA->id_kacab,
            'nama_lengkap' => 'Admin Cabang',
        ]);

        $wilbinA = Wilbin::create([
            'id_kacab' => $kacabA->id_kacab,
            'nama_wilbin' => 'Wilbin A',
        ]);

        $wilbinB = Wilbin::create([
            'id_kacab' => $kacabB->id_kacab,
            'nama_wilbin' => 'Wilbin B',
        ]);

        $ownedShelter = Shelter::create([
            'id_wilbin' => $wilbinA->id_wilbin,
            'nama_shelter' => 'Shelter Milik',
        ]);

        $foreignShelter = Shelter::create([
            'id_wilbin' => $wilbinB->id_wilbin,
            'nama_shelter' => 'Shelter Lain',
        ]);

        Kelompok::create([
            'id_shelter' => $ownedShelter->id_shelter,
            'nama_kelompok' => 'Kelompok A',
        ]);

        Kelompok::create([
            'id_shelter' => $foreignShelter->id_shelter,
            'nama_kelompok' => 'Kelompok B',
        ]);

        Sanctum::actingAs($user, ['*']);

        $this->getJson(sprintf(
            '/api/admin-cabang/laporan/attendance/weekly/shelters/%d?week=2024-W01',
            $foreignShelter->id_shelter
        ))->assertForbidden()->assertJsonFragment([
            'message' => 'Anda tidak memiliki akses ke shelter ini.',
        ]);
    }

    public function test_it_returns_not_found_when_shelter_missing(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang Utama',
            'status' => 'aktif',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
            'nama_lengkap' => 'Admin Cabang',
        ]);

        Sanctum::actingAs($user, ['*']);

        $this->getJson('/api/admin-cabang/laporan/attendance/weekly/shelters/999?week=2024-W01')
            ->assertNotFound();
    }

    public function test_it_returns_empty_state_for_week_without_activities(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang Utama',
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

        $shelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Alpha',
        ]);

        Kelompok::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => 'Kelompok Alpha',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson(sprintf(
            '/api/admin-cabang/laporan/attendance/weekly/shelters/%d?week=2024-W05',
            $shelter->id_shelter
        ));

        $response->assertOk();

        $payload = $response->json('data');
        $this->assertSame('0.00', $payload['summary']['attendance_percentage']);
        $this->assertSame(0, $payload['summary']['present_count']);
        $this->assertSame(0, $payload['summary']['late_count']);
        $this->assertSame(0, $payload['summary']['absent_count']);
        $this->assertEmpty($payload['groups']);
        $this->assertContains('Tidak ada aktivitas yang tercatat pada rentang tanggal ini.', $payload['notes']);
    }
}
