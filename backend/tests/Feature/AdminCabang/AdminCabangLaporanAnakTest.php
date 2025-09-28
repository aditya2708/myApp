<?php

namespace Tests\Feature\AdminCabang;

use App\Models\Absen;
use App\Models\AbsenUser;
use App\Models\AdminCabang;
use App\Models\Aktivitas;
use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Shelter;
use App\Models\User;
use App\Models\Wilbin;
use Carbon\Carbon;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCabangLaporanAnakTest extends TestCase
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

        Schema::create('anak', function (Blueprint $table) {
            $table->id('id_anak');
            $table->unsignedBigInteger('id_shelter');
            $table->string('status_validasi')->default('aktif');
            $table->string('full_name')->nullable();
            $table->string('nick_name')->nullable();
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_shelter');
            $table->string('jenis_kegiatan')->nullable();
            $table->date('tanggal');
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
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('anak');
        Schema::dropIfExists('shelter');
        Schema::dropIfExists('wilbin');
        Schema::dropIfExists('admin_cabang');
        Schema::dropIfExists('kacab');
        Schema::dropIfExists('users');

        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_admin_cabang_can_list_children_with_pagination(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-05-15 08:00:00'));

        $user = User::create([
            'username' => 'cabang-user',
            'email' => 'cabang@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang Bandung',
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

        $childOne = Anak::create([
            'id_shelter' => $shelterOne->id_shelter,
            'status_validasi' => 'aktif',
            'full_name' => 'Andi Wijaya',
        ]);

        $childTwo = Anak::create([
            'id_shelter' => $shelterOne->id_shelter,
            'status_validasi' => 'Aktif',
            'full_name' => 'Budi Santoso',
        ]);

        $childThree = Anak::create([
            'id_shelter' => $shelterTwo->id_shelter,
            'status_validasi' => 'aktif',
            'full_name' => 'Cici Maharani',
        ]);

        $activityOne = Aktivitas::create([
            'id_shelter' => $shelterOne->id_shelter,
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => '2024-05-01',
        ]);

        $activityTwo = Aktivitas::create([
            'id_shelter' => $shelterOne->id_shelter,
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => '2024-05-08',
        ]);

        $activityThree = Aktivitas::create([
            'id_shelter' => $shelterTwo->id_shelter,
            'jenis_kegiatan' => 'Outing',
            'tanggal' => '2024-05-03',
        ]);

        $absenUserOne = AbsenUser::create(['id_anak' => $childOne->id_anak]);
        $absenUserTwo = AbsenUser::create(['id_anak' => $childTwo->id_anak]);
        $absenUserThree = AbsenUser::create(['id_anak' => $childThree->id_anak]);

        Absen::create([
            'id_absen_user' => $absenUserOne->id_absen_user,
            'id_aktivitas' => $activityOne->id_aktivitas,
            'absen' => Absen::TEXT_YA,
        ]);

        Absen::create([
            'id_absen_user' => $absenUserTwo->id_absen_user,
            'id_aktivitas' => $activityTwo->id_aktivitas,
            'absen' => Absen::TEXT_TERLAMBAT,
        ]);

        Absen::create([
            'id_absen_user' => $absenUserThree->id_absen_user,
            'id_aktivitas' => $activityThree->id_aktivitas,
            'absen' => Absen::TEXT_YA,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/anak-binaan?per_page=2');

        $response
            ->assertOk()
            ->assertJsonPath('data.pagination.current_page', 1)
            ->assertJsonPath('data.pagination.per_page', 2)
            ->assertJsonPath('data.pagination.total', 3)
            ->assertJsonCount(2, 'data.children')
            ->assertJsonPath('data.summary.total_children', 3)
            ->assertJsonPath('data.summary.by_shelter.0.nama_shelter', 'Shelter Alpha')
            ->assertJsonPath('data.summary.by_wilbin.0.nama_wilbin', 'Wilbin 1');
    }

    public function test_admin_cabang_can_filter_by_date_jenis_and_shelter(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-06-01 08:00:00'));

        $user = User::create([
            'username' => 'cabang-user',
            'email' => 'cabang@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang Surabaya',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
        ]);

        $wilbin = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin Filter',
        ]);

        $shelterA = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Filter A',
        ]);

        $shelterB = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter Filter B',
        ]);

        $childA = Anak::create([
            'id_shelter' => $shelterA->id_shelter,
            'status_validasi' => 'aktif',
            'full_name' => 'Ahmad Filter',
        ]);

        $childB = Anak::create([
            'id_shelter' => $shelterB->id_shelter,
            'status_validasi' => 'aktif',
            'full_name' => 'Bara Filter',
        ]);

        $januaryActivity = Aktivitas::create([
            'id_shelter' => $shelterA->id_shelter,
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => '2024-01-10',
        ]);

        $marchActivity = Aktivitas::create([
            'id_shelter' => $shelterB->id_shelter,
            'jenis_kegiatan' => 'Outing',
            'tanggal' => '2024-03-05',
        ]);

        $absenUserA = AbsenUser::create(['id_anak' => $childA->id_anak]);
        $absenUserB = AbsenUser::create(['id_anak' => $childB->id_anak]);

        Absen::create([
            'id_absen_user' => $absenUserA->id_absen_user,
            'id_aktivitas' => $januaryActivity->id_aktivitas,
            'absen' => Absen::TEXT_YA,
        ]);

        Absen::create([
            'id_absen_user' => $absenUserB->id_absen_user,
            'id_aktivitas' => $marchActivity->id_aktivitas,
            'absen' => Absen::TEXT_YA,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson(sprintf(
            '/api/admin-cabang/laporan/anak-binaan?start_date=%s&end_date=%s&jenis_kegiatan=%s&shelter_id=%d',
            '2024-03-01',
            '2024-03-31',
            'Outing',
            $shelterB->id_shelter
        ));

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data.children')
            ->assertJsonPath('data.children.0.full_name', 'Bara Filter')
            ->assertJsonPath('data.summary.total_children', 1)
            ->assertJsonPath('data.children.0.monthly_data.2024-03.activities_count', 1)
            ->assertJsonPath('data.children.0.monthly_data.2024-03.attended_count', 1);
    }

    public function test_admin_cabang_without_profile_cannot_access_report(): void
    {
        $user = User::create([
            'username' => 'no-admin',
            'email' => 'no-admin@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/anak-binaan');

        $response->assertNotFound();
    }
}
