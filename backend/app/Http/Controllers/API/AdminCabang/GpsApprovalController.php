<?php

namespace App\Http\Controllers\API\AdminCabang;

use App\Http\Controllers\Controller;
use App\Models\Shelter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class GpsApprovalController extends Controller
{
    /**
     * Get list of GPS approval requests for admin cabang
     */
    public function getGpsApprovalList(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user->adminCabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $query = Shelter::with(['adminShelters' => function($q) {
                $q->select('id_admin_shelter', 'id_shelter', 'nama_lengkap');
            }])
            ->whereHas('wilbin', function($q) use ($user) {
                $q->where('id_kacab', $user->adminCabang->id_kacab);
            })
            ->whereIn('gps_approval_status', ['pending', 'approved', 'rejected']);

            // Filter by status if provided
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('gps_approval_status', $request->status);
            }

            // Search by shelter name
            if ($request->has('search') && $request->search) {
                $query->where('nama_shelter', 'like', '%' . $request->search . '%');
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'gps_submitted_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 10);
            $shelters = $query->paginate($perPage);

            // Transform data
            $transformedData = $shelters->getCollection()->map(function ($shelter) {
                $pendingData = $shelter->gps_approval_data ? json_decode($shelter->gps_approval_data, true) : null;
                
                return [
                    'id' => $shelter->id_shelter,
                    'nama_shelter' => $shelter->nama_shelter,
                    'alamat' => $shelter->alamat,
                    'gps_approval_status' => $shelter->gps_approval_status,
                    'gps_submitted_at' => $shelter->gps_submitted_at,
                    'gps_approved_at' => $shelter->gps_approved_at,
                    'gps_rejection_reason' => $shelter->gps_rejection_reason,
                    'admin_shelter' => $shelter->adminShelters->first(),
                    'current_gps_data' => [
                        'require_gps' => $shelter->require_gps,
                        'latitude' => $shelter->latitude,
                        'longitude' => $shelter->longitude,
                        'max_distance_meters' => $shelter->max_distance_meters,
                        'gps_accuracy_required' => $shelter->gps_accuracy_required,
                        'location_name' => $shelter->location_name
                    ],
                    'pending_gps_data' => $pendingData,
                    'has_changes' => $this->hasGpsChanges($shelter, $pendingData)
                ];
            });

            $shelters->setCollection($transformedData);

            return response()->json([
                'success' => true,
                'message' => 'GPS approval requests retrieved successfully',
                'data' => $shelters
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve GPS approval requests: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get GPS approval request detail
     */
    public function getGpsApprovalDetail($shelterId)
    {
        try {
            $user = Auth::user();
            
            if (!$user->adminCabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelter = Shelter::with(['adminShelters', 'kacab'])
                ->where('id_shelter', $shelterId)
                ->whereHas('wilbin', function($q) use ($user) {
                    $q->where('id_kacab', $user->adminCabang->id_kacab);
                })
                ->whereIn('gps_approval_status', ['pending', 'approved', 'rejected'])
                ->first();

            if (!$shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'GPS approval request tidak ditemukan'
                ], 404);
            }

            $pendingData = $shelter->gps_approval_data ? json_decode($shelter->gps_approval_data, true) : null;
            $changeHistory = $shelter->gps_change_history ? json_decode($shelter->gps_change_history, true) : [];

            return response()->json([
                'success' => true,
                'message' => 'GPS approval detail retrieved successfully',
                'data' => [
                    'id' => $shelter->id_shelter,
                    'nama_shelter' => $shelter->nama_shelter,
                    'alamat' => $shelter->alamat,
                    'no_telp' => $shelter->no_telp,
                    'gps_approval_status' => $shelter->gps_approval_status,
                    'gps_submitted_at' => $shelter->gps_submitted_at,
                    'gps_approved_at' => $shelter->gps_approved_at,
                    'gps_rejection_reason' => $shelter->gps_rejection_reason,
                    'admin_shelter' => $shelter->adminShelters->first(),
                    'kacab' => $shelter->kacab,
                    'current_gps_data' => [
                        'require_gps' => $shelter->require_gps,
                        'latitude' => $shelter->latitude,
                        'longitude' => $shelter->longitude,
                        'max_distance_meters' => $shelter->max_distance_meters,
                        'gps_accuracy_required' => $shelter->gps_accuracy_required,
                        'location_name' => $shelter->location_name
                    ],
                    'pending_gps_data' => $pendingData,
                    'changes_summary' => $this->getChangesSummary($shelter, $pendingData),
                    'change_history' => array_reverse($changeHistory) // Latest first
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve GPS approval detail: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve GPS setting changes
     */
    public function approveGpsRequest(Request $request, $shelterId)
    {
        $validator = Validator::make($request->all(), [
            'approval_notes' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $user = Auth::user();
            
            if (!$user->adminCabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelter = Shelter::where('id_shelter', $shelterId)
                ->whereHas('wilbin', function($q) use ($user) {
                    $q->where('id_kacab', $user->adminCabang->id_kacab);
                })
                ->where('gps_approval_status', 'pending')
                ->lockForUpdate()
                ->first();

            if (!$shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'GPS approval request tidak ditemukan atau sudah diproses'
                ], 404);
            }

            $pendingData = json_decode($shelter->gps_approval_data, true);
            
            if (!$pendingData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data GPS pending tidak valid'
                ], 400);
            }

            // Store current data for history
            $currentGpsData = [
                'require_gps' => $shelter->require_gps,
                'latitude' => $shelter->latitude,
                'longitude' => $shelter->longitude,
                'max_distance_meters' => $shelter->max_distance_meters,
                'gps_accuracy_required' => $shelter->gps_accuracy_required,
                'location_name' => $shelter->location_name
            ];

            // Update change history
            $changeHistory = $shelter->gps_change_history ? json_decode($shelter->gps_change_history, true) : [];
            $changeHistory[] = [
                'timestamp' => now()->toISOString(),
                'admin_cabang_id' => $user->adminCabang->id,
                'action' => 'approved',
                'previous_data' => $currentGpsData,
                'approved_data' => $pendingData,
                'notes' => $request->approval_notes
            ];

            // Apply approved GPS settings
            $shelter->update([
                'require_gps' => $pendingData['require_gps'],
                'latitude' => $pendingData['latitude'],
                'longitude' => $pendingData['longitude'],
                'max_distance_meters' => $pendingData['max_distance_meters'],
                'gps_accuracy_required' => $pendingData['gps_accuracy_required'],
                'location_name' => $pendingData['location_name'],
                'gps_approval_status' => 'approved',
                'gps_approved_at' => now(),
                'gps_approved_by' => $user->id_users,
                'gps_approval_data' => null,
                'gps_rejection_reason' => null,
                'gps_change_history' => json_encode($changeHistory)
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'GPS setting berhasil disetujui',
                'data' => [
                    'shelter_id' => $shelter->id_shelter,
                    'shelter_name' => $shelter->nama_shelter,
                    'approved_at' => $shelter->gps_approved_at,
                    'approved_by' => $user->name,
                    'applied_settings' => $pendingData
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyetujui GPS setting: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject GPS setting changes
     */
    public function rejectGpsRequest(Request $request, $shelterId)
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:1000'
        ], [
            'rejection_reason.required' => 'Alasan penolakan wajib diisi',
            'rejection_reason.max' => 'Alasan penolakan maksimal 1000 karakter'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $user = Auth::user();
            
            if (!$user->adminCabang) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelter = Shelter::where('id_shelter', $shelterId)
                ->whereHas('wilbin', function($q) use ($user) {
                    $q->where('id_kacab', $user->adminCabang->id_kacab);
                })
                ->where('gps_approval_status', 'pending')
                ->lockForUpdate()
                ->first();

            if (!$shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'GPS approval request tidak ditemukan atau sudah diproses'
                ], 404);
            }

            $rejectedData = json_decode($shelter->gps_approval_data, true);

            // Update change history
            $changeHistory = $shelter->gps_change_history ? json_decode($shelter->gps_change_history, true) : [];
            $changeHistory[] = [
                'timestamp' => now()->toISOString(),
                'admin_cabang_id' => $user->adminCabang->id,
                'action' => 'rejected',
                'rejected_data' => $rejectedData,
                'rejection_reason' => $request->rejection_reason
            ];

            // Update shelter status
            $shelter->update([
                'gps_approval_status' => 'rejected',
                'gps_approved_at' => null,
                'gps_approved_by' => $user->id_users,
                'gps_rejection_reason' => $request->rejection_reason,
                'gps_change_history' => json_encode($changeHistory)
                // Keep gps_approval_data so shelter admin can see what was rejected
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'GPS setting berhasil ditolak',
                'data' => [
                    'shelter_id' => $shelter->id_shelter,
                    'shelter_name' => $shelter->nama_shelter,
                    'rejected_at' => now(),
                    'rejected_by' => $user->name,
                    'rejection_reason' => $request->rejection_reason
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menolak GPS setting: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if there are GPS changes between current and pending data
     */
    private function hasGpsChanges($shelter, $pendingData)
    {
        if (!$pendingData) return false;

        return $shelter->require_gps != $pendingData['require_gps'] ||
               $shelter->latitude != $pendingData['latitude'] ||
               $shelter->longitude != $pendingData['longitude'] ||
               $shelter->max_distance_meters != $pendingData['max_distance_meters'] ||
               $shelter->gps_accuracy_required != $pendingData['gps_accuracy_required'] ||
               $shelter->location_name != $pendingData['location_name'];
    }

    /**
     * Get summary of changes
     */
    private function getChangesSummary($shelter, $pendingData)
    {
        if (!$pendingData) return [];

        $changes = [];

        if ($shelter->require_gps != $pendingData['require_gps']) {
            $changes[] = [
                'field' => 'GPS Status',
                'from' => $shelter->require_gps ? 'Aktif' : 'Tidak Aktif',
                'to' => $pendingData['require_gps'] ? 'Aktif' : 'Tidak Aktif'
            ];
        }

        if ($shelter->latitude != $pendingData['latitude']) {
            $changes[] = [
                'field' => 'Latitude',
                'from' => $shelter->latitude ?: 'Tidak diatur',
                'to' => $pendingData['latitude'] ?: 'Tidak diatur'
            ];
        }

        if ($shelter->longitude != $pendingData['longitude']) {
            $changes[] = [
                'field' => 'Longitude', 
                'from' => $shelter->longitude ?: 'Tidak diatur',
                'to' => $pendingData['longitude'] ?: 'Tidak diatur'
            ];
        }

        if ($shelter->location_name != $pendingData['location_name']) {
            $changes[] = [
                'field' => 'Nama Lokasi',
                'from' => $shelter->location_name ?: 'Tidak diatur',
                'to' => $pendingData['location_name'] ?: 'Tidak diatur'
            ];
        }

        if ($shelter->max_distance_meters != $pendingData['max_distance_meters']) {
            $changes[] = [
                'field' => 'Radius Maksimal',
                'from' => $shelter->max_distance_meters . 'm',
                'to' => $pendingData['max_distance_meters'] . 'm'
            ];
        }

        if ($shelter->gps_accuracy_required != $pendingData['gps_accuracy_required']) {
            $changes[] = [
                'field' => 'Akurasi GPS Required',
                'from' => $shelter->gps_accuracy_required . 'm',
                'to' => $pendingData['gps_accuracy_required'] . 'm'
            ];
        }

        return $changes;
    }
}