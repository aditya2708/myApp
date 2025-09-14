<?php
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

Route::get('/test-pdf-download', function() {
    $data = [
        'export_date' => now()->format('Y-m-d H:i:s'),
        'shelter' => 'Test Shelter',
        'shelter_coordinator' => 'Test Coordinator', // Add this
        'filters' => ['status' => null],
        'summary' => [
            'BCPB' => 10, 'CPB' => 5, 'NPB' => 15, 'PB' => 8, 'total' => 38
        ],
        'total_records' => 1,
        'children' => [[
            'nama_lengkap' => 'Test Child',
            'nama_panggilan' => 'Test',
            'jenis_kelamin' => 'Laki-laki',
            'umur' => 12,
            'kelas' => '6',
            'status_orang_tua' => 'yatim',
            'status_cpb' => 'BCPB',
            'tanggal_daftar' => '2025-01-01',
            'tanggal_sponsorship' => ''
        ]]
    ];
    $pdf = PDF::loadView('reports.cpb-report', compact('data'));
    return $pdf->download('test-cpb-report.pdf');
});
