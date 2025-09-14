<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AttendanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        return true; // Authorization will be handled by middleware
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $method = $this->route()->getActionMethod();
        
        switch ($method) {
            case 'recordByQr':
                return [
                    'type' => 'required|in:student,tutor',
                    'target_id' => 'required|integer',
                    'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
                    'status' => 'nullable|in:present,absent,late',
                    'token' => 'required|string',
                    'arrival_time' => 'nullable|date_format:Y-m-d H:i:s',
                    'gps_data' => 'nullable|array',
                    'gps_data.latitude' => 'required_with:gps_data|numeric|between:-90,90',
                    'gps_data.longitude' => 'required_with:gps_data|numeric|between:-180,180',
                    'gps_data.accuracy' => 'nullable|numeric|min:0',
                    'gps_data.timestamp' => 'nullable|date_format:Y-m-d\TH:i:s.u\Z'
                ];
                
            case 'recordManually':
                return [
                    'type' => 'required|in:student,tutor',
                    'target_id' => 'required|integer',
                    'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
                    'status' => 'nullable|in:present,absent,late',
                    'notes' => 'nullable|string|max:255',
                    'arrival_time' => 'nullable|date_format:Y-m-d H:i:s',
                    'gps_data' => 'nullable|array',
                    'gps_data.latitude' => 'required_with:gps_data|numeric|between:-90,90',
                    'gps_data.longitude' => 'required_with:gps_data|numeric|between:-180,180',
                    'gps_data.accuracy' => 'nullable|numeric|min:0',
                    'gps_data.timestamp' => 'nullable|date_format:Y-m-d\TH:i:s.u\Z'
                ];
                
            case 'recordAttendanceByQr':
                return [
                    'id_anak' => 'required|exists:anak,id_anak',
                    'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
                    'status' => 'nullable|in:present,absent,late',
                    'token' => 'required|string',
                    'arrival_time' => 'nullable|date_format:Y-m-d H:i:s'
                ];
                
            case 'recordAttendanceManually':
                return [
                    'id_anak' => 'required|exists:anak,id_anak',
                    'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
                    'status' => 'nullable|in:present,absent,late',
                    'notes' => 'nullable|string|max:255',
                    'arrival_time' => 'nullable|date_format:Y-m-d H:i:s'
                ];
                
            case 'recordTutorAttendanceByQr':
                return [
                    'id_tutor' => 'required|exists:tutor,id_tutor',
                    'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
                    'status' => 'nullable|in:present,absent,late',
                    'token' => 'required|string',
                    'arrival_time' => 'nullable|date_format:Y-m-d H:i:s'
                ];
                
            case 'recordTutorAttendanceManually':
                return [
                    'id_tutor' => 'required|exists:tutor,id_tutor',
                    'id_aktivitas' => 'required|exists:aktivitas,id_aktivitas',
                    'status' => 'nullable|in:present,absent,late',
                    'notes' => 'required|string|max:255',
                    'arrival_time' => 'nullable|date_format:Y-m-d H:i:s'
                ];
                
            case 'getByStudent':
                return [
                    'date_from' => 'nullable|date_format:Y-m-d',
                    'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from',
                    'is_verified' => 'nullable|boolean',
                    'verification_status' => 'nullable|in:pending,verified,rejected,manual',
                    'status' => 'nullable|in:present,absent,late'
                ];
                
            case 'manualVerify':
                return [
                    'notes' => 'required|string|max:255'
                ];
                
            case 'rejectVerification':
                return [
                    'reason' => 'required|string|max:255'
                ];
                
            case 'generateStats':
                return [
                    'start_date' => 'required|date_format:Y-m-d',
                    'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
                    'id_shelter' => 'nullable|exists:shelter,id_shelter'
                ];
                
            case 'generateTutorPaymentReport':
                return [
                    'start_date' => 'required|date_format:Y-m-d',
                    'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
                    'id_tutor' => 'nullable|exists:tutor,id_tutor',
                    'id_shelter' => 'nullable|exists:shelter,id_shelter'
                ];
                
            case 'exportAttendanceData':
                return [
                    'start_date' => 'required|date_format:Y-m-d',
                    'end_date' => 'required|date_format:Y-m-d|after_or_equal:start_date',
                    'id_shelter' => 'nullable|exists:shelter,id_shelter',
                    'id_anak' => 'nullable|exists:anak,id_anak',
                    'format' => 'required|in:csv,excel'
                ];
                
            default:
                return [];
        }
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'type.required' => 'Type is required (student or tutor)',
            'type.in' => 'Type must be either student or tutor',
            'target_id.required' => 'Target ID is required',
            'target_id.integer' => 'Target ID must be a valid integer',
            'id_anak.required' => 'Student ID is required',
            'id_anak.exists' => 'Student not found with the provided ID',
            'id_tutor.required' => 'Tutor ID is required',
            'id_tutor.exists' => 'Tutor not found with the provided ID',
            'id_aktivitas.required' => 'Activity ID is required',
            'id_aktivitas.exists' => 'Activity not found with the provided ID',
            'status.in' => 'Status must be either present, absent, or late',
            'token.required' => 'QR token is required for verification',
            'notes.max' => 'Notes cannot exceed 255 characters',
            'reason.required' => 'Reason for rejection is required',
            'reason.max' => 'Reason cannot exceed 255 characters',
            'date_from.date_format' => 'Start date must be in YYYY-MM-DD format',
            'date_to.date_format' => 'End date must be in YYYY-MM-DD format',
            'date_to.after_or_equal' => 'End date must be on or after start date',
            'arrival_time.date_format' => 'Arrival time must be in YYYY-MM-DD HH:MM:SS format',
            'id_shelter.exists' => 'Shelter not found with the provided ID',
            'format.required' => 'Export format is required',
            'format.in' => 'Format must be either csv or excel',
            'gps_data.latitude.required_with' => 'Latitude is required when GPS data is provided',
            'gps_data.latitude.between' => 'Latitude must be between -90 and 90',
            'gps_data.longitude.required_with' => 'Longitude is required when GPS data is provided',
            'gps_data.longitude.between' => 'Longitude must be between -180 and 180',
            'gps_data.accuracy.min' => 'GPS accuracy cannot be negative',
            'gps_data.timestamp.date_format' => 'GPS timestamp must be in ISO format',
        ];
    }
}