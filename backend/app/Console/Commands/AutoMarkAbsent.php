<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Aktivitas;
use App\Services\AttendanceService;
use Carbon\Carbon;

class AutoMarkAbsent extends Command
{
    protected $signature = 'attendance:auto-mark-absent {--date= : Specific date to process (Y-m-d format)}';
    
    protected $description = 'Otomatis mark absent untuk anak yang tidak hadir pada aktivitas yang sudah berakhir';

    protected AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        parent::__construct();
        $this->attendanceService = $attendanceService;
    }

    public function handle()
    {
        $targetDate = $this->option('date') 
            ? Carbon::parse($this->option('date'))->format('Y-m-d')
            : Carbon::yesterday()->format('Y-m-d');
        
        $this->info("Memproses aktivitas tanggal: {$targetDate}");

        // Ambil semua aktivitas target date yang sudah berakhir
        $activities = Aktivitas::whereDate('tanggal', $targetDate)
            ->whereNotNull('nama_kelompok')
            ->get();

        $totalProcessed = 0;
        $totalMarkedAbsent = 0;

        foreach ($activities as $activity) {
            $this->info("Memproses aktivitas: {$activity->jenis_kegiatan} - {$activity->materi} (ID: {$activity->id_aktivitas})");

            $summary = $this->attendanceService->generateAbsencesForCompletedActivity($activity);

            if (!$summary['success']) {
                $this->warn($summary['message'] ?? 'Aktivitas tidak dapat diproses.');
                continue;
            }

            $totalProcessed++;
            $totalMarkedAbsent += $summary['created_count'];

            $this->info(sprintf(
                '  ✓ %d anggota diproses, %d sudah memiliki absen, %d ditandai absen.',
                $summary['total_members'],
                $summary['already_marked'],
                $summary['created_count']
            ));
        }

        $this->info("Selesai! Diproses {$totalProcessed} aktivitas, {$totalMarkedAbsent} anak di-mark absent.");

        return 0;
    }
}