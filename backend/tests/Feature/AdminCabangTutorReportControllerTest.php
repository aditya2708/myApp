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
            ->with($user->adminCabang, [])
            ->andReturn([
                'tutors' => [
                    [
                        'id' => 1,
                        'nama' => 'Tutor High',
                        'attendance' => [
                            'totals' => [
                                'activities' => 5,
                                'records' => 5,
                                'attended' => 5,
                            ],
                            'breakdown' => [
                                'present' => 4,
                                'late' => 1,
                                'absent' => 0,
                            ],
                            'verified' => [
                                'total' => 5,
                                'present' => 4,
                                'late' => 1,
                                'absent' => 0,
                                'attended' => 5,
                            ],
                            'rate' => 100.0,
                        ],
                        'category' => [
                            'key' => 'high',
                        ],
                    ],
                    [
                        'id' => 2,
                        'nama' => 'Tutor Medium',
                        'attendance' => [
                            'totals' => [
                                'activities' => 5,
                                'records' => 5,
                                'attended' => 3,
                            ],
                            'breakdown' => [
                                'present' => 2,
                                'late' => 1,
                                'absent' => 2,
                            ],
                            'verified' => [
                                'total' => 5,
                                'present' => 2,
                                'late' => 1,
                                'absent' => 2,
                                'attended' => 3,
                            ],
                            'rate' => 60.0,
                        ],
                        'category' => [
                            'key' => 'medium',
                        ],
                    ],
                    [
                        'id' => 3,
                        'nama' => 'Tutor Low',
                        'attendance' => [
                            'totals' => [
                                'activities' => 4,
                                'records' => 4,
                                'attended' => 1,
                            ],
                            'breakdown' => [
                                'present' => 1,
                                'late' => 0,
                                'absent' => 3,
                            ],
                            'verified' => [
                                'total' => 4,
                                'present' => 1,
                                'late' => 0,
                                'absent' => 3,
                                'attended' => 1,
                            ],
                            'rate' => 25.0,
                        ],
                        'category' => [
                            'key' => 'low',
                        ],
                    ],
                    [
                        'id' => 4,
                        'nama' => 'Tutor No Data',
                        'attendance' => [
                            'totals' => [
                                'activities' => 0,
                                'records' => 0,
                                'attended' => 0,
                            ],
                            'breakdown' => [
                                'present' => 0,
                                'late' => 0,
                                'absent' => 0,
                            ],
                            'verified' => [
                                'total' => 0,
                                'present' => 0,
                                'late' => 0,
                                'absent' => 0,
                                'attended' => 0,
                            ],
                            'rate' => null,
                        ],
                        'category' => [
                            'key' => 'no_data',
                        ],
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
        $this->assertSame('Laporan tutor berhasil diambil.', $payload['message']);

        $tutors = $payload['data'];
        $this->assertCount(4, $tutors);

        $high = collect($tutors)->firstWhere('id', 1);
        $this->assertSame('Tutor High', $high['nama']);
        $this->assertSame(100.0, $high['attendance']['rate']);
        $this->assertSame([
            'key' => 'high',
            'label' => 'Baik',
        ], $high['category']);

        $medium = collect($tutors)->firstWhere('id', 2);
        $this->assertSame('Tutor Medium', $medium['nama']);
        $this->assertSame(60.0, $medium['attendance']['rate']);
        $this->assertSame([
            'key' => 'medium',
            'label' => 'Sedang',
        ], $medium['category']);

        $low = collect($tutors)->firstWhere('id', 3);
        $this->assertSame('Tutor Low', $low['nama']);
        $this->assertSame(25.0, $low['attendance']['rate']);
        $this->assertSame([
            'key' => 'low',
            'label' => 'Rendah',
        ], $low['category']);

        $noData = collect($tutors)->firstWhere('id', 4);
        $this->assertSame('Tutor No Data', $noData['nama']);
        $this->assertNull($noData['attendance']['rate']);
        $this->assertSame([
            'key' => 'no_data',
            'label' => 'Tidak Ada Data',
        ], $noData['category']);

        $summary = $payload['summary'];
        $this->assertSame(4, $summary['total_tutors']);
        $this->assertSame(61.67, $summary['average_attendance_rate']);

        $expectedDistribution = [
            'high' => [
                'count' => 1,
                'percentage' => 25.0,
                'label' => 'Baik',
            ],
            'medium' => [
                'count' => 1,
                'percentage' => 25.0,
                'label' => 'Sedang',
            ],
            'low' => [
                'count' => 1,
                'percentage' => 25.0,
                'label' => 'Rendah',
            ],
            'no_data' => [
                'count' => 1,
                'percentage' => 25.0,
                'label' => 'Tidak Ada Data',
            ],
        ];

        $this->assertSame($expectedDistribution, $summary['distribution']);

        $this->assertSame([], $payload['meta']['filters']);
        $this->assertNull($payload['meta']['branch']);
        $this->assertArrayHasKey('collections', $payload['meta']);
        $this->assertSame(['from_service' => true], $payload['meta']['metadata']);
    }

    public function test_index_applies_custom_page_and_per_page_query_parameters(): void
    {
        $user = $this->makeAuthenticatedAdminCabangUser();

        $service = Mockery::mock(TutorAttendanceReportService::class);

        $service->shouldReceive('build')
            ->once()
            ->withArgs(function ($adminCabang, $filters) use ($user) {
                $this->assertSame($user->adminCabang, $adminCabang);
                $this->assertSame(['jenis_kegiatan' => 'kelas'], $filters);

                return true;
            })
            ->andReturn([
                'tutors' => [
                    [
                        'id' => 10,
                        'nama' => 'Filtered Tutor',
                        'present_count' => 3,
                        'late_count' => 1,
                        'absent_count' => 0,
                        'total_activities' => 4,
                        'verified_attendance_count' => 4,
                    ],
                ],
                'metadata' => [
                    'from_service' => true,
                ],
            ]);

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
        $this->assertSame('Laporan tutor berhasil diambil.', $payload['message']);

        $tutor = $payload['data'][0];
        $this->assertSame(10, $tutor['id']);
        $this->assertSame('Filtered Tutor', $tutor['nama']);

        $this->assertSame([
            'activities' => 4,
            'records' => 4,
            'attended' => 4,
        ], $tutor['attendance']['totals']);
        $this->assertSame([
            'present' => 3,
            'late' => 1,
            'absent' => 0,
        ], $tutor['attendance']['breakdown']);
        $this->assertSame([
            'total' => 4,
            'present' => 3,
            'late' => 1,
            'absent' => 0,
            'attended' => 4,
        ], $tutor['attendance']['verified']);
        $this->assertSame(100.0, $tutor['attendance']['rate']);

        $this->assertSame([
            'key' => 'high',
            'label' => 'Baik',
        ], $tutor['category']);

        $summary = $payload['summary'];
        $this->assertSame(1, $summary['total_tutors']);
        $this->assertSame(100.0, $summary['average_attendance_rate']);

        $this->assertSame([
            'high' => [
                'count' => 1,
                'percentage' => 100.0,
                'label' => 'Baik',
            ],
            'medium' => [
                'count' => 0,
                'percentage' => 0.0,
                'label' => 'Sedang',
            ],
            'low' => [
                'count' => 0,
                'percentage' => 0.0,
                'label' => 'Rendah',
            ],
            'no_data' => [
                'count' => 0,
                'percentage' => 0.0,
                'label' => 'Tidak Ada Data',
            ],
        ], $summary['distribution']);

        $this->assertSame(['jenis_kegiatan' => 'kelas'], $payload['meta']['filters']);
        $this->assertNull($payload['meta']['branch']);
        $this->assertArrayHasKey('collections', $payload['meta']);
        $this->assertSame(['from_service' => true], $payload['meta']['metadata']);
    }

    public function test_index_filters_tutors_by_shelter_id(): void
    {
        $user = $this->makeAuthenticatedAdminCabangUser();

        $service = Mockery::mock(TutorAttendanceReportService::class);

        $shelterId = 999;

        $service->shouldReceive('build')
            ->once()
            ->with($user->adminCabang, ['shelter_id' => $shelterId])
            ->andReturn([
                'tutors' => [
                    [
                        'id' => 21,
                        'nama' => 'Tutor Shelter 999-A',
                        'attendance' => [
                            'totals' => [
                                'activities' => 2,
                                'records' => 2,
                                'attended' => 2,
                            ],
                            'breakdown' => [
                                'present' => 2,
                                'late' => 0,
                                'absent' => 0,
                            ],
                            'verified' => [
                                'total' => 2,
                                'present' => 2,
                                'late' => 0,
                                'absent' => 0,
                                'attended' => 2,
                            ],
                            'rate' => 100.0,
                        ],
                        'shelter' => [
                            'id' => $shelterId,
                            'name' => 'Shelter 999',
                        ],
                    ],
                    [
                        'id' => 22,
                        'nama' => 'Tutor Shelter 999-B',
                        'attendance' => [
                            'totals' => [
                                'activities' => 3,
                                'records' => 3,
                                'attended' => 3,
                            ],
                            'breakdown' => [
                                'present' => 2,
                                'late' => 1,
                                'absent' => 0,
                            ],
                            'verified' => [
                                'total' => 3,
                                'present' => 2,
                                'late' => 1,
                                'absent' => 0,
                                'attended' => 3,
                            ],
                            'rate' => 100.0,
                        ],
                        'shelter' => [
                            'id' => $shelterId,
                            'name' => 'Shelter 999',
                        ],
                    ],
                ],
            ]);

        $request = Request::create('/api/admin-cabang/laporan/tutors', 'GET', [
            'shelter_id' => (string) $shelterId,
        ]);
        $request->setUserResolver(fn () => $user);

        $controller = new AdminCabangTutorReportController();

        $response = $controller->index($request, $service);

        $this->assertSame(200, $response->status());

        $payload = $response->getData(true);

        $this->assertTrue($payload['success']);
        $this->assertSame('Laporan tutor berhasil diambil.', $payload['message']);

        $tutors = collect($payload['data']);

        $this->assertSame(2, $tutors->count());
        $this->assertTrue($tutors->every(fn ($tutor) => $tutor['shelter']['id'] === $shelterId));
        $this->assertSame([$shelterId], $tutors->pluck('shelter.id')->unique()->values()->all());

        $this->assertSame(['shelter_id' => $shelterId], $payload['meta']['filters']);
        $this->assertNull($payload['meta']['branch']);
        $this->assertArrayHasKey('collections', $payload['meta']);
        $this->assertSame([], $payload['meta']['metadata']);
    }
}
