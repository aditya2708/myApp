<?php

namespace App\Http\Controllers\AdminPusat\Berita;

use App\Models\Berita;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class BeritaController extends Controller
{
    public function index()
    {
        // Cache data berita selama 10 menit
        $data_berita = Cache::remember('data_berita', 300, function () {
            return Berita::all();
        });    
        

        return view('AdminPusat.Berita.DataBerita.index', compact('data_berita'));
    }

    public function getBeritaAjax(Request $request)
    {
        try {
            $query = Berita::query();

            $totalData = $query->count();

            if ($request->filled('search.value')) {
                $searchValue = $request->input('search.value');
                $query->where('judul', 'like', '%' . $searchValue . '%')
                    ->orWhere('konten', 'like', '%' . $searchValue . '%');
            }

            $totalFiltered = $query->count();

             // Sorting dan Paging
            $sortColumnIndex = $request->input('order.0.column'); // Index kolom
            $sortColumnName = $request->input("columns.$sortColumnIndex.data"); // Nama kolom
            $sortDirection = $request->input('order.0.dir', 'desc'); // Arah sorting

            if ($sortColumnName !== 'DT_RowIndex') { // Abaikan sorting pada kolom DT_RowIndex
                $query->orderBy($sortColumnName, $sortDirection);
            }

            $query->skip($request->input('start'))->take($request->input('length'));

            // Data Mapping
            $data = $query->get()->map(function ($berita, $index) use ($request) {
                $editUrl = route('berita.edit', $berita->id_berita);
                $deleteAction = "confirmDelete('{$berita->judul}', {$berita->id_berita})";

                return [
                        'DT_RowIndex' => $request->input('start') + $index + 1,
                        // 'id_berita' => $berita->id_berita,
                        'judul' => $berita->judul,
                        'tanggal' => $berita->tanggal,
                        'konten' => Str::words($berita->konten, 20, '...'),
                        'foto' => $berita->foto
                            ? '<img src="' . asset("storage/berita/{$berita->id_berita}/{$berita->foto}") . '" width="90">'
                            : '<img src="' . asset('assets/img/noimage.jpg') . '" width="90">',
                        'foto2' => $berita->foto2
                            ? '<img src="' . asset("storage/berita/{$berita->id_berita}/{$berita->foto2}") . '" width="90">'
                            : '<img src="' . asset('assets/img/noimage.jpg') . '" width="90">',
                        'foto3' => $berita->foto3
                            ? '<img src="' . asset("storage/berita/{$berita->id_berita}/{$berita->foto3}") . '" width="90">'
                            : '<img src="' . asset('assets/img/noimage.jpg') . '" width="90">',
                        'aksi' => '
                            <div class="action-buttons" style="display: flex; gap: 8px; align-items: center;">
                                <a href="' . $editUrl . '" class="btn btn-link btn-primary btn-lg">
                                    <i class="fa fa-edit"></i>
                                </a>
                                <button type="button" class="btn btn-link btn-danger" onclick="' . $deleteAction . '">
                                    <i class="fa fa-trash"></i>
                                </button>
                            </div>',

                    ];
                });

            return response()->json([
                'draw' => intval($request->input('draw')),
                'recordsTotal' => $totalData,
                'recordsFiltered' => $totalFiltered,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['error' => 'Terjadi kesalahan. Silakan coba lagi.'], 500);
        }
    }

    public function store()
    {
        return view('AdminPusat.Berita.DataBerita.create');
    }

    /* public function storeprosess(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'konten' => 'required|string',
            'tanggal' => 'required|date',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif',
            'foto2' => 'nullable|image|mimes:jpeg,png,jpg,gif',
            'foto3' => 'nullable|image|mimes:jpeg,png,jpg,gif',
        ]);

         // Simpan data awal berita tanpa foto
        $berita = Berita::create([
            'judul' => $request->judul,
            'konten' => $request->konten,
            'tanggal' => $request->tanggal,
        ]);

        // Simpan foto jika ada
        if ($request->hasFile('foto')) {
            $folderPath = 'berita/' . $berita->id_berita; // Folder berdasarkan ID berita
            $fileName = $request->file('foto')->getClientOriginalName(); // Nama asli file
            $fotoPath = $request->file('foto')->storeAs($folderPath, $fileName, 'public'); // Simpan file
            $berita->update(['foto' => $fileName]); // Simpan nama file ke database
        }

        if ($request->hasFile('foto2')) {
            $folderPath = 'berita/' . $berita->id_berita; // Folder berdasarkan ID berita
            $fileName = $request->file('foto2')->getClientOriginalName(); // Nama asli file
            $fotoPath = $request->file('foto2')->storeAs($folderPath, $fileName, 'public'); // Simpan file
            $berita->update(['foto2' => $fileName]); // Simpan nama file ke database
        }

        if ($request->hasFile('foto3')) {
            $folderPath = 'berita/' . $berita->id_berita; // Folder berdasarkan ID berita
            $fileName = $request->file('foto3')->getClientOriginalName(); // Nama asli file
            $fotoPath = $request->file('foto3')->storeAs($folderPath, $fileName, 'public'); // Simpan file
            $berita->update(['foto3' => $fileName]); // Simpan nama file ke database
        }

        return redirect()->route('databerita')->with('success', 'Berita berhasil ditambahkan.');
    } */

    public function storeAjax(Request $request)
    {
        try {
            $request->validate([
                'judul' => 'required|string|max:255',
                'konten' => 'required|string',
                'tanggal' => 'required|date',
                'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif',
                'foto2' => 'nullable|image|mimes:jpeg,png,jpg,gif',
                'foto3' => 'nullable|image|mimes:jpeg,png,jpg,gif',
            ]);

            // Simpan data awal berita tanpa foto
            $berita = Berita::create([
                'judul' => $request->judul,
                'konten' => $request->konten,
                'tanggal' => $request->tanggal,
            ]);

            // Simpan foto jika ada
            $folderPath = 'berita/' . $berita->id_berita;
            if ($request->hasFile('foto')) {
                $fileName = $request->file('foto')->getClientOriginalName();
                $request->file('foto')->storeAs($folderPath, $fileName, 'public');
                $berita->update(['foto' => $fileName]);
            }

            if ($request->hasFile('foto2')) {
                $fileName = $request->file('foto2')->getClientOriginalName();
                $request->file('foto2')->storeAs($folderPath, $fileName, 'public');
                $berita->update(['foto2' => $fileName]);
            }

            if ($request->hasFile('foto3')) {
                $fileName = $request->file('foto3')->getClientOriginalName();
                $request->file('foto3')->storeAs($folderPath, $fileName, 'public');
                $berita->update(['foto3' => $fileName]);
            }

            return response()->json(['message' => 'Berita berhasil ditambahkan.'], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal menambahkan berita.', 'error' => $e->getMessage()], 500);
        }
    }

    public function edit($id)
    {
        $berita = Berita::findOrFail($id);
        return view('AdminPusat.Berita.DataBerita.edit', compact('berita'));
    }

    public function editprosess(Request $request, $id)
    {
        try {
            $berita = Berita::findOrFail($id);
    
            $request->validate([
                'judul' => 'required|string|max:255',
                'konten' => 'required|string',
                'tanggal' => 'required|date',
                'foto' => 'nullable|image|mimes:jpeg,png,jpg,gif',
                'foto2' => 'nullable|image|mimes:jpeg,png,jpg,gif',
                'foto3' => 'nullable|image|mimes:jpeg,png,jpg,gif',
            ]);
    
            // Update data berita kecuali foto
            $berita->update([
                'judul' => $request->judul,
                'konten' => $request->konten,
                'tanggal' => $request->tanggal,
            ]);
    
            // Folder path berdasarkan id_berita
            $folderPath = 'berita/' . $berita->id_berita;
    
            // Update foto jika ada
            if ($request->hasFile('foto')) {
                // Hapus foto lama jika ada
                if ($berita->foto) {
                    Storage::disk('public')->delete($folderPath . '/' . $berita->foto);
                }
                // Simpan foto baru
                $fileName = $request->file('foto')->getClientOriginalName();
                $request->file('foto')->storeAs($folderPath, $fileName, 'public');
                $berita->update(['foto' => $fileName]);
            }
    
            // Update foto2 jika ada
            if ($request->hasFile('foto2')) {
                // Hapus foto lama jika ada
                if ($berita->foto2) {
                    Storage::disk('public')->delete($folderPath . '/' . $berita->foto2);
                }
                $fileName = $request->file('foto2')->getClientOriginalName();
                $request->file('foto2')->storeAs($folderPath, $fileName, 'public');
                $berita->update(['foto2' => $fileName]);
            }
    
            // Update foto3 jika ada
            if ($request->hasFile('foto3')) {
                // Hapus foto lama jika ada
                if ($berita->foto3) {
                    Storage::disk('public')->delete($folderPath . '/' . $berita->foto3);
                }
                $fileName = $request->file('foto3')->getClientOriginalName();
                $request->file('foto3')->storeAs($folderPath, $fileName, 'public');
                $berita->update(['foto3' => $fileName]);
            }

         // Return JSON response untuk AJAX
         return response()->json([
                'status' => 'success',
                'message' => 'Berita berhasil diperbarui.',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        $berita = Berita::findOrFail($id);
    
        // Folder path berdasarkan id_berita
        $folderPath = 'berita/' . $berita->id_berita;
    
        // Hapus foto jika ada
        if ($berita->foto) {
            Storage::disk('public')->delete($folderPath . '/' . $berita->foto);
        }
    
        if ($berita->foto2) {
            Storage::disk('public')->delete($folderPath . '/' . $berita->foto2);
        }
    
        if ($berita->foto3) {
            Storage::disk('public')->delete($folderPath . '/' . $berita->foto3);
        }
    
        // Hapus folder berita jika masih ada
        if (Storage::disk('public')->exists($folderPath)) {
            Storage::disk('public')->deleteDirectory($folderPath);
        }
    
        // Hapus data berita dari database
        $berita->delete();
    
        return response()->json(['message' => 'Berita berhasil dihapus'], 200);
    }
    
    
}
