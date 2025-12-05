<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\QrTokenRequest;
use App\Models\QrToken;
use App\Models\Anak;
use App\Models\Semester;
use App\Models\Aktivitas;
use App\Services\QrTokenService;
use App\Services\AttendanceService;
use App\Http\Resources\QrTokenResource;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;
use App\Support\AdminShelterScope;

class QrTokenController extends Controller
{
    use AdminShelterScope;

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
            $expiryStrategy = $request->input('expiry_strategy', 'days');
            $validUntil = null;

            if ($expiryStrategy === 'semester') {
                $anak = Anak::findOrFail($request->id_anak);
                $semester = $this->findActiveSemesterForEntity($anak->id_shelter, $this->resolveKacabId($anak));

                if (!$semester) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Active semester not found for the student'
                    ], 404);
                }

                $validUntil = Carbon::parse($semester->tanggal_selesai)->endOfDay();
            }

            $token = $this->qrTokenService->generateToken($request->id_anak, $validDays, $validUntil);

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
            $expiryStrategy = $request->input('expiry_strategy', 'days');
            $validUntilOverrides = [];
            $missingSemesters = [];

            if ($expiryStrategy === 'semester') {
                foreach ($request->student_ids as $studentId) {
                    $anak = Anak::find($studentId);

                    if (!$anak) {
                        $missingSemesters[] = $studentId;
                        continue;
                    }

                    $semester = $this->findActiveSemesterForEntity($anak->id_shelter, $this->resolveKacabId($anak));

                    if (!$semester) {
                        $missingSemesters[] = $studentId;
                        continue;
                    }

                    $validUntilOverrides[$studentId] = Carbon::parse($semester->tanggal_selesai)->endOfDay();
                }

                if (!empty($missingSemesters)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Active semester not found for student IDs: ' . implode(', ', $missingSemesters)
                    ], 404);
                }
            }

            $tokens = $this->qrTokenService->generateBatchTokens($request->student_ids, $validDays, $validUntilOverrides);

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
            $companyId = $this->companyId();
            $shelterId = $this->shelterId();

            $aktivitas = Aktivitas::where('id_aktivitas', $id_aktivitas)
                ->when($shelterId, fn ($q) => $q->where('id_shelter', $shelterId))
                ->when($companyId && Schema::hasColumn('aktivitas', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                ->first();

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found in your scope'
                ], 404);
            }

            $config = $this->attendanceService->getGpsConfig($aktivitas->id_aktivitas);
            
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
            $companyId = $this->companyId();
            $shelterId = $this->shelterId();

            $aktivitas = Aktivitas::where('id_aktivitas', $request->id_aktivitas)
                ->when($shelterId, fn ($q) => $q->where('id_shelter', $shelterId))
                ->when($companyId && Schema::hasColumn('aktivitas', 'company_id'), fn ($q) => $q->where('company_id', $companyId))
                ->first();

            if (!$aktivitas) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found in your scope'
                ], 404);
            }

            $gpsConfig = $this->attendanceService->getGpsConfig($aktivitas->id_aktivitas);
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

    protected function findActiveSemesterForEntity(?int $shelterId, ?int $kacabId)
    {
        if ($shelterId) {
            $semester = $this->buildActiveSemesterQuery()
                ->where('id_shelter', $shelterId)
                ->first();

            if ($semester) {
                return $semester;
            }
        }

        if ($kacabId) {
            return $this->buildActiveSemesterQuery()
                ->where('id_kacab', $kacabId)
                ->first();
        }

        return null;
    }

    protected function buildActiveSemesterQuery()
    {
        $query = Semester::query();

        if (Schema::hasColumn('semester', 'status')) {
            $query->where('status', 'active');
        } else {
            $query->where('is_active', true);
        }

        return $query;
    }

    protected function resolveKacabId($entity): ?int
    {
        if (!empty($entity->id_kacab)) {
            return $entity->id_kacab;
        }

        if (method_exists($entity, 'wilbin')) {
            $wilbin = $entity->wilbin;
            if ($wilbin) {
                return $wilbin->id_kacab ?? null;
            }
        }

        if (method_exists($entity, 'shelter')) {
            $shelter = $entity->shelter;
            if ($shelter && method_exists($shelter, 'kacab')) {
                $kacab = $shelter->kacab;
                if ($kacab) {
                    return $kacab->id_kacab ?? null;
                }
            }
        }

        return null;
    }
}

