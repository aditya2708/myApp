import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const GpsApprovalCard = ({ 
  request, 
  onPress, 
  onQuickApprove, 
  onQuickReject 
}) => {
  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { 
          label: 'Menunggu Persetujuan', 
          color: '#f39c12', 
          bgColor: '#fef9e7', 
          icon: 'time-outline' 
        };
      case 'approved':
        return { 
          label: 'Disetujui', 
          color: '#27ae60', 
          bgColor: '#eafaf1', 
          icon: 'checkmark-circle-outline' 
        };
      case 'rejected':
        return { 
          label: 'Ditolak', 
          color: '#e74c3c', 
          bgColor: '#fadbd8', 
          icon: 'close-circle-outline' 
        };
      default:
        return { 
          label: 'Unknown', 
          color: '#95a5a6', 
          bgColor: '#f8f9fa', 
          icon: 'help-circle-outline' 
        };
    }
  };

  const statusInfo = getStatusInfo(request.gps_approval_status);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
    } catch {
      return '-';
    }
  };

  // Get changes count
  const getChangesCount = () => {
    if (!request.has_changes) return 0;
    
    const current = request.current_gps_data || {};
    const pending = request.pending_gps_data || {};
    
    let changes = 0;
    if (current.require_gps !== pending.require_gps) changes++;
    if (current.latitude !== pending.latitude) changes++;
    if (current.longitude !== pending.longitude) changes++;
    if (current.location_name !== pending.location_name) changes++;
    if (current.max_distance_meters !== pending.max_distance_meters) changes++;
    if (current.gps_accuracy_required !== pending.gps_accuracy_required) changes++;
    
    return changes;
  };

  const changesCount = getChangesCount();

  // Get GPS status text
  const getGpsStatusText = (data) => {
    if (!data) return 'Tidak diatur';
    return data.require_gps ? 'Aktif' : 'Tidak Aktif';
  };

  // Handle quick actions
  const handleQuickAction = (action, event) => {
    event.stopPropagation();
    
    if (request.gps_approval_status !== 'pending') {
      Alert.alert('Info', 'Hanya permintaan dengan status "Menunggu Persetujuan" yang bisa diproses');
      return;
    }
    
    if (action === 'approve') {
      onQuickApprove?.();
    } else if (action === 'reject') {
      onQuickReject?.();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.shelterInfo}>
          <Text style={styles.shelterName} numberOfLines={1}>
            {request.nama_shelter}
          </Text>
          <Text style={styles.adminName} numberOfLines={1}>
            Admin: {request.admin_shelter?.nama_lengkap || 'Unknown'}
          </Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Current vs Pending GPS Status */}
        <View style={styles.gpsStatusContainer}>
          <View style={styles.gpsStatusItem}>
            <Text style={styles.gpsStatusLabel}>GPS Saat Ini:</Text>
            <Text style={styles.gpsStatusValue}>
              {getGpsStatusText(request.current_gps_data)}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={16} color="#3498db" />
          <View style={styles.gpsStatusItem}>
            <Text style={styles.gpsStatusLabel}>GPS Baru:</Text>
            <Text style={[styles.gpsStatusValue, styles.pendingValue]}>
              {getGpsStatusText(request.pending_gps_data)}
            </Text>
          </View>
        </View>

        {/* Changes Summary */}
        {request.has_changes && (
          <View style={styles.changesContainer}>
            <Ionicons name="swap-horizontal" size={16} color="#e67e22" />
            <Text style={styles.changesText}>
              {changesCount} perubahan setting
            </Text>
          </View>
        )}

        {/* Location Info if GPS enabled */}
        {request.pending_gps_data?.require_gps && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={14} color="#27ae60" />
            <Text style={styles.locationText} numberOfLines={1}>
              {request.pending_gps_data.location_name || 'Lokasi tidak disebutkan'}
            </Text>
            {request.pending_gps_data.latitude && request.pending_gps_data.longitude && (
              <Text style={styles.coordinatesText}>
                {parseFloat(request.pending_gps_data.latitude).toFixed(4)}, {parseFloat(request.pending_gps_data.longitude).toFixed(4)}
              </Text>
            )}
          </View>
        )}

        {/* Rejection reason for rejected requests */}
        {request.gps_approval_status === 'rejected' && request.gps_rejection_reason && (
          <View style={styles.rejectionContainer}>
            <Ionicons name="information-circle" size={14} color="#e74c3c" />
            <Text style={styles.rejectionText} numberOfLines={2}>
              {request.gps_rejection_reason}
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dateInfo}>
          <Text style={styles.dateLabel}>
            {request.gps_approval_status === 'pending' ? 'Diajukan' : 
             request.gps_approval_status === 'approved' ? 'Disetujui' : 'Ditolak'}:
          </Text>
          <Text style={styles.dateValue}>
            {formatDate(
              request.gps_approval_status === 'pending' ? request.gps_submitted_at :
              request.gps_approval_status === 'approved' ? request.gps_approved_at :
              request.gps_approved_at
            )}
          </Text>
        </View>

        {/* Quick Actions for pending requests */}
        {request.gps_approval_status === 'pending' && (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.rejectButton]}
              onPress={(e) => handleQuickAction('reject', e)}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.approveButton]}
              onPress={(e) => handleQuickAction('approve', e)}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Detail Indicator */}
      <View style={styles.detailIndicator}>
        <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  shelterInfo: {
    flex: 1,
    marginRight: 12,
  },
  shelterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  adminName: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  gpsStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  gpsStatusItem: {
    flex: 1,
  },
  gpsStatusLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  gpsStatusValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2c3e50',
  },
  pendingValue: {
    color: '#3498db',
    fontWeight: '600',
  },
  changesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  changesText: {
    fontSize: 12,
    color: '#e67e22',
    marginLeft: 6,
    fontWeight: '500',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#27ae60',
    marginLeft: 6,
    flex: 1,
    fontWeight: '500',
  },
  coordinatesText: {
    fontSize: 10,
    color: '#7f8c8d',
    fontFamily: 'monospace',
    marginLeft: 6,
  },
  rejectionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fadbd8',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  rejectionText: {
    fontSize: 11,
    color: '#e74c3c',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: '#27ae60',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  detailIndicator: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});

export default GpsApprovalCard;