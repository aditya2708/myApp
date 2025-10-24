<?php

namespace Tests\Feature;

use App\Http\Controllers\API\AdminCabang\Reports\AdminCabangTutorReportController;
use App\Models\AdminCabang;
use App\Models\User;
use App\Services\AdminCabang\Reports\TutorAttendanceReportService;
use Illuminate\Http\Request;
use Mockery;
use Tests\TestCase;

class AdminCabangTutorReportControllerTest extends TestCase
{
    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    private function makeAuthenticatedAdminCabangUser(): User
    {
        $user = new User([
            'username' => 'admin',
            'email' => 'admin@example.com',
            'level' => 'admin_cabang',
            'status' => 'active',
        ]);

        $user->setAttribute('id_users', 101);

        $adminCabang = new AdminCabang([
            'user_id' => 101,
            'id_kacab' => 201,
            'nama_lengkap' => 'Admin Cabang',
        ]);

        $adminCabang->setAttribute('id_admin_cabang', 301);

        $user->setRelation('adminCabang', $adminCabang);

        return $user;
    }

    public function test_index_uses_service_default_pagination_when_query_is_empty(): void
    {
        $user = $this->makeAuthenticatedAdminCabangUser();

        $service = Mockery::mock(TutorAttendanceReportService::class);

        $service->shouldReceive('build')
            ->once()
            ->with($user->adminCabang, [], 1, 15)
            ->andReturn([
                'tutors' => [
                    'data' => [
                        ['marker' => 'default'],
                    ],
                    'pagination' => [
                        'current_page' => 1,
                        'per_page' => 15,
                        'total' => 100,
                        'last_page' => 7,
                        'next_page' => 2,
                        'prev_page' => null,
                    ],
                ],
                'metadata' => [
                    'from_service' => true,
                ],
            ]);

        $request = Request::create('/api/admin-cabang/laporan/tutors', 'GET');
        $request->setUserResolver(fn () => $user);

        $controller = new AdminCabangTutorReportController();

        $response = $controller->index($request, $service);

        $this->assertSame(200, $response->status());

        $payload = $response->getData(true);

        $this->assertTrue($payload['success']);
        $this->assertSame('default', $payload['data'][0]['marker']);
        $this->assertSame(1, $payload['metadata']['pagination']['current_page']);
        $this->assertSame(15, $payload['metadata']['pagination']['per_page']);
        $this->assertSame([], $payload['metadata']['filters']);
    }

    public function test_index_applies_custom_page_and_per_page_query_parameters(): void
    {
        $user = $this->makeAuthenticatedAdminCabangUser();

        $service = Mockery::mock(TutorAttendanceReportService::class);

        $service->shouldReceive('build')
            ->once()
            ->withArgs(function ($adminCabang, $filters, $page, $perPage) use ($user) {
                $this->assertSame($user->adminCabang, $adminCabang);
                $this->assertSame(['jenis_kegiatan' => 'kelas'], $filters);
                $this->assertSame(2, $page);
                $this->assertSame(50, $perPage);

                return true;
            })
            ->andReturnUsing(function ($adminCabang, $filters, $page, $perPage) {
                return [
                    'tutors' => [
                        'data' => [
                            [
                                'marker' => "page-{$page}-per-{$perPage}",
                            ],
                        ],
                        'pagination' => [
                            'current_page' => $page,
                            'per_page' => $perPage,
                            'total' => 123,
                            'last_page' => 5,
                            'next_page' => $page + 1,
                            'prev_page' => $page - 1,
                        ],
                    ],
                    'metadata' => [
                        'from_service' => true,
                    ],
                ];
            });

        $request = Request::create('/api/admin-cabang/laporan/tutors', 'GET', [
            'page' => 2,
            'per_page' => 50,
            'jenis_kegiatan' => 'kelas',
        ]);
        $request->setUserResolver(fn () => $user);

        $controller = new AdminCabangTutorReportController();

        $response = $controller->index($request, $service);

        $this->assertSame(200, $response->status());

        $payload = $response->getData(true);

        $this->assertTrue($payload['success']);
        $this->assertSame('page-2-per-50', $payload['data'][0]['marker']);
        $this->assertSame(2, $payload['metadata']['pagination']['current_page']);
        $this->assertSame(50, $payload['metadata']['pagination']['per_page']);
        $this->assertSame(['jenis_kegiatan' => 'kelas'], $payload['metadata']['filters']);
    }
}
