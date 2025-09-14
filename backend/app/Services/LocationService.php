<?php

namespace App\Services;

class LocationService
{
    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     * 
     * @param float $lat1 Latitude of first point
     * @param float $lon1 Longitude of first point  
     * @param float $lat2 Latitude of second point
     * @param float $lon2 Longitude of second point
     * @return float Distance in meters
     */
    public function calculateDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // Earth radius in meters
        
        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLatRad = deg2rad($lat2 - $lat1);
        $deltaLonRad = deg2rad($lon2 - $lon1);
        
        $a = sin($deltaLatRad / 2) * sin($deltaLatRad / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLonRad / 2) * sin($deltaLonRad / 2);
             
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
    }
    
    /**
     * Validate if attendance location is within allowed radius
     * 
     * @param array $attendanceLocation ['latitude' => float, 'longitude' => float]
     * @param array $activityLocation ['latitude' => float, 'longitude' => float] 
     * @param int $maxDistanceMeters Maximum allowed distance in meters
     * @return array Validation result with status and details
     */
    public function validateAttendanceLocation(
        array $attendanceLocation, 
        array $activityLocation, 
        int $maxDistanceMeters
    ): array {
        if (!$this->isValidCoordinate($attendanceLocation['latitude'], $attendanceLocation['longitude'])) {
            return [
                'valid' => false,
                'reason' => 'Invalid attendance location coordinates',
                'distance' => null
            ];
        }
        
        if (!$this->isValidCoordinate($activityLocation['latitude'], $activityLocation['longitude'])) {
            return [
                'valid' => false, 
                'reason' => 'Invalid activity location coordinates',
                'distance' => null
            ];
        }
        
        $distance = $this->calculateDistance(
            $attendanceLocation['latitude'],
            $attendanceLocation['longitude'],
            $activityLocation['latitude'], 
            $activityLocation['longitude']
        );
        
        return [
            'valid' => $distance <= $maxDistanceMeters,
            'distance' => round($distance, 2),
            'max_distance' => $maxDistanceMeters,
            'reason' => $distance > $maxDistanceMeters 
                ? "Location is {$distance}m away, maximum allowed is {$maxDistanceMeters}m"
                : null
        ];
    }
    
    /**
     * Check if GPS coordinates are within valid range
     * 
     * @param float $latitude
     * @param float $longitude  
     * @return bool
     */
    public function isValidCoordinate(float $latitude, float $longitude): bool
    {
        return $latitude >= -90 && $latitude <= 90 && 
               $longitude >= -180 && $longitude <= 180;
    }
    
    /**
     * Check if GPS accuracy is acceptable
     * 
     * @param float $accuracy GPS accuracy in meters
     * @param float $maxAccuracy Maximum acceptable accuracy in meters
     * @return bool
     */
    public function isAccuracyAcceptable(float $accuracy, float $maxAccuracy = 50.0): bool
    {
        return $accuracy <= $maxAccuracy;
    }
    
    /**
     * Format GPS coordinates for display
     * 
     * @param float $latitude
     * @param float $longitude
     * @param int $precision Number of decimal places
     * @return string Formatted coordinates
     */
    public function formatCoordinates(float $latitude, float $longitude, int $precision = 6): string
    {
        return number_format($latitude, $precision) . ', ' . number_format($longitude, $precision);
    }
    
    /**
     * Convert coordinates to DMS (Degrees Minutes Seconds) format
     * 
     * @param float $decimal Decimal coordinate
     * @param string $type 'lat' or 'lng'
     * @return string DMS formatted coordinate
     */
    public function convertToDMS(float $decimal, string $type): string
    {
        $degrees = floor(abs($decimal));
        $minutes = floor((abs($decimal) - $degrees) * 60);
        $seconds = ((abs($decimal) - $degrees) * 60 - $minutes) * 60;
        
        $direction = '';
        if ($type === 'lat') {
            $direction = $decimal >= 0 ? 'N' : 'S';
        } elseif ($type === 'lng') {
            $direction = $decimal >= 0 ? 'E' : 'W';
        }
        
        return sprintf('%d°%02d\'%05.2f"%s', $degrees, $minutes, $seconds, $direction);
    }
    
    /**
     * Get suggested GPS accuracy threshold based on activity type
     * 
     * @param string $activityType Type of activity
     * @return float Suggested accuracy in meters
     */
    public function getSuggestedAccuracy(string $activityType = 'default'): float
    {
        $accuracyThresholds = [
            'indoor' => 20.0,     // Indoor activities - more lenient
            'outdoor' => 10.0,    // Outdoor activities - stricter
            'field_trip' => 100.0, // Field trips - very lenient
            'default' => 30.0     // Default threshold
        ];
        
        return $accuracyThresholds[$activityType] ?? $accuracyThresholds['default'];
    }
    
    /**
     * Get GPS validation rules for different scenarios
     * 
     * @param string $scenario Validation scenario
     * @return array Validation configuration
     */
    public function getValidationRules(string $scenario = 'default'): array
    {
        $rules = [
            'strict' => [
                'max_accuracy' => 10.0,
                'max_distance' => 50,
                'require_fresh_location' => true
            ],
            'moderate' => [
                'max_accuracy' => 30.0,
                'max_distance' => 100,
                'require_fresh_location' => false
            ],
            'lenient' => [
                'max_accuracy' => 100.0,
                'max_distance' => 200,
                'require_fresh_location' => false
            ],
            'default' => [
                'max_accuracy' => 50.0,
                'max_distance' => 100,
                'require_fresh_location' => false
            ]
        ];
        
        return $rules[$scenario] ?? $rules['default'];
    }
}