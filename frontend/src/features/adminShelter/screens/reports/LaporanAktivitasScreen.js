import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import ReportFilters from '../../components/ReportFilters';
import ActivityReportCard from '../../components/ActivityReportCard';
import { formatPercentage } from '../../utils/reportUtils';
import {
  fetchLaporanAktivitas,
  initializeLaporanAktivitasPage,
  updateFiltersAndRefreshAktivitas
} from '../../redux/laporanAktivitasThunks';
import {
  selectActivities,
  selectSummary,
  selectFilterOptions,
  selectFilters,
  selectExpandedCards,
  selectLoading,
  selectError,
  toggleCardExpanded
} from '../../redux/laporanAktivitasSlice';

const LaporanAktivitasScreen = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const activities = useSelector(selectActivities);
  const summary = useSelector(selectSummary);
  const filterOptions = useSelector(selectFilterOptions);
  const filters = useSelector(selectFilters);
  const expandedCards = useSelector(selectExpandedCards);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Initialize page data
  useEffect(() => {
    dispatch(initializeLaporanAktivitasPage());
  }, [dispatch]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchLaporanAktivitas(filters));
    } finally {
      setRefreshing(false);
    }
  };

  // Handle filter changes
  const handleYearChange = (year) => {
    dispatch(updateFiltersAndRefreshAktivitas({ year }));
  };

  const handleActivityTypeChange = (jenisKegiatan) => {
    dispatch(updateFiltersAndRefreshAktivitas({ jenisKegiatan }));
  };

  const handleMonthChange = (month) => {
    dispatch(updateFiltersAndRefreshAktivitas({ month }));
  };

  const handleClearFilter = () => {
    dispatch(updateFiltersAndRefreshAktivitas({ 
      jenisKegiatan: null, 
      month: null 
    }));
  };

  // Handle card expand/collapse
  const handleCardToggle = (activityId) => {
    dispatch(toggleCardExpanded(activityId));
  };

  // Handle activity press (for future navigation to detail)
  const handleActivityPress = (activity) => {
    // TODO: Navigate to activity detail screen
    console.log('Activity pressed:', activity.materi);
  };

  // Render summary stats
  const renderSummary = () => {
    if (!summary) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Ringkasan</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.total_activities}</Text>
            <Text style={styles.summaryLabel}>Total Aktivitas</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.total_participants}</Text>
            <Text style={styles.summaryLabel}>Total Peserta</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatPercentage(summary.average_attendance)}%</Text>
            <Text style={styles.summaryLabel}>Rata-rata</Text>
          </View>
        </View>
        
        {summary.activities_this_month !== undefined && (
          <View style={styles.additionalStats}>
            <Text style={styles.additionalStatText}>
              Aktivitas bulan ini: {summary.activities_this_month}
            </Text>
            {summary.most_active_type && (
              <Text style={styles.additionalStatText}>
                Jenis terbanyak: {summary.most_active_type}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat laporan aktivitas..." />;
  }

  // Error state
  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <ErrorMessage 
          message={error} 
          onRetry={() => dispatch(fetchLaporanAktivitas(filters))}
        />
      </View>
    );
  }

  // Empty state
  if (!loading && activities.length === 0 && !error) {
    return (
      <View style={styles.container}>
        <ReportFilters
          filters={filters}
          filterOptions={filterOptions}
          onYearChange={handleYearChange}
          onActivityTypeChange={handleActivityTypeChange}
          onMonthChange={handleMonthChange}
          onClearFilter={handleClearFilter}
          showMonthFilter={true}
        />
        <EmptyState
          icon="calendar-outline"
          title="Tidak ada data"
          message="Tidak ada data aktivitas untuk filter yang dipilih"
          actionButtonText="Refresh"
          onActionPress={handleRefresh}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#9b59b6']}
            tintColor="#9b59b6"
          />
        }
      >
        <ReportFilters
          filters={filters}
          filterOptions={filterOptions}
          onYearChange={handleYearChange}
          onActivityTypeChange={handleActivityTypeChange}
          onMonthChange={handleMonthChange}
          onClearFilter={handleClearFilter}
          showMonthFilter={true}
        />
        
        {renderSummary()}
        
        {/* Activities list */}
        <View style={styles.activitiesContainer}>
          <Text style={styles.sectionTitle}>Daftar Aktivitas</Text>
          {activities.map((activity) => (
            <ActivityReportCard
              key={activity.id_aktivitas}
              activity={activity}
              isExpanded={expandedCards.includes(activity.id_aktivitas)}
              onToggle={() => handleCardToggle(activity.id_aktivitas)}
              onActivityPress={handleActivityPress}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },

  // Summary styles
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9b59b6'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  additionalStats: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  additionalStatText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4
  },

  // Activities list styles
  activitiesContainer: {
    paddingHorizontal: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  }
});

export default LaporanAktivitasScreen;