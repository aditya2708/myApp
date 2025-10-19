<?php

namespace Tests\Feature\AdminShelter\Attendance;

use App\Models\Absen;
use App\Models\AbsenUser;
use App\Models\AdminShelter;
use App\Models\Aktivitas;
use App\Models\Shelter;
use App\Models\Tutor;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TutorAttendanceSummaryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');

        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('tutor');
        Schema::dropIfExists('admin_shelter');
        Schema::dropIfExists('shelter');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id('id_users');
            $table->string('username');
            $table->string('email')->nullable();
            $table->string('password');
            $table->string('level');
            $table->timestamps();
        });

        Schema::create('shelter', function (Blueprint $table) {
            $table->id('id_shelter');
            $table->string('nama_shelter')->nullable();
            $table->boolean('require_gps')->default(false);
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('max_distance_meters')->nullable();
            $table->integer('gps_accuracy_required')->nullable();
            $table->string('location_name')->nullable();
            $table->timestamps();
        });

        Schema::create('admin_shelter', function (Blueprint $table) {
            $table->id('id_admin_shelter');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('id_shelter');
            $table->string('nama_lengkap')->nullable();
            $table->timestamps();
        });

        Schema::create('tutor', function (Blueprint $table) {
            $table->id('id_tutor');
            $table->unsignedBigInteger('id_shelter')->nullable();
            $table->string('nama');
            $table->string('maple')->nullable();
            $table->string('email')->nullable();
            $table->string('no_hp')->nullable();
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_shelter')->nullable();
            $table->unsignedBigInteger('id_tutor')->nullable();
            $table->string('jenis_kegiatan')->nullable();
            $table->date('tanggal');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->timestamps();
        });

        Schema::create('absen_user', function (Blueprint $table) {
            $table->id('id_absen_user');
            $table->unsignedBigInteger('id_anak')->nullable();
            $table->unsignedBigInteger('id_tutor')->nullable();
            $table->timestamps();
        });

        Schema::create('absen', function (Blueprint $table) {
            $table->id('id_absen');
            $table->string('absen');
            $table->unsignedBigInteger('id_absen_user');
            $table->unsignedBigInteger('id_aktivitas');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('tutor');
        Schema::dropIfExists('admin_shelter');
        Schema::dropIfExists('shelter');
        Schema::dropIfExists('users');

        Carbon::setTestNow();

        parent::tearDown();
    }

    protected function actingAsAdminShelter(?Shelter $shelter = null): array
    {
        $user = User::create([
            'username' => 'admin-shelter',
            'email' => 'admin-shelter@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_shelter',
        ]);

        $shelter = $shelter ?? Shelter::create([
            'nama_shelter' => 'Shelter A',
            'require_gps' => false,
        ]);

        $adminShelter = AdminShelter::create([
            'user_id' => $user->id_users,
            'id_shelter' => $shelter->id_shelter,
            'nama_lengkap' => 'Shelter Admin',
        ]);

        Sanctum::actingAs($user, ['*']);

        return [$user, $shelter, $adminShelter];
    }

    public function test_it_returns_tutor_summary_with_category_distribution(): void
    {
        [$user, $shelter] = $this->actingAsAdminShelter();

        $otherShelter = Shelter::create([
            'nama_shelter' => 'Shelter B',
            'require_gps' => false,
        ]);

        $highTutor = Tutor::create([
            'nama' => 'Tutor High',
            'id_shelter' => $shelter->id_shelter,
        ]);

        $mediumTutor = Tutor::create([
            'nama' => 'Tutor Medium',
            'id_shelter' => $shelter->id_shelter,
        ]);

        $lowTutor = Tutor::create([
            'nama' => 'Tutor Low',
            'id_shelter' => $shelter->id_shelter,
        ]);

        $noDataTutor = Tutor::create([
            'nama' => 'Tutor No Data',
            'id_shelter' => $shelter->id_shelter,
        ]);

        $externalTutor = Tutor::create([
            'nama' => 'Tutor External',
            'id_shelter' => $otherShelter->id_shelter,
        ]);

        $highUser = AbsenUser::create(['id_tutor' => $highTutor->id_tutor]);
        $mediumUser = AbsenUser::create(['id_tutor' => $mediumTutor->id_tutor]);
        $lowUser = AbsenUser::create(['id_tutor' => $lowTutor->id_tutor]);
        $externalUser = AbsenUser::create(['id_tutor' => $externalTutor->id_tutor]);

        $baseDate = Carbon::parse('2024-01-01');

        $createActivity = function (Tutor $tutor, AbsenUser $absenUser, array $statuses) use ($shelter, $baseDate) {
            foreach ($statuses as $index => $status) {
                $aktivitas = Aktivitas::create([
                    'id_shelter' => $shelter->id_shelter,
                    'id_tutor' => $tutor->id_tutor,
                    'jenis_kegiatan' => 'Bimbel',
                    'tanggal' => $baseDate->copy()->addDays($index)->toDateString(),
                ]);

                Absen::create([
                    'absen' => $status,
                    'id_absen_user' => $absenUser->id_absen_user,
                    'id_aktivitas' => $aktivitas->id_aktivitas,
                ]);
            }
        };

        $createActivity($highTutor, $highUser, [
            Absen::TEXT_YA,
            Absen::TEXT_YA,
            Absen::TEXT_YA,
            Absen::TEXT_YA,
            Absen::TEXT_TERLAMBAT,
        ]);

        $createActivity($mediumTutor, $mediumUser, [
            Absen::TEXT_YA,
            Absen::TEXT_YA,
            Absen::TEXT_TIDAK,
            Absen::TEXT_YA,
            Absen::TEXT_TIDAK,
        ]);

        $createActivity($lowTutor, $lowUser, [
            Absen::TEXT_YA,
            Absen::TEXT_TIDAK,
            Absen::TEXT_TIDAK,
            Absen::TEXT_TIDAK,
            Absen::TEXT_TIDAK,
        ]);

        $createActivity($externalTutor, $externalUser, [
            Absen::TEXT_YA,
            Absen::TEXT_YA,
            Absen::TEXT_YA,
        ]);

        $response = $this->getJson('/api/admin-shelter/attendance/tutor/summary');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('summary.total_tutors', 4);

        $response->assertJsonPath('summary.distribution.high.count', 1);
        $response->assertJsonPath('summary.distribution.medium.count', 1);
        $response->assertJsonPath('summary.distribution.low.count', 1);
        $response->assertJsonPath('summary.distribution.no_data.count', 1);
        $response->assertJsonPath('summary.average_attendance_rate', 60.0);

        $data = collect($response->json('data'));

        $this->assertCount(4, $data);

        $high = $data->firstWhere('id_tutor', $highTutor->id_tutor);
        $this->assertSame('high', $high['category']);
        $this->assertSame(5, $high['total_activities']);
        $this->assertSame(5, $high['attended_count']);
        $this->assertSame(100.0, $high['attendance_rate']);

        $medium = $data->firstWhere('id_tutor', $mediumTutor->id_tutor);
        $this->assertSame('medium', $medium['category']);
        $this->assertSame(5, $medium['total_activities']);
        $this->assertSame(3, $medium['attended_count']);
        $this->assertSame(60.0, $medium['attendance_rate']);

        $low = $data->firstWhere('id_tutor', $lowTutor->id_tutor);
        $this->assertSame('low', $low['category']);
        $this->assertSame(5, $low['total_activities']);
        $this->assertSame(1, $low['attended_count']);
        $this->assertSame(20.0, $low['attendance_rate']);

        $noData = $data->firstWhere('id_tutor', $noDataTutor->id_tutor);
        $this->assertSame('no_data', $noData['category']);
        $this->assertNull($noData['attendance_rate']);
    }
}
