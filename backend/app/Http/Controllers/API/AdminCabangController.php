<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Anak;
use App\Models\Donatur;
use App\Models\Shelter;
use App\Models\Survey;
use App\Models\Tutor;
use App\Models\Wilbin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AdminCabangController extends Controller
{
    public function dashboard()
    {
        $user = auth()->user();
        $adminCabang = $user->adminCabang;

        if (!$adminCabang) {
            return response()->json([
                'message' => 'Admin Cabang tidak ditemukan',
                'data' => null,
            ], 404);
        }

        $adminCabang->load(['kacab']);

        $summary = $this->buildDashboardSummary($adminCabang->id_kacab);

        $adminCabang->setAttribute('wilbin_count', $summary['wilayah']);
        $adminCabang->setAttribute('shelter_count', $summary['shelter']);
        $adminCabang->setAttribute('pending_gps_requests', $summary['pending_gps_requests']);
        $adminCabang->setAttribute('total_children', $summary['total_children']);
        $adminCabang->setAttribute('total_tutors', $summary['total_tutors']);
        $adminCabang->setAttribute('summary', $summary);
        
        return response()->json([
            'message' => 'Admin Cabang Dashboard',
            'data' => $adminCabang
        ]);
    }

    public function getProfile()
    {
        $user = auth()->user();
        $adminCabang = $user->adminCabang->load(['kacab']);
        
        return response()->json([
            'message' => 'Profile retrieved successfully',
            'data' => $adminCabang
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        $adminCabang = $user->adminCabang;

        $validator = Validator::make($request->all(), [
            'nama_lengkap' => 'required|string|max:255',
            'alamat' => 'nullable|string',
            'no_hp' => 'nullable|string|max:20',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->only(['nama_lengkap', 'alamat', 'no_hp']);

        if ($request->hasFile('foto')) {
            if ($adminCabang->foto) {
                Storage::delete("public/AdminCabang/{$adminCabang->id_admin_cabang}/{$adminCabang->foto}");
            }
            
            $file = $request->file('foto');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $file->storeAs("public/AdminCabang/{$adminCabang->id_admin_cabang}", $fileName);
            $data['foto'] = $fileName;
        }

        $adminCabang->update($data);
        $adminCabang->load(['kacab']);

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $adminCabang
        ]);
    }

    protected function buildDashboardSummary(?int $kacabId): array
    {
        if (!$kacabId) {
            return [
                'wilayah' => 0,
                'shelter' => 0,
                'donatur' => 0,
                'pending_surveys' => 0,
                'total_children' => 0,
                'total_tutors' => 0,
                'pending_gps_requests' => 0,
            ];
        }

        $wilbinCount = Wilbin::where('id_kacab', $kacabId)->count();

        $shelterQuery = Shelter::whereHas('wilbin', function ($query) use ($kacabId) {
            $query->where('id_kacab', $kacabId);
        });

        $shelterCount = (clone $shelterQuery)->count();
        $pendingGpsRequests = (clone $shelterQuery)
            ->where('gps_approval_status', 'pending')
            ->count();

        $donaturCount = Donatur::where('id_kacab', $kacabId)->count();
        $pendingSurveys = Survey::pending()->byKacab($kacabId)->count();

        $totalChildren = Anak::whereHas('shelter', function ($shelterQuery) use ($kacabId) {
            $shelterQuery->whereHas('wilbin', function ($wilbinQuery) use ($kacabId) {
                $wilbinQuery->where('id_kacab', $kacabId);
            });
        })
            ->whereIn('status_validasi', Anak::STATUS_AKTIF)
            ->count();

        $totalTutors = Tutor::where('id_kacab', $kacabId)->count();

        return [
            'wilayah' => $wilbinCount,
            'shelter' => $shelterCount,
            'donatur' => $donaturCount,
            'pending_surveys' => $pendingSurveys,
            'total_children' => $totalChildren,
            'total_tutors' => $totalTutors,
            'pending_gps_requests' => $pendingGpsRequests,
        ];
    }
}
