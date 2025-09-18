<?php

namespace Tests\Integration;

use App\Http\Controllers\API\AdminPusat\AdminPusatUserController;
use App\Models\Kacab;
use App\Models\Shelter;
use App\Models\User;
use App\Models\Wilbin;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Events\Dispatcher;
use Illuminate\Hashing\BcryptHasher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Facade;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use Illuminate\Validation\Factory;
use PHPUnit\Framework\TestCase;

class AdminPusatUserControllerTest extends TestCase
{
    private Capsule $database;

    protected function setUp(): void
    {
        parent::setUp();

        Model::clearBootedModels();

        $this->setUpContainer();
        $this->setUpDatabase();
    }

    protected function tearDown(): void
    {
        if (isset($this->database)) {
            $schema = $this->database->schema();
            $schema->dropIfExists('admin_shelter');
            $schema->dropIfExists('admin_cabang');
            $schema->dropIfExists('admin_pusat');
            $schema->dropIfExists('shelter');
            $schema->dropIfExists('wilbin');
            $schema->dropIfExists('kacab');
            $schema->dropIfExists('users');
        }

        Facade::clearResolvedInstances();
        Container::setInstance(null);
        Model::unsetEventDispatcher();

        parent::tearDown();
    }

    public function test_store_creates_user_and_admin_pusat_profile(): void
    {
        $controller = new AdminPusatUserController();

        $request = Request::create('/admin-pusat/create-user', 'POST', [
            'username' => 'central-admin',
            'email' => 'central@example.com',
            'password' => 'secret123',
            'level' => 'admin_pusat',
            'nama_lengkap' => 'Central Admin',
            'alamat' => 'Central Address',
            'no_hp' => '0800111222',
        ]);

        $response = $controller->store($request);
        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertSame(201, $response->getStatusCode());

        $payload = $response->getData(true);
        $this->assertTrue($payload['status']);
        $this->assertArrayHasKey('admin_pusat', $payload['data']);

        $user = User::where('email', 'central@example.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('admin_pusat', $user->level);
        $this->assertTrue(Container::getInstance()->make('hash')->check('secret123', $user->password));

        $profile = $user->adminPusat()->first();
        $this->assertNotNull($profile);
        $this->assertSame('Central Admin', $profile->nama_lengkap);
        $this->assertSame('Central Address', $profile->alamat);
        $this->assertSame('0800111222', $profile->no_hp);

        $this->assertSame('Central Admin', $payload['data']['admin_pusat']['nama_lengkap']);
        $this->assertSame('Central Address', $payload['data']['admin_pusat']['alamat']);
    }

    public function test_update_switches_to_admin_shelter_and_syncs_profiles(): void
    {
        $controller = new AdminPusatUserController();
        $locations = $this->createLocationHierarchy();

        $user = User::create([
            'username' => 'central-admin',
            'email' => 'central@example.com',
            'password' => Container::getInstance()->make('hash')->make('secret123'),
            'level' => 'admin_pusat',
        ]);

        $user->adminPusat()->create([
            'nama_lengkap' => 'Central Admin',
            'alamat' => 'Central Address',
            'no_hp' => '0800111222',
        ]);

        $request = Request::create('/admin-pusat/users/' . $user->id_users, 'PUT', [
            'level' => 'admin_shelter',
            'nama_lengkap' => 'Shelter Admin',
            'alamat' => 'Shelter Address',
            'no_hp' => '08123456789',
            'id_kacab' => $locations['kacab']->id_kacab,
            'id_wilbin' => $locations['wilbin']->id_wilbin,
            'id_shelter' => $locations['shelter']->id_shelter,
        ]);

        $response = $controller->update($request, $user->id_users);
        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertSame(200, $response->getStatusCode());

        $payload = $response->getData(true);
        $this->assertTrue($payload['status']);
        $this->assertArrayHasKey('admin_shelter', $payload['data']);
        $this->assertArrayNotHasKey('admin_pusat', $payload['data']);

        $user->refresh();
        $this->assertSame('admin_shelter', $user->level);

        $shelterProfile = $user->adminShelter()->first();
        $this->assertNotNull($shelterProfile);
        $this->assertSame($locations['kacab']->id_kacab, $shelterProfile->id_kacab);
        $this->assertSame($locations['wilbin']->id_wilbin, $shelterProfile->id_wilbin);
        $this->assertSame($locations['shelter']->id_shelter, $shelterProfile->id_shelter);
        $this->assertSame('Shelter Admin', $shelterProfile->nama_lengkap);
        $this->assertSame('Shelter Address', $shelterProfile->alamat_adm);

        $this->assertNull($user->adminPusat()->first());

        $this->assertSame('Shelter Admin', $payload['data']['admin_shelter']['nama_lengkap']);
        $this->assertSame('Shelter Address', $payload['data']['admin_shelter']['alamat']);
    }

    private function setUpContainer(): void
    {
        $container = new Container();
        Container::setInstance($container);

        $config = new Repository([
            'app.locale' => 'en',
            'app.fallback_locale' => 'en',
            'database.default' => 'sqlite',
            'database.connections.sqlite' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
            ],
        ]);

        $container->instance('config', $config);
        $container->instance('app', $container);

        $loader = new ArrayLoader();
        $translator = new Translator($loader, 'en');
        $container->instance('translator', $translator);

        $validator = new Factory($translator, $container);
        $container->instance('validator', $validator);

        $container->singleton('hash', static fn () => new BcryptHasher());

        Facade::setFacadeApplication($container);

        $capsule = new Capsule($container);
        $capsule->addConnection([
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
        ]);

        $events = new Dispatcher($container);
        $capsule->setEventDispatcher($events);

        $capsule->setAsGlobal();
        $capsule->bootEloquent();

        $container->instance('events', $events);
        $container->instance('db', $capsule->getDatabaseManager());

        Model::setConnectionResolver($capsule->getDatabaseManager());
        Model::setEventDispatcher($events);

        $this->database = $capsule;
    }

    private function setUpDatabase(): void
    {
        $schema = $this->database->schema();

        $schema->create('users', function (Blueprint $table) {
            $table->increments('id_users');
            $table->string('username');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('level');
            $table->string('status')->nullable();
            $table->timestamps();
        });

        $schema->create('kacab', function (Blueprint $table) {
            $table->increments('id_kacab');
            $table->string('nama_kacab')->nullable();
            $table->timestamps();
        });

        $schema->create('wilbin', function (Blueprint $table) {
            $table->increments('id_wilbin');
            $table->unsignedInteger('id_kacab')->nullable();
            $table->string('nama_wilbin')->nullable();
            $table->timestamps();
        });

        $schema->create('shelter', function (Blueprint $table) {
            $table->increments('id_shelter');
            $table->unsignedInteger('id_wilbin')->nullable();
            $table->string('nama_shelter')->nullable();
            $table->timestamps();
        });

        $schema->create('admin_pusat', function (Blueprint $table) {
            $table->increments('id_admin_pusat');
            $table->unsignedInteger('id_users')->unique();
            $table->string('nama_lengkap')->nullable();
            $table->string('alamat')->nullable();
            $table->string('no_hp')->nullable();
            $table->timestamps();
        });

        $schema->create('admin_cabang', function (Blueprint $table) {
            $table->increments('id_admin_cabang');
            $table->unsignedInteger('user_id')->unique();
            $table->unsignedInteger('id_kacab')->nullable();
            $table->string('nama_lengkap')->nullable();
            $table->string('alamat')->nullable();
            $table->string('no_hp')->nullable();
            $table->timestamps();
        });

        $schema->create('admin_shelter', function (Blueprint $table) {
            $table->increments('id_admin_shelter');
            $table->unsignedInteger('user_id')->unique();
            $table->unsignedInteger('id_kacab')->nullable();
            $table->unsignedInteger('id_wilbin')->nullable();
            $table->unsignedInteger('id_shelter')->nullable();
            $table->string('nama_lengkap')->nullable();
            $table->string('alamat_adm')->nullable();
            $table->string('no_hp')->nullable();
            $table->timestamps();
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function createLocationHierarchy(): array
    {
        $kacab = Kacab::create(['nama_kacab' => 'Cabang']);
        $wilbin = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin',
        ]);
        $shelter = Shelter::create([
            'id_wilbin' => $wilbin->id_wilbin,
            'nama_shelter' => 'Shelter',
        ]);

        return compact('kacab', 'wilbin', 'shelter');
    }
}
