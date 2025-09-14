<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Aktivitas;
use App\Models\AbsenUser;
use App\Models\Absen;
use App\Models\Kelompok;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

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

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting auto-mark absent process...');
        
        try {
            DB::beginTransaction();
            
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
            
            foreach ($completedActivities as $activity) {
                $marked = $this->processActivity($activity);
                $totalMarked += $marked;
                
                $this->info("Activity '{$activity->nama_aktivitas}' ({$activity->id_aktivitas}): {$marked} students marked absent");
            }
            
            DB::commit();
            
            $this->info("Process completed. Total students marked absent: {$totalMarked}");
            
        } catch (\Exception $e) {
            DB::rollback();
            $this->error("Error processing activities: " . $e->getMessage());
            return 1;
        }
        
        return 0;
    }
    
    /**
     * Process a single activity to mark absent students
     */
    private function processActivity(Aktivitas $activity)
    {
        $markedCount = 0;
        
        // Check if activity is actually completed
        if (!$this->isActivityCompleted($activity)) {
            $this->info("Activity {$activity->id_aktivitas} is not yet completed, skipping...");
            return 0;
        }
        
        // Get kelompok and its students for this activity
        $kelompok = Kelompok::with('anak')->find($activity->id_kelompok);
        
        if (!$kelompok) {
            $this->info("Kelompok not found for activity {$activity->id_aktivitas}");
            return 0;
        }
        
        $students = $kelompok->anak;
        
        if ($students->isEmpty()) {
            $this->info("No students found in kelompok for activity {$activity->id_aktivitas}");
            return 0;
        }
        
        foreach ($students as $student) {
            if (!$student) {
                continue;
            }
            
            // Check if student already has attendance record for this activity
            $existingRecord = $this->checkExistingAttendance($student->id_anak, $activity->id_aktivitas);
            
            if (!$existingRecord) {
                // Create attendance record with "Tidak" status
                $this->createAbsentRecord($student->id_anak, $activity->id_aktivitas, $activity);
                $markedCount++;
                
                $this->line("  - Marked {$student->full_name} as absent");
            }
        }
        
        return $markedCount;
    }
    
    /**
     * Check if activity is actually completed
     */
    private function isActivityCompleted(Aktivitas $activity)
    {
        $now = Carbon::now();
        $activityDate = Carbon::parse($activity->tanggal);
        
        // If activity is not today, it's definitely completed
        if ($activityDate->lt($now->startOfDay())) {
            return true;
        }
        
        // If activity is today, check if end_time has passed
        if ($activityDate->isSameDay($now) && $activity->end_time) {
            $endDateTime = $activityDate->copy()->setTimeFromTimeString($activity->end_time);
            return $now->gt($endDateTime);
        }
        
        return false;
    }
    
    /**
     * Check existing attendance record
     */
    private function checkExistingAttendance($id_anak, $id_aktivitas)
    {
        $absenUser = AbsenUser::where('id_anak', $id_anak)->first();
        
        if (!$absenUser) {
            return false;
        }
        
        return Absen::where('id_absen_user', $absenUser->id_absen_user)
                    ->where('id_aktivitas', $id_aktivitas)
                    ->first();
    }
    
    /**
     * Create absent record for student
     */
    private function createAbsentRecord($id_anak, $id_aktivitas, Aktivitas $activity)
    {
        // Get or create AbsenUser record
        $absenUser = AbsenUser::firstOrCreate(
            ['id_anak' => $id_anak],
            [
                'id_anak' => $id_anak,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now()
            ]
        );
        
        // Create the absent record
        Absen::create([
            'id_absen_user' => $absenUser->id_absen_user,
            'id_aktivitas' => $id_aktivitas,
            'absen' => Absen::TEXT_TIDAK,
            'keterangan' => 'Auto-marked absent after activity completion',
            'tanggal_absen' => $activity->tanggal,
            'arrival_time' => null,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now()
        ]);
    }
}