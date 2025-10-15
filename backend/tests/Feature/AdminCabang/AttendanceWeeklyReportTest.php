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

    public function test_it_returns_weekly_overview_with_summary_and_attendance_bands(): void
    {
        $fixtures = $this->seedWeeklyOverviewFixtures();

        Sanctum::actingAs($fixtures['user'], ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/attendance/weekly?start_date=2024-01-01&end_date=2024-01-31');
        $response->assertOk();

        $payload = $response->json('data');

        $this->assertSame([
            'start_date' => '2024-01-01',
            'end_date' => '2024-01-31',
        ], $payload['period']);

        $this->assertSame(2, $payload['summary']['total_shelters']);
        $this->assertSame(3, $payload['summary']['total_groups']);
        $this->assertSame(5, $payload['summary']['total_students']);
        $this->assertSame(5, $payload['summary']['present_count']);
        $this->assertSame(1, $payload['summary']['late_count']);
        $this->assertSame(2, $payload['summary']['absent_count']);
        $this->assertSame('75.00', $payload['summary']['attendance_percentage']);

        $this->assertSame('2024-01-01', $payload['meta']['filters']['start_date']);
        $this->assertSame('2024-01-31', $payload['meta']['filters']['end_date']);
        $this->assertNull($payload['meta']['filters']['attendance_band']);
        $this->assertNull($payload['meta']['filters']['search']);
        $this->assertNull($payload['meta']['filters']['week_id']);
        $this->assertNotNull($payload['meta']['last_refreshed_at']);

        $shelters = collect($payload['shelters']);
        $this->assertCount(2, $shelters);

        $alphaPayload = $shelters->firstWhere('name', 'Shelter Alpha');
        $this->assertSame($fixtures['shelterAlpha']->id_shelter, $alphaPayload['id']);
        $this->assertSame(3, $alphaPayload['total_students']);
        $this->assertSame(2, $alphaPayload['groups_count']);
        $this->assertSame(4, $alphaPayload['present_count']);
        $this->assertSame(1, $alphaPayload['late_count']);
        $this->assertSame(1, $alphaPayload['absent_count']);
        $this->assertSame('83.33', $alphaPayload['attendance_percentage']);
        $this->assertSame('high', $alphaPayload['attendance_band']);
        $this->assertSame('83.33', $alphaPayload['trend_delta']);

        $betaPayload = $shelters->firstWhere('name', 'Shelter Beta');
        $this->assertSame($fixtures['shelterBeta']->id_shelter, $betaPayload['id']);
        $this->assertSame(2, $betaPayload['total_students']);
        $this->assertSame(1, $betaPayload['groups_count']);
        $this->assertSame(1, $betaPayload['present_count']);
        $this->assertSame(0, $betaPayload['late_count']);
        $this->assertSame(1, $betaPayload['absent_count']);
        $this->assertSame('50.00', $betaPayload['attendance_percentage']);
        $this->assertSame('low', $betaPayload['attendance_band']);
        $this->assertSame('50.00', $betaPayload['trend_delta']);

        $weeks = collect($payload['weeks']);
        $this->assertCount(5, $weeks);

        $weekOne = $weeks->firstWhere('id', '2024-W01');
        $this->assertNotNull($weekOne);
        $this->assertSame('2024-01-01', $weekOne['dates']['start']);
        $this->assertSame('2024-01-07', $weekOne['dates']['end']);
        $this->assertSame(1, $weekOne['metrics']['present_count']);
        $this->assertSame(1, $weekOne['metrics']['late_count']);
        $this->assertSame(1, $weekOne['metrics']['absent_count']);
        $this->assertSame('66.67', $weekOne['metrics']['attendance_percentage']);
        $this->assertSame('33.33', $weekOne['metrics']['late_percentage']);
        $this->assertSame(3, $weekOne['metrics']['unique_children']);
        $this->assertSame(1, $weekOne['metrics']['verification']['verified']);
        $this->assertSame(1, $weekOne['metrics']['verification']['manual']);
        $this->assertSame(1, $weekOne['metrics']['verification']['rejected']);

        $weekThree = $weeks->firstWhere('id', '2024-W03');
        $this->assertNotNull($weekThree);
        $this->assertSame('2024-01-15', $weekThree['dates']['start']);
        $this->assertSame('2024-01-21', $weekThree['dates']['end']);
        $this->assertSame(3, $weekThree['metrics']['present_count']);
        $this->assertSame(0, $weekThree['metrics']['late_count']);
        $this->assertSame(0, $weekThree['metrics']['absent_count']);
        $this->assertSame('100.00', $weekThree['metrics']['attendance_percentage']);
        $this->assertSame('0.00', $weekThree['metrics']['late_percentage']);
    }

    public function test_it_scopes_summary_and_weeks_by_selected_week_id(): void
    {
        $fixtures = $this->seedWeeklyOverviewFixtures();

        Sanctum::actingAs($fixtures['user'], ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/attendance/weekly?week_id=2024-W02');
        $response->assertOk();

        $payload = $response->json('data');

        $this->assertSame([
            'start_date' => '2024-01-08',
            'end_date' => '2024-01-14',
        ], $payload['period']);

        $this->assertSame(1, $payload['summary']['present_count']);
        $this->assertSame(0, $payload['summary']['late_count']);
        $this->assertSame(1, $payload['summary']['absent_count']);
        $this->assertSame('50.00', $payload['summary']['attendance_percentage']);
        $this->assertSame('2024-W02', $payload['meta']['filters']['week_id']);

        $weeks = collect($payload['weeks']);
        $this->assertCount(5, $weeks);

        $selectedWeek = $weeks->firstWhere('id', '2024-W02');
        $this->assertNotNull($selectedWeek);
        $this->assertSame('2024-01-08', $selectedWeek['dates']['start']);
        $this->assertSame('2024-01-14', $selectedWeek['dates']['end']);
        $this->assertSame(1, $selectedWeek['metrics']['present_count']);
        $this->assertSame(0, $selectedWeek['metrics']['late_count']);
        $this->assertSame(1, $selectedWeek['metrics']['absent_count']);
        $this->assertSame('50.00', $selectedWeek['metrics']['attendance_percentage']);
        $this->assertSame('0.00', $selectedWeek['metrics']['late_percentage']);
    }

    public function test_it_can_filter_by_attendance_band_and_search_terms(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang B',
            'status' => 'aktif',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
            'nama_lengkap' => 'Admin Cabang',
        ]);

        $wilbin = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin 2',
        ]);

        $highShelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter High',
        ]);

        $lowShelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Low',
        ]);

        $groupHigh = Kelompok::create([
            'id_shelter' => $highShelter->id_shelter,
            'nama_kelompok' => 'Kelompok High',
        ]);

        $groupLow = Kelompok::create([
            'id_shelter' => $lowShelter->id_shelter,
            'nama_kelompok' => 'Kelompok Low',
        ]);

        $highStudent = Anak::create([
            'id_shelter' => $highShelter->id_shelter,
            'id_kelompok' => $groupHigh->id_kelompok,
            'full_name' => 'High Performer',
            'status_validasi' => 'aktif',
        ]);

        $lowStudent = Anak::create([
            'id_shelter' => $lowShelter->id_shelter,
            'id_kelompok' => $groupLow->id_kelompok,
            'full_name' => 'Low Performer',
            'status_validasi' => 'aktif',
        ]);

        $highActivity = Aktivitas::create([
            'id_shelter' => $highShelter->id_shelter,
            'nama_kelompok' => $groupHigh->nama_kelompok,
            'tanggal' => '2024-02-05',
        ]);

        $lowActivity = Aktivitas::create([
            'id_shelter' => $lowShelter->id_shelter,
            'nama_kelompok' => $groupLow->nama_kelompok,
            'tanggal' => '2024-02-05',
        ]);

        $highAttendance = AbsenUser::create(['id_anak' => $highStudent->id_anak]);
        $lowAttendance = AbsenUser::create(['id_anak' => $lowStudent->id_anak]);

        Absen::create([
            'id_absen_user' => $highAttendance->id_absen_user,
            'id_aktivitas' => $highActivity->id_aktivitas,
            'absen' => Absen::TEXT_YA,
        ]);

        Absen::create([
            'id_absen_user' => $lowAttendance->id_absen_user,
            'id_aktivitas' => $lowActivity->id_aktivitas,
            'absen' => Absen::TEXT_TIDAK,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/attendance/weekly?start_date=2024-02-01&end_date=2024-02-29&attendance_band=high&search=High');
        $response->assertOk();

        $payload = $response->json('data');

        $this->assertSame('high', $payload['meta']['filters']['attendance_band']);
        $this->assertSame('High', $payload['meta']['filters']['search']);
        $this->assertNull($payload['meta']['filters']['week_id']);
        $this->assertCount(1, $payload['shelters']);
        $this->assertSame('Shelter High', $payload['shelters'][0]['name']);
        $this->assertSame('100.00', $payload['summary']['attendance_percentage']);
        $this->assertSame(1, $payload['summary']['total_shelters']);
    }

    public function test_it_validates_filters(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        Sanctum::actingAs($user, ['*']);

        $this->getJson('/api/admin-cabang/laporan/attendance/weekly?start_date=invalid&end_date=2024-01-01')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['start_date']);

        $this->getJson('/api/admin-cabang/laporan/attendance/weekly?start_date=2024-02-01&end_date=2024-01-01')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['end_date']);

        $this->getJson('/api/admin-cabang/laporan/attendance/weekly?attendance_band=extreme')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['attendance_band']);

        $this->getJson('/api/admin-cabang/laporan/attendance/weekly?week_id=2024-W60')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['week_id']);
    }

    public function test_it_returns_empty_dataset_when_no_shelter_found(): void
    {
        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang C',
            'status' => 'aktif',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
            'nama_lengkap' => 'Admin Cabang',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/attendance/weekly?start_date=2024-03-01&end_date=2024-03-31');
        $response->assertOk();

        $payload = $response->json('data');

        $this->assertSame(0, $payload['summary']['total_shelters']);
        $this->assertSame('0.00', $payload['summary']['attendance_percentage']);
        $this->assertSame([], $payload['shelters']);
    }

    private function seedWeeklyOverviewFixtures(): array
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

        $shelterAlpha = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Alpha',
        ]);

        $shelterBeta = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Beta',
        ]);

        $kelompokAlpha = Kelompok::create([
            'id_shelter' => $shelterAlpha->id_shelter,
            'nama_kelompok' => 'Kelompok Alpha',
            'jumlah_anggota' => 15,
        ]);

        $kelompokBeta = Kelompok::create([
            'id_shelter' => $shelterAlpha->id_shelter,
            'nama_kelompok' => 'Kelompok Beta',
            'jumlah_anggota' => 12,
            'kelas_gabungan' => ['A', 'B'],
        ]);

        $kelompokGamma = Kelompok::create([
            'id_shelter' => $shelterBeta->id_shelter,
            'nama_kelompok' => 'Kelompok Gamma',
            'jumlah_anggota' => 10,
        ]);

        $alphaStudents = collect([
            ['full_name' => 'Alpha One', 'nick_name' => 'A1', 'id_kelompok' => $kelompokAlpha->id_kelompok],
            ['full_name' => 'Alpha Two', 'nick_name' => 'A2', 'id_kelompok' => $kelompokAlpha->id_kelompok],
            ['full_name' => 'Alpha Three', 'nick_name' => 'A3', 'id_kelompok' => $kelompokBeta->id_kelompok],
        ])->map(fn ($payload) => Anak::create(array_merge([
            'id_shelter' => $shelterAlpha->id_shelter,
            'jenis_kelamin' => 'L',
            'status_validasi' => 'aktif',
        ], $payload)));

        $betaStudents = collect([
            ['full_name' => 'Beta One', 'nick_name' => 'B1'],
            ['full_name' => 'Beta Two', 'nick_name' => 'B2'],
        ])->map(fn ($payload) => Anak::create(array_merge([
            'id_shelter' => $shelterBeta->id_shelter,
            'id_kelompok' => $kelompokGamma->id_kelompok,
            'jenis_kelamin' => 'P',
            'status_validasi' => 'aktif',
        ], $payload)));

        $activityAlphaWeekOne = Aktivitas::create([
            'id_shelter' => $shelterAlpha->id_shelter,
            'nama_kelompok' => $kelompokAlpha->nama_kelompok,
            'tanggal' => '2024-01-03',
        ]);

        $activityAlphaWeekThree = Aktivitas::create([
            'id_shelter' => $shelterAlpha->id_shelter,
            'nama_kelompok' => $kelompokBeta->nama_kelompok,
            'tanggal' => '2024-01-17',
        ]);

        $activityBeta = Aktivitas::create([
            'id_shelter' => $shelterBeta->id_shelter,
            'nama_kelompok' => $kelompokGamma->nama_kelompok,
            'tanggal' => '2024-01-10',
        ]);

        $attendanceUsers = $alphaStudents
            ->merge($betaStudents)
            ->map(fn (Anak $student) => AbsenUser::create(['id_anak' => $student->id_anak]))
            ->values();

        Absen::create([
            'id_absen_user' => $attendanceUsers[0]->id_absen_user,
            'id_aktivitas' => $activityAlphaWeekOne->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_VERIFIED,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[1]->id_absen_user,
            'id_aktivitas' => $activityAlphaWeekOne->id_aktivitas,
            'absen' => Absen::TEXT_TERLAMBAT,
            'verification_status' => Absen::VERIFICATION_MANUAL,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[2]->id_absen_user,
            'id_aktivitas' => $activityAlphaWeekOne->id_aktivitas,
            'absen' => Absen::TEXT_TIDAK,
            'verification_status' => Absen::VERIFICATION_REJECTED,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[0]->id_absen_user,
            'id_aktivitas' => $activityAlphaWeekThree->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_PENDING,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[1]->id_absen_user,
            'id_aktivitas' => $activityAlphaWeekThree->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_PENDING,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[2]->id_absen_user,
            'id_aktivitas' => $activityAlphaWeekThree->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_PENDING,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[3]->id_absen_user,
            'id_aktivitas' => $activityBeta->id_aktivitas,
            'absen' => Absen::TEXT_YA,
            'verification_status' => Absen::VERIFICATION_VERIFIED,
        ]);

        Absen::create([
            'id_absen_user' => $attendanceUsers[4]->id_absen_user,
            'id_aktivitas' => $activityBeta->id_aktivitas,
            'absen' => Absen::TEXT_TIDAK,
            'verification_status' => Absen::VERIFICATION_PENDING,
        ]);

        return [
            'user' => $user,
            'shelterAlpha' => $shelterAlpha,
            'shelterBeta' => $shelterBeta,
        ];
    }
}
