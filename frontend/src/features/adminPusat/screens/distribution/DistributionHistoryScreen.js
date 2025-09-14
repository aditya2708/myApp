import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

import {
  fetchDistributionHistory,
  fetchDistributionStats,
  setHistoryFilters,
  selectDistributionHistory,
  selectDistributionStats,
  selectHistoryFilters,
  selectDistributionLoading,
  selectDistributionError,
  selectDistributionPagination
} from '../../redux/distributionSlice';

const DistributionHistoryScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();

  // Redux state
  const distributionHistory = useSelector(selectDistributionHistory);
  const distributionStats = useSelector(selectDistributionStats);
  const filters = useSelector(selectHistoryFilters);
  const loading = useSelector(selectDistributionLoading);
  const error = useSelector(selectDistributionError);
  const pagination = useSelector(selectDistributionPagination);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  // Load data saat component mount
  useFocusEffect(
    React.useCallback(() => {
      loadDistributionHistory();
      loadDistributionStats();
    }, [])
  );

  const loadDistributionHistory = async () => {
    try {
      await dispatch(fetchDistributionHistory({
        ...filters,
        search: searchQuery
      })).unwrap();
    } catch (err) {
      console.error('Error loading distribution history:', err);
    }
  };

  const loadDistributionStats = async () => {
    try {
      await dispatch(fetchDistributionStats()).unwrap();
    } catch (err) {
      console.error('Error loading distribution stats:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadDistributionHistory(),
      loadDistributionStats()
    ]);
    setRefreshing(false);
  };

  // Event handlers
  const handleSearch = (text) => {
    setSearchQuery(text);
    dispatch(setHistoryFilters({ search: text }));
  };

  const handleSearchSubmit = () => {
    loadDistributionHistory();
  };


  const handleDistributionDetail = (distribution) => {
    navigation.navigate('DistributionDetail', { 
      distributionId: distribution.id_distribution 
    });
  };

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  if (loading.history && !distributionHistory.length) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleNavigateBack}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Riwayat Distribusi</Text>
          <Text style={styles.headerSubtitle}>
            {distributionHistory.length} distribusi ditemukan
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6c757d" />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari template atau cabang..."
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#6c757d" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsValue}>{distributionStats.total_distributions}</Text>
            <Text style={styles.statsLabel}>Total</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: '#27ae60' }]}>
              {distributionStats.active_distributions}
            </Text>
            <Text style={styles.statsLabel}>Aktif</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: '#3498db' }]}>
              {distributionStats.total_cabang}
            </Text>
            <Text style={styles.statsLabel}>Cabang</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: '#e74c3c' }]}>
              {distributionStats.avg_adoption_rate}%
            </Text>
            <Text style={styles.statsLabel}>Avg. Adopsi</Text>
          </View>
        </View>
      </View>

      {/* Distribution History List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e74c3c']}
          />
        }
      >
        <View style={styles.historyContainer}>
          {distributionHistory.map((distribution) => (
            <DistributionHistoryCard
              key={distribution.id_distribution}
              distribution={distribution}
              onPress={() => handleDistributionDetail(distribution)}
            />
          ))}
        </View>

        {/* Empty State */}
        {distributionHistory.length === 0 && !loading.history && (
          <View style={styles.emptyState}>
            <Ionicons name="send-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery || Object.values(filters).some(v => v && v !== 'all') 
                ? 'Tidak Ada Hasil' 
                : 'Belum Ada Distribusi'
              }
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? `Tidak ditemukan distribusi dengan kata kunci "${searchQuery}"`
                : 'Belum ada riwayat distribusi template'
              }
            </Text>
          </View>
        )}

        {/* Error handling */}
        {error.history && (
          <ErrorMessage 
            message={error.history}
            onRetry={loadDistributionHistory}
          />
        )}
      </ScrollView>
    </View>
  );
};

// Distribution History Card Component
const DistributionHistoryCard = ({ distribution, onPress }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#27ae60';
      case 'in_progress': return '#3498db';
      case 'failed': return '#e74c3c';
      case 'cancelled': return '#6c757d';
      default: return '#f39c12';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Berlangsung';
      case 'failed': return 'Gagal';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Pending';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'low': return '#6c757d';
      default: return '#3498db';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity style={styles.historyCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.historyCardContent}>
        {/* Header */}
        <View style={styles.historyCardHeader}>
          <View style={styles.templateInfo}>
            <Text style={styles.templateName} numberOfLines={2}>
              {distribution.template?.nama_template || 'Template'}
            </Text>
            <Text style={styles.templateMeta}>
              {distribution.template?.mata_pelajaran?.nama_mata_pelajaran} • {distribution.template?.kelas?.nama_kelas}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(distribution.status) }]}>
              <Text style={styles.statusBadgeText}>
                {getStatusText(distribution.status)}
              </Text>
            </View>
            {distribution.priority !== 'normal' && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(distribution.priority) }]}>
                <Text style={styles.priorityBadgeText}>
                  {distribution.priority.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Distribution Info */}
        <View style={styles.distributionInfo}>
          <View style={styles.distributionStats}>
            <View style={styles.distributionStat}>
              <Ionicons name="business" size={16} color="#3498db" />
              <Text style={styles.distributionStatText}>
                {distribution.total_cabang || 0} cabang
              </Text>
            </View>
            <View style={styles.distributionStat}>
              <Ionicons name="people" size={16} color="#27ae60" />
              <Text style={styles.distributionStatText}>
                {distribution.total_users || 0} users
              </Text>
            </View>
            <View style={styles.distributionStat}>
              <Ionicons name="checkmark-circle" size={16} color="#e74c3c" />
              <Text style={styles.distributionStatText}>
                {distribution.adoption_rate || 0}% adopsi
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          {distribution.status === 'in_progress' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${distribution.progress || 0}%`,
                      backgroundColor: '#3498db'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {distribution.progress || 0}%
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.historyCardFooter}>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={16} color="#6c757d" />
            <Text style={styles.dateText}>
              {formatDate(distribution.created_at)}
            </Text>
          </View>
          
          <View style={styles.createdByContainer}>
            <Ionicons name="person-outline" size={16} color="#6c757d" />
            <Text style={styles.createdByText}>
              {distribution.created_by?.name || 'Admin'}
            </Text>
          </View>
        </View>

        {/* Notes preview */}
        {distribution.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText} numberOfLines={2}>
              "{distribution.notes}"
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  statsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsCard: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  content: {
    flex: 1,
  },
  historyContainer: {
    padding: 16,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyCardContent: {
    padding: 16,
  },
  historyCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
    marginRight: 12,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  templateMeta: {
    fontSize: 12,
    color: '#6c757d',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  distributionInfo: {
    marginBottom: 12,
  },
  distributionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  distributionStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributionStatText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    minWidth: 40,
  },
  historyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  createdByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createdByText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  notesContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  notesText: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DistributionHistoryScreen;