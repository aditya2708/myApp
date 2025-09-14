<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Aktivitas;
use App\Models\Kelompok;
use App\Models\Absen;
use Carbon\Carbon;

class AutoMarkAbsent extends Command
{
    protected $signature = 'attendance:auto-mark-absent {--date= : Specific date to process (Y-m-d format)}';
    
    protected $description = 'Otomatis mark absent untuk anak yang tidak hadir pada aktivitas yang sudah berakhir';

    public function handle()
    {
        $targetDate = $this->option('date') 
            ? Carbon::parse($this->option('date'))->format('Y-m-d')
            : Carbon::yesterday()->format('Y-m-d');
        
        $this->info("Memproses aktivitas tanggal: {$targetDate}");

        // Ambil semua aktivitas target date yang sudah berakhir
        $activities = Aktivitas::whereDate('tanggal', $targetDate)
            ->whereNotNull('nama_kelompok')
            ->get()
            ->filter(function($activity) {
                return $activity->isCompleted();
            });

        $totalProcessed = 0;
        $totalMarkedAbsent = 0;

        foreach ($activities as $activity) {
            $this->info("Memproses aktivitas: {$activity->jenis_kegiatan} - {$activity->materi} (ID: {$activity->id_aktivitas})");
            
            // Ambil kelompok berdasarkan nama_kelompok
            $kelompok = $activity->kelompok();
            if ($kelompok) {
                $kelompok->load('anak');
            }
            
            if (!$kelompok || !$kelompok->anak) {
                $this->warn("Kelompok tidak ditemukan atau tidak ada anggota untuk aktivitas ID: {$activity->id_aktivitas}");
                continue;
            }

            foreach ($kelompok->anak as $anak) {
                // Cek apakah anak sudah ada record absen untuk aktivitas ini
                $existingAttendance = Absen::whereHas('absenUser', function($query) use ($anak) {
                        $query->where('id_anak', $anak->id_anak);
                    })
                    ->where('id_aktivitas', $activity->id_aktivitas)
                    ->first();

                if (!$existingAttendance) {
                    // Buat AbsenUser terlebih dahulu
                    $absenUser = \App\Models\AbsenUser::firstOrCreate([
                        'id_anak' => $anak->id_anak
                    ]);

                    // Buat record absen "Tidak"
                    Absen::create([
                        'id_absen_user' => $absenUser->id_absen_user,
                        'id_aktivitas' => $activity->id_aktivitas,
                        'absen' => 'Tidak',
                        'time_arrived' => now(),
                        'latitude' => null,
                        'longitude' => null,
                        'verification_status' => 'verified',
                        'is_verified' => true,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    $totalMarkedAbsent++;
                    $this->info("  ✓ Mark absent: {$anak->name}");
                }
            }

            $totalProcessed++;
        }

        $this->info("Selesai! Diproses {$totalProcessed} aktivitas, {$totalMarkedAbsent} anak di-mark absent.");
        
        return 0;
    }
}