<?php

namespace App\Http\Controllers\AdminShalter\PemberdayaanShelter\DataBinaan\DataSurvey;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Survey;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Keluarga;
use App\Models\AdminShelter;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DataSurveyShelterController extends Controller
{
    public function index(Request $request) {
        // Mendapatkan ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
    
        // Menyaring admin shelter berdasarkan user ID
        $adminShelter = AdminShelter::where('user_id', $user_id)->first();
    
        if (!$adminShelter) {
            abort(403, 'Admin Shelter tidak ditemukan.');
        }
    
        // Query dasar untuk data keluarga yang valid dan sesuai dengan admin shelter
         $query = Keluarga::with(['kacab', 'wilbin', 'shelter'])
                     ->whereDoesntHave('surveys')  // Menyaring keluarga yang belum memiliki survey
                     ->where('id_kacab', $adminShelter->id_kacab)  // Filter berdasarkan id_kacab dari admin shelter
                     ->where('id_shelter', $adminShelter->id_shelter);
    
        // Jika ada filter tambahan, misalnya berdasarkan id_wilbin dari request
        if ($request->has('wilbin_id')) {
            $query->where('id_wilbin', $request->get('wilbin_id')); // Filter berdasarkan id_wilbin
        }
    
        // Mengambil data keluarga yang sudah difilter
        $data_keluarga = $query->get();
    
        // Mengambil data untuk dropdown filter: Kacab dan Wilbin yang relevan dengan admin shelter yang login
        $kacab = Kacab::where('id_kacab', $adminShelter->id_kacab)->get();
        $wilbins = Wilbin::where('id_kacab', $adminShelter->id_kacab)->get();
        $shelter = Shelter::whereIn('id_wilbin', $wilbins->pluck('id_wilbin'))->get();
    
        // Kembalikan data ke view
        return view('AdminShalter.Pemberdayaan.DataBinaan.DataIsiSurvey.index', compact('data_keluarga', 'kacab', 'wilbins' , 'shelter'));
    }
    
    public function show($id_keluarga)
    {
        $keluarga = Keluarga::with(['kacab', 'wilbin', 'shelter', 'ayah', 'ibu'])->findOrFail($id_keluarga);
        $tab = request()->get('tab', 'data-keluarga');

        // Ambil data survei jika sudah ada
        $survey = Survey::where('id_keluarga', $id_keluarga)->first();

        return view('AdminShalter.Pemberdayaan.DataBinaan.DataIsiSurvey.surveykeluarga', compact('keluarga', 'tab', 'survey'));
    }

    public function store(Request $request, $id_keluarga)
    {
        $tab = $request->get('tab');

        // Buat aturan validasi untuk masing-masing tab
        $rules = [
            'data-keluarga' => [
                'pendidikan_kepala_keluarga' => 'required|string|in:Tidak Sekolah,Sekolah Dasar,SMP/MTS/SEDERAJAT,SMK/SMA/MA/SEDERAJAT,DIPLOMA I,DIPLOMA II,DIPLOMA III,STRATA-1,STRATA-2,STRATA-3,LAINNYA',
                'jumlah_tanggungan' => 'required|integer',
            ],
            'data-ekonomi' => [
                'pekerjaan_kepala_keluarga' => 'required|string|in:Petani,Nelayan,Peternak,PNS NON Dosen/Guru,Guru PNS,Guru Non PNS,Karyawan Swasta,Buruh,Wiraswasta,Wirausaha,Pedagang Kecil,Pedagang Besar,Pensiunan,Tidak Bekerja,Sudah Meninggal,Lainnya',
                'penghasilan' => 'required|string|in:dibawah_500k,500k_1500k,1500k_2500k,2500k_3500k,3500k_5000k,5000k_7000k,7000k_10000k,diatas_10000k',
                'kepemilikan_tabungan' => 'required|string|in:Ya,Tidak',
                'jumlah_makan' => 'required|string|in:Ya,Tidak',
            ],
            'data-asset' => [
                'kepemilikan_tanah' => 'required|string|in:Ya,Tidak',
                'kepemilikan_rumah' => 'required|string|in:Hak Milik,Sewa,Orang Tua,Saudara,Kerabat',
                'kondisi_rumah_dinding' => 'required|string|in:Tembok,Kayu,Papan,Geribik,Lainnya',
                'kondisi_rumah_lantai' => 'required|string|in:Keramik,Ubin,Marmer,Kayu,Tanah,Lainnya',
                'kepemilikan_kendaraan' => 'required|string|in:Sepeda,Motor,Mobil',
                'kepemilikan_elektronik' => 'required|string|in:Radio,Televisi,Handphone,Kulkas',
            ],
            'data-kesehatan' => [
                'sumber_air_bersih' => 'required|string|in:Sumur,Sungai,PDAM,Lainnya',
                'jamban_limbah' => 'required|string|in:Sungai,Sepitank,Lainnya',
                'tempat_sampah' => 'required|string|in:TPS,Sungai,Pekarangan',
                'perokok' => 'required|string|in:Ya,Tidak',
                'konsumen_miras' => 'required|string|in:Ya,Tidak',
                'persediaan_p3k' => 'required|string|in:Ya,Tidak',
                'makan_buah_sayur' => 'required|string|in:Ya,Tidak',
            ],
            'data-ibadah' => [
                'solat_lima_waktu' => 'required|string|in:Lengkap,Kadang-kadang,Tidak Pernah',
                'membaca_alquran' => 'required|string|in:Lancar,Terbata-bata,Tidak Bisa',
                'majelis_taklim' => 'required|string|in:Rutin,Jarang,Tidak Pernah',
                'membaca_koran' => 'required|string|in:Selalu,Jarang,Tidak Pernah',
                'pengurus_organisasi' => 'required|string|in:Ya,Tidak',
                'pengurus_organisasi_sebagai' => 'nullable|string|required_if:pengurus_organisasi,Ya',
            ],
            'data-lainnya' => [
                'status_anak' => 'required|string|in:Yatim,Dhuafa,Non Dhuafa',
                'biaya_pendidikan_perbulan' => 'required|string',
                'bantuan_lembaga_formal_lain' => 'required|string|in:Ya,Tidak',
                'bantuan_lembaga_formal_lain_sebesar' => 'nullable|string|required_if:bantuan_lembaga_formal_lain,Ya',
            ],
            'data-survey' => [
                'kondisi_penerima_manfaat' => 'nullable|string',
                'petugas_survey' => 'nullable|string',
                'hasil_survey' => 'nullable|string|in:Layak,Tidak Layak', 
                'keterangan_hasil' => 'nullable|string|max:255'
            ]
        ];

        // Validasi input berdasarkan tab
        $currentRules = $rules[$tab] ?? [];
        $request->validate($currentRules);

        // Ambil data dari semua tab untuk disimpan
        $dataToSave = [];
        foreach ($rules as $key => $ruleSet) {
            $dataToSave = array_merge($dataToSave, $request->only(array_keys($ruleSet)));
        }

         // Cek status hasil_survey sebelumnya
        $survey = Survey::where('id_keluarga', $id_keluarga)->first();
        if ($survey && $survey->hasil_survey === 'Tidak Layak') {
            // Set status ke 'Tambah Kelayakan' jika sebelumnya 'Tidak Layak'
            $dataToSave['hasil_survey'] = 'Tambah Kelayakan';
        }

        // Simpan atau update data
        Survey::updateOrCreate(
            ['id_keluarga' => $id_keluarga],
            array_merge($dataToSave, ['id_keluarga' => $id_keluarga])
        );

            // Ambil ulang data survei untuk memastikan perubahan terbaru
            $updatedSurvey = Survey::where('id_keluarga', $id_keluarga)->first();

            // Jika hasil survei menyatakan "Layak", ubah status_cpb anak menjadi "CPB"
            if ($updatedSurvey->hasil_survey === 'Layak') {
                Anak::where('id_keluarga', $id_keluarga)
                    ->update(['status_cpb' => Anak::STATUS_CPB_CPB]);
            }

        return redirect()->route('validasisurveykeluarga.shelter', ['id' => $id_keluarga, 'tab' => $tab])
            ->with('success', 'Data survey keluarga berhasil disimpan.');
    }
}
