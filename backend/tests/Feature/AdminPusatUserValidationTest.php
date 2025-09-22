<?php

namespace Tests\Feature;

use App\Http\Controllers\API\AdminPusat\AdminPusatUserController;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class AdminPusatUserValidationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');

        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id('id_users');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('level');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_store_returns_indonesian_messages_for_duplicate_username_and_email(): void
    {
        DB::table('users')->insert([
            'username' => 'existing-user',
            'email' => 'existing@example.com',
            'password' => bcrypt('password'),
            'level' => 'admin_pusat',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $request = Request::create('/api/admin-pusat/create-user', 'POST', [
            'username' => 'existing-user',
            'email' => 'existing@example.com',
            'password' => 'rahasia',
            'level' => 'admin_pusat',
            'nama_lengkap' => 'Pengguna Baru',
        ]);

        $controller = app(AdminPusatUserController::class);
        $response = $controller->store($request);
        $payload = $response->getData(true);

        $this->assertFalse($payload['status']);
        $this->assertEquals('Validasi gagal', $payload['message']);
        $this->assertSame('Username sudah digunakan.', $payload['errors']['username'][0]);
        $this->assertSame('Email sudah digunakan.', $payload['errors']['email'][0]);
    }

    public function test_ensure_required_profile_data_requires_nama_lengkap_for_admin_pusat(): void
    {
        $controller = app(AdminPusatUserController::class);
        $user = new User();
        $user->setRelation('adminPusat', null);

        $method = new \ReflectionMethod($controller, 'ensureRequiredProfileData');
        $method->setAccessible(true);

        try {
            $method->invoke($controller, $user, 'admin_pusat', []);
            $this->fail('ValidationException was not thrown for missing nama_lengkap.');
        } catch (ValidationException $exception) {
            $this->assertSame(['Nama lengkap wajib diisi.'], $exception->errors()['nama_lengkap']);
        }
    }

    public function test_ensure_required_profile_data_requires_admin_shelter_identifiers(): void
    {
        $controller = app(AdminPusatUserController::class);
        $user = new User();
        $user->setRelation('adminShelter', null);

        $method = new \ReflectionMethod($controller, 'ensureRequiredProfileData');
        $method->setAccessible(true);

        try {
            $method->invoke($controller, $user, 'admin_shelter', []);
            $this->fail('ValidationException was not thrown for missing admin shelter identifiers.');
        } catch (ValidationException $exception) {
            $errors = $exception->errors();

            $this->assertSame(['Cabang wajib dipilih.'], $errors['id_kacab']);
            $this->assertSame(['Wilayah binaan wajib dipilih.'], $errors['id_wilbin']);
            $this->assertSame(['Shelter wajib dipilih.'], $errors['id_shelter']);
        }
    }
}
