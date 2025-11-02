<?php

namespace App\Http\Controllers\AdminCabang\ReportCabang;

use App\Models\Anak;
use App\Models\Kacab;
use App\Models\AdminCabang;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Controller;

class ReportCPBCabangController extends Controller
{
    public function laporanCPB()
    {
         // Ambil ID pengguna yang sedang login
         $user_id = auth()->user()->id_users;
    
         // Ambil Admin Cabang berdasarkan User
         $adminCabang = AdminCabang::where('user_id', $user_id)->first();
     
         if (!$adminCabang) {
             abort(403, 'Admin cabang tidak ditemukan.');
         }
         
         // Ambil data Kacab terkait dengan wilayah binaan admin cabang yang sedang login
         $dataKacab = Kacab::where('id_kacab', $adminCabang->id_kacab) // Filter berdasarkan id_kacab admin cabang
             ->with(['wilbins.shelters.anak.anakPendidikan']) // Mengambil data wilbin, shelter, anak, dan pendidikan anak
             ->get();

        // Kirim data ke view
        return view('AdminCabang.Report.CPBReport.cpbreport', compact('dataKacab'));
    }

    public function getChildrenByShelter($shelterId)
    {
        $children = Anak::with(['anakPendidikan', 'shelter', 'keluarga'])
            ->where('id_shelter', $shelterId)
            ->get();

        if ($children->isEmpty()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak ada data anak untuk shelter ini.'
            ]);
        }

        // Format data anak sebelum dikelompokkan
        $formattedChildren = $children->map(function ($child) {
            return [
                'id' => $child->id_anak,
                'shelter_name' => $child->shelter->nama_shelter ?? 'N/A',
                'name' => $child->full_name ?? 'N/A',
                'gender' => $child->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan',
                'class' => $child->anakPendidikan->kelas ?? 'N/A',
                'status_ortu' => $child->keluarga->status_ortu ?? 'N/A',
                'status_cpb' => $child->status_cpb ?? 'N/A',
            ];
        });

        // Kelompokkan data berdasarkan status_cpb
        $groupedChildren = $formattedChildren->groupBy('status_cpb');

        return response()->json([
            'status' => 'success',
            'data' => [
                'bcpb' => $groupedChildren['BCPB'] ?? [],
                'cpb' => $groupedChildren['CPB'] ?? [],
                'npb' => $groupedChildren['NPB'] ?? [],
                'pb' => $groupedChildren['PB'] ?? [],
            ],
        ]);
    }

    public function exportPdf($anakId)
    {
        // Ambil data anak berdasarkan ID
        $anak = Anak::with(['anakPendidikan', 'keluarga.ayah', 'keluarga.ibu', 'shelter'])->findOrFail($anakId);

        // Load view untuk export PDF
        $pdf = Pdf::loadView('AdminCabang.Report.CPBReport.exportcpbdcabang_pdf', compact('anak'));

        // Set ukuran kertas ke A4
        $pdf->setPaper('a4', 'portrait');

        // Unduh PDF
        return $pdf->download('Data_Anak_' . $anak->full_name . '.pdf');
    }
}
