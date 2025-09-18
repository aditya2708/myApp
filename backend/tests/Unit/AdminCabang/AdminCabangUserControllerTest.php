<?php

namespace Tests\Unit\AdminCabang;

use App\Http\Controllers\API\AdminCabang\AdminCabangUserController;
use Mockery;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AdminCabangUserControllerTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    /** @runInSeparateProcess */
    public function test_admin_cabang_cannot_view_user_outside_allowed_levels(): void
    {
        $controller = new AdminCabangUserController();

        $user = (object) ['level' => 'admin_pusat'];

        $builderMock = Mockery::mock();
        $builderMock->shouldReceive('findOrFail')->once()->with(42)->andReturn($user);

        Mockery::mock('alias:App\\Models\\User')
            ->shouldReceive('with')
            ->once()
            ->with(['adminCabang', 'adminShelter'])
            ->andReturn($builderMock);

        try {
            $controller->show(42);
            $this->fail('Expected HttpException to be thrown.');
        } catch (HttpException $exception) {
            $this->assertSame(404, $exception->getStatusCode());
        }
    }
}
