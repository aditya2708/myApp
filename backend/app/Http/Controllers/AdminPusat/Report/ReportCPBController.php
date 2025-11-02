<?php

namespace App\Http\Controllers\AdminPusat\Report;

use App\Models\Kacab;
use App\Models\Anak;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ReportCPBController extends Controller
{
    public function laporanCPB()
    {
        // Mengambil data shelter, anak, dan pendidikan anak
        $dataKacab = Kacab::with(['wilbins.shelters.anak.anakPendidikan'])->get();

        return view('AdminPusat.Report.CPBReport.cpbreport', compact('dataKacab'));
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
        $pdf = Pdf::loadView('AdminPusat.Report.CPBReport.exportcpbd_pdf', compact('anak'));

        // Set ukuran kertas ke A4
        $pdf->setPaper('a4', 'portrait');

        // Mengatur agar PDF langsung diunduh, bukan dibuka di browser
        return $pdf->download('Data_Anak_' . $anak->full_name . '.pdf', [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="Data_Anak_' . $anak->full_name . '.pdf"'
        ]);
    }

}

