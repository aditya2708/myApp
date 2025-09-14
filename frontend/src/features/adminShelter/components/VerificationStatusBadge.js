import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Verification Status Badge Component
 * Displays the verification status of an attendance record
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isVerified - Whether attendance is verified
 * @param {string} props.status - Verification status (pending, verified, rejected, manual)
 * @param {string} props.method - Verification method (qr_code, manual, face_recognition, dual)
 * @param {string} props.attendanceStatus - Attendance status (Ya, Tidak, Terlambat)
 * @param {boolean} props.showMethod - Whether to show verification method
 * @param {boolean} props.compact - Whether to use compact display
 * @param {Function} props.onPress - Callback when badge is pressed
 */
const VerificationStatusBadge = ({ 
  isVerified = false,
  status = 'pending',
  method = null,
  attendanceStatus = 'Ya',
  showMethod = true,
  compact = false,
  onPress = null,
  style
}) => {
  // Determine status colors and icons
  const getStatusColor = () => {
    if (isVerified) {
      return '#2ecc71'; // Green for verified
    } else if (status === 'rejected') {
      return '#e74c3c'; // Red for rejected
    } else {
      return '#f39c12'; // Orange for pending
    }
  };
  
  const getStatusIcon = () => {
    if (isVerified) {
      return 'checkmark-circle';
    } else if (status === 'rejected') {
      return 'close-circle';
    } else {
      return 'time';
    }
  };
  
  const getStatusText = () => {
    if (isVerified) {
      return status === 'manual' ? 'Manually Verified' : 'Verified';
    } else if (status === 'rejected') {
      return 'Rejected';
    } else {
      return 'Pending';
    }
  };
  
  const getMethodText = () => {
    if (!method) return null;
    
    switch (method) {
      case 'qr_code':
        return 'QR Code';
      case 'manual':
        return 'Manual';
      case 'face_recognition':
        return 'Face Recognition';
      case 'dual':
        return 'QR + Face';
      default:
        return method;
    }
  };
  
  // Attendance status badge
  const getAttendanceStatusColor = () => {
    switch (attendanceStatus) {
      case 'Ya':
        return '#2ecc71'; // Green for present
      case 'Terlambat':
        return '#f39c12'; // Orange for late
      case 'Tidak':
        return '#e74c3c'; // Red for absent
      default:
        return '#95a5a6'; // Gray for unknown
    }
  };
  
  const getAttendanceStatusIcon = () => {
    switch (attendanceStatus) {
      case 'Ya':
        return 'checkmark-circle';
      case 'Terlambat':
        return 'time';
      case 'Tidak':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };
  
  const getAttendanceStatusText = () => {
    switch (attendanceStatus) {
      case 'Ya':
        return 'Present';
      case 'Terlambat':
        return 'Late';
      case 'Tidak':
        return 'Absent';
      default:
        return 'Unknown';
    }
  };
  
  // Combine verification and attendance status in compact mode
  const renderCompactBadge = () => {
    return (
      <View style={[
        styles.container, 
        { backgroundColor: getStatusColor() },
        styles.compactContainer,
        style
      ]}>
        <Ionicons 
          name={getStatusIcon()} 
          size={14} 
          color="#fff" 
        />
        <Text style={[
          styles.statusText,
          styles.compactText
        ]}>
          {getStatusText()}
        </Text>
      </View>
    );
  };
  
  // Render full badge with attendance status
  const renderFullBadge = () => {
    return (
      <View style={[styles.fullBadgeContainer, style]}>
        {/* Verification Status */}
        <View style={[
          styles.container, 
          { backgroundColor: getStatusColor() }
        ]}>
          <Ionicons 
            name={getStatusIcon()} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.statusText}>
            {getStatusText()}
          </Text>
          
          {showMethod && method && (
            <View style={styles.methodContainer}>
              <Text style={styles.methodText}>{getMethodText()}</Text>
            </View>
          )}
        </View>
        
        {/* Attendance Status */}
        <View style={[
          styles.attendanceContainer,
          { backgroundColor: getAttendanceStatusColor() }
        ]}>
          <Ionicons
            name={getAttendanceStatusIcon()}
            size={16}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {getAttendanceStatusText()}
          </Text>
        </View>
      </View>
    );
  };
  
  const content = compact ? renderCompactBadge() : renderFullBadge();
  
  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  
  return content;
};

const styles = StyleSheet.create({
  fullBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f39c12',
    marginRight: 6,
  },
  compactContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  compactText: {
    fontSize: 12,
  },
  methodContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  methodText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  attendanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
});

export default VerificationStatusBadge;