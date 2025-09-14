<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Semester;
use App\Models\Kelompok;
use App\Models\Aktivitas;
use App\Models\Anak;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class KurikulumDashboardController extends Controller
{
    /**
     * Get comprehensive kurikulum dashboard data for AdminShelter
     */
    public function getDashboard(): JsonResponse
    {
        try {
            $user = auth()->user();
            $adminShelter = $user->adminShelter;
            $kacabId = $adminShelter->id_kacab;
            $shelterId = $adminShelter->id_shelter;

            // Get active semester
            $semesterAktif = $this->getSemesterAktif($kacabId);
            
            // Get today's statistics
            $todayStats = $this->getTodayStatistics($shelterId, $semesterAktif);
            
            // Get recent activities (today's schedule)
            $recentActivity = $this->getRecentActivity($shelterId);

            // Compile dashboard data
            $dashboardData = [
                'semesterAktif' => $semesterAktif,
                'todayStats' => $todayStats,
                'recentActivity' => $recentActivity,
                'shelter_info' => [
                    'nama' => $adminShelter->shelter->nama_shelter ?? 'Unknown Shelter',
                    'kacab' => $adminShelter->kacab->nama_kacab ?? 'Unknown Kacab'
                ],
                'last_updated' => now()->toISOString()
            ];

            return response()->json([
                'success' => true,
                'data' => $dashboardData,
                'message' => 'Dashboard kurikulum berhasil dimuat'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat dashboard kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active semester data
     */
    private function getSemesterAktif($kacabId)
    {
        $hasStatusColumn = \Schema::hasColumn('semester', 'status');
        
        $query = Semester::where('id_kacab', $kacabId)
            ->with(['kurikulum']);

        if ($hasStatusColumn) {
            $query->where('status', 'active');
        } else {
            $query->where('is_active', true);
        }

        $semester = $query->first();

        if (!$semester) {
            return null;
        }

        // Calculate progress based on dates
        $progress = $this->calculateSemesterProgress($semester);

        return [
            'nama' => $semester->nama_semester,
            'periode' => $semester->periode . ' ' . $semester->tahun_ajaran,
            'progress' => $progress,
            'tanggal_mulai' => $semester->tanggal_mulai,
            'tanggal_selesai' => $semester->tanggal_selesai,
            'status' => $semester->status ?? ($semester->is_active ? 'active' : 'draft')
        ];
    }

    /**
     * Calculate semester progress based on current date
     */
    private function calculateSemesterProgress($semester)
    {
        if (!$semester->tanggal_mulai || !$semester->tanggal_selesai) {
            return 0;
        }

        $start = Carbon::parse($semester->tanggal_mulai);
        $end = Carbon::parse($semester->tanggal_selesai);
        $now = Carbon::now();

        // If not started yet
        if ($now->lt($start)) {
            return 0;
        }

        // If already finished
        if ($now->gt($end)) {
            return 100;
        }

        // Calculate percentage
        $totalDays = $start->diffInDays($end);
        $passedDays = $start->diffInDays($now);

        return $totalDays > 0 ? min(100, max(0, round(($passedDays / $totalDays) * 100))) : 0;
    }

    /**
     * Get today's statistics
     */
    private function getTodayStatistics($shelterId, $semesterAktif)
    {
        $today = Carbon::today();

        // Count total kelompok (check if status column exists)
        $kelompokQuery = Kelompok::where('id_shelter', $shelterId);
        if (\Schema::hasColumn('kelompok', 'status')) {
            $kelompokQuery->where('status', 'aktif');
        }
        $totalKelompok = $kelompokQuery->count();

        // Count today's activities
        $aktivitasHariIni = Aktivitas::where('id_shelter', $shelterId)
            ->whereDate('tanggal', $today)
            ->count();

        // Count active students (anak binaan) - use status_validasi with proper constants
        $siswaAktif = Anak::where('id_shelter', $shelterId)
            ->whereIn('status_validasi', Anak::STATUS_AKTIF)
            ->count();

        // Count active tutors - no status column exists, count all tutors for the shelter
        $tutorAktif = Tutor::where('id_shelter', $shelterId)->count();

        return [
            'totalKelompok' => $totalKelompok,
            'aktivitasHariIni' => $aktivitasHariIni,
            'siswaAktif' => $siswaAktif,
            'tutorAktif' => $tutorAktif,
            'semester_info' => $semesterAktif ? $semesterAktif['nama'] : 'Tidak ada semester aktif'
        ];
    }

    /**
     * Get recent activities - prioritize today, fallback to recent activities (last 7 days)
     */
    private function getRecentActivity($shelterId)
    {
        try {
            $today = Carbon::today();
            
            // Check if jam_mulai column exists, fallback to created_at ordering
            $orderByColumn = \Schema::hasColumn('aktivitas', 'jam_mulai') ? 'jam_mulai' : 'created_at';

            // First, try to get today's activities without eager loading to avoid relationship issues
            $todayActivities = Aktivitas::where('id_shelter', $shelterId)
                ->whereDate('tanggal', $today)
                ->orderBy($orderByColumn)
                ->limit(5)
                ->get();

            // If no activities today, get recent activities from last 7 days
            if ($todayActivities->isEmpty()) {
                $sevenDaysAgo = Carbon::today()->subDays(7);
                $todayActivities = Aktivitas::where('id_shelter', $shelterId)
                    ->whereBetween('tanggal', [$sevenDaysAgo, $today])
                    ->orderBy('tanggal', 'desc')
                    ->orderBy($orderByColumn, 'desc')
                    ->limit(5)
                    ->get();
            }

            return $todayActivities->map(function ($activity) {
                // Handle jam_mulai column existence
                $jamMulai = 'TBD';
                if (\Schema::hasColumn('aktivitas', 'jam_mulai') && $activity->jam_mulai) {
                    $jamMulai = Carbon::parse($activity->jam_mulai)->format('H:i');
                } elseif ($activity->created_at) {
                    $jamMulai = Carbon::parse($activity->created_at)->format('H:i');
                }
                
                // Add date info if not today
                $isToday = Carbon::parse($activity->tanggal)->isToday();
                $dateInfo = $isToday ? '' : ' (' . Carbon::parse($activity->tanggal)->format('d/m') . ')';
                
                // Safely get related data
                $tutorName = 'Tutor belum ditentukan';
                $kelompokName = 'Kelompok tidak diketahui';
                $mataPelajaranName = '';
                $materiName = '';
                $kategoriName = '';
                
                try {
                    // Get tutor name - direct query by id_tutor
                    if ($activity->id_tutor) {
                        $tutor = Tutor::find($activity->id_tutor);
                        if ($tutor) {
                            $tutorName = $tutor->nama ?? $tutor->nama_tutor ?? $tutorName;
                        }
                    }
                    
                    // Get kelompok name - use nama_kelompok field directly or call custom method
                    if ($activity->nama_kelompok) {
                        // First, try using the nama_kelompok field directly
                        $kelompokName = $activity->nama_kelompok;
                    } else {
                        // Fallback: try to get kelompok object using the custom method
                        $kelompokObj = $activity->kelompok();
                        if ($kelompokObj) {
                            $kelompokName = $kelompokObj->nama_kelompok ?? $kelompokName;
                        }
                    }
                    
                    // Get materi and mata pelajaran data
                    if ($activity->id_materi) {
                        $materi = \App\Models\Materi::with('mataPelajaran')->find($activity->id_materi);
                        if ($materi) {
                            $materiName = $materi->nama_materi ?? '';
                            $kategoriName = $materi->kategori ?? '';
                            if ($materi->mataPelajaran) {
                                $mataPelajaranName = $materi->mataPelajaran->nama_mata_pelajaran ?? '';
                            }
                        }
                    }
                } catch (\Exception $e) {
                    // If relationships fail, just use defaults
                }
                
                return [
                    'time' => $jamMulai,
                    'activity' => ($activity->jenis_kegiatan ?? 'Aktivitas tidak diketahui') . $dateInfo,
                    'tutor' => $tutorName,
                    'kelompok' => $kelompokName,
                    'mata_pelajaran' => $mataPelajaranName,
                    'nama_materi' => $materiName,
                    'kategori' => $kategoriName,
                    'status' => (\Schema::hasColumn('aktivitas', 'status') && $activity->status) ? $activity->status : 'scheduled'
                ];
            })->toArray();

        } catch (\Exception $e) {
            // If everything fails, return empty array
            return [];
        }
    }

    /**
     * Get quick semester info
     */
    public function getSemesterInfo(): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminShelter->id_kacab;
            $semesterAktif = $this->getSemesterAktif($kacabId);

            return response()->json([
                'success' => true,
                'data' => $semesterAktif,
                'message' => $semesterAktif ? 'Semester aktif ditemukan' : 'Tidak ada semester aktif'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil info semester: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get today's activity summary
     */
    public function getTodayActivities(): JsonResponse
    {
        try {
            $shelterId = auth()->user()->adminShelter->id_shelter;
            $activities = $this->getRecentActivity($shelterId);

            return response()->json([
                'success' => true,
                'data' => $activities,
                'message' => 'Aktivitas hari ini berhasil dimuat'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil aktivitas hari ini: ' . $e->getMessage()
            ], 500);
        }
    }
}