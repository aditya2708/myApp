<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Aktivitas;
use Carbon\Carbon;
use App\Services\AttendanceService;

class MarkAbsentAfterActivity extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'attendance:mark-absent {--activity-id= : Specific activity ID to process}';

    /**
     * The console command description.
     */
    protected $description = 'Automatically mark students as absent for completed activities';

    protected AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService)
    {
        parent::__construct();
        $this->attendanceService = $attendanceService;
    }

    public function handle()
    {
        $this->info('Starting auto-mark absent process...');

        try {
            $activitiesQuery = Aktivitas::whereNotNull('end_time')
                ->where('tanggal', '<=', Carbon::now()->toDateString());

            // If specific activity ID provided, filter by it
            if ($this->option('activity-id')) {
                $activitiesQuery->where('id_aktivitas', $this->option('activity-id'));
            } else {
                // Only process activities that ended in the last 24 hours to avoid reprocessing
                $activitiesQuery->where('tanggal', '>=', Carbon::now()->subDay()->toDateString());
            }

            $completedActivities = $activitiesQuery->get();

            $this->info("Found {$completedActivities->count()} completed activities to process.");

            $totalMarked = 0;
            $totalAlreadyMarked = 0;

            foreach ($completedActivities as $activity) {
                $summary = $this->attendanceService->generateAbsencesForCompletedActivity($activity);

                if (!$summary['success']) {
                    $this->warn("Activity '{$activity->nama_aktivitas}' ({$activity->id_aktivitas}) skipped: " . ($summary['message'] ?? 'Unable to process.'));
                    continue;
                }

                $totalMarked += $summary['created_count'];
                $totalAlreadyMarked += $summary['already_marked'];

                $this->info(sprintf(
                    "Activity '%s' (%s): %d absent created, %d already marked from %d members.",
                    $activity->nama_aktivitas,
                    $activity->id_aktivitas,
                    $summary['created_count'],
                    $summary['already_marked'],
                    $summary['total_members']
                ));
            }

            $this->info("Process completed. Total new absences: {$totalMarked}. Already marked: {$totalAlreadyMarked}.");

        } catch (\Exception $e) {
            $this->error("Error processing activities: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}