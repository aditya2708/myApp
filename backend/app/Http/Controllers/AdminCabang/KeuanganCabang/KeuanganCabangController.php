<?php

namespace App\Http\Controllers\AdminCabang\KeuanganCabang;

use App\Models\Anak;
use App\Models\Keuangan;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class KeuanganCabangController extends Controller
{
    public function index() {
        $data_keuangan = Keuangan::with('anak')->get();
        $available_anak = Anak::whereNotIn('id_anak', $data_keuangan->pluck('id_anak'))
                              ->where('status_validasi', 'Aktif')
                              ->get();

        return view('AdminCabang.Keuangan.DataKeuangan.index', compact('data_keuangan', 'available_anak'));
    }

    public function store()
    {
        $available_anak = Anak::with('donatur')->get();  // Ambil semua data anak tanpa filter

        // Opsi tingkat sekolah dan faktor pengali biaya bimbel
        $tingkat_sekolah_options = [
            'SD' => 24,
            'SMP' => 24,
            'SMA' => 24,
            'TAHFIDZ SD' => 48,
            'TAHFIDZ SMP' => 48,
            'TAHFIDZ SMA' => 48,
            'NPB TAHFIDZ SD' => 6,
            'NPB TAHFIDZ SMP' => 6,
            'NPB TAHFIDZ SMA' => 6
        ];

        // Opsi kelas/semester menggunakan angka Romawi
        $kelas_semester_options = [];
        for ($i = 1; $i <= 12; $i++) {
            $kelas_romawi = $this->toRoman($i);
            $kelas_semester_options[] = "Kelas $kelas_romawi/Ganjil";
            $kelas_semester_options[] = "Kelas $kelas_romawi/Genap";
        }

        return view('AdminCabang.Keuangan.DataKeuangan.create', compact('available_anak', 'tingkat_sekolah_options', 'kelas_semester_options'));
    }

    // Fungsi untuk mengonversi angka menjadi angka Romawi
    private function toRoman($num) 
    {
        $map = [
            'XII' => 12, 'XI' => 11, 'X' => 10,
            'IX' => 9, 'VIII' => 8, 'VII' => 7,
            'VI' => 6, 'V' => 5, 'IV' => 4,
            'III' => 3, 'II' => 2, 'I' => 1
        ];
        $roman = '';
        foreach ($map as $romanNum => $intVal) {
            while ($num >= $intVal) {
                $roman .= $romanNum;
                $num -= $intVal;
            }
        }
        return $roman;
    }

    public function storeprosess(Request $request)
    {
        $request->validate([
            'id_anak' => 'required|exists:anak,id_anak',
            'tingkat_sekolah' => 'required|string|in:SD,SMP,SMA,TAHFIDZ SD,TAHFIDZ SMP,TAHFIDZ SMA,NPB TAHFIDZ SD,NPB TAHFIDZ SMP,NPB TAHFIDZ SMA',
            'semester' => 'required|string',
            'bimbel' => 'nullable|numeric',
            'eskul_dan_keagamaan' => 'nullable|numeric',
            'laporan' => 'nullable|numeric',
            'uang_tunai_nominal' => 'nullable|numeric',
            'uang_tunai_bulan' => 'nullable|integer',
            'donasi_nominal' => 'nullable|numeric',
            'donasi_bulan' => 'nullable|integer'
        ]);

        // Calculate total based on nominal and bulan
        $bimbel = $request->input('bimbel', 0);
        $eskul_dan_keagamaan = $request->input('eskul_dan_keagamaan', 0);
        $laporan = $request->input('laporan', 0);
        $uang_tunai = ($request->input('uang_tunai_nominal', 0) * $request->input('uang_tunai_bulan', 0));
        $donasi = ($request->input('donasi_nominal', 0) * $request->input('donasi_bulan', 0));

        // Hitung biaya bimbel sesuai tingkat sekolah
        $tingkat_sekolah = $request->input('tingkat_sekolah');
        $biaya_bimbel_faktor = [
            'SD' => 24,
            'SMP' => 24,
            'SMA' => 24,
            'TAHFIDZ SD' => 48,
            'TAHFIDZ SMP' => 48,
            'TAHFIDZ SMA' => 48,
            'NPB TAHFIDZ SD' => 6,
            'NPB TAHFIDZ SMP' => 6,
            'NPB TAHFIDZ SMA' => 6
        ];
        $bimbel *= $biaya_bimbel_faktor[$tingkat_sekolah] ?? 1;

        // Calculate subsidi_infak
        $subsidi_infak = ($bimbel + $eskul_dan_keagamaan + $laporan + $uang_tunai) - $donasi;

        Keuangan::create(array_merge($request->all(), [
            'bimbel' => $bimbel, 
            'uang_tunai' => $uang_tunai, 
            'donasi' => $donasi, 
            'subsidi_infak' => $subsidi_infak
        ]));

        return redirect()->route('datakeuangan.cabang')->with('success', 'Data keuangan berhasil ditambahkan.');
    }

    public function destroy($id_keuangan)
    {
        $keuangan = Keuangan::findOrFail($id_keuangan);
        $keuangan->delete();

        return redirect()->route('datakeuangan.cabang')->with('success', 'Data keuangan berhasil dihapus.');
    }

}
