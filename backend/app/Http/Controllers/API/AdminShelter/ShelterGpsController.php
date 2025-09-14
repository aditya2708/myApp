<?php

namespace App\Http\Controllers\API\AdminShelter;

use App\Http\Controllers\Controller;
use App\Models\Shelter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ShelterGpsController extends Controller
{
    /**
     * Get shelter GPS configuration
     */
    public function getGpsConfig()
    {
        try {
            $user = Auth::user();
            
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelter = $user->adminShelter->shelter;
            
            if (!$shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shelter not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'GPS config retrieved successfully',
                'data' => [
                    'require_gps' => $shelter->require_gps,
                    'latitude' => $shelter->latitude,
                    'longitude' => $shelter->longitude,
                    'max_distance_meters' => $shelter->max_distance_meters,
                    'gps_accuracy_required' => $shelter->gps_accuracy_required,
                    'location_name' => $shelter->location_name,
                    'shelter_name' => $shelter->nama_shelter,
                    'gps_approval_status' => $shelter->gps_approval_status,
                    'gps_submitted_at' => $shelter->gps_submitted_at,
                    'gps_approved_at' => $shelter->gps_approved_at,
                    'gps_rejection_reason' => $shelter->gps_rejection_reason,
                    'pending_gps_data' => $shelter->gps_approval_data ? json_decode($shelter->gps_approval_data, true) : null
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve GPS config: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update shelter GPS configuration
     */
    public function updateGpsConfig(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelter = $user->adminShelter->shelter;
            
            if (!$shelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Shelter not found'
                ], 404);
            }

            // Validation rules
            $rules = [
                'require_gps' => 'required|boolean',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'max_distance_meters' => 'nullable|integer|min:10|max:1000',
                'gps_accuracy_required' => 'nullable|integer|min:10|max:50',
                'location_name' => 'nullable|string|max:255'
            ];

            // Additional validation when GPS is enabled
            if ($request->require_gps) {
                $rules['latitude'] = 'required|numeric|between:-90,90';
                $rules['longitude'] = 'required|numeric|between:-180,180';
                $rules['location_name'] = 'required|string|max:255';
            }

            $validator = Validator::make($request->all(), $rules, [
                'latitude.required' => 'Latitude wajib diisi jika GPS diaktifkan',
                'latitude.between' => 'Latitude harus antara -90 sampai 90',
                'longitude.required' => 'Longitude wajib diisi jika GPS diaktifkan', 
                'longitude.between' => 'Longitude harus antara -180 sampai 180',
                'location_name.required' => 'Nama lokasi wajib diisi jika GPS diaktifkan',
                'max_distance_meters.min' => 'Radius minimal 10 meter',
                'max_distance_meters.max' => 'Radius maksimal 1000 meter',
                'gps_accuracy_required.min' => 'Akurasi GPS minimal 10 meter',
                'gps_accuracy_required.max' => 'Akurasi GPS maksimal 50 meter'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Prepare GPS data for approval
            $gpsData = [
                'require_gps' => $request->require_gps,
                'max_distance_meters' => $request->max_distance_meters ?: 100,
                'gps_accuracy_required' => $request->gps_accuracy_required ?: 25,
                'latitude' => $request->require_gps ? $request->latitude : null,
                'longitude' => $request->require_gps ? $request->longitude : null,
                'location_name' => $request->require_gps ? $request->location_name : null
            ];

            // Store current GPS settings for history
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
                'admin_shelter_id' => $user->adminShelter->id,
                'previous_data' => $currentGpsData,
                'new_data' => $gpsData,
                'action' => 'submitted_for_approval'
            ];

            // Update shelter with pending approval
            $shelter->update([
                'gps_approval_status' => 'pending',
                'gps_approval_data' => json_encode($gpsData),
                'gps_submitted_at' => now(),
                'gps_approved_at' => null,
                'gps_approved_by' => null,
                'gps_rejection_reason' => null,
                'gps_change_history' => json_encode($changeHistory)
            ]);

            // Get updated shelter data
            $shelter->refresh();

            return response()->json([
                'success' => true,
                'message' => 'GPS setting berhasil dikirim untuk persetujuan Admin Cabang',
                'data' => [
                    'gps_approval_status' => $shelter->gps_approval_status,
                    'gps_submitted_at' => $shelter->gps_submitted_at,
                    'pending_gps_data' => json_decode($shelter->gps_approval_data, true),
                    'current_gps_data' => [
                        'require_gps' => $shelter->require_gps,
                        'latitude' => $shelter->latitude,
                        'longitude' => $shelter->longitude,
                        'max_distance_meters' => $shelter->max_distance_meters,
                        'gps_accuracy_required' => $shelter->gps_accuracy_required,
                        'location_name' => $shelter->location_name
                    ],
                    'shelter_name' => $shelter->nama_shelter
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui GPS config: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test GPS distance calculation
     */
    public function testGpsDistance(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_latitude' => 'required|numeric|between:-90,90',
                'user_longitude' => 'required|numeric|between:-180,180'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            
            if (!$user->adminShelter) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $shelter = $user->adminShelter->shelter;
            
            if (!$shelter || !$shelter->require_gps) {
                return response()->json([
                    'success' => false,
                    'message' => 'GPS tidak diaktifkan untuk shelter ini'
                ], 400);
            }

            if (!$shelter->latitude || !$shelter->longitude) {
                return response()->json([
                    'success' => false,
                    'message' => 'Koordinat shelter belum diatur'
                ], 400);
            }

            // Calculate distance using LocationService
            $locationService = app(\App\Services\LocationService::class);
            
            $distance = $locationService->calculateDistance(
                $request->user_latitude,
                $request->user_longitude,
                $shelter->latitude,
                $shelter->longitude
            );

            $isWithinRange = $distance <= $shelter->max_distance_meters;

            return response()->json([
                'success' => true,
                'message' => 'Perhitungan jarak GPS berhasil',
                'data' => [
                    'user_coordinates' => [
                        'latitude' => $request->user_latitude,
                        'longitude' => $request->user_longitude
                    ],
                    'shelter_coordinates' => [
                        'latitude' => $shelter->latitude,
                        'longitude' => $shelter->longitude
                    ],
                    'distance_meters' => round($distance, 2),
                    'max_distance_meters' => $shelter->max_distance_meters,
                    'is_within_range' => $isWithinRange,
                    'status' => $isWithinRange ? 'Dalam jangkauan' : 'Diluar jangkauan'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghitung jarak GPS: ' . $e->getMessage()
            ], 500);
        }
    }
}