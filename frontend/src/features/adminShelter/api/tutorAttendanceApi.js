import api from '../../../api/axiosConfig';

export const tutorAttendanceApi = {
  generateTutorToken: async (id_tutor, validDays = 30) => {
    return await api.post('/admin-shelter/attendance/generate-tutor-token', {
      id_tutor,
      valid_days: validDays
    });
  },

  validateTutorToken: async (token) => {
    return await api.post('/admin-shelter/attendance/validate-tutor-token', {
      token
    });
  },

  recordTutorAttendanceByQr: async (id_aktivitas, token, arrival_time = null, gps_data = null) => {
    const params = {
      type: 'tutor',
      id_aktivitas,
      token
    };
    
    if (arrival_time) {
      params.arrival_time = arrival_time;
    }
    
    if (gps_data) {
      params.gps_data = gps_data;
    }
    
    return await api.post('/admin-shelter/attendance/record', params);
  },

  recordTutorAttendanceManually: async (id_tutor, id_aktivitas, status, notes = '', arrival_time = null, gps_data = null) => {
    const params = {
      type: 'tutor',
      target_id: id_tutor,
      id_aktivitas,
      notes
    };
    
    if (status) {
      params.status = status;
    }
    
    if (arrival_time) {
      params.arrival_time = arrival_time;
    }
    
    if (gps_data) {
      params.gps_data = gps_data;
    }
    
    return await api.post('/admin-shelter/attendance/record-manual', params);
  },

  getTutorAttendanceByActivity: async (id_aktivitas) => {
    const fetchTutorAttendance = async (url, config = {}) => {
      const response = await api.get(url, config);
      const tutorRecord = response?.data?.tutor ?? response?.data?.data ?? response?.data ?? null;

      response.data = tutorRecord;
      return response;
    };

    try {
      return await fetchTutorAttendance(`/admin-shelter/attendance/activity/${id_aktivitas}/tutor`);
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 405) {
        return await fetchTutorAttendance(`/admin-shelter/attendance/activity/${id_aktivitas}`, {
          params: { type: 'tutor' }
        });
      }

      throw error;
    }
  },

  getTutorAttendanceHistory: async (id_tutor, filters = {}) => {
    return await api.get(`/admin-shelter/attendance/tutor/${id_tutor}/history`, {
      params: filters
    });
  }
};