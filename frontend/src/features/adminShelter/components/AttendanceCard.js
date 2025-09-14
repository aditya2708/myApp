import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateToIndonesian } from '../../../common/utils/dateFormatter';

const AttendanceCard = ({ 
  attendance, 
  onPress, 
  onVerify, 
  onReject, 
  showActions = true,
  expanded = false
}) => {
  if (!attendance) return null;
  
  // Extract data from attendance record
  const {
    id_absen,
    absen,
    is_verified,
    verification_status,
    absen_user,
    aktivitas,
    latest_verification,
    time_arrived
  } = attendance;
  
  // Get student info if available
  const student = absen_user?.anak || {};
  
  // Determine status colors and icons
  const getStatusColor = () => {
    if (is_verified) {
      return '#2ecc71'; // Green for verified
    } else if (verification_status === 'rejected') {
      return '#e74c3c'; // Red for rejected
    } else {
      return '#f39c12'; // Orange for pending
    }
  };
  
  const getStatusIcon = () => {
    if (is_verified) {
      return 'checkmark-circle';
    } else if (verification_status === 'rejected') {
      return 'close-circle';
    } else {
      return 'time';
    }
  };
  
  const getStatusText = () => {
    if (is_verified) {
      return verification_status === 'manual' ? 'Verifikasi Manual' : 'Terverifikasi';
    } else if (verification_status === 'rejected') {
      return 'Ditolak';
    } else {
      return 'Menunggu Verifikasi';
    }
  };
  
  const getAttendanceStatusText = () => {
    if (absen === 'Ya') return 'Hadir';
    if (absen === 'Terlambat') return 'Terlambat';
    return 'Tidak Hadir';
  };
  
  const getAttendanceStatusColor = () => {
    if (absen === 'Ya') return '#2ecc71'; // Green for present
    if (absen === 'Terlambat') return '#f39c12'; // Orange for late
    return '#e74c3c'; // Red for absent
  };
  
  const getAttendanceStatusIcon = () => {
    if (absen === 'Ya') return 'checkmark-circle';
    if (absen === 'Terlambat') return 'time';
    return 'close-circle';
  };

  return (
    <TouchableOpacity 
      style={[styles.card, { borderLeftColor: getStatusColor() }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        {/* Student photo */}
        {student.foto_url ? (
          <Image 
            source={{ uri: student.foto_url }} 
            style={styles.studentPhoto} 
          />
        ) : (
          <View style={[styles.studentPhoto, styles.noPhoto]}>
            <Ionicons name="person" size={24} color="#bdc3c7" />
          </View>
        )}
        
        {/* Student info */}
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>
            {student.name || student.full_name || student.nick_name || 'Siswa Tidak Dikenal'}
          </Text>
          <View style={styles.statusContainer}>
            <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        {/* Attendance status badge */}
        <View style={[styles.attendanceStatus, { backgroundColor: getAttendanceStatusColor() }]}>
          <Ionicons name={getAttendanceStatusIcon()} size={14} color="#fff" style={styles.attendanceStatusIcon} />
          <Text style={styles.attendanceStatusText}>
            {getAttendanceStatusText()}
          </Text>
        </View>
      </View>
      
      {/* Activity info */}
      {aktivitas && (
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>
            {aktivitas.jenis_kegiatan || 'Activity'}
          </Text>
          <Text style={styles.activityDate}>
            {formatDateToIndonesian(aktivitas.tanggal) || 'Date not available'}
          </Text>
          
          {/* Show arrival time if present */}
          {time_arrived && (
            <Text style={[
              styles.arrivalTime, 
              absen === 'Terlambat' ? styles.lateArrival : styles.onTimeArrival
            ]}>
              {`Arrived: ${formatDateToIndonesian(time_arrived, true)}`}
              {absen === 'Terlambat' && ' (Terlambat)'}
            </Text>
          )}
          
          {/* Show schedule info if available */}
          {aktivitas.start_time && (
            <Text style={styles.scheduleInfo}>
              Schedule: {aktivitas.start_time.substring(0, 5)} - 
              {aktivitas.end_time ? aktivitas.end_time.substring(0, 5) : '?'}
            </Text>
          )}
        </View>
      )}
      
      {/* Expanded details */}
      {expanded && (
        <View style={styles.expandedDetails}>
          {latest_verification && (
            <View style={styles.verificationInfo}>
              <Text style={styles.detailLabel}>Verification Method:</Text>
              <Text style={styles.detailText}>
                {latest_verification.verification_method === 'qr_code' ? 'QR Code' : 
                 latest_verification.verification_method === 'manual' ? 'Manual' : 
                 latest_verification.verification_method}
              </Text>
              
              {latest_verification.verification_notes && (
                <>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailText}>{latest_verification.verification_notes}</Text>
                </>
              )}
              
              <Text style={styles.detailLabel}>Diverifikasi oleh:</Text>
              <Text style={styles.detailText}>{latest_verification.verified_by || 'N/A'}</Text>
              
              <Text style={styles.detailLabel}>Verification time:</Text>
              <Text style={styles.detailText}>
                {latest_verification.verified_at ? 
                  formatDateToIndonesian(latest_verification.verified_at) : 'N/A'}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {/* Action buttons */}
      {showActions && !is_verified && verification_status !== 'rejected' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.verifyButton]} 
            onPress={() => onVerify(id_absen)}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Verify</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.rejectButton]} 
            onPress={() => onReject(id_absen)}
          >
            <Ionicons name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  noPhoto: {
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  attendanceStatusIcon: {
    marginRight: 4,
  },
  attendanceStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  activityInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  activityDate: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  scheduleInfo: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  arrivalTime: {
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  onTimeArrival: {
    color: '#2ecc71',
  },
  lateArrival: {
    color: '#f39c12',
  },
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  verificationInfo: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7f8c8d',
    marginTop: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#2c3e50',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  verifyButton: {
    backgroundColor: '#2ecc71',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default AttendanceCard;