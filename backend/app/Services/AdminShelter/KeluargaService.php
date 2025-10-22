<?php

namespace App\Services\AdminShelter;

use App\Models\Keluarga;
use App\Models\Anak;
use App\Models\AnakPendidikan;
use App\Models\Ayah;
use App\Models\Ibu;
use App\Models\Wali;
use App\Models\Survey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class KeluargaService
{
    public function getKeluargaList(Request $request)
    {
        $perPage = $request->get('per_page', 10);
        $search = $request->get('search', '');
        
        $query = Keluarga::with(['shelter', 'wilbin', 'kacab'])
            ->where('id_shelter', Auth::user()->adminShelter->id_shelter);
            
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('kepala_keluarga', 'like', "%{$search}%")
                  ->orWhere('no_kk', 'like', "%{$search}%");
            });
        }
        
        $keluarga = $query->orderBy('created_at', 'desc')->paginate($perPage);
        
        return [
            'data' => $keluarga->items(),
            'pagination' => [
                'current_page' => $keluarga->currentPage(),
                'last_page' => $keluarga->lastPage(),
                'per_page' => $keluarga->perPage(),
                'total' => $keluarga->total(),
            ]
        ];
    }

    public function getKeluargaDetail($id)
    {
        $keluarga = Keluarga::with([
            'ayah', 'ibu', 'wali', 'shelter', 'wilbin', 'kacab', 'bank', 'surveys'
        ])->findOrFail($id);
        
        $anak = Anak::with(['anakPendidikan'])->where('id_keluarga', $id)->get();
        
        return [
            'keluarga' => $keluarga,
            'anak' => $anak
        ];
    }

    public function createKeluarga(array $data)
    {
        return DB::transaction(function () use ($data) {
            // Create family
            $keluargaData = $this->extractKeluargaData($data);
            $keluarga = Keluarga::create($keluargaData);
            
            // Create parents
            $this->createParentData($keluarga->id_keluarga, $data);
            
            // Create guardian if yatim piatu
            if ($data['status_ortu'] === 'yatim piatu') {
                $this->createGuardianData($keluarga->id_keluarga, $data);
            }
            
            // Create education data first to get id_anak_pend
            $anakPendidikan = $this->createEducationData($keluarga->id_keluarga, $data);
            
            // Create child with id_anak_pend
            $anak = $this->createChildData($keluarga->id_keluarga, $data, $anakPendidikan->id_anak_pend);
            
            // Create survey data
            $this->createSurveyData($keluarga->id_keluarga, $data);
            
            return $keluarga->load(['ayah', 'ibu', 'wali', 'anak']);
        });
    }

    public function updateKeluarga($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $keluarga = Keluarga::findOrFail($id);
            
            // Update family data
            $keluargaData = $this->extractKeluargaData($data);
            $keluarga->update($keluargaData);
            
            // Update parents
            $this->updateParentData($id, $data);
            
            // Update guardian if yatim piatu
            if ($data['status_ortu'] === 'yatim piatu') {
                $this->updateGuardianData($id, $data);
            } else {
                // Remove guardian if status changed
                Wali::where('id_keluarga', $id)->delete();
            }
            
            // Update child and link to education data
            $this->updateChildData($id, $data);
            
            // Update survey data
            $this->updateSurveyData($id, $data);
            
            return $keluarga->fresh();
        });
    }

    public function deleteKeluarga($id)
    {
        return DB::transaction(function () use ($id) {
            $keluarga = Keluarga::findOrFail($id);
            
            // Check for active children
            $activeChildren = Anak::where('id_keluarga', $id)
                ->where('status_validasi', 'aktif')
                ->count();
                
            if ($activeChildren > 0) {
                throw new \Exception('HAS_ACTIVE_CHILDREN');
            }
            
            // Delete related data
            $this->deleteRelatedData($id);
            
            // Delete family
            $keluarga->delete();
            
            return ['deleted_id' => $id];
        });
    }

    public function forceDeleteKeluarga($id)
    {
        return DB::transaction(function () use ($id) {
            $keluarga = Keluarga::findOrFail($id);
            
            // Update children status to 'tanpa keluarga'
            $affectedChildren = Anak::where('id_keluarga', $id)
                ->where('status_validasi', 'aktif')
                ->update(['status_validasi' => 'tanpa keluarga']);
            
            // Delete related data
            $this->deleteRelatedData($id);
            
            // Delete family
            $keluarga->delete();
            
            return [
                'deleted_id' => $id,
                'affected_children' => $affectedChildren
            ];
        });
    }

    private function extractKeluargaData(array $data): array
    {
        $adminShelter = Auth::user()->adminShelter->load('shelter.wilbin.kacab');
        $shelter = $adminShelter->shelter;
        $wilbin = $shelter->wilbin;
        $kacab = $wilbin->kacab;
        
        return [
            'id_shelter' => $shelter->id_shelter,
            'id_wilbin' => $wilbin->id_wilbin,
            'id_kacab' => $kacab->id_kacab,
            'no_kk' => $data['no_kk'],
            'kepala_keluarga' => $data['kepala_keluarga'],
            'status_ortu' => $data['status_ortu'],
            'id_bank' => $data['id_bank'] ?? null,
            'no_rek' => $data['no_rek'] ?? null,
            'an_rek' => $data['an_rek'] ?? null,
            'no_tlp' => $data['no_tlp'] ?? null,
            'an_tlp' => $data['an_tlp'] ?? null,
        ];
    }

    private function createParentData($keluargaId, array $data): void
    {
        // Create father
        Ayah::create([
            'id_keluarga' => $keluargaId,
            'nik_ayah' => $data['nik_ayah'] ?? null,
            'nama_ayah' => $data['nama_ayah'],
            'agama' => $data['agama_ayah'] ?? null,
            'tempat_lahir' => $data['tempat_lahir_ayah'] ?? null,
            'tanggal_lahir' => $data['tanggal_lahir_ayah'] ?? null,
            'alamat' => $data['alamat_ayah'] ?? null,
            'penghasilan' => $data['penghasilan_ayah'] ?? null,
            'tanggal_kematian' => $data['tanggal_kematian_ayah'] ?? null,
            'penyebab_kematian' => $data['penyebab_kematian_ayah'] ?? null,
        ]);
        
        // Create mother
        Ibu::create([
            'id_keluarga' => $keluargaId,
            'nik_ibu' => $data['nik_ibu'] ?? null,
            'nama_ibu' => $data['nama_ibu'],
            'agama' => $data['agama_ibu'] ?? null,
            'tempat_lahir' => $data['tempat_lahir_ibu'] ?? null,
            'tanggal_lahir' => $data['tanggal_lahir_ibu'] ?? null,
            'alamat' => $data['alamat_ibu'] ?? null,
            'penghasilan' => $data['penghasilan_ibu'] ?? null,
            'tanggal_kematian' => $data['tanggal_kematian_ibu'] ?? null,
            'penyebab_kematian' => $data['penyebab_kematian_ibu'] ?? null,
        ]);
    }

    private function updateParentData($keluargaId, array $data): void
    {
        // Update father
        Ayah::updateOrCreate(
            ['id_keluarga' => $keluargaId],
            [
                'nik_ayah' => $data['nik_ayah'] ?? null,
                'nama_ayah' => $data['nama_ayah'],
                'agama' => $data['agama_ayah'] ?? null,
                'tempat_lahir' => $data['tempat_lahir_ayah'] ?? null,
                'tanggal_lahir' => $data['tanggal_lahir_ayah'] ?? null,
                'alamat' => $data['alamat_ayah'] ?? null,
                'penghasilan' => $data['penghasilan_ayah'] ?? null,
                'tanggal_kematian' => $data['tanggal_kematian_ayah'] ?? null,
                'penyebab_kematian' => $data['penyebab_kematian_ayah'] ?? null,
            ]
        );
        
        // Update mother
        Ibu::updateOrCreate(
            ['id_keluarga' => $keluargaId],
            [
                'nik_ibu' => $data['nik_ibu'] ?? null,
                'nama_ibu' => $data['nama_ibu'],
                'agama' => $data['agama_ibu'] ?? null,
                'tempat_lahir' => $data['tempat_lahir_ibu'] ?? null,
                'tanggal_lahir' => $data['tanggal_lahir_ibu'] ?? null,
                'alamat' => $data['alamat_ibu'] ?? null,
                'penghasilan' => $data['penghasilan_ibu'] ?? null,
                'tanggal_kematian' => $data['tanggal_kematian_ibu'] ?? null,
                'penyebab_kematian' => $data['penyebab_kematian_ibu'] ?? null,
            ]
        );
    }

    private function createGuardianData($keluargaId, array $data): void
    {
        if (isset($data['nama_wali'])) {
            Wali::create([
                'id_keluarga' => $keluargaId,
                'nik_wali' => $data['nik_wali'],
                'nama_wali' => $data['nama_wali'],
                'agama' => $data['agama_wali'],
                'tempat_lahir' => $data['tempat_lahir_wali'],
                'tanggal_lahir' => $data['tanggal_lahir_wali'],
                'alamat' => $data['alamat_wali'],
                'penghasilan' => $data['penghasilan_wali'],
                'hub_kerabat' => $data['hub_kerabat_wali'],
            ]);
        }
    }

    private function updateGuardianData($keluargaId, array $data): void
    {
        if (isset($data['nama_wali'])) {
            Wali::updateOrCreate(
                ['id_keluarga' => $keluargaId],
                [
                    'nik_wali' => $data['nik_wali'],
                    'nama_wali' => $data['nama_wali'],
                    'agama' => $data['agama_wali'],
                    'tempat_lahir' => $data['tempat_lahir_wali'],
                    'tanggal_lahir' => $data['tanggal_lahir_wali'],
                    'alamat' => $data['alamat_wali'],
                    'penghasilan' => $data['penghasilan_wali'],
                    'hub_kerabat' => $data['hub_kerabat_wali'],
                ]
            );
        }
    }

    private function createChildData($keluargaId, array $data, $idAnakPend = null): Anak
    {
        $shelterId = Auth::user()->adminShelter->id_shelter;
        
        $childData = $this->sanitizeChildData([
            'id_keluarga' => $keluargaId,
            'id_shelter' => $shelterId,
            'id_anak_pend' => $idAnakPend,
            'nik_anak' => $data['nik_anak'],
            'anak_ke' => $data['anak_ke'],
            'dari_bersaudara' => $data['dari_bersaudara'],
            'nick_name' => $data['nick_name'],
            'full_name' => $data['full_name'],
            'agama' => $data['agama'],
            'tempat_lahir' => $data['tempat_lahir'],
            'tanggal_lahir' => $data['tanggal_lahir'],
            'jenis_kelamin' => $data['jenis_kelamin'],
            'tinggal_bersama' => $data['tinggal_bersama'],
            'hafalan' => $data['hafalan'],
            'pelajaran_favorit' => $data['pelajaran_favorit'] ?? null,
            'hobi' => $data['hobi'] ?? null,
            'prestasi' => $data['prestasi'] ?? null,
            'jarak_rumah' => $data['jarak_rumah'],
            'transportasi' => $data['transportasi'],
            'status_validasi' => 'aktif',
            'status_cpb' => 'BCPB',
        ]);

        $anak = Anak::create($childData);

        if (isset($data['foto'])) {
            $directory = "Anak/{$anak->id_anak}";
            $filename = $data['foto']->hashName();

            Storage::disk('public')->putFileAs($directory, $data['foto'], $filename);

            $anak->update(['foto' => $filename]);
        }

        return $anak;
    }

    private function updateChildData($keluargaId, array $data): void
    {
        $anak = Anak::where('id_keluarga', $keluargaId)->first();
        
        if ($anak) {
            $shelterId = Auth::user()->adminShelter->id_shelter;
            
            // Get the education record to link with id_anak_pend
            $anakPendidikan = AnakPendidikan::where('id_keluarga', $keluargaId)->first();
            
            $childData = $this->sanitizeChildData([
                'id_shelter' => $shelterId,
                'id_anak_pend' => $anakPendidikan ? $anakPendidikan->id_anak_pend : null,
                'nik_anak' => $data['nik_anak'],
                'anak_ke' => $data['anak_ke'],
                'dari_bersaudara' => $data['dari_bersaudara'],
                'nick_name' => $data['nick_name'],
                'full_name' => $data['full_name'],
                'agama' => $data['agama'],
                'tempat_lahir' => $data['tempat_lahir'],
                'tanggal_lahir' => $data['tanggal_lahir'],
                'jenis_kelamin' => $data['jenis_kelamin'],
                'tinggal_bersama' => $data['tinggal_bersama'],
                'hafalan' => $data['hafalan'],
                'pelajaran_favorit' => $data['pelajaran_favorit'] ?? null,
                'hobi' => $data['hobi'] ?? null,
                'prestasi' => $data['prestasi'] ?? null,
                'jarak_rumah' => $data['jarak_rumah'],
                'transportasi' => $data['transportasi'],
            ]);

            // Handle photo upload
            if (isset($data['foto'])) {
                if ($anak->foto) {
                    Storage::disk('public')->delete("Anak/{$anak->id_anak}/{$anak->foto}");
                }

                $directory = "Anak/{$anak->id_anak}";
                $filename = $data['foto']->hashName();

                Storage::disk('public')->putFileAs($directory, $data['foto'], $filename);

                $childData['foto'] = $filename;
            }

            $anak->update($childData);
        }
    }

    private function sanitizeChildData(array $childData): array
    {
        return array_map(function ($value) {
            if (is_string($value)) {
                $value = trim($value);
            }

            return $value === '' ? null : $value;
        }, $childData);
    }

    private function createEducationData($keluargaId, array $data): AnakPendidikan
    {
        $educationData = [
            'id_keluarga' => $keluargaId,
            'jenjang' => $data['jenjang'],
            'kelas' => $data['kelas'] ?? null,
            'nama_sekolah' => $data['nama_sekolah'] ?? null,
            'alamat_sekolah' => $data['alamat_sekolah'] ?? null,
            'jurusan' => $data['jurusan'] ?? null,
            'semester' => $data['semester'] ?? null,
            'nama_pt' => $data['nama_pt'] ?? null,
            'alamat_pt' => $data['alamat_pt'] ?? null,
        ];

        return AnakPendidikan::create(array_filter($educationData, function ($value) {
            return $value !== null && $value !== '';
        }));
    }

    private function createSurveyData($keluargaId, array $data): void
    {
        $surveyData = array_merge(
            ['id_keluarga' => $keluargaId],
            $this->buildSurveyDataPayload($data)
        );

        Survey::create($surveyData);
    }

    private function updateSurveyData($keluargaId, array $data): void
    {
        $surveyData = $this->buildSurveyDataPayload($data);

        Survey::updateOrCreate(
            ['id_keluarga' => $keluargaId],
            $surveyData
        );
    }

    private function buildSurveyDataPayload(array $data): array
    {
        $surveyData = [
            'pekerjaan_kepala_keluarga' => $this->getSurveyInput($data, 'pekerjaan_kepala_keluarga'),
            'penghasilan' => $this->getSurveyInput($data, 'penghasilan'),
            'pendidikan_kepala_keluarga' => $this->getSurveyInput($data, 'pendidikan_kepala_keluarga'),
            'jumlah_tanggungan' => $this->getSurveyInput($data, 'jumlah_tanggungan'),
            'kepemilikan_tabungan' => $this->getSurveyInput($data, 'kepemilikan_tabungan'),
            'jumlah_makan' => $this->getSurveyInput($data, 'jumlah_makan'),
            'kepemilikan_tanah' => $this->getSurveyInput($data, 'kepemilikan_tanah'),
            'kepemilikan_rumah' => $this->getSurveyInput($data, 'kepemilikan_rumah'),
            'kondisi_rumah_dinding' => $this->getSurveyInput($data, 'kondisi_rumah_dinding'),
            'kondisi_rumah_lantai' => $this->getSurveyInput($data, 'kondisi_rumah_lantai'),
            'kepemilikan_kendaraan' => $this->getSurveyInput($data, 'kepemilikan_kendaraan'),
            'kepemilikan_elektronik' => $this->getSurveyInput($data, 'kepemilikan_elektronik'),
            'sumber_air_bersih' => $this->getSurveyInput($data, 'sumber_air_bersih'),
            'jamban_limbah' => $this->getSurveyInput($data, 'jamban_limbah'),
            'tempat_sampah' => $this->getSurveyInput($data, 'tempat_sampah'),
            'perokok' => $this->getSurveyInput($data, 'perokok'),
            'konsumen_miras' => $this->getSurveyInput($data, 'konsumen_miras'),
            'persediaan_p3k' => $this->getSurveyInput($data, 'persediaan_p3k'),
            'makan_buah_sayur' => $this->getSurveyInput($data, 'makan_buah_sayur'),
            'solat_lima_waktu' => $this->getSurveyInput($data, 'solat_lima_waktu'),
            'membaca_alquran' => $this->getSurveyInput($data, 'membaca_alquran'),
            'majelis_taklim' => $this->getSurveyInput($data, 'majelis_taklim'),
            'membaca_koran' => $this->getSurveyInput($data, 'membaca_koran'),
            'pengurus_organisasi' => $this->getSurveyInput($data, 'pengurus_organisasi'),
            'pengurus_organisasi_sebagai' => $this->getSurveyInput($data, 'pengurus_organisasi_sebagai'),
            'kondisi_fisik_anak' => $this->getSurveyInput($data, 'kondisi_fisik_anak'),
            'keterangan_disabilitas' => $this->getSurveyInput($data, 'keterangan_disabilitas'),
            'kepribadian_anak' => $this->getSurveyInput($data, 'kepribadian_anak'),
            'biaya_pendidikan_perbulan' => $this->getSurveyInput($data, 'biaya_pendidikan_perbulan'),
            'bantuan_lembaga_formal_lain' => $this->getSurveyInput($data, 'bantuan_lembaga_formal_lain'),
            'bantuan_lembaga_formal_lain_sebesar' => $this->getSurveyInput($data, 'bantuan_lembaga_formal_lain_sebesar'),
            'kondisi_penerima_manfaat' => $this->getSurveyInput($data, 'kondisi_penerima_manfaat'),
            'tanggal_survey' => $this->getSurveyInput($data, 'tanggal_survey', now()->format('Y-m-d')),
            'petugas_survey' => $this->getSurveyInput($data, 'petugas_survey', Auth::user()->name),
        ];

        $surveyData = array_map(function ($value) {
            if (is_string($value)) {
                $value = trim($value);
            }

            return $value === '' ? null : $value;
        }, $surveyData);

        return array_filter($surveyData, function ($value) {
            return !(is_string($value) && $value === '');
        });
    }

    private function getSurveyInput(array $data, string $key, $default = null)
    {
        return array_key_exists($key, $data) ? $data[$key] : $default;
    }

    private function deleteRelatedData($keluargaId): void
    {
        // Delete in correct order to avoid foreign key constraints
        AnakPendidikan::where('id_keluarga', $keluargaId)->delete();
        Survey::where('id_keluarga', $keluargaId)->delete();
        Anak::where('id_keluarga', $keluargaId)->delete();
        Wali::where('id_keluarga', $keluargaId)->delete();
        Ibu::where('id_keluarga', $keluargaId)->delete();
        Ayah::where('id_keluarga', $keluargaId)->delete();
    }
}