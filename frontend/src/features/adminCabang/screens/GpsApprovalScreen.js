import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import SearchBar from '../../../common/components/SearchBar';
import EmptyState from '../../../common/components/EmptyState';
import ErrorMessage from '../../../common/components/ErrorMessage';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import GpsApprovalCard from '../components/GpsApprovalCard';
import ReasonInputModal from '../components/ReasonInputModal';
import { adminCabangApi } from '../api/adminCabangApi';

const GpsApprovalScreen = ({ navigation }) => {
  const [gpsRequests, setGpsRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Semua Status', color: '#95a5a6' },
    { value: 'pending', label: 'Menunggu Persetujuan', color: '#f39c12' },
    { value: 'approved', label: 'Disetujui', color: '#27ae60' },
    { value: 'rejected', label: 'Ditolak', color: '#e74c3c' }
  ];

  // Load GPS approval requests
  const loadGpsRequests = useCallback(async (page = 1, isRefresh = false, overrides = {}) => {
    const { statusOverride } = overrides;
    const effectiveStatus = statusOverride ?? selectedStatus;

    try {
      if (page === 1) {
        isRefresh ? setRefreshing(true) : setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page,
        per_page: pagination.per_page,
        status: effectiveStatus,
        search: searchQuery.trim() || undefined,
        sort_by: 'gps_submitted_at',
        sort_order: 'desc'
      };

      const response = await adminCabangApi.getGpsApprovalList(params);

      if (response.data.success) {
        const newData = response.data.data.data;
        const paginationInfo = {
          current_page: response.data.data.current_page,
          last_page: response.data.data.last_page,
          per_page: response.data.data.per_page,
          total: response.data.data.total
        };

        if (page === 1) {
          setGpsRequests(newData);
        } else {
          setGpsRequests(prev => [...prev, ...newData]);
        }
        
        setPagination(paginationInfo);
      } else {
        throw new Error(response.data.message || 'Gagal memuat data');
      }
    } catch (err) {
      console.error('Error loading GPS requests:', err);
      setError(err.response?.data?.message || err.message || 'Gagal memuat data persetujuan GPS');
      if (page === 1) setGpsRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [selectedStatus, searchQuery, pagination.per_page]);

  // Initial load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadGpsRequests(1);
    }, [loadGpsRequests])
  );

  // Refresh data
  const handleRefresh = (overrides) => {
    loadGpsRequests(1, true, overrides);
  };

  // Load more data
  const handleLoadMore = (overrides) => {
    if (!loadingMore && pagination.current_page < pagination.last_page) {
      loadGpsRequests(pagination.current_page + 1, false, overrides);
    }
  };

  // Search handler
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Search submit
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      loadGpsRequests(1);
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Status filter change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    loadGpsRequests(1, false, { statusOverride: status });
  };

  // Navigate to detail
  const handleRequestPress = (request) => {
    navigation.navigate('GpsApprovalDetailScreen', {
      shelterId: request.id,
      shelterName: request.nama_shelter
    });
  };

  // Quick approve
  const handleQuickApprove = async (request) => {
    Alert.alert(
      'Konfirmasi Persetujuan',
      `Setujui perubahan GPS setting untuk ${request.nama_shelter}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Setujui',
          style: 'default',
          onPress: async () => {
            try {
              const response = await adminCabangApi.approveGpsRequest(request.id, {
                approval_notes: 'Disetujui langsung dari daftar'
              });

              if (response.data.success) {
                Alert.alert('Berhasil', 'GPS setting berhasil disetujui');
                loadGpsRequests(1, true);
              } else {
                throw new Error(response.data.message);
              }
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'Gagal menyetujui GPS setting');
            }
          }
        }
      ]
    );
  };

  // Quick reject
  const handleQuickReject = (request) => {
    setSelectedRequest(request);
    setRejectModalVisible(true);
  };

  const handleCloseRejectModal = () => {
    setRejectModalVisible(false);
    setSelectedRequest(null);
  };

  const handleRejectSubmit = async (reason) => {
    if (!selectedRequest) return;

    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      Alert.alert('Error', 'Alasan penolakan harus diisi');
      return;
    }

    setRejectLoading(true);

    try {
      const response = await adminCabangApi.rejectGpsRequest(selectedRequest.id, {
        rejection_reason: trimmedReason
      });

      if (response.data.success) {
        Alert.alert('Berhasil', 'GPS setting berhasil ditolak');
        handleCloseRejectModal();
        loadGpsRequests(1, true);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Gagal menolak GPS setting');
    } finally {
      setRejectLoading(false);
    }
  };

  // Render status filter tabs
  const renderStatusTabs = () => (
    <View style={styles.statusTabs}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={statusOptions}
        keyExtractor={(item) => item.value}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.statusTab,
              selectedStatus === item.value && [styles.activeStatusTab, { borderBottomColor: item.color }]
            ]}
            onPress={() => handleStatusChange(item.value)}
          >
            <Text style={[
              styles.statusTabText,
              selectedStatus === item.value && [styles.activeStatusTabText, { color: item.color }]
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.statusTabsContainer}
      />
    </View>
  );

  // Render request item
  const renderRequestItem = ({ item }) => (
    <GpsApprovalCard
      request={item}
      onPress={() => handleRequestPress(item)}
      onQuickApprove={() => handleQuickApprove(item)}
      onQuickReject={() => handleQuickReject(item)}
    />
  );

  // Render footer
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.footerLoaderText}>Memuat data...</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <EmptyState
        icon="document-text-outline"
        title="Tidak ada permintaan GPS"
        message={
          searchQuery 
            ? `Tidak ditemukan permintaan GPS untuk "${searchQuery}"`
            : selectedStatus === 'all'
            ? 'Belum ada shelter yang mengajukan perubahan GPS setting'
            : `Tidak ada permintaan GPS dengan status "${statusOptions.find(s => s.value === selectedStatus)?.label}"`
        }
        actionText={searchQuery ? "Hapus Pencarian" : "Refresh"}
        onActionPress={searchQuery ? () => setSearchQuery('') : handleRefresh}
      />
    );
  };

  if (loading && gpsRequests.length === 0) {
    return <LoadingSpinner message="Memuat permintaan persetujuan GPS..." />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={() => loadGpsRequests(1)} 
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Persetujuan GPS Setting</Text>
        <Text style={styles.subtitle}>
          Kelola permintaan perubahan GPS setting dari shelter
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="Cari nama shelter..."
          value={searchQuery}
          onChangeText={handleSearch}
          style={styles.searchBar}
        />
      </View>

      {/* Status Filter Tabs */}
      {renderStatusTabs()}

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Total: {pagination.total} permintaan
        </Text>
        <Text style={styles.statsText}>
          Halaman {pagination.current_page} dari {pagination.last_page}
        </Text>
      </View>

      {/* GPS Requests List */}
      <FlatList
        data={gpsRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3498db']}
            tintColor="#3498db"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
      />

      <ReasonInputModal
        visible={rejectModalVisible}
        title="Alasan Penolakan"
        message={
          selectedRequest
            ? `Masukkan alasan penolakan untuk ${selectedRequest.nama_shelter}`
            : ''
        }
        placeholder="Masukkan alasan penolakan"
        confirmText="Tolak"
        cancelText="Batal"
        onCancel={handleCloseRejectModal}
        onSubmit={handleRejectSubmit}
        loading={rejectLoading}
      />
    </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchBar: {
    marginBottom: 0,
  },
  statusTabs: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  statusTabsContainer: {
    paddingHorizontal: 20,
  },
  statusTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeStatusTab: {
    borderBottomWidth: 2,
  },
  statusTabText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  activeStatusTabText: {
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  statsText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  listContainer: {
    padding: 20,
    paddingTop: 16,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerLoaderText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default GpsApprovalScreen;