<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Semester;
use App\Models\Kurikulum;

class FillSemesterKurikulumId extends Command
{
    protected $signature = 'semester:fill-kurikulum';

    protected $description = 'Fill semester.kurikulum_id with active kurikulum id for its cabang';

    public function handle(): int
    {
        $updated = 0;

        $semesters = Semester::whereNull('kurikulum_id')->get();

        foreach ($semesters as $semester) {
            $kurikulum = Kurikulum::where('id_kacab', $semester->id_kacab)
                ->where(function($q) {
                    $q->where('is_active', true)
                      ->orWhere('status', 'aktif');
                })
                ->first();

            if ($kurikulum) {
                $semester->kurikulum_id = $kurikulum->id_kurikulum;
                $semester->save();
                $updated++;
            }
        }

        $this->info("Updated {$updated} semester records.");
        return Command::SUCCESS;
    }
}

