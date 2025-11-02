<?php

namespace App\Http\Controllers\AdminPusat\Settings\MasterData\Bank;

use App\Http\Controllers\Controller;
use App\Models\Bank;
use Illuminate\Http\Request;

class BankController extends Controller
{
    public function index() {
        // Ambil semua data bank
        $data_bank = Bank::get();
        return view('AdminPusat.Settings.MasterData.Bank.index', compact('data_bank'));
    }

    public function store(Request $request) {
        $request->validate([
            'nama_bank' => 'required',
        ]);

        // Tambahkan data baru
        Bank::create($request->all());

        // Hitung total data
        $totalData = Bank::count();
        $perPage = 10; // Sesuaikan dengan jumlah per halaman di DataTables
        $lastPage = ceil($totalData / $perPage); // Hitung halaman terakhir

        // Redirect ke halaman terakhir jika data baru mengisi halaman baru
        return redirect()->route('bank')->with('success', 'Data Bank berhasil ditambahkan')
            ->with('currentPage', $lastPage - 1); // Pengarahan ke halaman terakhir
    }

    public function update(Request $request, $id) {
        $request->validate([
            'nama_bank' => 'required',
        ]);

        $bank = Bank::findOrFail($id);
        $bank->update($request->all());

        // Redirect ke halaman yang sama
        return redirect()->route('bank')->with('success', 'Data Bank berhasil diperbarui')
            ->with('currentPage', $request->input('current_page', 0));
    }

    public function destroy(Request $request, $id) {
        $bank = Bank::findOrFail($id);
        $bank->delete();

        // Redirect ke halaman yang sama
        return redirect()->route('bank')->with('success', 'Data Bank berhasil dihapus')
            ->with('currentPage', $request->input('current_page', 0));
    }
}
