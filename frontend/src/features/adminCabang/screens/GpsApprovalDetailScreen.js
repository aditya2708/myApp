import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminCabangApi } from '../api/adminCabangApi';

const { width } = Dimensions.get('window');

const GpsApprovalDetailScreen = ({ navigation, route }) => {
  const { shelterId, shelterName } = route.params;
  
  const [gpsRequest, setGpsRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Load GPS request detail
  useEffect(() => {
    loadGpsRequestDetail();
  }, [shelterId]);

  const loadGpsRequestDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminCabangApi.getGpsApprovalDetail(shelterId);

      if (response.data.success) {
        setGpsRequest(response.data.data);
      } else {
        throw new Error(response.data.message || 'Gagal memuat detail permintaan GPS');
      }
    } catch (err) {
      console.error('Error loading GPS request detail:', err);
      setError(err.response?.data?.message || err.message || 'Gagal memuat detail permintaan GPS');
    } finally {
      setLoading(false);
    }
  };

  // Handle approval
  const handleApprove = () => {
    if (!gpsRequest || gpsRequest.gps_approval_status !== 'pending') {
      Alert.alert('Info', 'Hanya permintaan dengan status "Menunggu Persetujuan" yang bisa diproses');
      return;
    }

    Alert.alert(
      'Konfirmasi Persetujuan',
      `Setujui perubahan GPS setting untuk ${gpsRequest.nama_shelter}?\\n\\nPerubahan akan langsung diterapkan ke shelter.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          style: 'default',
          onPress: processApproval
        }
      ]
    );
  };

  const processApproval = async () => {
    try {
      setActionLoading(true);

      const response = await adminCabangApi.approveGpsRequest(shelterId, {
        approval_notes: 'Disetujui dari detail screen'
      });

      if (response.data.success) {
        Alert.alert('Berhasil', 'GPS setting berhasil disetujui', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Gagal menyetujui GPS setting');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle rejection
  const handleReject = () => {
    if (!gpsRequest || gpsRequest.gps_approval_status !== 'pending') {
      Alert.alert('Info', 'Hanya permintaan dengan status "Menunggu Persetujuan" yang bisa diproses');
      return;
    }

    Alert.prompt(
      'Alasan Penolakan',
      `Masukkan alasan penolakan untuk ${gpsRequest.nama_shelter}:`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tolak',
          style: 'destructive',
          onPress: processRejection
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const processRejection = async (reason) => {
    if (!reason?.trim()) {
      Alert.alert('Error', 'Alasan penolakan harus diisi');
      return;
    }

    try {
      setActionLoading(true);

      const response = await adminCabangApi.rejectGpsRequest(shelterId, {
        rejection_reason: reason.trim()
      });

      if (response.data.success) {
        Alert.alert('Berhasil', 'GPS setting berhasil ditolak', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Gagal menolak GPS setting');
    } finally {
      setActionLoading(false);
    }
  };

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
    } catch {
      return '-';
    }
  };

  // Render changes comparison
  const renderChangesComparison = () => {
    if (!gpsRequest.changes_summary || gpsRequest.changes_summary.length === 0) {
      return (
        <View style={styles.noChangesContainer}>
          <Text style={styles.noChangesText}>Tidak ada perubahan GPS setting</Text>
        </View>
      );
    }

    return (
      <View style={styles.changesContainer}>
        <Text style={styles.changesTitle}>Perubahan GPS Setting:</Text>
        {gpsRequest.changes_summary.map((change, index) => (
          <View key={index} style={styles.changeItem}>
            <Text style={styles.changeField}>{change.field}:</Text>
            <View style={styles.changeValues}>
              <View style={styles.changeValueContainer}>
                <Text style={styles.changeLabel}>Sebelum:</Text>
                <Text style={styles.changeValue}>{change.from}</Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#3498db" style={styles.changeArrow} />
              <View style={styles.changeValueContainer}>
                <Text style={styles.changeLabel}>Sesudah:</Text>
                <Text style={[styles.changeValue, styles.newValue]}>{change.to}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Render GPS coordinate comparison
  const renderGpsComparison = () => {
    const currentData = gpsRequest.current_gps_data;
    const pendingData = gpsRequest.pending_gps_data;

    if (!currentData?.require_gps && !pendingData?.require_gps) {
      return null;
    }

    return (
      <View style={styles.gpsContainer}>
        <Text style={styles.sectionTitle}>Perbandingan Lokasi GPS:</Text>
        
        {/* Current GPS */}
        {currentData?.require_gps && (
          <View style={styles.gpsSection}>
            <Text style={styles.gpsTitle}>GPS Saat Ini:</Text>
            <View style={styles.coordinateCard}>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Nama Lokasi:</Text>
                <Text style={styles.coordinateValue}>{currentData.location_name || '-'}</Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Latitude:</Text>
                <Text style={styles.coordinateValue}>{parseFloat(currentData.latitude).toFixed(6)}</Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Longitude:</Text>
                <Text style={styles.coordinateValue}>{parseFloat(currentData.longitude).toFixed(6)}</Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Radius:</Text>
                <Text style={styles.coordinateValue}>{currentData.max_distance_meters}m</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Pending GPS */}
        {pendingData?.require_gps && (
          <View style={styles.gpsSection}>
            <Text style={styles.gpsTitle}>GPS Baru (Pending):</Text>
            <View style={[styles.coordinateCard, styles.pendingCard]}>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Nama Lokasi:</Text>
                <Text style={styles.coordinateValue}>{pendingData.location_name || '-'}</Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Latitude:</Text>
                <Text style={styles.coordinateValue}>{parseFloat(pendingData.latitude).toFixed(6)}</Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Longitude:</Text>
                <Text style={styles.coordinateValue}>{parseFloat(pendingData.longitude).toFixed(6)}</Text>
              </View>
              <View style={styles.coordinateRow}>
                <Text style={styles.coordinateLabel}>Radius:</Text>
                <Text style={styles.coordinateValue}>{pendingData.max_distance_meters}m</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Memuat detail permintaan GPS..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={loadGpsRequestDetail} />
      </View>
    );
  }

  if (!gpsRequest) {
    return (
      <View style={styles.container}>
        <ErrorMessage message="Data permintaan GPS tidak ditemukan" />
      </View>
    );
  }

  const statusInfo = getStatusInfo(gpsRequest.gps_approval_status);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.shelterInfo}>
          <Text style={styles.shelterName}>{gpsRequest.nama_shelter}</Text>
          <Text style={styles.adminName}>
            Admin: {gpsRequest.admin_shelter?.nama_lengkap || 'Unknown'}
          </Text>
          <Text style={styles.shelterAddress}>{gpsRequest.alamat}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
          <Ionicons name={statusInfo.icon} size={16} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Submission Info */}
      <View style={styles.submissionInfo}>
        <View style={styles.dateInfo}>
          <Text style={styles.dateLabel}>Tanggal Pengajuan:</Text>
          <Text style={styles.dateValue}>{formatDate(gpsRequest.gps_submitted_at)}</Text>
        </View>
        
        {gpsRequest.gps_approval_status === 'approved' && gpsRequest.gps_approved_at && (
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Tanggal Disetujui:</Text>
            <Text style={styles.dateValue}>{formatDate(gpsRequest.gps_approved_at)}</Text>
          </View>
        )}
        
        {gpsRequest.gps_approval_status === 'rejected' && gpsRequest.gps_rejection_reason && (
          <View style={styles.rejectionInfo}>
            <Text style={styles.rejectionLabel}>Alasan Penolakan:</Text>
            <Text style={styles.rejectionText}>{gpsRequest.gps_rejection_reason}</Text>
          </View>
        )}
      </View>

      {/* Changes Comparison */}
      {renderChangesComparison()}

      {/* GPS Comparison */}
      {renderGpsComparison()}

      {/* Action Buttons */}
      {gpsRequest.gps_approval_status === 'pending' && (
        <View style={styles.actionButtons}>
          <Button
            title="Tolak"
            onPress={handleReject}
            type="outline"
            loading={actionLoading}
            disabled={actionLoading}
            style={[styles.actionButton, styles.rejectButton]}
            textStyle={styles.rejectButtonText}
          />
          <Button
            title="Setujui"
            onPress={handleApprove}
            loading={actionLoading}
            disabled={actionLoading}
            style={[styles.actionButton, styles.approveButton]}
          />
        </View>
      )}

      {/* Change History */}
      {gpsRequest.change_history && gpsRequest.change_history.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Riwayat Perubahan:</Text>
          {gpsRequest.change_history.map((history, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyAction}>{history.action}</Text>
                <Text style={styles.historyDate}>
                  {formatDate(history.timestamp)}
                </Text>
              </View>
              {history.notes && (
                <Text style={styles.historyNotes}>{history.notes}</Text>
              )}
              {history.rejection_reason && (
                <Text style={styles.historyReason}>Alasan: {history.rejection_reason}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  shelterInfo: {
    marginBottom: 16,
  },
  shelterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  adminName: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  shelterAddress: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  submissionInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  rejectionInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fadbd8',
    borderRadius: 8,
  },
  rejectionLabel: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#e74c3c',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  changesContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  changesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  changeItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  changeField: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  changeValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeValueContainer: {
    flex: 1,
  },
  changeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  newValue: {
    color: '#3498db',
    fontWeight: '600',
  },
  changeArrow: {
    marginHorizontal: 16,
  },
  noChangesContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  noChangesText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  gpsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
  },
  gpsSection: {
    marginBottom: 24,
  },
  gpsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 12,
  },
  coordinateCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  pendingCard: {
    backgroundColor: '#fff5e6',
    borderColor: '#f39c12',
    borderWidth: 2,
  },
  coordinateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  coordinateValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  rejectButton: {
    borderColor: '#e74c3c',
  },
  rejectButtonText: {
    color: '#e74c3c',
  },
  approveButton: {
    backgroundColor: '#27ae60',
  },
  historyContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  historyItem: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textTransform: 'capitalize',
  },
  historyDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  historyNotes: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
    marginBottom: 4,
  },
  historyReason: {
    fontSize: 14,
    color: '#e74c3c',
    lineHeight: 20,
  },
});

export default GpsApprovalDetailScreen;