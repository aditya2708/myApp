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
        $user = User::create([
            'username' => 'admin_sd',
            'email' => 'admin-sd@example.com',
            'password' => 'secret',
            'level' => 'admin_cabang',
            'status' => 'active',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang Utama',
            'status' => 'aktif',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
            'nama_lengkap' => 'Admin SD',
        ]);

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
