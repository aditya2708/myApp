<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Penilaian;
use App\Support\AdminShelterScope;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class AchievementReportController extends Controller
{
    use AdminShelterScope;

    /**
     * List achievement reports for the authenticated admin shelter.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user || !$user->adminShelter || !$user->adminShelter->shelter) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $companyId = $this->companyId();
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|string',
            'end_date' => 'nullable|string',
            'jenis_kegiatan' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page' => 'nullable|integer|min:1'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $filters = $validator->validated();
        $startInput = $filters['start_date'] ?? null;
        $endInput = $filters['end_date'] ?? null;

        $startDate = $this->parseFilterDate($startInput);
        $endDate = $this->parseFilterDate($endInput);

        if ($startInput !== null && $startDate === null && $startInput !== '') {
            return response()->json([
                'success' => false,
                'message' => 'Format tanggal mulai tidak valid. Gunakan contoh: 17 Agustus 2025.',
                'errors' => [
                    'start_date' => ['Format tanggal mulai tidak valid.']
                ]
            ], 422);
        }

        if ($endInput !== null && $endDate === null && $endInput !== '') {
            return response()->json([
                'success' => false,
                'message' => 'Format tanggal akhir tidak valid. Gunakan contoh: 17 Agustus 2025.',
                'errors' => [
                    'end_date' => ['Format tanggal akhir tidak valid.']
                ]
            ], 422);
        }

        if ($startDate && $endDate && $endDate->lt($startDate)) {
            return response()->json([
                'success' => false,
                'message' => 'Tanggal akhir harus lebih besar atau sama dengan tanggal mulai.',
                'errors' => [
                    'end_date' => ['Tanggal akhir harus lebih besar atau sama dengan tanggal mulai.']
                ]
            ], 422);
        }

        $perPage = (int) ($filters['per_page'] ?? 15);
        $perPage = max(1, min($perPage, 100));

        $shelterId = $user->adminShelter->shelter->id_shelter;

        $query = Penilaian::query()
            ->when($companyId && Schema::hasColumn('penilaian', 'company_id'), fn ($q) => $q->where('penilaian.company_id', $companyId))
            ->with([
                'anak:id_anak,full_name,id_kelompok',
                'anak.kelompok:id_kelompok,nama_kelompok,id_shelter',
                'aktivitas:id_aktivitas,id_shelter,jenis_kegiatan,id_kegiatan,id_materi,pakai_materi_manual,mata_pelajaran_manual,materi_manual,materi',
                'aktivitas.kegiatan:id_kegiatan,nama_kegiatan',
                'aktivitas.materiRelation:id_materi,id_mata_pelajaran,nama_materi',
                'aktivitas.materiRelation.mataPelajaran:id_mata_pelajaran,nama_mata_pelajaran',
                'materi:id_materi,id_mata_pelajaran,nama_materi',
                'materi.mataPelajaran:id_mata_pelajaran,nama_mata_pelajaran',
                'jenisPenilaian:id_jenis_penilaian,nama_jenis'
            ])
            ->whereHas('aktivitas', function ($aktivitasQuery) use ($shelterId, $companyId) {
                $aktivitasQuery->where('id_shelter', $shelterId);

                if ($companyId && Schema::hasColumn('aktivitas', 'company_id')) {
                    $aktivitasQuery->where('aktivitas.company_id', $companyId);
                }
            });

        if ($startDate) {
            $query->whereDate('tanggal_penilaian', '>=', $startDate->toDateString());
        }

        if ($endDate) {
            $query->whereDate('tanggal_penilaian', '<=', $endDate->toDateString());
        }

        if (!empty($filters['jenis_kegiatan'])) {
            $jenisKegiatan = $filters['jenis_kegiatan'];

            $query->whereHas('aktivitas', function ($aktivitasQuery) use ($jenisKegiatan) {
                $aktivitasQuery->where(function ($subQuery) use ($jenisKegiatan) {
                    $subQuery->where('jenis_kegiatan', $jenisKegiatan)
                        ->orWhereHas('kegiatan', function ($kegiatanQuery) use ($jenisKegiatan) {
                            $kegiatanQuery->where('nama_kegiatan', $jenisKegiatan);
                        });
                });
            });
        }

        $paginator = $query
            ->orderByDesc('tanggal_penilaian')
            ->orderByDesc('id_penilaian')
            ->paginate($perPage);

        $items = $paginator->getCollection()->map(function (Penilaian $penilaian) {
            return $this->transformPenilaian($penilaian);
        })->values();

        return response()->json([
            'success' => true,
            'message' => 'Laporan pencapaian berhasil diambil.',
            'data' => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'filters' => [
                'start_date' => $startInput,
                'end_date' => $endInput,
                'jenis_kegiatan' => $filters['jenis_kegiatan'] ?? null,
            ],
        ]);
    }

    private function transformPenilaian(Penilaian $penilaian): array
    {
        $tanggal = $penilaian->tanggal_penilaian
            ? Carbon::parse($penilaian->tanggal_penilaian)
            : null;
        $anak = $penilaian->anak;
        $kelompokId = $anak?->id_kelompok;
        $kelompokName = $anak?->kelompok?->nama_kelompok;

        if (empty($kelompokName) && $penilaian->aktivitas) {
            $kelompokName = $penilaian->aktivitas->nama_kelompok ?: null;
        }

        $kelompok = null;
        if ($kelompokId !== null || !empty($kelompokName)) {
            $kelompok = [
                'id' => $kelompokId !== null ? (int) $kelompokId : null,
                'nama' => $kelompokName ?: null,
            ];
        }

        return [
            'id_penilaian' => $penilaian->id_penilaian,
            'anak' => [
                'id' => $penilaian->id_anak,
                'nama' => $anak?->full_name,
                'id_kelompok' => $kelompokId !== null ? (int) $kelompokId : null,
                'nama_kelompok' => $kelompokName ?: null,
            ],
            'kelompok' => $kelompok,
            'jenis_penilaian' => $penilaian->jenisPenilaian?->nama_jenis,
            'jenis_kegiatan' => $this->resolveJenisKegiatan($penilaian),
            'nama_aktivitas' => $this->buildActivityName($penilaian),
            'nilai' => $penilaian->nilai !== null ? (float) $penilaian->nilai : null,
            'deskripsi_tugas' => $penilaian->deskripsi_tugas,
            'catatan' => $penilaian->catatan,
            'tanggal_penilaian' => $tanggal ? $this->formatDisplayDate($tanggal) : null,
            'tanggal_penilaian_iso' => $tanggal ? $tanggal->toDateString() : null,
        ];
    }

    private function resolveJenisKegiatan(Penilaian $penilaian): ?string
    {
        $aktivitas = $penilaian->aktivitas;

        if (!$aktivitas) {
            return null;
        }

        if (!empty($aktivitas->jenis_kegiatan)) {
            return $aktivitas->jenis_kegiatan;
        }

        if ($aktivitas->kegiatan) {
            return $aktivitas->kegiatan->nama_kegiatan;
        }

        return null;
    }

    private function buildActivityName(Penilaian $penilaian): ?string
    {
        $subject = $penilaian->mata_pelajaran_manual;
        $material = $penilaian->materi_manual ?? $penilaian->materi_text;

        $materi = $penilaian->materi;
        if (!$materi && $penilaian->aktivitas) {
            $materi = $penilaian->aktivitas->materiRelation;
        }

        if (!$subject && $materi && $materi->mataPelajaran) {
            $subject = $materi->mataPelajaran->nama_mata_pelajaran;
        }

        if (!$subject && $penilaian->aktivitas && $penilaian->aktivitas->mata_pelajaran_manual) {
            $subject = $penilaian->aktivitas->mata_pelajaran_manual;
        }

        if (!$material && $materi && !empty($materi->nama_materi)) {
            $material = $materi->nama_materi;
        }

        if (
            !$material
            && $penilaian->aktivitas
            && ($penilaian->aktivitas->materi_manual || $penilaian->aktivitas->materi)
        ) {
            $material = $penilaian->aktivitas->materi_manual ?: $penilaian->aktivitas->materi;
        }

        $parts = array_filter([
            $subject ? trim($subject) : null,
            $material ? trim($material) : null,
        ], fn ($value) => $value !== null && $value !== '');

        if (empty($parts)) {
            return null;
        }

        return implode(' - ', $parts);
    }

    private function parseFilterDate($value): ?Carbon
    {
        if (!is_string($value) || trim($value) === '') {
            return null;
        }

        $value = trim($value);

        try {
            return Carbon::createFromFormat('Y-m-d', $value)->startOfDay();
        } catch (\Exception $e) {
            // ignore and try the next format
        }

        try {
            return Carbon::createFromLocaleFormat('d F Y', 'id', $value)->startOfDay();
        } catch (\Exception $e) {
            return null;
        }
    }

    private function formatDisplayDate(Carbon $date): string
    {
        return $date->locale('id')->translatedFormat('j F Y');
    }
}
