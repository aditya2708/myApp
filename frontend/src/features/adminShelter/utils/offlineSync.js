import NetInfo from '@react-native-community/netinfo';
import { store } from '../../../redux/store';
import { queueOfflineAttendance, removeFromOfflineQueue, setSyncing } from '../redux/attendanceSlice';
import { attendanceApi } from '../api/attendanceApi';

/**
 * Utility for handling offline attendance syncing
 */
class OfflineSync {
  /**
   * Process attendance recording with offline fallback
   * 
   * @param {Object} attendanceData - Attendance data to record
   * @param {string} method - 'qr' or 'manual'
   * @returns {Promise} - Result of operation
   */
  static async processAttendance(attendanceData, method) {
    const netState = await NetInfo.fetch();
    
    // If online, try to record directly
    if (netState.isConnected && netState.isInternetReachable) {
      try {
        if (method === 'qr') {
          return await attendanceApi.recordAttendanceByQr(
            attendanceData.id_anak, 
            attendanceData.id_aktivitas, 
            attendanceData.status, 
            attendanceData.token,
            attendanceData.arrival_time
          );
        } else {
          return await attendanceApi.recordAttendanceManually(
            attendanceData.id_anak, 
            attendanceData.id_aktivitas, 
            attendanceData.status, 
            attendanceData.notes,
            attendanceData.arrival_time
          );
        }
      } catch (error) {
        console.error('Error recording attendance online:', error);
        // If server error, queue for later
        this.queueForSync({
          ...attendanceData,
          method,
          timestamp: new Date().toISOString(),
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });
        return { 
          offline: true, 
          queued: true, 
          error: error.message 
        };
      }
    } else {
      // If offline, queue for later sync
      this.queueForSync({
        ...attendanceData,
        method,
        timestamp: new Date().toISOString(),
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
      return { 
        offline: true, 
        queued: true,
        message: 'Attendance recorded offline and will be synced when connection is available' 
      };
    }
  }
  
  /**
   * Queue an attendance record for later sync
   * 
   * @param {Object} item - Attendance data to queue
   */
  static queueForSync(item) {
    store.dispatch(queueOfflineAttendance(item));
  }
  
  /**
   * Sync all queued attendance records
   * 
   * @returns {Promise<Object>} - Sync results
   */
  static async syncAll() {
    const state = store.getState();
    const queue = state.attendance.offlineQueue;
    
    if (queue.length === 0) {
      return { synced: 0, failed: 0 };
    }
    
    // Check connection
    const netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      return { 
        synced: 0, 
        failed: 0, 
        offline: true, 
        message: 'No internet connection available' 
      };
    }
    
    // Start syncing
    store.dispatch(setSyncing(true));
    
    let synced = 0;
    let failed = 0;
    
    for (const item of queue) {
      try {
        if (item.method === 'qr') {
          await attendanceApi.recordAttendanceByQr(
            item.id_anak, 
            item.id_aktivitas, 
            item.status, 
            item.token,
            item.arrival_time
          );
        } else {
          await attendanceApi.recordAttendanceManually(
            item.id_anak, 
            item.id_aktivitas, 
            item.status, 
            item.notes,
            item.arrival_time
          );
        }
        
        // Successfully synced, remove from queue
        store.dispatch(removeFromOfflineQueue(item.id));
        synced++;
      } catch (error) {
        console.error('Error syncing attendance:', error, item);
        failed++;
      }
    }
    
    store.dispatch(setSyncing(false));
    
    return {
      synced,
      failed,
      total: queue.length
    };
  }
  
  /**
   * Register network listeners to auto-sync when connection is restored
   */
  static registerNetworkListeners() {
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        const queuedItems = store.getState().attendance.offlineQueue;
        if (queuedItems.length > 0) {
          this.syncAll()
            .then(result => {
              console.log('Auto-sync results:', result);
            })
            .catch(error => {
              console.error('Auto-sync error:', error);
            });
        }
      }
    });
  }
}

export default OfflineSync;