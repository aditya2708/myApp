/**
 * Helper utilities for activity status validation
 */
import { Alert } from 'react-native';

// Status values that indicate activity is completed/finished
export const COMPLETED_STATUSES = ['completed', 'reported', 'selesai', 'finished', 'done'];

/**
 * Check if activity status indicates it's completed
 * @param {string} status - Activity status
 * @returns {boolean} - True if activity is completed
 */
export const isActivityCompleted = (status) => {
  if (!status || typeof status !== 'string') {
    return false;
  }
  return COMPLETED_STATUSES.includes(status.toLowerCase());
};

/**
 * Show alert and navigate back if activity is completed
 * @param {string} status - Activity status
 * @param {function} navigation - Navigation object
 * @param {string} actionType - Type of action being blocked (e.g., 'absen manual', 'laporan kegiatan')
 */
export const blockIfCompleted = (status, navigation, actionType) => {
  if (isActivityCompleted(status)) {
    Alert.alert(
      'Aktivitas Sudah Selesai',
      `Tidak dapat melakukan ${actionType} karena status aktivitas sudah selesai. Silakan hubungi Kantor Cabang jika ada perubahan yang diperlukan.`,
      [
        {
          text: 'Kembali',
          onPress: () => navigation.goBack(),
          style: 'default',
        }
      ]
    );
    return true;
  }
  return false;
};
