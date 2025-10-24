<?php

namespace Tests\Feature\AdminCabang\Reports;

use App\Models\Absen;
use App\Models\AbsenUser;
use App\Models\AdminCabang;
use App\Models\Aktivitas;
use App\Models\Kacab;
use App\Models\Shelter;
use App\Models\Tutor;
use App\Models\User;
use App\Models\Wilbin;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCabangTutorAttendanceReportTest extends TestCase
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
        Schema::dropIfExists('shelter');
        Schema::dropIfExists('wilbin');
        Schema::dropIfExists('admin_cabang');
        Schema::dropIfExists('kacab');
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id('id_users');
            $table->string('username');
            $table->string('email')->nullable();
            $table->string('password');
            $table->string('level');
            $table->timestamps();
        });

        Schema::create('kacab', function (Blueprint $table) {
            $table->id('id_kacab');
            $table->string('nama_kacab');
            $table->string('email')->nullable();
            $table->timestamps();
        });

        Schema::create('admin_cabang', function (Blueprint $table) {
            $table->id('id_admin_cabang');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('id_kacab');
            $table->string('nama_lengkap')->nullable();
            $table->timestamps();
        });

        Schema::create('wilbin', function (Blueprint $table) {
            $table->id('id_wilbin');
            $table->unsignedBigInteger('id_kacab');
            $table->string('nama_wilbin');
            $table->timestamps();
        });

        Schema::create('shelter', function (Blueprint $table) {
            $table->id('id_shelter');
            $table->unsignedBigInteger('id_wilbin');
            $table->string('nama_shelter');
            $table->timestamps();
        });

        Schema::create('tutor', function (Blueprint $table) {
            $table->id('id_tutor');
            $table->unsignedBigInteger('id_kacab')->nullable();
            $table->unsignedBigInteger('id_wilbin')->nullable();
            $table->unsignedBigInteger('id_shelter')->nullable();
            $table->string('nama');
            $table->string('maple')->nullable();
            $table->string('email')->nullable();
            $table->string('no_hp')->nullable();
            $table->timestamps();
        });

        Schema::create('aktivitas', function (Blueprint $table) {
            $table->id('id_aktivitas');
            $table->unsignedBigInteger('id_shelter');
            $table->unsignedBigInteger('id_tutor')->nullable();
            $table->string('jenis_kegiatan')->nullable();
            $table->date('tanggal');
            $table->timestamps();
        });

        Schema::create('absen_user', function (Blueprint $table) {
            $table->id('id_absen_user');
            $table->unsignedBigInteger('id_tutor')->nullable();
            $table->timestamps();
        });

        Schema::create('absen', function (Blueprint $table) {
            $table->id('id_absen');
            $table->string('absen');
            $table->unsignedBigInteger('id_absen_user');
            $table->unsignedBigInteger('id_aktivitas');
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('absen');
        Schema::dropIfExists('absen_user');
        Schema::dropIfExists('aktivitas');
        Schema::dropIfExists('tutor');
        Schema::dropIfExists('shelter');
        Schema::dropIfExists('wilbin');
        Schema::dropIfExists('admin_cabang');
        Schema::dropIfExists('kacab');
        Schema::dropIfExists('users');

        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_it_returns_tutor_summary_for_branch(): void
    {
        Carbon::setTestNow(Carbon::parse('2024-01-10'));

        $user = User::create([
            'username' => 'admin-cabang',
            'email' => 'cabang@example.com',
            'password' => bcrypt('secret'),
            'level' => 'admin_cabang',
        ]);

        $kacab = Kacab::create([
            'nama_kacab' => 'Cabang A',
            'email' => 'kacab@example.com',
        ]);

        AdminCabang::create([
            'user_id' => $user->id_users,
            'id_kacab' => $kacab->id_kacab,
            'nama_lengkap' => 'Admin Cabang',
        ]);

        $wilbinA = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin A',
        ]);

        $wilbinB = Wilbin::create([
            'id_kacab' => $kacab->id_kacab,
            'nama_wilbin' => 'Wilbin B',
        ]);

        $shelterA = Shelter::create([
            'id_wilbin' => $wilbinA->id_wilbin,
            'nama_shelter' => 'Shelter A',
        ]);

        $shelterB = Shelter::create([
            'id_wilbin' => $wilbinB->id_wilbin,
            'nama_shelter' => 'Shelter B',
        ]);

        $otherKacab = Kacab::create([
            'nama_kacab' => 'Cabang B',
            'email' => 'other@example.com',
        ]);

        $otherWilbin = Wilbin::create([
            'id_kacab' => $otherKacab->id_kacab,
            'nama_wilbin' => 'Wilbin C',
        ]);

        $otherShelter = Shelter::create([
            'id_wilbin' => $otherWilbin->id_wilbin,
            'nama_shelter' => 'Shelter C',
        ]);

        $highTutor = Tutor::create([
            'nama' => 'Tutor High',
            'id_kacab' => $kacab->id_kacab,
            'id_wilbin' => $wilbinA->id_wilbin,
            'id_shelter' => $shelterA->id_shelter,
        ]);

        $mediumTutor = Tutor::create([
            'nama' => 'Tutor Medium',
            'id_kacab' => $kacab->id_kacab,
            'id_wilbin' => $wilbinA->id_wilbin,
            'id_shelter' => $shelterA->id_shelter,
        ]);

        $lowTutor = Tutor::create([
            'nama' => 'Tutor Low',
            'id_kacab' => $kacab->id_kacab,
            'id_wilbin' => $wilbinB->id_wilbin,
            'id_shelter' => $shelterB->id_shelter,
        ]);

        $noDataTutor = Tutor::create([
            'nama' => 'Tutor No Data',
            'id_kacab' => $kacab->id_kacab,
            'id_wilbin' => $wilbinB->id_wilbin,
            'id_shelter' => $shelterB->id_shelter,
        ]);

        $externalTutor = Tutor::create([
            'nama' => 'Tutor External',
            'id_kacab' => $otherKacab->id_kacab,
            'id_wilbin' => $otherWilbin->id_wilbin,
            'id_shelter' => $otherShelter->id_shelter,
        ]);

        $highUser = AbsenUser::create(['id_tutor' => $highTutor->id_tutor]);
        $mediumUser = AbsenUser::create(['id_tutor' => $mediumTutor->id_tutor]);
        $lowUser = AbsenUser::create(['id_tutor' => $lowTutor->id_tutor]);
        $externalUser = AbsenUser::create(['id_tutor' => $externalTutor->id_tutor]);

        $baseDate = Carbon::parse('2024-01-01');

        $createActivity = function (Shelter $shelter, Tutor $tutor, AbsenUser $absenUser, array $records) use ($baseDate) {
            foreach ($records as $index => $record) {
                $status = is_array($record) ? ($record['status'] ?? Absen::TEXT_YA) : $record;
                $isVerified = is_array($record) ? ($record['is_verified'] ?? true) : true;
                $jenis = is_array($record) ? ($record['jenis_kegiatan'] ?? 'Bimbel') : 'Bimbel';

                $aktivitas = Aktivitas::create([
                    'id_shelter' => $shelter->id_shelter,
                    'id_tutor' => $tutor->id_tutor,
                    'jenis_kegiatan' => $jenis,
                    'tanggal' => $baseDate->copy()->addDays($index)->toDateString(),
                ]);

                Absen::create([
                    'absen' => $status,
                    'id_absen_user' => $absenUser->id_absen_user,
                    'id_aktivitas' => $aktivitas->id_aktivitas,
                    'is_verified' => $isVerified,
                ]);
            }
        };

        $createActivity($shelterA, $highTutor, $highUser, [
            Absen::TEXT_YA,
            Absen::TEXT_YA,
            Absen::TEXT_TERLAMBAT,
            Absen::TEXT_YA,
            Absen::TEXT_YA,
        ]);

        $createActivity($shelterA, $mediumTutor, $mediumUser, [
            Absen::TEXT_YA,
            Absen::TEXT_TERLAMBAT,
            Absen::TEXT_YA,
            Absen::TEXT_TIDAK,
            Absen::TEXT_TIDAK,
        ]);

        $createActivity($shelterB, $lowTutor, $lowUser, [
            Absen::TEXT_YA,
            Absen::TEXT_TIDAK,
            Absen::TEXT_TIDAK,
            Absen::TEXT_TIDAK,
        ]);

        $createActivity($otherShelter, $externalTutor, $externalUser, [
            Absen::TEXT_YA,
            Absen::TEXT_YA,
        ]);

        Sanctum::actingAs($user, ['*']);

        $response = $this->getJson('/api/admin-cabang/laporan/tutors');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'summary' => [
                    'total_tutors' => 4,
                ],
            ]);

        $data = $response->json('data');
        $this->assertCount(4, $data);

        $names = collect($data)->pluck('nama');
        $this->assertContains('Tutor High', $names);
        $this->assertContains('Tutor Medium', $names);
        $this->assertContains('Tutor Low', $names);
        $this->assertContains('Tutor No Data', $names);
        $this->assertNotContains('Tutor External', $names);

        $summary = $response->json('summary');
        $this->assertSame(4, $summary['total_tutors']);
        $this->assertSame(61.67, $summary['average_attendance_rate']);

        $distribution = collect($summary['distribution']);
        $this->assertSame(1, $distribution['high']['count']);
        $this->assertSame(1, $distribution['medium']['count']);
        $this->assertSame(1, $distribution['low']['count']);
        $this->assertSame(1, $distribution['no_data']['count']);

        $highRecord = collect($data)->firstWhere('nama', 'Tutor High');
        $this->assertSame('high', $highRecord['category']);
        $this->assertSame(100.0, $highRecord['attendance_rate']);

        $mediumRecord = collect($data)->firstWhere('nama', 'Tutor Medium');
        $this->assertSame('medium', $mediumRecord['category']);
        $this->assertSame(60.0, $mediumRecord['attendance_rate']);

        $lowRecord = collect($data)->firstWhere('nama', 'Tutor Low');
        $this->assertSame('low', $lowRecord['category']);
        $this->assertSame(25.0, $lowRecord['attendance_rate']);

        $noDataRecord = collect($data)->firstWhere('nama', 'Tutor No Data');
        $this->assertSame('no_data', $noDataRecord['category']);
        $this->assertNull($noDataRecord['attendance_rate']);
    }
}
