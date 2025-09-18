<?php

namespace Tests\Integration;

use App\Http\Controllers\API\AdminCabang\AdminCabangUserController;
use App\Http\Resources\UserResource;
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
use Illuminate\Http\Request;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use Illuminate\Validation\Factory;
use PHPUnit\Framework\TestCase;

class AdminCabangUserControllerTest extends TestCase
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
            $schema->dropIfExists('shelter');
            $schema->dropIfExists('wilbin');
            $schema->dropIfExists('kacab');
            $schema->dropIfExists('users');
        }

        Container::setInstance(null);
        Model::unsetEventDispatcher();

        parent::tearDown();
    }

    public function test_store_creates_user_and_related_admin_shelter(): void
    {
        $controller = new AdminCabangUserController();
        $locations = $this->createLocationHierarchy();

        $request = Request::create('/admin-cabang/create-user', 'POST', [
            'username' => 'shelter-admin',
            'email' => 'shelter@example.com',
            'password' => 'secret123',
            'level' => 'admin_shelter',
            'nama_lengkap' => 'Shelter Admin',
            'alamat' => 'Shelter Address',
            'no_hp' => '08123456789',
            'id_kacab' => $locations['kacab']->id_kacab,
            'id_wilbin' => $locations['wilbin']->id_wilbin,
            'id_shelter' => $locations['shelter']->id_shelter,
        ]);

        $resource = $controller->store($request);
        $this->assertInstanceOf(UserResource::class, $resource);

        $response = $resource->toArray($request);

        $user = User::where('email', 'shelter@example.com')->first();
        $this->assertNotNull($user);
        $this->assertSame('admin_shelter', $user->level);
        $this->assertTrue(Container::getInstance()->make('hash')->check('secret123', $user->password));

        $profile = $user->adminShelter()->first();
        $this->assertNotNull($profile);
        $this->assertSame($locations['kacab']->id_kacab, $profile->id_kacab);
        $this->assertSame($locations['wilbin']->id_wilbin, $profile->id_wilbin);
        $this->assertSame($locations['shelter']->id_shelter, $profile->id_shelter);
        $this->assertSame('Shelter Address', $profile->alamat_adm);
        $this->assertSame('08123456789', $profile->no_hp);

        $this->assertArrayHasKey('user', $response);
        $this->assertArrayHasKey('admin_shelter', $response);
        $this->assertSame('shelter-admin', $response['user']['username']);
        $this->assertSame('Shelter Admin', $response['admin_shelter']['nama_lengkap']);
        $this->assertSame('Shelter Address', $response['admin_shelter']['alamat']);
    }

    public function test_update_can_switch_to_admin_shelter_and_sync_profile(): void
    {
        $controller = new AdminCabangUserController();
        $locations = $this->createLocationHierarchy();

        $user = User::create([
            'username' => 'cabang-admin',
            'email' => 'cabang@example.com',
            'password' => Container::getInstance()->make('hash')->make('secret123'),
            'level' => 'admin_cabang',
        ]);

        $user->adminCabang()->create([
            'id_kacab' => $locations['kacab']->id_kacab,
            'nama_lengkap' => 'Cabang Admin',
            'alamat' => 'Old Address',
            'no_hp' => '0800000000',
        ]);

        $request = Request::create('/admin-cabang/users/' . $user->id_users, 'PUT', [
            'level' => 'admin_shelter',
            'email' => 'updated@example.com',
            'nama_lengkap' => 'Shelter Admin',
            'alamat' => 'Shelter Address',
            'no_hp' => '08123456789',
            'id_kacab' => $locations['kacab']->id_kacab,
            'id_wilbin' => $locations['wilbin']->id_wilbin,
            'id_shelter' => $locations['shelter']->id_shelter,
        ]);

        $resource = $controller->update($request, $user->id_users);
        $this->assertInstanceOf(UserResource::class, $resource);

        $response = $resource->toArray($request);

        $user->refresh();
        $this->assertSame('admin_shelter', $user->level);
        $this->assertSame('updated@example.com', $user->email);

        $shelterProfile = $user->adminShelter()->first();
        $this->assertNotNull($shelterProfile);
        $this->assertSame($locations['kacab']->id_kacab, $shelterProfile->id_kacab);
        $this->assertSame($locations['wilbin']->id_wilbin, $shelterProfile->id_wilbin);
        $this->assertSame($locations['shelter']->id_shelter, $shelterProfile->id_shelter);
        $this->assertSame('Shelter Address', $shelterProfile->alamat_adm);
        $this->assertSame('Shelter Admin', $shelterProfile->nama_lengkap);

        $this->assertNull($user->adminCabang()->first());

        $this->assertArrayHasKey('admin_shelter', $response);
        $this->assertArrayNotHasKey('admin_cabang', $response);
        $this->assertSame('Shelter Admin', $response['admin_shelter']['nama_lengkap']);
        $this->assertSame('Shelter Address', $response['admin_shelter']['alamat']);
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

