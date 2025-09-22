<?php

namespace Tests\Feature;

use App\Models\AdminCabang;
use App\Models\Jenjang;
use App\Models\Kacab;
use App\Models\MataPelajaran;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MataPelajaranEndpointTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['app.key' => 'base64:'.base64_encode(random_bytes(32))]);
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

    public function test_endpoint_returns_mata_pelajaran_for_target_assignments(): void
    {
        $user = User::create([
            'username' => 'admin_cabang',
            'email' => 'admin@example.com',
            'password' => 'secret',
            'level' => 'admin_cabang',
            'status' => 'active',
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

        $jenjang = Jenjang::create([
            'nama_jenjang' => 'SMP',
            'kode_jenjang' => 'SMP',
            'urutan' => 1,
            'deskripsi' => 'Sekolah Menengah Pertama',
            'is_active' => true,
        ]);

        MataPelajaran::create([
            'nama_mata_pelajaran' => 'Matematika',
            'kode_mata_pelajaran' => 'MTK',
            'kategori' => 'wajib',
            'deskripsi' => 'Belajar angka',
            'status' => 'active',
            'id_kacab' => $kacab->id_kacab,
            'id_jenjang' => null,
            'is_global' => false,
            'target_jenjang' => [$jenjang->id_jenjang],
            'target_kelas' => [101],
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/kurikulum/mata-pelajaran?jenjang='.$jenjang->id_jenjang.'&kelas=101');

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonPath('data.0.nama_mata_pelajaran', 'Matematika');
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

        Schema::create('mata_pelajaran', function (Blueprint $table) {
            $table->bigIncrements('id_mata_pelajaran');
            $table->string('nama_mata_pelajaran');
            $table->string('kode_mata_pelajaran')->unique();
            $table->string('kategori');
            $table->text('deskripsi')->nullable();
            $table->string('status')->default('active');
            $table->unsignedBigInteger('id_kacab')->nullable();
            $table->unsignedBigInteger('id_jenjang')->nullable();
            $table->boolean('is_global')->default(false);
            $table->json('target_jenjang')->nullable();
            $table->json('target_kelas')->nullable();
            $table->timestamps();
        });

        Schema::create('materi', function (Blueprint $table) {
            $table->bigIncrements('id_materi');
            $table->unsignedBigInteger('id_mata_pelajaran')->nullable();
            $table->unsignedBigInteger('id_kelas')->nullable();
            $table->unsignedBigInteger('id_kacab')->nullable();
            $table->string('nama_materi')->nullable();
            $table->timestamps();
        });
    }
}
