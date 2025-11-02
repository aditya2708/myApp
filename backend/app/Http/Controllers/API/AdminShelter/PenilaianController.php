<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Penilaian;
use App\Models\Anak;
use App\Models\Aktivitas;
use App\Models\Semester;
use App\Models\JenisPenilaian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;

class PenilaianController extends Controller
{
    /**
     * Display a listing of penilaian
     */
    public function index(Request $request)
    {
        try {
            $query = Penilaian::with(['anak', 'aktivitas', 'materi', 'jenisPenilaian', 'semester']);
            
            // Filter by anak
            if ($request->has('id_anak')) {
                $query->where('id_anak', $request->id_anak);
            }
            
            // Filter by semester
            if ($request->has('id_semester')) {
                $query->where('id_semester', $request->id_semester);
            }
            
            // Filter by aktivitas
            if ($request->has('id_aktivitas')) {
                $query->where('id_aktivitas', $request->id_aktivitas);
            }
            
            // Filter by jenis penilaian
            if ($request->has('id_jenis_penilaian')) {
                $query->where('id_jenis_penilaian', $request->id_jenis_penilaian);
            }
            
            // Filter by date range
            if ($request->has('date_from') && $request->has('date_to')) {
                $query->whereBetween('tanggal_penilaian', [$request->date_from, $request->date_to]);
            }
            
            $penilaian = $query->orderBy('tanggal_penilaian', 'desc')->paginate(20);
            
            return response()->json([
                'success' => true,
                'message' => 'Data penilaian berhasil diambil',
                'data' => $penilaian
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data penilaian',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created penilaian
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_anak' => 'required|exists:anak,id_anak',
                'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
                'id_jenis_penilaian' => 'required|exists:jenis_penilaian,id_jenis_penilaian',
                'id_semester' => 'nullable|exists:semester,id_semester',
                'nilai' => 'required|numeric|min:0|max:100',
                'deskripsi_tugas' => 'nullable|string',
                'tanggal_penilaian' => 'required|date',
                'catatan' => 'nullable|string',
                'materi_text' => 'nullable|string',
                'mata_pelajaran_manual' => 'nullable|string|max:255',
                'materi_manual' => 'nullable|string',
            ]);
    
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }
    
            $aktivitas = Aktivitas::find($request->id_aktivitas);

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aktivitas tidak ditemukan'
                ], 422);
            }

            $data = $request->all();

            if ($aktivitas->id_materi) {
                // Activity uses kurikulum materi
                $data['id_materi'] = $aktivitas->id_materi;
                $data['mata_pelajaran_manual'] = null;
                $data['materi_manual'] = null;

                if (!$request->filled('materi_text')) {
                    $data['materi_text'] = $aktivitas->materi;
                }
            } else {
                $data['id_materi'] = null;
                $pakaiManualAktivitas = (bool) $aktivitas->pakai_materi_manual;

                if ($pakaiManualAktivitas) {
                    $mataPelajaranManual = $request->mata_pelajaran_manual ?? $aktivitas->mata_pelajaran_manual;
                    $materiManual = $request->materi_manual ?? $aktivitas->materi_manual;

                    if (!$mataPelajaranManual || !$materiManual) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Aktivitas menggunakan materi manual, namun mata pelajaran atau materi manual tidak tersedia.'
                        ], 422);
                    }

                    $data['mata_pelajaran_manual'] = $mataPelajaranManual;
                    $data['materi_manual'] = $materiManual;
                    $data['materi_text'] = $request->materi_text ?? $this->formatMateriLabel($mataPelajaranManual, $materiManual);
                } else {
                    $data['mata_pelajaran_manual'] = $request->mata_pelajaran_manual;
                    $data['materi_manual'] = $request->materi_manual;

                    if (
                        !$request->filled('materi_text')
                        && (!$data['materi_manual'] || trim($data['materi_manual']) === '')
                    ) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Aktivitas tidak memiliki materi kurikulum dan materi_text tidak disediakan'
                        ], 422);
                    }

                    if (!$request->filled('materi_text')) {
                        $data['materi_text'] = $this->formatMateriLabel(
                            $data['mata_pelajaran_manual'],
                            $data['materi_manual']
                        );
                    }
                }
            }
    
            // ✅ Pastikan ada semester aktif jika id_semester tidak dikirim
            if (!$request->filled('id_semester')) {
                $kacabId = auth()->user()->adminShelter->id_kacab ?? null;
                $query = Semester::query();
                if ($kacabId) {
                    $query->where('id_kacab', $kacabId);
                }
                if (Schema::hasColumn('semester', 'status')) {
                    $query->where('status', 'active');
                } else {
                    $query->where('is_active', true);
                }
                $activeSemester = $query->first();
                if (!$activeSemester) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Semester aktif tidak ditemukan'
                    ], 422);
                }
                $data['id_semester'] = $activeSemester->id_semester;
            }
    
            $penilaian = Penilaian::create($data);
    
            return response()->json([
                'success' => true,
                'message' => 'Penilaian berhasil ditambahkan',
                'data' => $penilaian->load(['anak', 'aktivitas', 'materi', 'jenisPenilaian', 'semester'])
            ], 201);

        } catch (\Exception $e) {
            logger()->error('Error menambahkan penilaian: '.$e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan penilaian',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString() // <-- tambahkan untuk debug sementara
            ], 500);
        }
        
    }
    

    /**
     * Display the specified penilaian
     */
    public function show($id)
    {
        try {
            $penilaian = Penilaian::with(['anak', 'aktivitas', 'materi', 'jenisPenilaian', 'semester'])
                ->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Detail penilaian berhasil diambil',
                'data' => $penilaian
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Penilaian tidak ditemukan',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified penilaian
     */
    public function update(Request $request, $id)
    {
        try {
            $penilaian = Penilaian::findOrFail($id);
            
            $validator = Validator::make($request->all(), [
                'id_anak' => 'sometimes|required|exists:anak,id_anak',
                'id_aktivitas' => 'sometimes|required|exists:aktivitas,id_aktivitas',
                'id_jenis_penilaian' => 'sometimes|required|exists:jenis_penilaian,id_jenis_penilaian',
                'id_semester' => 'sometimes|nullable|exists:semester,id_semester',
                'nilai' => 'sometimes|required|numeric|min:0|max:100',
                'deskripsi_tugas' => 'nullable|string',
                'tanggal_penilaian' => 'sometimes|required|date',
                'catatan' => 'nullable|string',
                'materi_text' => 'nullable|string',
                'mata_pelajaran_manual' => 'nullable|string|max:255',
                'materi_manual' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $aktivitasId = $request->id_aktivitas ?? $penilaian->id_aktivitas;
            $aktivitas = Aktivitas::find($aktivitasId);
            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aktivitas tidak ditemukan'
                ], 422);
            }

            $data = $request->all();
            $data['id_aktivitas'] = $aktivitasId;
            $pakaiManualAktivitas = (bool) $aktivitas->pakai_materi_manual;

            if ($aktivitas->id_materi) {
                $data['id_materi'] = $aktivitas->id_materi;
                $data['mata_pelajaran_manual'] = null;
                $data['materi_manual'] = null;

                if (!$request->filled('materi_text')) {
                    $data['materi_text'] = $aktivitas->materi;
                }
            } else {
                $data['id_materi'] = null;

                if ($pakaiManualAktivitas) {
                    $mataPelajaranManual = $request->mata_pelajaran_manual ?? $aktivitas->mata_pelajaran_manual;
                    $materiManual = $request->materi_manual ?? $aktivitas->materi_manual;

                    if (!$mataPelajaranManual || !$materiManual) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Aktivitas menggunakan materi manual, namun mata pelajaran atau materi manual tidak tersedia.'
                        ], 422);
                    }

                    $data['mata_pelajaran_manual'] = $mataPelajaranManual;
                    $data['materi_manual'] = $materiManual;
                    if (!$request->filled('materi_text')) {
                        $data['materi_text'] = $this->formatMateriLabel($mataPelajaranManual, $materiManual);
                    }
                } else {
                    $data['mata_pelajaran_manual'] = $request->mata_pelajaran_manual;
                    $data['materi_manual'] = $request->materi_manual;

                    if (
                        !$request->filled('materi_text')
                        && (!$data['materi_manual'] || trim($data['materi_manual']) === '')
                    ) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Aktivitas tidak memiliki materi kurikulum dan materi_text tidak disediakan'
                        ], 422);
                    }

                    if (!$request->filled('materi_text')) {
                        $data['materi_text'] = $this->formatMateriLabel(
                            $data['mata_pelajaran_manual'],
                            $data['materi_manual']
                        );
                    }
                }
            }

            if (!$request->has('id_semester')) {
                $kacabId = auth()->user()->adminShelter->id_kacab ?? null;
                $query = Semester::query();
                if ($kacabId) {
                    $query->where('id_kacab', $kacabId);
                }
                if (Schema::hasColumn('semester', 'status')) {
                    $query->where('status', 'active');
                } else {
                    $query->where('is_active', true);
                }
                $activeSemester = $query->first();
                if (!$activeSemester) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Semester aktif tidak ditemukan'
                    ], 422);
                }
                $data['id_semester'] = $activeSemester->id_semester;
            }

            $penilaian->update($data);
            
            return response()->json([
                'success' => true,
                'message' => 'Penilaian berhasil diperbarui',
                'data' => $penilaian->load(['anak', 'aktivitas', 'materi', 'jenisPenilaian', 'semester'])
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui penilaian',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified penilaian
     */
    public function destroy($id)
    {
        try {
            $penilaian = Penilaian::findOrFail($id);
            $penilaian->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Penilaian berhasil dihapus'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus penilaian',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get penilaian by anak and semester
     */
    public function getByAnakSemester($idAnak, $idSemester)
    {
        try {
            $penilaianCollection = Penilaian::with(['aktivitas', 'materi.mataPelajaran', 'jenisPenilaian'])
                ->where('id_anak', $idAnak)
                ->where('id_semester', $idSemester)
                ->orderBy('tanggal_penilaian', 'desc')
                ->get();
            
            // Group by mata pelajaran with null handling
            $grouped = $penilaianCollection->groupBy(function ($item) {
                if ($item->mata_pelajaran_manual) {
                    return $item->mata_pelajaran_manual;
                }

                if ($item->materi && $item->materi->mataPelajaran) {
                    return $item->materi->mataPelajaran->nama_mata_pelajaran;
                }

                return 'Tanpa Mata Pelajaran';
            });
            
            return response()->json([
                'success' => true,
                'message' => 'Data penilaian berhasil diambil',
                'data' => $grouped
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data penilaian',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate nilai akhir for specific anak, semester, and mata pelajaran
     */
    public function calculateNilaiAkhir(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'id_anak' => 'required|exists:anak,id_anak',
                'id_semester' => 'required|exists:semester,id_semester',
                'mata_pelajaran' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $penilaian = Penilaian::with(['materi', 'jenisPenilaian'])
                ->where('id_anak', $request->id_anak)
                ->where('id_semester', $request->id_semester)
                ->whereHas('materi', function($query) use ($request) {
                    $query->where('mata_pelajaran', $request->mata_pelajaran);
                })
                ->get();

            $nilaiAkhir = 0;
            $details = [];
            
            // DEPRECATED: Use new bobot system from cabang setting
            // Get kacab from user context
            $kacabId = $request->user()->id_kacab ?? null;
            
            if (!$kacabId) {
                return response()->json([
                    'success' => false,
                    'message' => 'ID Kacab tidak ditemukan. Tidak dapat menghitung nilai akhir.'
                ], 400);
            }

            // Get bobot mapping from cabang setting (NEW SYSTEM)
            $bobotMapping = \App\Models\BobotPenilaian::getBobotMappingByMataPelajaran($kacabId, $penilaian->first()->id_mata_pelajaran ?? null);
            
            if (empty($bobotMapping)) {
                // Fallback to old system if bobot not configured
                foreach ($penilaian as $p) {
                    $bobot = $p->jenisPenilaian->bobot_decimal;
                    $kontribusi = $p->nilai * $bobot;
                    $nilaiAkhir += $kontribusi;
                    
                    $details[] = [
                        'jenis_penilaian' => $p->jenisPenilaian->nama_jenis,
                        'nilai' => $p->nilai,
                        'bobot' => $p->jenisPenilaian->bobot_persen,
                        'kontribusi' => $kontribusi,
                        'source' => 'old_system' // Indicate this is fallback
                    ];
                }
            } else {
                // Use new bobot system from cabang
                foreach ($penilaian as $p) {
                    $bobot = $bobotMapping[$p->id_jenis_penilaian] ?? $p->jenisPenilaian->bobot_decimal;
                    $kontribusi = $p->nilai * $bobot;
                    $nilaiAkhir += $kontribusi;
                    
                    $details[] = [
                        'jenis_penilaian' => $p->jenisPenilaian->nama_jenis,
                        'nilai' => $p->nilai,
                        'bobot' => $bobot * 100,
                        'kontribusi' => $kontribusi,
                        'source' => 'cabang_setting' // Indicate this is from new system
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Nilai akhir berhasil dihitung',
                'data' => [
                    'nilai_akhir' => $nilaiAkhir,
                    'nilai_huruf' => $this->convertToHuruf($nilaiAkhir),
                    'details' => $details
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghitung nilai akhir',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk input penilaian
     */
    public function bulkStore(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'penilaian' => 'required|array',
                'penilaian.*.id_anak' => 'required|exists:anak,id_anak',
                'penilaian.*.id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
                'penilaian.*.id_materi' => 'nullable|exists:materi,id_materi',
                'penilaian.*.id_jenis_penilaian' => 'required|exists:jenis_penilaian,id_jenis_penilaian',
                'penilaian.*.id_semester' => 'required|exists:semester,id_semester',
                'penilaian.*.nilai' => 'required|numeric|min:0|max:100',
                'penilaian.*.tanggal_penilaian' => 'required|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();
            
            $created = [];
            foreach ($request->penilaian as $data) {
                $created[] = Penilaian::create($data);
            }
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => count($created) . ' penilaian berhasil ditambahkan',
                'data' => $created
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan penilaian',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function convertToHuruf($nilai)
    {
        if ($nilai >= 90) return 'A';
        if ($nilai >= 80) return 'B';
        if ($nilai >= 70) return 'C';
        if ($nilai >= 60) return 'D';
        return 'E';
    }

    private function formatMateriLabel(?string $mataPelajaran, ?string $materi): string
    {
        $parts = array_filter([
            $mataPelajaran ? trim($mataPelajaran) : null,
            $materi ? trim($materi) : null,
        ], fn ($value) => $value !== null && $value !== '');

        return implode(' - ', $parts);
    }

    public function getJenisPenilaian()
    {
        try {
            $jenisPenilaian = JenisPenilaian::select('id_jenis_penilaian', 'nama_jenis', 'bobot_persen', 'kategori')
                ->orderBy('kategori')
                ->orderBy('nama_jenis')
                ->get();
            
            return response()->json([
                'success' => true,
                'message' => 'Data jenis penilaian berhasil diambil',
                'data' => $jenisPenilaian
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data jenis penilaian',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
