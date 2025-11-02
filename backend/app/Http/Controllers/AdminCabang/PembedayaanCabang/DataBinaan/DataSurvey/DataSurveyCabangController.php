<?php

namespace App\Http\Controllers\AdminCabang\PembedayaanCabang\DataBinaan\DataSurvey;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\Survey;
use App\Models\Wilbin;
use App\Models\Shelter;
use App\Models\Keluarga;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class DataSurveyCabangController extends Controller
{
    public function index(Request $request) {
        // Mendapatkan ID pengguna yang sedang login
        $user_id = auth()->user()->id_users;
    
        // Menyaring admin cabang berdasarkan user ID
        $adminCabang = AdminCabang::where('user_id', $user_id)->first();
        
        if (!$adminCabang) {
            abort(403, 'Admin cabang tidak ditemukan.');
        }
    
        // Query dasar untuk data keluarga yang belum memiliki survey
        $query = Keluarga::with(['kacab', 'wilbin', 'shelter'])
                         ->whereDoesntHave('surveys')  // Menggunakan 'surveys' untuk mengecualikan keluarga yang sudah memiliki survey
                         ->where('id_kacab', $adminCabang->id_kacab);  // Menambahkan filter berdasarkan id_kacab admin cabang
    
        // Filter berdasarkan Wilayah Binaan (Wilbin) dan Shelter
        if ($request->filled('id_wilbin')) {
            $query->where('id_wilbin', $request->id_wilbin);
        }
    
        if ($request->filled('id_shelter')) {
            $query->where('id_shelter', $request->id_shelter);
        }
    
        // Mengambil data keluarga sesuai filter yang diterapkan
        $data_keluarga = $query->get();
    
        // Mengambil semua wilayah binaan dan shelter yang terkait dengan admin cabang
        $wilbins = Wilbin::where('id_kacab', $adminCabang->id_kacab)->get();
        $shelter = Shelter::whereIn('id_wilbin', $wilbins->pluck('id_wilbin'))->get(); // Mengambil shelter berdasarkan wilbin yang terkait dengan admin cabang
    
        // Mengambil semua data Kacab untuk dropdown filter (Hanya data cabang yang sesuai)
        $kacab = Kacab::where('id_kacab', $adminCabang->id_kacab)->get();
    
        return view('AdminCabang.Pemberdayaan.DataBinaan.DataIsiSurvey.index', compact('data_keluarga', 'kacab', 'wilbins', 'shelter'));
    }

    public function show($id_keluarga)
    {
        $keluarga = Keluarga::with(['kacab', 'wilbin', 'shelter', 'ayah', 'ibu'])->findOrFail($id_keluarga);
        $tab = request()->get('tab', 'data-keluarga');

        // Ambil data survei jika sudah ada
        $survey = Survey::where('id_keluarga', $id_keluarga)->first();

        return view('AdminCabang.Pemberdayaan.DataBinaan.DataIsiSurvey.surveykeluarga', compact('keluarga', 'tab', 'survey'));
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

        return redirect()->route('validasisurveykeluarga.cabang', ['id' => $id_keluarga, 'tab' => $tab])
            ->with('success', 'Data survey keluarga berhasil disimpan.');
    }
    
}
