import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../../common/components/ErrorMessage';

import {
  getAttendanceByActivity, manualVerify, rejectVerification,
  selectActivityAttendance, selectAttendanceLoading, selectAttendanceError, resetAttendanceError
} from '../../../redux/attendanceSlice';

const AttendanceListTab = ({
  navigation,
  id_aktivitas,
  activityName,
  activityDate,
  activityType,
  kelompokId,
  kelompokName,
}) => {
  const dispatch = useDispatch();
  
  const attendanceRecords = useSelector(state => selectActivityAttendance(state, id_aktivitas));
  const loading = useSelector(selectAttendanceLoading);
  const error = useSelector(selectAttendanceError);
  
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Ref untuk prevent multiple simultaneous requests
  const fetchingRef = useRef(false);
  const lastFetchTime = useRef(0);
  
  useEffect(() => {
    if (id_aktivitas) {
      // Debounce untuk prevent multiple calls saat tab switching
      const timeoutId = setTimeout(() => {
        fetchAttendanceRecords();
      }, 200);
      
      return () => {
        clearTimeout(timeoutId);
        dispatch(resetAttendanceError());
      };
    }
    
    return () => dispatch(resetAttendanceError());
  }, [id_aktivitas, dispatch]);
  
  const fetchAttendanceRecords = async () => {
    if (!id_aktivitas) return;
    
    // Prevent multiple simultaneous requests
    if (fetchingRef.current) return;
    
    // Rate limiting - minimum 1 second between requests
    const now = Date.now();
    if (now - lastFetchTime.current < 1000) return;
    
    try {
      fetchingRef.current = true;
      lastFetchTime.current = now;
      
      // Use old endpoint that shows attendance records only
      await dispatch(getAttendanceByActivity({ id_aktivitas, type: 'student' })).unwrap();
    } catch (err) {
      console.error('Gagal mengambil kehadiran:', err);
    } finally {
      fetchingRef.current = false;
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttendanceRecords();
  };
  
  // Filter attendance records based on search and status filter
  const filteredRecords = attendanceRecords.filter(record => {
    const studentName = record.absen_user?.anak?.name || record.student_name || record.full_name || '';
    const matchesSearch = studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.absen_user?.anak?.nis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.nis?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filterStatus === 'pending') {
      matchesFilter = record.verification_status === 'pending';
    } else if (filterStatus === 'verified') {
      matchesFilter = record.verification_status === 'verified';
    } else if (filterStatus === 'rejected') {
      matchesFilter = record.verification_status === 'rejected';
    }
    
    return matchesSearch && matchesFilter;
  });
  
  const getFilterCounts = () => {
    const pending = attendanceRecords.filter(r => r.verification_status === 'pending').length;
    const verified = attendanceRecords.filter(r => r.verification_status === 'verified').length;
    const rejected = attendanceRecords.filter(r => r.verification_status === 'rejected').length;
    
    return { pending, verified, rejected, all: attendanceRecords.length };
  };
  
  const counts = getFilterCounts();
  
  const handleVerify = (id_absen) => {
    Alert.prompt(
      'Verifikasi Manual',
      'Masukkan catatan verifikasi:',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Verifikasi',
          onPress: (notes) => {
            if (!notes) {
              Alert.alert('Error', 'Catatan verifikasi diperlukan');
              return;
            }
            
            dispatch(manualVerify({ id_absen, notes }))
              .unwrap()
              .then(() => Alert.alert('Berhasil', 'Kehadiran berhasil diverifikasi'))
              .catch((err) => Alert.alert('Error', err.message || 'Gagal memverifikasi kehadiran'));
          }
        }
      ],
      'plain-text'
    );
  };
  
  const handleReject = (id_absen) => {
    Alert.prompt(
      'Tolak Verifikasi',
      'Masukkan alasan penolakan:',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tolak',
          onPress: (reason) => {
            if (!reason) {
              Alert.alert('Error', 'Alasan penolakan diperlukan');
              return;
            }
            
            dispatch(rejectVerification({ id_absen, reason }))
              .unwrap()
              .then(() => Alert.alert('Berhasil', 'Verifikasi kehadiran ditolak'))
              .catch((err) => Alert.alert('Error', err.message || 'Gagal menolak verifikasi'));
          }
        }
      ],
      'plain-text'
    );
  };
  
  const navigateToManualEntry = () => {
    navigation.navigate('ManualAttendance', {
      id_aktivitas,
      activityName,
      activityDate,
      activityType,
      kelompokId,
      kelompokName,
    });
  };

  const getStatusColor = (absen) => ({
    'Ya': '#2ecc71',
    'Terlambat': '#f39c12',
    'Tidak': '#e74c3c'
  }[absen] || '#e74c3c');

  const getStatusText = (absen) => ({
    'Ya': 'Hadir',
    'Terlambat': 'Terlambat',
    'Tidak': 'Tidak Hadir'
  }[absen] || 'Tidak Hadir');

  const getVerificationColor = (record) => {
    if (record.is_verified) return '#27ae60';
    return record.verification_status === 'rejected' ? '#e74c3c' : '#f39c12';
  };

  const getVerificationText = (record) => {
    if (record.is_verified) return 'Terverifikasi';
    return record.verification_status === 'rejected' ? 'Ditolak' : 'Menunggu';
  };

  const getPersonName = (item) => {
    return item.absen_user?.anak?.name || item.student_name || item.full_name || item.tutor_name || 'Unknown';
  };

  const getPersonType = (item) => {
    if (item.absen_user?.anak) return 'Siswa';
    if (item.absen_user?.tutor) return 'Tutor';
    if (item.student_name || item.full_name) return 'Siswa';
    if (item.tutor_name) return 'Tutor';
    return 'Unknown';
  };
  
  
  const renderAttendanceCard = ({ item }) => (
    <View style={styles.attendanceCard}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setExpandedCardId(expandedCardId === item.id_absen ? null : item.id_absen)}
      >
        <View style={styles.personInfo}>
          <View style={styles.personDetails}>
            <Text style={styles.personName}>{getPersonName(item)}</Text>
            <Text style={styles.personType}>{getPersonType(item)}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.attendanceStatus, { backgroundColor: getStatusColor(item.absen) }]}>
              <Text style={styles.attendanceStatusText}>{getStatusText(item.absen)}</Text>
            </View>
            
            <View style={[styles.verificationStatus, { backgroundColor: getVerificationColor(item) }]}>
              <Text style={styles.verificationStatusText}>{getVerificationText(item)}</Text>
            </View>
          </View>
        </View>
        
        <Ionicons
          name={expandedCardId === item.id_absen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#7f8c8d"
        />
      </TouchableOpacity>
      
      {expandedCardId === item.id_absen && (
        <View style={styles.cardContent}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Waktu Absen:</Text>
            <Text style={styles.detailValue}>
              {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : 'Tidak tercatat'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(item.absen) }]}>
              {getStatusText(item.absen)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Verifikasi:</Text>
            <Text style={[styles.detailValue, { color: getVerificationColor(item) }]}>
              {getVerificationText(item)}
            </Text>
          </View>

          {item.latest_verification?.verification_notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Catatan:</Text>
              <Text style={styles.detailValue}>{item.latest_verification.verification_notes}</Text>
            </View>
          )}
          
          {!item.is_verified && item.verification_status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.verifyButton]}
                onPress={() => handleVerify(item.id_absen)}
              >
                <Text style={styles.actionButtonText}>Verifikasi</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item.id_absen)}
              >
                <Text style={styles.actionButtonText}>Tolak</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#bdc3c7" />
      <Text style={styles.emptyText}>Tidak ada catatan kehadiran ditemukan</Text>
      <Text style={styles.emptySubText}>
        {searchQuery 
          ? 'Coba ubah pencarian atau filter Anda' 
          : 'Ketuk tombol + untuk mencatat kehadiran'}
      </Text>
    </View>
  );

  const FilterTab = ({ status, label, count, active, onPress }) => (
    <TouchableOpacity
      style={[styles.filterTab, active && styles.activeFilterTab]}
      onPress={onPress}
    >
      <Text style={[styles.filterTabText, active && styles.activeFilterTabText]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );
  
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <ErrorMessage message={error} onRetry={fetchAttendanceRecords} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityName}>{activityName || 'Aktivitas'}</Text>
        <Text style={styles.activityDate}>{activityDate || 'Tanggal tidak ditentukan'}</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7f8c8d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari berdasarkan nama..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>
      
      <View style={styles.filterTabs}>
        <FilterTab
          status="all"
          label="Semua"
          count={counts.all}
          active={filterStatus === 'all'}
          onPress={() => setFilterStatus('all')}
        />
        <FilterTab
          status="pending"
          label="Menunggu"
          count={counts.pending}
          active={filterStatus === 'pending'}
          onPress={() => setFilterStatus('pending')}
        />
        <FilterTab
          status="verified"
          label="Terverifikasi"
          count={counts.verified}
          active={filterStatus === 'verified'}
          onPress={() => setFilterStatus('verified')}
        />
        <FilterTab
          status="rejected"
          label="Ditolak"
          count={counts.rejected}
          active={filterStatus === 'rejected'}
          onPress={() => setFilterStatus('rejected')}
        />
      </View>
      
      <FlatList
        data={filteredRecords}
        renderItem={renderAttendanceCard}
        keyExtractor={item => item.id_absen.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3498db']}
          />
        }
      />
      
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={navigateToManualEntry}>
          <Ionicons name="create" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  activityHeader: { backgroundColor: '#3498db', padding: 16, alignItems: 'center' },
  activityName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  activityDate: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 4 },
  searchContainer: {
    padding: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e1e1e1'
  },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2',
    borderRadius: 8, paddingHorizontal: 12
  },
  searchInput: { flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 16 },
  filterTabs: {
    flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: '#e1e1e1'
  },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  activeFilterTab: { borderBottomWidth: 2, borderBottomColor: '#3498db' },
  filterTabText: { fontSize: 12, color: '#7f8c8d' },
  activeFilterTabText: { color: '#3498db', fontWeight: '500' },
  listContainer: { padding: 12, paddingBottom: 80 },
  attendanceCard: {
    backgroundColor: '#fff', borderRadius: 8, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  memberCard: {
    backgroundColor: '#fff', borderRadius: 8, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2, elevation: 2
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  personInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personDetails: { flex: 1 },
  personName: { fontSize: 16, fontWeight: '500', color: '#2c3e50' },
  personType: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  statusContainer: { alignItems: 'flex-end' },
  attendanceStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  attendanceStatusText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  verificationStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  verificationStatusText: { color: '#fff', fontSize: 10, fontWeight: '500' },
  cardContent: {
    padding: 16, paddingTop: 0,
    borderTopWidth: 1, borderTopColor: '#f0f0f0'
  },
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { width: 120, fontSize: 14, color: '#7f8c8d' },
  detailValue: { flex: 1, fontSize: 14, color: '#2c3e50' },
  actionButtons: { flexDirection: 'row', marginTop: 12 },
  actionButton: {
    flex: 1, paddingVertical: 8, borderRadius: 6,
    alignItems: 'center', marginHorizontal: 4
  },
  verifyButton: { backgroundColor: '#27ae60' },
  rejectButton: { backgroundColor: '#e74c3c' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, color: '#7f8c8d', marginTop: 12 },
  emptySubText: { fontSize: 14, color: '#95a5a6', marginTop: 8, textAlign: 'center' },
  fabContainer: { position: 'absolute', bottom: 20, right: 20 },
  fab: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#9b59b6',
    justifyContent: 'center', alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.84
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center', alignItems: 'center'
  },
  cardLeft: { flex: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center' },
  studentName: { fontSize: 16, fontWeight: '500', color: '#2c3e50' },
  studentNis: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, marginRight: 12
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '500', marginLeft: 4 },
  cardDetails: {
    padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#f0f0f0'
  },
  noRecordNote: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa',
    padding: 12, borderRadius: 6, marginTop: 8
  },
  noRecordText: { flex: 1, fontSize: 12, color: '#6c757d', marginLeft: 8 }
});

export default AttendanceListTab;