<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\QrTokenRequest;
use App\Models\QrToken;
use App\Models\Anak;
use App\Models\Aktivitas;
use App\Services\QrTokenService;
use App\Services\AttendanceService;
use App\Http\Resources\QrTokenResource;

class QrTokenController extends Controller
{
    protected $qrTokenService;
    protected $attendanceService;
    
    public function __construct(QrTokenService $qrTokenService, AttendanceService $attendanceService)
    {
        $this->qrTokenService = $qrTokenService;
        $this->attendanceService = $attendanceService;
    }
    
    public function generate(QrTokenRequest $request)
    {
        try {
            $validDays = $request->input('valid_days', 30);
            $token = $this->qrTokenService->generateToken($request->id_anak, $validDays);
            
            return response()->json([
                'success' => true,
                'message' => 'QR token generated successfully',
                'data' => new QrTokenResource($token->load('anak'))
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate token: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function generateBatch(QrTokenRequest $request)
    {
        try {
            $validDays = $request->input('valid_days', 30);
            $tokens = $this->qrTokenService->generateBatchTokens($request->student_ids, $validDays);
            
            return response()->json([
                'success' => true,
                'message' => count($tokens) . ' QR tokens generated successfully',
                'data' => QrTokenResource::collection(collect($tokens)->map->load('anak'))
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate batch tokens: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function validateToken(QrTokenRequest $request)
    {
        $result = $this->qrTokenService->validateToken($request->token);
        
        if (!$result['valid']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }
        
        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => [
                'anak' => $result['anak'],
                'token' => new QrTokenResource($result['token'])
            ]
        ]);
    }
    
    public function getActiveToken($id_anak)
    {
        $token = QrToken::where('id_anak', $id_anak)
                       ->where('type', 'anak')
                       ->where('is_active', true)
                       ->where(function($q) {
                           $q->whereNull('valid_until')
                             ->orWhere('valid_until', '>', now());
                       })
                       ->orderBy('created_at', 'desc')
                       ->with('anak')
                       ->first();
        
        if (!$token) {
            return response()->json([
                'success' => false,
                'message' => 'No active token found for the student'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => new QrTokenResource($token)
        ]);
    }
    
    public function invalidate(QrTokenRequest $request)
    {
        $success = $this->qrTokenService->invalidateToken($request->token);
        
        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Token not found or already inactive'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Token invalidated successfully'
        ]);
    }
    
    public function getActivityGpsConfig($id_aktivitas)
    {
        try {
            $config = $this->attendanceService->getGpsConfig($id_aktivitas);
            
            if (!$config) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => $config
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve GPS configuration: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function validateTokenWithActivity(QrTokenRequest $request)
    {
        $result = $this->qrTokenService->validateToken($request->token);
        
        if (!$result['valid']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }
        
        $responseData = [
            'anak' => $result['anak'],
            'token' => new QrTokenResource($result['token'])
        ];
        
        // Include GPS config if activity is provided
        if ($request->has('id_aktivitas')) {
            $gpsConfig = $this->attendanceService->getGpsConfig($request->id_aktivitas);
            if ($gpsConfig) {
                $responseData['gps_config'] = $gpsConfig;
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => $responseData
        ]);
    }
}