<?php

namespace App\Services\Attendance;

use Carbon\Carbon;
use Illuminate\Support\Arr;

class GpsMetadataService
{
    public function __construct(protected \App\Services\LocationService $locationService)
    {
    }

    /**
     * Normalize GPS payload and generate auto-flag metadata.
     */
    public function compile(?array $gpsData, $shelter, bool $isGpsRequired): array
    {
        $payload = [];
        $flags = [];

        if (!$gpsData) {
            if ($isGpsRequired) {
                $payload['gps_valid'] = false;
                $payload['gps_validation_notes'] = 'GPS data missing when shelter requires location capture.';
                $flags[] = [
                    'code' => 'GPS_MISSING',
                    'message' => 'GPS data missing when shelter requires location capture.',
                    'severity' => 'warning',
                ];
            }

            return [
                'payload' => $payload,
                'flags' => $flags,
            ];
        }

        $normalized = $this->normalizeGpsPayload($gpsData);
        $payload = $normalized;
        $payload['gps_valid'] = true;

        if (!$shelter || !$shelter->latitude || !$shelter->longitude) {
            $payload['gps_valid'] = false;
            $payload['gps_validation_notes'] = 'Shelter location is not configured.';
            $flags[] = [
                'code' => 'SHELTER_LOCATION_INCOMPLETE',
                'message' => 'Shelter location is not configured.',
                'severity' => 'warning',
            ];

            return [
                'payload' => $payload,
                'flags' => $flags,
            ];
        }

        $validationInput = [
            'latitude' => $normalized['latitude'] ?? null,
            'longitude' => $normalized['longitude'] ?? null,
        ];

        $accuracy = $gpsData['accuracy'] ?? $gpsData['gps_accuracy'] ?? $normalized['gps_accuracy'] ?? null;
        if ($accuracy !== null) {
            $validationInput['accuracy'] = $accuracy;
        }

        $validation = $this->validateGpsLocationFromShelter($shelter, $validationInput);

        if (!$validation['valid']) {
            $payload['gps_valid'] = false;
            $payload['gps_validation_notes'] = $validation['reason'];
            if (isset($validation['distance'])) {
                $payload['distance_from_activity'] = $validation['distance'];
            }

            $flags[] = [
                'code' => strtoupper($validation['error_type'] ?? 'GPS_INVALID'),
                'message' => $validation['reason'],
                'severity' => 'warning',
                'details' => Arr::except($validation, ['valid', 'reason']),
            ];
        } else {
            $payload['gps_validation_notes'] = null;
            if (isset($validation['distance'])) {
                $payload['distance_from_activity'] = $validation['distance'];
            }
        }

        return [
            'payload' => $payload,
            'flags' => $flags,
        ];
    }

    public function normalizeGpsPayload(?array $gpsData): array
    {
        if (!$gpsData) {
            return [];
        }

        $latitude = $gpsData['latitude'] ?? $gpsData['lat'] ?? null;
        $longitude = $gpsData['longitude'] ?? $gpsData['lng'] ?? null;
        $accuracy = $gpsData['gps_accuracy'] ?? $gpsData['accuracy'] ?? null;
        $timestamp = $gpsData['gps_recorded_at'] ?? $gpsData['timestamp'] ?? null;

        return array_filter([
            'latitude' => $latitude !== null ? (float) $latitude : null,
            'longitude' => $longitude !== null ? (float) $longitude : null,
            'gps_accuracy' => $accuracy !== null ? (float) $accuracy : null,
            'gps_recorded_at' => $this->parseGpsTimestamp($timestamp),
            'location_name' => $gpsData['location_name'] ?? null,
        ], static function ($value) {
            return $value !== null;
        });
    }

    public function validateGpsLocationFromShelter($shelter, $gpsData)
    {
        if (!$shelter->latitude || !$shelter->longitude) {
            return [
                'valid' => false,
                'reason' => 'Shelter location not configured. Please contact administrator.',
                'error_type' => 'missing_shelter_location'
            ];
        }

        if (!isset($gpsData['latitude']) || !isset($gpsData['longitude'])) {
            return [
                'valid' => false,
                'reason' => 'Invalid GPS data format. Location coordinates required.',
                'error_type' => 'invalid_gps_format'
            ];
        }

        if (isset($gpsData['accuracy'])) {
            $requiredAccuracy = $shelter->gps_accuracy_required ?: 25;
            if (!$this->locationService->isAccuracyAcceptable($gpsData['accuracy'], $requiredAccuracy)) {
                return [
                    'valid' => false,
                    'reason' => "GPS accuracy ({$gpsData['accuracy']}m) is too low. Please try again with better signal.",
                    'error_type' => 'low_accuracy',
                    'required_accuracy' => $requiredAccuracy,
                    'current_accuracy' => $gpsData['accuracy']
                ];
            }
        }

        $attendanceLocation = [
            'latitude' => $gpsData['latitude'],
            'longitude' => $gpsData['longitude']
        ];

        $shelterLocation = [
            'latitude' => $shelter->latitude,
            'longitude' => $shelter->longitude
        ];

        $maxDistance = $shelter->max_distance_meters ?: 100;

        $validation = $this->locationService->validateAttendanceLocation(
            $attendanceLocation,
            $shelterLocation,
            $maxDistance
        );

        if (!$validation['valid']) {
            return [
                'valid' => false,
                'reason' => $validation['reason'],
                'error_type' => 'location_out_of_range',
                'distance' => $validation['distance'],
                'max_distance' => $validation['max_distance']
            ];
        }

        return [
            'valid' => true,
            'distance' => $validation['distance'],
            'max_distance' => $validation['max_distance']
        ];
    }

    public function parseGpsTimestamp($timestamp): ?Carbon
    {
        if (!$timestamp) {
            return null;
        }

        try {
            return Carbon::parse($timestamp);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
