<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Materi;
use App\Models\Semester;
use App\Models\Kelas;
use App\Models\Jenjang;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * KurikulumConsumerController - SIMPLIFIED VERSION
 * 
 * Purpose: Simple kurikulum data provider (READ-ONLY access) per new implementation plan
 * Philosophy: SIMPLIFY & STREAMLINE - provide basic data, frontend handles filtering
 */
class KurikulumConsumerController extends Controller
{
    /**
     * Get all materi from cabang (for frontend caching & filtering)
     */
    public function getAllMateri(Request $request)
    {
        try {
            $adminShelter = Auth::user()->adminShelter;

            if (!$adminShelter || !$adminShelter->shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shelter tidak ditemukan'
                ], 403);
            }

            // Get shelter's kacab through wilbin relationship
            $shelter = \App\Models\Shelter::with('wilbin.kacab')->where('id_shelter', $adminShelter->shelter->id_shelter)->first();
            if (!$shelter || !$shelter->wilbin || !$shelter->wilbin->kacab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data kacab untuk shelter ini tidak ditemukan'
                ], 400);
            }

            $kacabId = $shelter->wilbin->kacab->id_kacab;

            // Cache key for all materi
            $cacheKey = "all_materi_kacab_{$kacabId}";
            
            $materiData = Cache::remember($cacheKey, 600, function () use ($kacabId) { // 10 minutes cache
                return Materi::where('id_kacab', $kacabId)
                    ->with(['mataPelajaran', 'kelas.jenjang'])
                    ->orderBy('urutan')
                    ->get();
            });

            return response()->json([
                'success' => true,
                'message' => 'Semua materi berhasil diambil',
                'data' => [
                    'hierarchy' => [
                        'materi_list' => $materiData,
                        'total_count' => $materiData->count(),
                        'kacab_info' => [
                            'id_kacab' => $kacabId,
                            'nama_kacab' => $shelter->wilbin->kacab->nama_kacab ?? 'Unknown'
                        ]
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in KurikulumConsumerController@getAllMateri: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data materi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available kelas for kelompok form
     */
    public function getAvailableKelas()
    {
        try {
            // Cache key for kelas data
            $cacheKey = "available_kelas_all";
            
            $kelasData = Cache::remember($cacheKey, 1800, function () { // 30 minutes cache
                return Kelas::where('is_active', true)
                    ->with(['jenjang' => function($query) {
                        $query->where('is_active', true);
                    }])
                    ->orderBy('id_jenjang')
                    ->orderBy('tingkat')
                    ->get();
            });

            // Group by jenjang for easier frontend usage
            $groupedKelas = $kelasData->groupBy('jenjang.nama_jenjang');

            return response()->json([
                'success' => true,
                'message' => 'Daftar kelas tersedia berhasil diambil',
                'data' => [
                    'hierarchy' => [
                        'kelas_list' => $kelasData,
                        'grouped_kelas' => $groupedKelas,
                        'total_count' => $kelasData->count()
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in KurikulumConsumerController@getAvailableKelas: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data kelas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active semester info
     */
    public function getSemesterAktif()
    {
        try {
            $adminShelter = Auth::user()->adminShelter;

            if (!$adminShelter || !$adminShelter->shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shelter tidak ditemukan'
                ], 403);
            }

            // Get shelter's kacab through wilbin relationship
            $shelter = \App\Models\Shelter::with('wilbin.kacab')->where('id_shelter', $adminShelter->shelter->id_shelter)->first();
            if (!$shelter || !$shelter->wilbin || !$shelter->wilbin->kacab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data kacab untuk shelter ini tidak ditemukan'
                ], 400);
            }

            $kacabId = $shelter->wilbin->kacab->id_kacab;
            $semesterAktif = $this->getSemesterAktifData($kacabId);

            return response()->json([
                'success' => true,
                'message' => 'Data semester aktif berhasil diambil',
                'data' => [
                    'hierarchy' => $semesterAktif
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in KurikulumConsumerController@getSemesterAktif: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data semester',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get materi detail for preview
     */
    public function getMateriDetail($materiId)
    {
        try {
            $adminShelter = Auth::user()->adminShelter;

            if (!$adminShelter || !$adminShelter->shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shelter tidak ditemukan'
                ], 403);
            }

            // Get shelter's kacab for validation
            $shelter = \App\Models\Shelter::with('wilbin.kacab')->where('id_shelter', $adminShelter->shelter->id_shelter)->first();
            if (!$shelter || !$shelter->wilbin || !$shelter->wilbin->kacab) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data kacab untuk shelter ini tidak ditemukan'
                ], 400);
            }

            $kacabId = $shelter->wilbin->kacab->id_kacab;

            // Get materi detail with validation
            $materi = Materi::where('id_materi', $materiId)
                ->where('id_kacab', $kacabId)
                ->with(['mataPelajaran', 'kelas.jenjang', 'kacab'])
                ->first();

            if (!$materi) {
                return response()->json([
                    'success' => false,
                    'message' => 'Materi tidak ditemukan atau tidak dapat diakses'
                ], 404);
            }

            // Get basic usage stats
            $usageStats = [
                'total_usage_in_shelter' => \App\Models\Aktivitas::where('id_materi', $materiId)
                    ->where('id_shelter', $adminShelter->shelter->id_shelter)
                    ->count(),
                'recent_usage' => \App\Models\Aktivitas::where('id_materi', $materiId)
                    ->where('id_shelter', $adminShelter->shelter->id_shelter)
                    ->where('tanggal', '>=', now()->subDays(30))
                    ->count()
            ];

            // File info
            $fileInfo = null;
            if ($materi->file_path) {
                $fileInfo = [
                    'file_name' => $materi->file_name,
                    'file_size' => $materi->file_size,
                    'file_size_formatted' => $this->formatFileSize($materi->file_size)
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Detail materi berhasil diambil',
                'data' => [
                    'hierarchy' => [
                        'materi' => $materi,
                        'usage_stats' => $usageStats,
                        'file_info' => $fileInfo
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error in KurikulumConsumerController@getMateriDetail: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil detail materi',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to get semester aktif data
     */
    private function getSemesterAktifData($kacabId)
    {
        $semesterAktif = Semester::where('id_kacab', $kacabId)
            ->where('is_active', true)
            ->orderBy('tanggal_mulai', 'desc')
            ->first();

        if (!$semesterAktif) {
            return null;
        }

        $today = now();
        $progress = 0;
        $status = 'upcoming';

        if ($today->gte($semesterAktif->tanggal_mulai) && $today->lte($semesterAktif->tanggal_selesai)) {
            $totalDays = $semesterAktif->tanggal_mulai->diffInDays($semesterAktif->tanggal_selesai);
            $elapsedDays = $semesterAktif->tanggal_mulai->diffInDays($today);
            $progress = $totalDays > 0 ? round(($elapsedDays / $totalDays) * 100, 1) : 0;
            $status = 'active';
        } elseif ($today->gt($semesterAktif->tanggal_selesai)) {
            $progress = 100;
            $status = 'completed';
        }

        return [
            'semester' => $semesterAktif,
            'progress_percentage' => $progress,
            'status' => $status,
            'days_remaining' => $status === 'active' ? 
                $today->diffInDays($semesterAktif->tanggal_selesai, false) : 
                ($status === 'upcoming' ? $semesterAktif->tanggal_mulai->diffInDays($today) : 0)
        ];
    }

    /**
     * Helper method to format file size
     */
    private function formatFileSize($bytes)
    {
        if ($bytes >= 1073741824) {
            $bytes = number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            $bytes = number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            $bytes = number_format($bytes / 1024, 2) . ' KB';
        } elseif ($bytes > 1) {
            $bytes = $bytes . ' bytes';
        } elseif ($bytes == 1) {
            $bytes = $bytes . ' byte';
        } else {
            $bytes = '0 bytes';
        }

        return $bytes;
    }
}