<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use App\Models\Jenjang;
use App\Models\Kelas;
use App\Models\Kurikulum;
use App\Models\MataPelajaran;
use App\Models\Materi;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class KurikulumController extends Controller
{
    /**
     * Display all kurikulum that belong to the authenticated cabang
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user || !$user->adminCabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak memiliki akses untuk melihat kurikulum'
                ], 403);
            }

            $kacabId = $user->adminCabang->id_kacab;
            $search = trim((string) $request->query('search', ''));
            $status = $request->query('status');
            $tahun = $request->query('tahun') ?? $request->query('tahun_berlaku');
            $limit = $request->query('limit');

            $query = Kurikulum::byKacab($kacabId)
                ->withCounts()
                ->with(['jenjang']);

            if ($search !== '') {
                $query->where(function($q) use ($search) {
                    $q->where('nama_kurikulum', 'like', "%{$search}%")
                      ->orWhere('kode_kurikulum', 'like', "%{$search}%")
                      ->orWhere('tahun_berlaku', 'like', "%{$search}%");
                });
            }

            if ($status && $status !== 'all') {
                $normalizedStatus = strtolower($status);

                if (in_array($normalizedStatus, ['aktif', 'active'], true)) {
                    $query->where(function($q) {
                        $q->where('status', 'aktif')
                          ->orWhere('is_active', true);
                    });
                } elseif (in_array($normalizedStatus, ['nonaktif', 'inactive', 'non-active'], true)) {
                    $query->where(function($q) {
                        $q->whereIn('status', ['nonaktif', 'inactive'])
                          ->orWhere('is_active', false);
                    });
                } else {
                    $query->where(function($q) use ($status, $normalizedStatus) {
                        $q->where('status', $status);
                        if ($status !== $normalizedStatus) {
                            $q->orWhere('status', $normalizedStatus);
                        }
                    });
                }
            }

            if (!empty($tahun)) {
                $query->where('tahun_berlaku', $tahun);
            }

            $query->orderByDesc('is_active')
                ->orderByRaw("CASE WHEN status = 'aktif' THEN 0 WHEN status = 'draft' THEN 1 ELSE 2 END")
                ->orderBy('tahun_berlaku', 'desc')
                ->orderBy('nama_kurikulum');

            if ($limit && is_numeric($limit) && (int) $limit > 0) {
                $query->limit((int) $limit);
            }

            $kurikulum = $query->get()->map(function($kurikulum) {
                $mataPelajaranCount = (int) ($kurikulum->mata_pelajaran_count ?? $kurikulum->getTotalMataPelajaran());

                $materiCount = $kurikulum->materi_count;
                if ($materiCount === null) {
                    $materiCount = $kurikulum->kurikulum_materi_count;
                }
                if ($materiCount === null) {
                    $materiCount = $kurikulum->getTotalMateri();
                }
                $materiCount = (int) $materiCount;
                $semesterCount = (int) ($kurikulum->semester_count ?? $kurikulum->semester()->count());

                return [
                    'id_kurikulum' => $kurikulum->id_kurikulum,
                    'nama_kurikulum' => $kurikulum->nama_kurikulum,
                    'kode_kurikulum' => $kurikulum->kode_kurikulum,
                    'tahun_berlaku' => $kurikulum->tahun_berlaku,
                    'jenis' => $kurikulum->jenis,
                    'deskripsi' => $kurikulum->deskripsi,
                    'status' => $kurikulum->status,
                    'status_text' => $kurikulum->status_text,
                    'status_color' => $kurikulum->status_color,
                    'is_active' => (bool) $kurikulum->is_active,
                    'mata_pelajaran_count' => $mataPelajaranCount,
                    'total_mata_pelajaran' => $mataPelajaranCount,
                    'kurikulum_materi_count' => $materiCount,
                    'total_materi' => $materiCount,
                    'semester_count' => $semesterCount,
                    'created_at' => $kurikulum->created_at ? $kurikulum->created_at->toIso8601String() : null,
                    'updated_at' => $kurikulum->updated_at ? $kurikulum->updated_at->toIso8601String() : null,
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => $kurikulum,
                'message' => 'Daftar kurikulum berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new kurikulum for current cabang
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user || !$user->adminCabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak memiliki akses untuk membuat kurikulum'
                ], 403);
            }

            $kacabId = $user->adminCabang->id_kacab;

            $validator = Validator::make($request->all(), [
                'nama' => 'required|string|max:255',
                'tahun' => 'required|integer|min:2000|max:2100',
                'jenis' => 'nullable|string|max:100',
                'deskripsi' => 'nullable|string',
                'status' => 'nullable|in:draft,aktif,nonaktif'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $nama = trim($request->input('nama'));
            $tahun = (int) $request->input('tahun');

            $duplicateExists = Kurikulum::where('id_kacab', $kacabId)
                ->where('nama_kurikulum', $nama)
                ->where('tahun_berlaku', $tahun)
                ->exists();

            if ($duplicateExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kurikulum dengan nama dan tahun tersebut sudah ada'
                ], 422);
            }

            $status = $request->input('status', 'draft');

            $kurikulum = Kurikulum::create([
                'nama_kurikulum' => $nama,
                'kode_kurikulum' => $this->generateKurikulumCode($kacabId, $request->input('jenis') ?? $nama, $tahun),
                'tahun_berlaku' => $tahun,
                'jenis' => $request->input('jenis'),
                'deskripsi' => $request->input('deskripsi'),
                'status' => $status,
                'is_active' => $status === 'aktif',
                'id_kacab' => $kacabId,
            ]);

            $kurikulum->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Kurikulum berhasil dibuat',
                'data' => $kurikulum
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get kurikulum hierarchy structure (jenjang -> kelas -> mata pelajaran)
     */
    public function getStruktur(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            
            $struktur = Jenjang::active()
                ->withCount(['kelas', 'mataPelajaran'])
                ->with([
                    'kelas' => function($query) use ($kacabId) {
                        $query->where(function($q) use ($kacabId) {
                            $q->where('is_global', true)
                              ->orWhere('id_kacab', $kacabId);
                        })
                        ->active()
                        ->orderByUrutan();
                    },
                    'mataPelajaran' => function($query) use ($kacabId) {
                        $query->where(function($q) use ($kacabId) {
                            $q->where('is_global', true)
                              ->orWhere('id_kacab', $kacabId);
                        })
                        ->active()
                        ->withCount('materi');
                    }
                ])
                ->orderByUrutan()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $struktur,
                'message' => 'Struktur kurikulum berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil struktur kurikulum: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get mata pelajaran list by jenjang and kelas with materi count
     */
    public function getMataPelajaran(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;
            $jenjangId = $request->query('jenjang');
            $kelasId = $request->query('kelas');

            if ($jenjangId !== null && $jenjangId !== '') {
                $jenjangId = (int) $jenjangId;
            } else {
                $jenjangId = null;
            }

            if ($kelasId !== null && $kelasId !== '') {
                $kelasId = (int) $kelasId;
            } else {
                $kelasId = null;
            }

            $query = MataPelajaran::where(function($q) use ($kacabId) {
                $q->where('is_global', true)
                  ->orWhere('id_kacab', $kacabId);
            })
            ->active()
            ->withCount(['materi' => function($q) use ($kelasId) {
                if ($kelasId) {
                    $q->where('id_kelas', $kelasId);
                }
            }])
            ->with(['jenjang', 'kacab']);

            if ($jenjangId !== null) {
                $query->where(function($q) use ($jenjangId) {
                    $q->where('id_jenjang', $jenjangId)
                      ->orWhereNull('id_jenjang')
                      ->orWhereJsonContains('target_jenjang', $jenjangId);
                });
            }

            if ($kelasId !== null) {
                $query->where(function($q) use ($kelasId) {
                    $q->whereJsonContains('target_kelas', $kelasId)
                      ->orWhereNull('target_kelas'); // Not specific to any class
                });
            }

            $mataPelajaran = $query->orderBy('kategori')
                ->orderBy('nama_mata_pelajaran')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $mataPelajaran,
                'message' => 'Mata pelajaran berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil mata pelajaran: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dropdown data for kurikulum forms
     */
    public function getDropdownData(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $data = [
                'jenjang' => Jenjang::active()->orderByUrutan()->get(['id_jenjang', 'nama_jenjang', 'kode_jenjang']),
                'kelas' => Kelas::where(function($q) use ($kacabId) {
                    $q->where('is_global', true)
                      ->orWhere('id_kacab', $kacabId);
                })
                ->active()
                ->with('jenjang')
                ->orderByUrutan()
                ->get(['id_kelas', 'nama_kelas', 'id_jenjang', 'jenis_kelas']),
                'mata_pelajaran' => MataPelajaran::where(function($q) use ($kacabId) {
                    $q->where('is_global', true)
                      ->orWhere('id_kacab', $kacabId);
                })
                ->active()
                ->with('jenjang')
                ->orderBy('kategori')
                ->orderBy('nama_mata_pelajaran')
                ->get(['id_mata_pelajaran', 'nama_mata_pelajaran', 'kode_mata_pelajaran', 'kategori', 'id_jenjang'])
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Data dropdown berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dropdown: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get kelas list by jenjang
     */
    public function getKelasByJenjang(Request $request, $jenjangId): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $kelas = Kelas::where('id_jenjang', $jenjangId)
                ->where(function($q) use ($kacabId) {
                    $q->where('is_global', true)
                      ->orWhere('id_kacab', $kacabId);
                })
                ->active()
                ->withCount('materi')
                ->orderByUrutan()
                ->get();

            return response()->json([
                'success' => true,
                'data' => $kelas,
                'message' => 'Kelas berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil kelas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for kurikulum overview
     */
    public function getStatistics(Request $request): JsonResponse
    {
        try {
            $kacabId = auth()->user()->adminCabang->id_kacab;

            $stats = [
                'total_jenjang' => Jenjang::active()->count(),
                'total_kelas' => Kelas::where(function($q) use ($kacabId) {
                    // Temporary fix: include all active kelas until migration is run
                    $q->where('is_global', true)
                      ->orWhere('id_kacab', $kacabId)
                      ->orWhereNull('is_global'); // Include existing kelas that don't have is_global set yet
                })->active()->count(),
                'total_mata_pelajaran' => MataPelajaran::where(function($q) use ($kacabId) {
                    // Temporary fix: include all active mata pelajaran until migration is run
                    $q->where('is_global', true)
                      ->orWhere('id_kacab', $kacabId)
                      ->orWhereNull('is_global'); // Include existing mata pelajaran that don't have is_global set yet
                })->active()->count(),
                'total_materi' => Materi::where('id_kacab', $kacabId)->count(),
                'kelas_custom' => Kelas::where(function($q) use ($kacabId) {
                    // Check both jenis_kelas = 'custom' and is_custom = 1
                    $q->where('jenis_kelas', 'custom')
                      ->orWhere('is_custom', 1);
                })
                ->where(function($q) use ($kacabId) {
                    // Include kelas with id_kacab or null id_kacab (if it's a global custom class)
                    $q->where('id_kacab', $kacabId)
                      ->orWhereNull('id_kacab');
                })
                ->active()
                ->count(),
                'mata_pelajaran_custom' => MataPelajaran::where('id_kacab', $kacabId)
                    ->active()
                    ->count()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistik kurikulum berhasil diambil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil statistik: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate unique kurikulum code for branch
     */
    private function generateKurikulumCode(int $kacabId, string $baseName, int $tahun): string
    {
        $slug = Str::slug($baseName, '_');
        $slug = $slug ?: 'kurikulum';
        $slug = substr($slug, 0, 40);
        $baseCode = strtoupper($slug) . '_' . $tahun;
        $code = $baseCode;
        $counter = 1;

        while (Kurikulum::where('id_kacab', $kacabId)
            ->where('kode_kurikulum', $code)
            ->exists()) {
            $code = $baseCode . '_' . str_pad($counter, 2, '0', STR_PAD_LEFT);
            $counter++;
        }

        return $code;
    }
}
