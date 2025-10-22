<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Anak;
use App\Http\Resources\Anak\AnakCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AdminShelterAnakController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->adminShelter) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $query = Anak::where('id_shelter', $user->adminShelter->id_shelter)
                     ->withActiveFamily();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('nick_name', 'like', "%{$search}%")
                  ->orWhere('nik_anak', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status_validasi', $request->status);
        }

        if ($request->has('id_level_anak_binaan')) {
            if ($request->id_level_anak_binaan === 'null') {
                $query->whereNull('id_level_anak_binaan');
            } else {
                $query->where('id_level_anak_binaan', $request->id_level_anak_binaan);
            }
        }

        if ($request->has('id_kelompok')) {
            if ($request->id_kelompok === 'null') {
                $query->whereNull('id_kelompok');
            } else {
                $query->where('id_kelompok', $request->id_kelompok);
            }
        }

        if ($request->has('jenis_anak_binaan')) {
            $query->where('jenis_anak_binaan', $request->jenis_anak_binaan);
        }

        if ($request->has('hafalan')) {
            $query->where('hafalan', $request->hafalan);
        }

        $perPage = $request->per_page ?? 10;

        $query->with(['kelompok', 'shelter', 'anakPendidikan', 'levelAnakBinaan', 'keluarga']);

        $anak = $query->latest()->paginate($perPage);

        $summary = [
            'total' => Anak::where('id_shelter', $user->adminShelter->id_shelter)
                          ->withActiveFamily()
                          ->count(),
            'anak_aktif' => Anak::where('id_shelter', $user->adminShelter->id_shelter)
                            ->withActiveFamily()
                            ->where('status_validasi', 'aktif')
                            ->count(),
            'anak_tidak_aktif' => Anak::where('id_shelter', $user->adminShelter->id_shelter)
                                ->withActiveFamily()
                                ->where('status_validasi', 'non-aktif')
                                ->count(),
            'dengan_kelompok' => Anak::where('id_shelter', $user->adminShelter->id_shelter)
                                ->withActiveFamily()
                                ->whereNotNull('id_kelompok')
                                ->count(),
            'tanpa_kelompok' => Anak::where('id_shelter', $user->adminShelter->id_shelter)
                                ->withActiveFamily()
                                ->whereNull('id_kelompok')
                                ->count(),
        ];

        return response()->json([
            'success' => true,
            'message' => 'Daftar Anak',
            'data' => AnakCollection::collection($anak),
            'pagination' => [
                'total' => $anak->total(),
                'per_page' => $anak->perPage(),
                'current_page' => $anak->currentPage(),
                'last_page' => $anak->lastPage(),
                'from' => $anak->firstItem(),
                'to' => $anak->lastItem()
            ],
            'summary' => $summary
        ], 200);
    }

    public function show($id)
    {
        $user = Auth::user();
        
        if (!$user->adminShelter) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $anak = Anak::where('id_shelter', $user->adminShelter->id_shelter)
                    ->withActiveFamily()
                    ->with([
                        'keluarga', 
                        'kelompok', 
                        'shelter', 
                        'anakPendidikan',
                        'levelAnakBinaan'
                    ])
                    ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Detail Anak',
            'data' => new AnakCollection($anak)
        ], 200);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->adminShelter) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $validatedData = $request->validate([
            'id_keluarga' => 'required|exists:keluarga,id_keluarga',
            'id_anak_pend' => 'nullable|exists:anak_pendidikan,id_anak_pend',
            'id_kelompok' => 'nullable|exists:kelompok,id_kelompok',
            'nik_anak' => 'nullable|unique:anak,nik_anak|max:16',
            'anak_ke' => 'nullable|integer',
            'dari_bersaudara' => 'nullable|integer',
            'nick_name' => 'nullable|string|max:255',
            'full_name' => 'nullable|string|max:255',
            'alamat' => 'nullable|string|max:255',
            'agama' => 'nullable|in:Islam,Kristen,Katolik,Buddha,Hindu,Konghucu',
            'tempat_lahir' => 'nullable|string|max:255',
            'tanggal_lahir' => 'nullable|date',
            'jenis_kelamin' => 'nullable|in:Laki-laki,Perempuan',
            'tinggal_bersama' => 'nullable|in:Ayah,Ibu,Ayah dan Ibu,Wali',
            'jenis_anak_binaan' => 'nullable|in:BCPB,NPB',
            'hafalan' => 'nullable|in:Tahfidz,Non-Tahfidz',
            'status_validasi' => 'nullable|in:aktif,non-aktif,Ditolak,Ditangguhkan',
            'foto' => 'nullable|image|max:2048',
            'background_story' => 'nullable|string',
            'educational_goals' => 'nullable|string',
            'personality_traits' => 'nullable',
            'special_needs' => 'nullable|string',
            'marketplace_featured' => 'nullable|boolean',
            'jenjang' => 'nullable|string|in:belum_sd,sd,smp,sma,perguruan_tinggi',
            'kelas' => 'nullable|string|max:255',
            'nama_sekolah' => 'nullable|string|max:255',
            'alamat_sekolah' => 'nullable|string|max:255',
            'jurusan' => 'nullable|string|max:255',
            'semester' => 'nullable|integer',
            'nama_pt' => 'nullable|string|max:255',
            'alamat_pt' => 'nullable|string|max:255',
        ]);

        $validatedData = $this->normalizeAnakPayload($validatedData);
        $validatedData['id_shelter'] = $user->adminShelter->id_shelter;

        $educationFields = ['jenjang', 'kelas', 'nama_sekolah', 'alamat_sekolah', 'jurusan', 'semester', 'nama_pt', 'alamat_pt'];
        $educationData = [];

        foreach ($educationFields as $field) {
            if (array_key_exists($field, $validatedData)) {
                $educationData[$field] = $validatedData[$field];
                unset($validatedData[$field]);
            }
        }

        $educationData = array_filter(
            $educationData,
            static fn ($value) => $value !== null && $value !== ''
        );

        if (array_key_exists('id_kelompok', $validatedData)) {
            if ($validatedData['id_kelompok']) {
                $kelompok = \App\Models\Kelompok::findOrFail($validatedData['id_kelompok']);
                $validatedData['id_level_anak_binaan'] = $kelompok->id_level_anak_binaan;
            } else {
                $validatedData['id_level_anak_binaan'] = null;
            }
        }

        $anak = new Anak($validatedData);

        if (array_key_exists('alamat', $validatedData)) {
            $anak->alamat = $validatedData['alamat'];
        }

        $anak->status_validasi = $validatedData['status_validasi'] ?? 'non-aktif';

        if (array_key_exists('jenis_anak_binaan', $validatedData)) {
            $anak->status_cpb = $validatedData['jenis_anak_binaan'] === 'BCPB'
                ? Anak::STATUS_CPB_BCPB
                : ($validatedData['jenis_anak_binaan'] === 'NPB'
                    ? Anak::STATUS_CPB_NPB
                    : null);
        }

        $anak->save();

        if (!empty($educationData)) {
            $educationPayload = array_merge(
                ['id_keluarga' => $anak->id_keluarga],
                $educationData
            );

            $educationAttributes = [];

            if ($anak->id_anak_pend) {
                $educationAttributes['id_anak_pend'] = $anak->id_anak_pend;
            }

            $pendidikan = $educationAttributes
                ? $anak->anakPendidikan()->updateOrCreate($educationAttributes, $educationPayload)
                : $anak->anakPendidikan()->create($educationPayload);

            if ($anak->id_anak_pend !== $pendidikan->id_anak_pend) {
                $anak->id_anak_pend = $pendidikan->id_anak_pend;
                $anak->save();
            }
        }

        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs("Anak/{$anak->id_anak}", $filename, 'public');
            $anak->foto = $filename;
            $anak->save();
        }

        $anak->load('anakPendidikan');

        return response()->json([
            'success' => true,
            'message' => 'Anak berhasil ditambahkan',
            'data' => new AnakCollection($anak)
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        
        if (!$user->adminShelter) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $anak = Anak::where('id_shelter', $user->adminShelter->id_shelter)
                    ->findOrFail($id);

        $validatedData = $request->validate([
            'id_keluarga' => 'sometimes|nullable|exists:keluarga,id_keluarga',
            'id_anak_pend' => 'nullable|exists:anak_pendidikan,id_anak_pend',
            'id_kelompok' => 'nullable|exists:kelompok,id_kelompok',
            'nik_anak' => 'nullable|unique:anak,nik_anak,' . $anak->id_anak . ',id_anak|max:16',
            'anak_ke' => 'nullable|integer',
            'dari_bersaudara' => 'nullable|integer',
            'nick_name' => 'sometimes|nullable|string|max:255',
            'full_name' => 'sometimes|nullable|string|max:255',
            'alamat' => 'sometimes|nullable|string|max:255',
            'agama' => 'sometimes|nullable|in:Islam,Kristen,Katolik,Buddha,Hindu,Konghucu',
            'tempat_lahir' => 'sometimes|nullable|string|max:255',
            'tanggal_lahir' => 'sometimes|nullable|date',
            'jenis_kelamin' => 'sometimes|nullable|in:Laki-laki,Perempuan',
            'tinggal_bersama' => 'sometimes|nullable|in:Ayah,Ibu,Ayah dan Ibu,Wali',
            'jenis_anak_binaan' => 'sometimes|nullable|in:BCPB,NPB',
            'hafalan' => 'sometimes|nullable|in:Tahfidz,Non-Tahfidz',
            'status_validasi' => 'sometimes|nullable|in:aktif,non-aktif,Ditolak,Ditangguhkan',
            'foto' => 'nullable|image|max:2048',
            'background_story' => 'nullable|string',
            'educational_goals' => 'nullable|string',
            'personality_traits' => 'nullable',
            'special_needs' => 'nullable|string',
            'marketplace_featured' => 'nullable|boolean',
            'jenjang' => 'sometimes|nullable|string|in:belum_sd,sd,smp,sma,perguruan_tinggi',
            'kelas' => 'sometimes|nullable|string|max:255',
            'nama_sekolah' => 'sometimes|nullable|string|max:255',
            'alamat_sekolah' => 'sometimes|nullable|string|max:255',
            'jurusan' => 'sometimes|nullable|string|max:255',
            'semester' => 'sometimes|nullable|integer',
            'nama_pt' => 'sometimes|nullable|string|max:255',
            'alamat_pt' => 'sometimes|nullable|string|max:255',
        ]);

        $validatedData = $this->normalizeAnakPayload($validatedData);

        $educationFields = ['jenjang', 'kelas', 'nama_sekolah', 'alamat_sekolah', 'jurusan', 'semester', 'nama_pt', 'alamat_pt'];
        $educationData = [];

        foreach ($educationFields as $field) {
            if (array_key_exists($field, $validatedData)) {
                $educationData[$field] = $validatedData[$field];
                unset($validatedData[$field]);
            }
        }

        $educationData = array_filter(
            $educationData,
            static fn ($value) => $value !== null && $value !== ''
        );

        if (array_key_exists('id_kelompok', $validatedData)) {
            if ($validatedData['id_kelompok']) {
                $kelompok = \App\Models\Kelompok::findOrFail($validatedData['id_kelompok']);
                $validatedData['id_level_anak_binaan'] = $kelompok->id_level_anak_binaan;
            } else {
                $validatedData['id_level_anak_binaan'] = null;
            }
        }

        $anak->fill($validatedData);

        if (array_key_exists('alamat', $validatedData)) {
            $anak->alamat = $validatedData['alamat'];
        }

        if (array_key_exists('jenis_anak_binaan', $validatedData)) {
            $anak->status_cpb = $validatedData['jenis_anak_binaan'] === 'BCPB'
                ? Anak::STATUS_CPB_BCPB
                : ($validatedData['jenis_anak_binaan'] === 'NPB'
                    ? Anak::STATUS_CPB_NPB
                    : null);
        }

        if ($request->hasFile('foto')) {
            if ($anak->foto) {
                Storage::disk('public')->delete("Anak/{$anak->id_anak}/{$anak->foto}");
            }

            $file = $request->file('foto');
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs("Anak/{$anak->id_anak}", $filename, 'public');
            $anak->foto = $filename;
        }

        $anak->save();

        if (!empty($educationData)) {
            $educationPayload = array_merge(
                ['id_keluarga' => $anak->id_keluarga],
                $educationData
            );

            $educationAttributes = [];

            if ($anak->id_anak_pend) {
                $educationAttributes['id_anak_pend'] = $anak->id_anak_pend;
            }

            $pendidikan = $educationAttributes
                ? $anak->anakPendidikan()->updateOrCreate($educationAttributes, $educationPayload)
                : $anak->anakPendidikan()->create($educationPayload);

            if ($anak->id_anak_pend !== $pendidikan->id_anak_pend) {
                $anak->id_anak_pend = $pendidikan->id_anak_pend;
                $anak->save();
            }
        }

        $anak->load('anakPendidikan');

        return response()->json([
            'success' => true,
            'message' => 'Anak berhasil diperbarui',
            'data' => new AnakCollection($anak)
        ], 200);
    }

    private function normalizeAnakPayload(array $data): array
    {
        $numericFields = [
            'id_anak_pend',
            'id_kelompok',
            'id_level_anak_binaan',
            'anak_ke',
            'dari_bersaudara',
            'semester',
        ];

        foreach ($numericFields as $field) {
            if (array_key_exists($field, $data)) {
                $value = $data[$field];

                if ($value === '' || $value === null || $value === '0' || $value === 'null') {
                    $data[$field] = null;
                } elseif ($value !== null && $value !== '') {
                    $data[$field] = is_numeric($value) ? (int) $value : $value;
                }
            }
        }

        $stringFields = [
            'nik_anak',
            'nick_name',
            'full_name',
            'alamat',
            'agama',
            'tempat_lahir',
            'tanggal_lahir',
            'jenis_kelamin',
            'tinggal_bersama',
            'jenis_anak_binaan',
            'hafalan',
            'status_validasi',
            'background_story',
            'educational_goals',
            'special_needs',
            'jenjang',
            'kelas',
            'nama_sekolah',
            'alamat_sekolah',
            'jurusan',
            'nama_pt',
            'alamat_pt',
        ];

        foreach ($stringFields as $field) {
            if (array_key_exists($field, $data) && ($data[$field] === '' || $data[$field] === 'null' || $data[$field] === '0')) {
                $data[$field] = null;
            }
        }

        if (array_key_exists('marketplace_featured', $data)) {
            $value = $data['marketplace_featured'];

            if ($value === '' || $value === null || $value === 'null') {
                $data['marketplace_featured'] = null;
            } else {
                $booleanValue = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                $data['marketplace_featured'] = $booleanValue;
            }
        }

        if (array_key_exists('personality_traits', $data)) {
            $traits = $data['personality_traits'];

            if ($traits === '' || $traits === null || $traits === '[]' || $traits === 'null') {
                $data['personality_traits'] = null;
            } elseif (is_string($traits)) {
                $values = array_filter(array_map('trim', explode(',', $traits)), fn ($trait) => $trait !== '');
                $data['personality_traits'] = $values ? array_values($values) : null;
            } elseif (is_array($traits)) {
                $values = array_filter(array_map('trim', $traits), fn ($trait) => $trait !== '');
                $data['personality_traits'] = $values ? array_values($values) : null;
            }
        }

        return $data;
    }

    public function toggleStatus($id)
    {
        $user = Auth::user();

        if (!$user->adminShelter) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $anak = Anak::where('id_shelter', $user->adminShelter->id_shelter)
                    ->findOrFail($id);

        $newStatus = $anak->status_validasi === 'aktif' ? 'non-aktif' : 'aktif';
        $anak->status_validasi = $newStatus;
        $anak->save();

        return response()->json([
            'success' => true,
            'message' => 'Status anak berhasil diubah menjadi ' . $newStatus,
            'data' => [
                'id_anak' => $anak->id_anak,
                'status_validasi' => $anak->status_validasi
            ]
        ], 200);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        
        if (!$user->adminShelter) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access'
            ], 403);
        }

        $anak = Anak::where('id_shelter', $user->adminShelter->id_shelter)
                    ->findOrFail($id);

        if ($anak->id_kelompok) {
            $kelompok = \App\Models\Kelompok::find($anak->id_kelompok);
            if ($kelompok) {
                $kelompok->jumlah_anggota = $kelompok->anak()->where('id_anak', '!=', $id)->count();
                $kelompok->save();
            }
        }

        if ($anak->foto) {
            Storage::disk('public')->delete("Anak/{$anak->id_anak}/{$anak->foto}");
        }

        $anak->delete();

        return response()->json([
            'success' => true,
            'message' => 'Anak berhasil dihapus'
        ], 200);
    }
}