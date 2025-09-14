import api from '../../../api/axiosConfig';

/**
 * Attendance API service
 * Contains methods for attendance management API requests
 */
export const attendanceApi = {
  /**
   * Get recent activities for attendance
   * @returns {Promise} - API response with activities
   */
  getRecentActivities: async () => {
    try {
      // Since there's no direct attendance/activities endpoint, 
      // we can try to use another existing endpoint
      
      // Option 1: Try from the Aktivitas model (if this endpoint exists)
      try {
        return await api.get('/admin-shelter/aktivitas');
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // Option 2: Try to extract activities from existing attendance records
          const response = await api.get('/admin-shelter/absen');
          
          // If successful, extract unique activities from attendance records
          if (response.data && response.data.data) {
            const activities = [];
            const activityIds = new Set();
            
            response.data.data.forEach(record => {
              if (record.aktivitas && !activityIds.has(record.aktivitas.id_aktivitas)) {
                activities.push(record.aktivitas);
                activityIds.add(record.aktivitas.id_aktivitas);
              }
            });
            
            return { data: { data: activities } };
          }
        }
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Record attendance using QR code verification
   * @param {number|string} id_anak - Student ID
   * @param {number|string} id_aktivitas - Activity ID
   * @param {string|null} status - Attendance status ('present', 'absent', 'late') or null for auto-detection
   * @param {string} token - QR token for verification
   * @param {string} arrival_time - Optional arrival time (format: YYYY-MM-DD HH:MM:SS)
   * @param {Object} gps_data - Optional GPS data for location validation
   * @returns {Promise} - API response with recorded attendance
   */
  recordAttendanceByQr: async (id_anak, id_aktivitas, status, token, arrival_time = null, gps_data = null) => {
    const params = {
      type: 'student',
      target_id: id_anak,
      id_aktivitas,
      token
    };
    
    // Only include status if it's provided (not null or undefined)
    if (status) {
      params.status = status;
    }
    
    // Add arrival time if provided
    if (arrival_time) {
      params.arrival_time = arrival_time;
    }
    
    // Add GPS data if provided
    if (gps_data) {
      params.gps_data = gps_data;
    }
    
    return await api.post('/admin-shelter/attendance/record', params);
  },

  /**
   * Record attendance manually
   * @param {number|string} id_anak - Student ID
   * @param {number|string} id_aktivitas - Activity ID
   * @param {string|null} status - Attendance status ('present', 'absent', 'late') or null for auto-detection
   * @param {string} notes - Optional notes for manual verification
   * @param {string} arrival_time - Optional arrival time (format: YYYY-MM-DD HH:MM:SS)
   * @param {Object} gps_data - Optional GPS data for location validation
   * @returns {Promise} - API response with recorded attendance
   */
  recordAttendanceManually: async (id_anak, id_aktivitas, status, notes = '', arrival_time = null, gps_data = null) => {
    const params = {
      type: 'student',
      target_id: id_anak,
      id_aktivitas,
      notes
    };
    
    // Only include status if it's provided (not null or undefined)
    if (status) {
      params.status = status;
    }
    
    // Add arrival time if provided
    if (arrival_time) {
      params.arrival_time = arrival_time;
    }
    
    // Add GPS data if provided
    if (gps_data) {
      params.gps_data = gps_data;
    }
    
    return await api.post('/admin-shelter/attendance/record-manual', params);
  },

  /**
   * Get attendance records for an activity
   * @param {number|string} id_aktivitas - Activity ID
   * @param {Object} filters - Optional filters (is_verified, verification_status)
   * @returns {Promise} - API response with attendance records
   */
  getAttendanceByActivity: async (id_aktivitas, filters = {}) => {
    return await api.get(`/admin-shelter/attendance/activity/${id_aktivitas}`, {
      params: filters
    });
  },


  /**
   * Get attendance records for a student
   * @param {number|string} id_anak - Student ID
   * @param {Object} filters - Optional filters (is_verified, verification_status, date_from, date_to)
   * @returns {Promise} - API response with attendance records
   */
  getAttendanceByStudent: async (id_anak, filters = {}) => {
    return await api.get(`/admin-shelter/attendance/student/${id_anak}`, {
      params: filters
    });
  },

  /**
   * Manually verify an attendance record
   * @param {number|string} id_absen - Attendance ID
   * @param {string} notes - Notes explaining manual verification
   * @returns {Promise} - API response
   */
  manualVerify: async (id_absen, notes) => {
    return await api.post(`/admin-shelter/attendance/${id_absen}/verify`, {
      notes
    });
  },

  /**
   * Reject an attendance verification
   * @param {number|string} id_absen - Attendance ID
   * @param {string} reason - Reason for rejection
   * @returns {Promise} - API response
   */
  rejectVerification: async (id_absen, reason) => {
    return await api.post(`/admin-shelter/attendance/${id_absen}/reject`, {
      reason
    });
  },

  /**
   * Get verification history for an attendance record
   * @param {number|string} id_absen - Attendance ID
   * @returns {Promise} - API response with verification history
   */
  getVerificationHistory: async (id_absen) => {
    return await api.get(`/admin-shelter/attendance/${id_absen}/verification-history`);
  },

  /**
   * Generate attendance statistics
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {number|string} id_shelter - Optional shelter ID
   * @returns {Promise} - API response with statistics
   */
  generateStats: async (startDate, endDate, id_shelter = null) => {
    const params = {
      start_date: startDate,
      end_date: endDate
    };
    
    if (id_shelter) {
      params.id_shelter = id_shelter;
    }
    
    return await api.post('/admin-shelter/attendance-reports/statistics', params);
  }
};