<?php

namespace Tests\Feature\AdminCabang;

use App\Models\AdminCabang;
use App\Models\Jenjang;
use App\Models\Kacab;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MasterDataKelasCustomTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:' . base64_encode(random_bytes(32))]);
        config(['database.default' => 'sqlite']);
        config(['database.connections.sqlite.database' => ':memory:']);

        DB::purge('sqlite');
        DB::reconnect('sqlite');

        $this->createSchema();
    }

    protected function tearDown(): void
    {
        Schema::dropAllTables();
        parent::tearDown();
    }

    public function test_store_kelas_custom_rejects_tingkat_outside_sd_range(): void
    {
        $user = $this->createAdminCabangUser('admin_sd', 'admin-sd@example.com');

        $jenjang = Jenjang::create([
            'nama_jenjang' => 'Sekolah Dasar',
            'kode_jenjang' => 'SD',
            'urutan' => 1,
            'deskripsi' => 'Jenjang SD',
            'is_active' => true,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->postJson('/api/admin-cabang/kelas-custom', [
            'id_jenjang' => $jenjang->id_jenjang,
            'nama_kelas' => 'Kelas Eksperimen',
            'tingkat' => 12,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
                'message' => 'Tingkat untuk jenjang SD harus antara 1 dan 6',
            ])
            ->assertJsonPath('errors.tingkat.0', 'Tingkat untuk jenjang SD harus antara 1 dan 6');
    }

    public function test_master_data_dropdown_includes_tingkat_metadata(): void
    {
        $user = $this->createAdminCabangUser('admin_metadata', 'admin-metadata@example.com');

        Jenjang::create([
            'nama_jenjang' => 'Sekolah Dasar',
            'kode_jenjang' => 'SD',
            'urutan' => 1,
            'deskripsi' => 'Jenjang SD',
            'is_active' => true,
        ]);

        Jenjang::create([
            'nama_jenjang' => 'Sekolah Menengah Pertama',
            'kode_jenjang' => 'SMP',
            'urutan' => 2,
            'deskripsi' => 'Jenjang SMP',
            'is_active' => true,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/master-data/dropdown');

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $jenjangData = $response->json('data.jenjang');
        $this->assertIsArray($jenjangData);

        $sdData = collect($jenjangData)->firstWhere('kode_jenjang', 'SD');
        $this->assertNotNull($sdData);
        $this->assertSame(1, $sdData['min_tingkat']);
        $this->assertSame(6, $sdData['max_tingkat']);
        $this->assertEquals([1, 2, 3, 4, 5, 6], $sdData['allowed_tingkat']);
        $this->assertIsArray($sdData['metadata']);
        $this->assertSame(1, $sdData['metadata']['min_tingkat']);
        $this->assertSame(6, $sdData['metadata']['max_tingkat']);
        $this->assertEquals([1, 2, 3, 4, 5, 6], $sdData['metadata']['tingkat_range']['allowed']);

        $smpData = collect($jenjangData)->firstWhere('kode_jenjang', 'SMP');
        $this->assertNotNull($smpData);
        $this->assertSame(7, $smpData['min_tingkat']);
        $this->assertSame(9, $smpData['max_tingkat']);
        $this->assertEquals([7, 8, 9], $smpData['allowed_tingkat']);
    }

    private function createAdminCabangUser(string $username, string $email): User
    {
        $user = User::create([
            'username' => $username,
            'email' => $email,
            'password' => 'secret',
            'level' => 'admin_cabang',
            'status' => 'active',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang ' . ucfirst(str_replace('_', ' ', $username)),
            'status' => 'aktif',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
            'nama_lengkap' => 'Admin ' . ucfirst(str_replace('_', ' ', $username)),
        ]);

        return $user;
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

        Schema::create('kacab', function (Blueprint $table) {
            $table->bigIncrements('id_kacab');
            $table->string('nama_kacab')->nullable();
            $table->string('status')->nullable();
            $table->timestamps();
        });

        Schema::create('admin_cabang', function (Blueprint $table) {
            $table->bigIncrements('id_admin_cabang');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('id_kacab');
            $table->string('nama_lengkap')->nullable();
            $table->timestamps();
        });

        Schema::create('jenjang', function (Blueprint $table) {
            $table->bigIncrements('id_jenjang');
            $table->string('nama_jenjang');
            $table->string('kode_jenjang')->nullable();
            $table->integer('urutan')->default(0);
            $table->text('deskripsi')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('kelas', function (Blueprint $table) {
            $table->bigIncrements('id_kelas');
            $table->unsignedBigInteger('id_jenjang')->nullable();
            $table->unsignedBigInteger('id_kacab')->nullable();
            $table->string('nama_kelas');
            $table->integer('tingkat')->nullable();
            $table->string('jenis_kelas')->default('custom');
            $table->boolean('is_custom')->default(true);
            $table->integer('urutan')->nullable();
            $table->text('deskripsi')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_global')->default(false);
            $table->json('target_jenjang')->nullable();
            $table->json('kelas_gabungan')->nullable();
            $table->timestamps();
        });
    }
}
