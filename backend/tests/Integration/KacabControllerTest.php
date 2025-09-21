<?php

namespace Tests\Integration;

use App\Http\Controllers\API\KacabController;
use App\Models\Kacab;
use Illuminate\Config\Repository;
use Illuminate\Container\Container;
use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Events\Dispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Facade;
use Illuminate\Translation\ArrayLoader;
use Illuminate\Translation\Translator;
use Illuminate\Validation\Factory;
use PHPUnit\Framework\TestCase;

class KacabControllerTest extends TestCase
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
            $schema->dropIfExists('kacab');
            $schema->dropIfExists('provinsi');
            $schema->dropIfExists('kabupaten');
            $schema->dropIfExists('kecamatan');
            $schema->dropIfExists('kelurahan');
        }

        Facade::clearResolvedInstances();
        Container::setInstance(null);
        Model::unsetEventDispatcher();

        parent::tearDown();
    }

    public function test_store_keeps_leading_zeroes_on_location_identifiers(): void
    {
        $controller = new KacabController();

        $request = Request::create('/api/kacab', 'POST', [
            'nama_kacab' => 'Cabang 01',
            'no_telp' => '0800123456',
            'alamat' => 'Alamat Cabang',
            'email' => 'cabang01@example.com',
            'id_prov' => '01',
            'id_kab' => '0102',
            'id_kec' => '010203',
            'id_kel' => '01020304',
        ]);

        $response = $controller->store($request);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertSame(201, $response->getStatusCode());

        $payload = $response->getData(true);
        $this->assertTrue($payload['status']);
        $this->assertSame('01', $payload['data']['id_prov']);
        $this->assertSame('0102', $payload['data']['id_kab']);
        $this->assertSame('010203', $payload['data']['id_kec']);
        $this->assertSame('01020304', $payload['data']['id_kel']);

        $stored = Kacab::query()->first();
        $this->assertNotNull($stored);
        $this->assertSame('01', $stored->id_prov);
        $this->assertSame('0102', $stored->id_kab);
        $this->assertSame('010203', $stored->id_kec);
        $this->assertSame('01020304', $stored->id_kel);
        $this->assertSame('0800123456', $stored->no_telpon);

        $raw = $this->database->table('kacab')->first();
        $this->assertSame('01', $raw->id_prov);
        $this->assertSame('0102', $raw->id_kab);
        $this->assertSame('010203', $raw->id_kec);
        $this->assertSame('01020304', $raw->id_kel);
        $this->assertSame('0800123456', $raw->no_telpon);
    }

    public function test_store_accepts_legacy_no_telpon_field(): void
    {
        $controller = new KacabController();

        $request = Request::create('/api/kacab', 'POST', [
            'nama_kacab' => 'Cabang 02',
            'no_telpon' => '0811223344',
            'alamat' => 'Alamat Cabang 02',
            'email' => 'cabang02@example.com',
        ]);

        $response = $controller->store($request);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertSame(201, $response->getStatusCode());

        $payload = $response->getData(true);
        $this->assertTrue($payload['status']);
        $this->assertSame('0811223344', $payload['data']['no_telp']);

        $stored = Kacab::query()->where('nama_kacab', 'Cabang 02')->first();
        $this->assertNotNull($stored);
        $this->assertSame('0811223344', $stored->no_telp);
        $this->assertSame('0811223344', $stored->no_telpon);

        $raw = $this->database->table('kacab')->where('nama_kacab', 'Cabang 02')->first();
        $this->assertSame('0811223344', $raw->no_telp);
        $this->assertSame('0811223344', $raw->no_telpon);
    }

    public function test_update_keeps_leading_zeroes_on_location_identifiers(): void
    {
        $existing = Kacab::create([
            'nama_kacab' => 'Cabang Awal',
            'no_telp' => '0800654321',
            'alamat' => 'Alamat Lama',
            'email' => 'awal@example.com',
            'id_prov' => '11',
            'id_kab' => '1102',
            'id_kec' => '110203',
            'id_kel' => '11020304',
        ]);

        $controller = new KacabController();

        $request = Request::create('/api/kacab/' . $existing->id_kacab, 'PUT', [
            'nama_kacab' => 'Cabang Update',
            'no_telp' => '0800987654',
            'alamat' => 'Alamat Baru',
            'email' => 'update@example.com',
            'id_prov' => '21',
            'id_kab' => '2103',
            'id_kec' => '210304',
            'id_kel' => '21030405',
        ]);

        $response = $controller->update($request, $existing);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertSame(200, $response->getStatusCode());

        $payload = $response->getData(true);
        $this->assertTrue($payload['status']);
        $this->assertSame('21', $payload['data']['id_prov']);
        $this->assertSame('2103', $payload['data']['id_kab']);
        $this->assertSame('210304', $payload['data']['id_kec']);
        $this->assertSame('21030405', $payload['data']['id_kel']);
        $this->assertSame('0800987654', $payload['data']['no_telp']);

        $existing->refresh();
        $this->assertSame('21', $existing->id_prov);
        $this->assertSame('2103', $existing->id_kab);
        $this->assertSame('210304', $existing->id_kec);
        $this->assertSame('21030405', $existing->id_kel);
        $this->assertSame('0800987654', $existing->no_telpon);

        $raw = $this->database->table('kacab')->where('id_kacab', $existing->id_kacab)->first();
        $this->assertSame('21', $raw->id_prov);
        $this->assertSame('2103', $raw->id_kab);
        $this->assertSame('210304', $raw->id_kec);
        $this->assertSame('21030405', $raw->id_kel);
        $this->assertSame('0800987654', $raw->no_telpon);
    }

    public function test_update_accepts_legacy_no_telpon_field(): void
    {
        $existing = Kacab::create([
            'nama_kacab' => 'Cabang Lama',
            'no_telpon' => '0899001122',
            'alamat' => 'Alamat Lama',
        ]);

        $controller = new KacabController();

        $request = Request::create('/api/kacab/' . $existing->id_kacab, 'PUT', [
            'nama_kacab' => 'Cabang Lama',
            'no_telpon' => '0811333444',
        ]);

        $response = $controller->update($request, $existing);

        $this->assertInstanceOf(JsonResponse::class, $response);
        $this->assertSame(200, $response->getStatusCode());

        $payload = $response->getData(true);
        $this->assertTrue($payload['status']);
        $this->assertSame('0811333444', $payload['data']['no_telp']);

        $existing->refresh();
        $this->assertSame('0811333444', $existing->no_telp);
        $this->assertSame('0811333444', $existing->no_telpon);

        $raw = $this->database->table('kacab')->where('id_kacab', $existing->id_kacab)->first();
        $this->assertSame('0811333444', $raw->no_telp);
        $this->assertSame('0811333444', $raw->no_telpon);
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

        $schema->create('kacab', function (Blueprint $table) {
            $table->increments('id_kacab');
            $table->string('nama_kacab')->nullable();
            $table->string('no_telp')->nullable();
            $table->string('no_telpon')->nullable();
            $table->string('alamat')->nullable();
            $table->string('email')->nullable();
            $table->string('status')->nullable();
            $table->string('id_prov', 10)->nullable();
            $table->string('id_kab', 10)->nullable();
            $table->string('id_kec', 10)->nullable();
            $table->string('id_kel', 10)->nullable();
            $table->timestamps();
        });

        $schema->create('provinsi', function (Blueprint $table) {
            $table->string('id_prov', 10)->primary();
            $table->string('nama')->nullable();
            $table->timestamps();
        });

        $schema->create('kabupaten', function (Blueprint $table) {
            $table->string('id_kab', 10)->primary();
            $table->string('id_prov', 10)->nullable();
            $table->string('nama')->nullable();
            $table->timestamps();
        });

        $schema->create('kecamatan', function (Blueprint $table) {
            $table->string('id_kec', 10)->primary();
            $table->string('id_kab', 10)->nullable();
            $table->string('nama')->nullable();
            $table->timestamps();
        });

        $schema->create('kelurahan', function (Blueprint $table) {
            $table->string('id_kel', 10)->primary();
            $table->string('id_kec', 10)->nullable();
            $table->string('nama')->nullable();
            $table->timestamps();
        });
    }
}

