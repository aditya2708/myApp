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
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AttendanceWeeklyGroupStudentReportTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        config()->set('filesystems.default', 'public');

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
            $table->string('foto')->nullable();
            $table->string('status_validasi')->default('aktif');
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_shelter');
            $table->string('nama_kelompok')->nullable();
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
            $table->time('time_arrived')->nullable();
            $table->string('verification_status')->nullable();
            $table->string('gps_validation_notes')->nullable();
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

    public function test_it_lists_group_students_with_status_counts_and_pagination(): void
    {
        Storage::fake('public');

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

        $shelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Alpha',
        ]);

        $group = Kelompok::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => 'Kelompok Hebat',
            'jumlah_anggota' => 25,
            'kelas_gabungan' => ['A', 'B'],
        ]);

        $students = collect([
            ['full_name' => 'Alpha One', 'nick_name' => 'Al', 'foto' => 'avatars/alpha.jpg'],
            ['full_name' => 'Bravo Two', 'nick_name' => 'B', 'foto' => 'avatars/bravo.jpg'],
            ['full_name' => 'Charlie Three', 'nick_name' => 'C'],
            ['full_name' => 'Delta Four', 'nick_name' => 'D'],
        ])->map(fn ($payload) => Anak::create(array_merge([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $group->id_kelompok,
            'status_validasi' => 'aktif',
        ], $payload)));

        $activity = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => $group->nama_kelompok,
            'tanggal' => '2024-03-06',
        ]);

        $attendanceUsers = $students->map(fn (Anak $student) => AbsenUser::create(['id_anak' => $student->id_anak]))->values();

        Absen::create([
            'id_absen_user' => $attendanceUsers[0]->id_absen_user,
            'id_aktivitas' => $activity->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'time_arrived' => '08:00:00',
            'verification_status' => Absen::VERIFICATION_VERIFIED,
            'gps_validation_notes' => 'Hadir tepat waktu',
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[1]->id_absen_user,
            'id_aktivitas' => $activity->id_aktivitas,
            'absen' => Absen::TEXT_TERLAMBAT,
            'time_arrived' => '08:10:00',
            'verification_status' => Absen::VERIFICATION_MANUAL,
            'gps_validation_notes' => 'Keterlambatan 10 menit',
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[2]->id_absen_user,
            'id_aktivitas' => $activity->id_aktivitas,
            'absen' => Absen::TEXT_TIDAK,
            'verification_status' => Absen::VERIFICATION_REJECTED,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson(sprintf(
            '/api/admin-cabang/laporan/attendance/weekly/groups/%d?start_date=2024-03-04&end_date=2024-03-10',
            $group->id_kelompok
        ));

        $response->assertOk();
        $response->assertJsonFragment([
            'message' => 'Daftar kehadiran mingguan anak per kelompok berhasil diambil.',
        ]);

        $payload = $response->json('data');

        $this->assertSame($group->id_kelompok, $payload['group']['id']);
        $this->assertSame('Kelompok Hebat', $payload['group']['name']);
        $this->assertSame('A, B', $payload['group']['description']);
        $this->assertSame('Shelter Alpha', $payload['group']['shelter']['name']);

        $this->assertSame('2024-03-04', $payload['period']['start_date']);
        $this->assertSame('2024-03-10', $payload['period']['end_date']);

        $statusCounts = collect($payload['status_counts'])->keyBy('code');
        $this->assertSame(4, $statusCounts['all']['count']);
        $this->assertSame(1, $statusCounts['present']['count']);
        $this->assertSame(1, $statusCounts['late']['count']);
        $this->assertSame(2, $statusCounts['absent']['count']);

        $studentsPayload = collect($payload['students']);
        $this->assertCount(4, $studentsPayload);

        $presentStudent = $studentsPayload->firstWhere('status.code', 'present');
        $this->assertTrue($presentStudent['is_recorded']);
        $this->assertSame('08:00', $presentStudent['arrival_time_label']);
        $this->assertSame('verified', $presentStudent['verification_status']);

        $lateStudent = $studentsPayload->firstWhere('status.code', 'late');
        $this->assertSame('clock', $lateStudent['status']['icon']);
        $this->assertSame('Keterlambatan 10 menit', $lateStudent['notes']);

        $unrecordedStudent = $studentsPayload->firstWhere('name', 'Delta Four');
        $this->assertFalse($unrecordedStudent['is_recorded']);
        $this->assertSame('Belum ada catatan kehadiran pada rentang ini.', $unrecordedStudent['notes']);

        $this->assertSame(4, $payload['pagination']['total']);
        $this->assertSame(15, $payload['pagination']['per_page']);
        $this->assertSame(1, $payload['pagination']['current_page']);
        $this->assertSame(1, $payload['pagination']['last_page']);

        $this->assertSame('2024-03-04', $payload['filters']['start_date']);
        $this->assertSame('2024-03-10', $payload['filters']['end_date']);
        $this->assertNull($payload['filters']['status']);
        $this->assertNull($payload['filters']['search']);
        $this->assertSame(15, $payload['filters']['per_page']);
        $this->assertSame(1, $payload['filters']['page']);

        $this->assertNotNull($payload['generated_at']);
    }

    public function test_it_filters_students_by_status_and_search_and_supports_custom_pagination(): void
    {
        Storage::fake('public');

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

        $shelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Alpha',
        ]);

        $group = Kelompok::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => 'Kelompok Filter',
        ]);

        $alpha = Anak::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $group->id_kelompok,
            'full_name' => 'Filter Alpha',
            'status_validasi' => 'aktif',
        ]);

        $bravo = Anak::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $group->id_kelompok,
            'full_name' => 'Filter Bravo',
            'status_validasi' => 'aktif',
        ]);

        $charlie = Anak::create([
            'id_shelter' => $shelter->id_shelter,
            'id_kelompok' => $group->id_kelompok,
            'full_name' => 'Filter Charlie',
            'status_validasi' => 'aktif',
        ]);

        $activity = Aktivitas::create([
            'id_shelter' => $shelter->id_shelter,
            'nama_kelompok' => $group->nama_kelompok,
            'tanggal' => '2024-04-02',
        ]);

        $users = collect([$alpha, $bravo, $charlie])->map(fn (Anak $student) => AbsenUser::create(['id_anak' => $student->id_anak]))->values();

        Absen::create([
            'id_absen_user' => $users[0]->id_absen_user,
            'id_aktivitas' => $activity->id_aktivitas,
            'absen' => Absen::TEXT_TERLAMBAT,
        ]);

        Absen::create([
            'id_absen_user' => $users[1]->id_absen_user,
            'id_aktivitas' => $activity->id_aktivitas,
            'absen' => Absen::TEXT_YA,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson(sprintf(
            '/api/admin-cabang/laporan/attendance/weekly/groups/%d?start_date=2024-04-01&end_date=2024-04-07&status=late&search=Alpha&per_page=1&page=1',
            $group->id_kelompok
        ));

        $response->assertOk();

        $payload = $response->json('data');

        $this->assertSame('late', $payload['filters']['status']);
        $this->assertSame('Alpha', $payload['filters']['search']);
        $this->assertSame(1, $payload['filters']['per_page']);
        $this->assertSame(1, $payload['filters']['page']);

        $this->assertCount(1, $payload['students']);
        $this->assertSame('Filter Alpha', $payload['students'][0]['name']);
        $this->assertSame('late', $payload['students'][0]['status']['code']);

        $this->assertSame(1, $payload['pagination']['current_page']);
        $this->assertSame(1, $payload['pagination']['per_page']);
        $this->assertGreaterThanOrEqual(1, $payload['pagination']['last_page']);

        $statusCounts = collect($payload['status_counts'])->keyBy('code');
        $this->assertSame(3, $statusCounts['all']['count']);
        $this->assertSame(1, $statusCounts['late']['count']);
        $this->assertSame(1, $statusCounts['present']['count']);
        $this->assertSame(1, $statusCounts['absent']['count']);
    }
}
