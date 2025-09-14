<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class TestController extends Controller
{
    /**
     * Test auto-mark absent command
     */
    public function testAutoMarkAbsent(Request $request)
    {
        try {
            $activityId = $request->get('activity_id');
            
            if ($activityId) {
                // Test specific activity
                $exitCode = Artisan::call('attendance:mark-absent', [
                    '--activity-id' => $activityId
                ]);
            } else {
                // Test all completed activities
                $exitCode = Artisan::call('attendance:mark-absent');
            }
            
            $output = Artisan::output();
            
            return response()->json([
                'success' => true,
                'message' => 'Auto-mark absent command executed',
                'exit_code' => $exitCode,
                'output' => $output
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to execute command: ' . $e->getMessage()
            ], 500);
        }
    }
}