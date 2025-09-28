<?php

namespace Tests\Feature\AdminCabang;

use App\Models\AdminCabang;
use App\Models\Aktivitas;
use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Shelter;
use App\Models\Tutor;
use App\Models\User;
use App\Models\Wilbin;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCabangReportSummaryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');

        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('anak');
        Schema::dropIfExists('tutor');
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
            $table->string('no_telp')->nullable();
            $table->string('alamat')->nullable();
            $table->string('email')->nullable();
            $table->string('status')->default('aktif');
            $table->string('id_prov')->nullable();
            $table->string('id_kab')->nullable();
            $table->string('id_kec')->nullable();
            $table->string('id_kel')->nullable();
            $table->timestamps();
        });

        Schema::create('admin_cabang', function (Blueprint $table) {
            $table->id('id_admin_cabang');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('id_kacab');
            $table->string('nama_lengkap')->nullable();
            $table->string('no_hp')->nullable();
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

        Schema::create('tutor', function (Blueprint $table) {
            $table->id('id_tutor');
            $table->string('nama');
            $table->unsignedBigInteger('id_kacab')->nullable();
            $table->unsignedBigInteger('id_wilbin')->nullable();
            $table->unsignedBigInteger('id_shelter')->nullable();
            $table->timestamps();
        });

        Schema::create('anak', function (Blueprint $table) {
            $table->id('id_anak');
            $table->unsignedBigInteger('id_shelter');
            $table->string('status_validasi')->default('aktif');
            $table->string('full_name')->nullable();
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_shelter');
            $table->string('status')->nullable();
            $table->string('jenis_kegiatan')->nullable();
            $table->date('tanggal');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('anak');
        Schema::dropIfExists('tutor');
        Schema::dropIfExists('shelter');
        Schema::dropIfExists('wilbin');
        Schema::dropIfExists('admin_cabang');
        Schema::dropIfExists('kacab');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_admin_cabang_can_retrieve_report_summary(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-05-10 08:00:00'));

        $user = User::create([
            'username' => 'cabang-user',
            'email' => 'cabang@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang Bandung',
            'no_telp' => '081234',
            'alamat' => 'Jl. Cabang',
            'email' => 'kacab@example.com',
            'status' => 'aktif',
            'id_prov' => '1',
            'id_kab' => '1',
            'id_kec' => '1',
            'id_kel' => '1',
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
            'nama_shelter' => 'Shelter A',
        ]);

        $shelterTwo = Shelter::create([
            'id_wilbin' => $wilbinTwo->id_wilbin,
            'nama_shelter' => 'Shelter B',
        ]);

        Tutor::create([
            'nama' => 'Tutor 1',
            'id_kacab' => $kacab->id_kacab,
            'id_wilbin' => $wilbinOne->id_wilbin,
            'id_shelter' => $shelterOne->id_shelter,
        ]);

        Tutor::create([
            'nama' => 'Tutor 2',
            'id_kacab' => $kacab->id_kacab,
            'id_wilbin' => $wilbinTwo->id_wilbin,
            'id_shelter' => $shelterTwo->id_shelter,
        ]);

        Anak::create([
            'id_shelter' => $shelterOne->id_shelter,
            'status_validasi' => 'aktif',
            'full_name' => 'Anak Aktif 1',
        ]);

        Anak::create([
            'id_shelter' => $shelterTwo->id_shelter,
            'status_validasi' => 'Aktif',
            'full_name' => 'Anak Aktif 2',
        ]);

        Anak::create([
            'id_shelter' => $shelterTwo->id_shelter,
            'status_validasi' => 'Tidak Aktif',
            'full_name' => 'Anak Tidak Aktif',
        ]);

        Aktivitas::create([
            'id_shelter' => $shelterOne->id_shelter,
            'status' => 'completed',
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::now()->subDays(2)->toDateString(),
        ]);

        Aktivitas::create([
            'id_shelter' => $shelterTwo->id_shelter,
            'status' => 'scheduled',
            'jenis_kegiatan' => 'Kunjungan',
            'tanggal' => Carbon::now()->subDay()->toDateString(),
        ]);

        Aktivitas::create([
            'id_shelter' => $shelterTwo->id_shelter,
            'status' => 'completed',
            'jenis_kegiatan' => 'Belajar',
            'tanggal' => Carbon::now()->subDays(45)->toDateString(),
        ]);

        Sanctum::actingAs($user);

        $startDate = Carbon::now()->subDays(5)->toDateString();
        $endDate = Carbon::now()->toDateString();

        $response = $this->getJson(
            '/api/admin-cabang/laporan/summary?start_date=' . $startDate . '&end_date=' . $endDate
        );

        $response->assertOk();

        $payload = $response->json('data');

        $this->assertSame(2, $payload['summary']['total_active_anak']);
        $this->assertSame(2, $payload['summary']['total_tutors']);
        $this->assertSame(2, $payload['summary']['total_shelters']);
        $this->assertSame(2, $payload['summary']['wilbin_count']);
        $this->assertSame(2, $payload['summary']['recent_aktivitas']['total']);
        $this->assertSame($startDate, $payload['summary']['recent_aktivitas']['date_range']['start_date']);
        $this->assertSame($endDate, $payload['summary']['recent_aktivitas']['date_range']['end_date']);

        $this->assertSame(1, $payload['summary']['recent_aktivitas']['by_status']['completed']);
        $this->assertSame(1, $payload['summary']['recent_aktivitas']['by_status']['scheduled']);
        $this->assertSame(1, $payload['summary']['recent_aktivitas']['by_jenis_kegiatan']['Belajar']);
        $this->assertSame(1, $payload['summary']['recent_aktivitas']['by_jenis_kegiatan']['Kunjungan']);

        $this->assertSame($kacab->id_kacab, $payload['metadata']['kacab']['id']);
        $this->assertSame('Cabang Bandung', $payload['metadata']['kacab']['nama']);
        $this->assertSame('kacab@example.com', $payload['metadata']['kacab']['email']);
        $this->assertSame($startDate, $payload['metadata']['filters']['start_date']);
        $this->assertSame($endDate, $payload['metadata']['filters']['end_date']);

        $this->assertEqualsCanonicalizing(
            [$shelterOne->id_shelter, $shelterTwo->id_shelter],
            $payload['metadata']['shelter_ids']
        );

        $this->assertNotNull($payload['metadata']['generated_at']);

        Carbon::setTestNow();
    }

    public function test_only_admin_cabang_role_can_access_summary(): void
    {
        $user = User::create([
            'username' => 'other-user',
            'email' => 'other@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_pusat',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/admin-cabang/laporan/summary');

        $response->assertStatus(403);
        $response->assertJson([
            'message' => 'Unauthorized access',
        ]);
    }
}
