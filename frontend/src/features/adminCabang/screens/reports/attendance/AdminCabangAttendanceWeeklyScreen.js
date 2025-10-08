import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import AttendanceTrendChart from '../../../components/reports/attendance/AttendanceTrendChart';
import ShelterAttendanceCard from '../../../components/reports/attendance/ShelterAttendanceCard';
import WeeklyAttendanceFilterSheet from '../../../components/reports/attendance/WeeklyAttendanceFilterSheet';
import WeeklySummaryCard from '../../../components/reports/attendance/WeeklySummaryCard';

import useAttendanceSummary from '../../../hooks/reports/attendance/useAttendanceSummary';
import useAttendanceWeekly from '../../../hooks/reports/attendance/useAttendanceWeekly';
import useAttendanceWeeklyShelters from '../../../hooks/reports/attendance/useAttendanceWeeklyShelters';
import useAttendanceTrend from '../../../hooks/reports/attendance/useAttendanceTrend';

const ATTENDANCE_BANDS = [
  {
    id: 'excellent',
    label: 'Sangat Baik',
    description: '≥ 90% kehadiran',
    min: 90,
    max: Infinity,
    color: '#2ecc71',
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
  },
  {
    id: 'good',
    label: 'Baik',
    description: '75% - 89%',
    min: 75,
    max: 89.99,
    color: '#3498db',
    backgroundColor: 'rgba(52, 152, 219, 0.12)',
  },
  {
    id: 'fair',
    label: 'Perlu Perhatian',
    description: '50% - 74%',
    min: 50,
    max: 74.99,
    color: '#f39c12',
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
  },
  {
    id: 'critical',
    label: 'Kritis',
    description: '< 50%',
    min: 0,
    max: 49.99,
    color: '#e74c3c',
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
  },
];

const getAttendanceBand = (rate) => {
  const numericRate = Number(rate);

  if (!Number.isFinite(numericRate)) {
    return null;
  }

  return (
    ATTENDANCE_BANDS.find((band) => numericRate >= band.min && numericRate <= band.max) ||
    ATTENDANCE_BANDS[ATTENDANCE_BANDS.length - 1]
  );
};

const AdminCabangAttendanceWeeklyScreen = () => {
  const navigation = useNavigation();

  const [isFilterVisible, setFilterVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBands, setSelectedBands] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: summaryData } = useAttendanceSummary();
  const {
    data: weeklyData,
    isLoading: isWeeklyLoading,
    error: weeklyError,
    refetch: refetchWeekly,
  } = useAttendanceWeekly();
  const { data: trendData, isLoading: isTrendLoading } = useAttendanceTrend();

  const selectedWeek = useMemo(() => {
    if (!Array.isArray(weeklyData) || weeklyData.length === 0) {
      return null;
    }

    if (selectedWeekId) {
      return weeklyData.find((week) => week.id === selectedWeekId) || weeklyData[0];
    }

    return weeklyData[0];
  }, [weeklyData, selectedWeekId]);

  const weeklyParams = useMemo(() => {
    const startDate = selectedWeek?.dates?.start;
    const endDate = selectedWeek?.dates?.end;

    if (startDate && endDate) {
      return {
        start_date: startDate,
        end_date: endDate,
      };
    }

    return {};
  }, [selectedWeek]);

  const {
    data: shelterData,
    isLoading: isShelterLoading,
    error: shelterError,
    refetch: refetchShelters,
  } = useAttendanceWeeklyShelters(weeklyParams);

  useEffect(() => {
    if (Array.isArray(weeklyData) && weeklyData.length > 0 && !selectedWeekId) {
      setSelectedWeekId(weeklyData[0].id);
    }
  }, [weeklyData, selectedWeekId]);

  const handleShelterPress = useCallback(
    (shelter) => {
      if (!shelter) {
        return;
      }

      navigation.navigate('AdminCabangAttendanceShelterDetail', {
        shelterId: shelter.id,
        shelterName: shelter.name,
        startDate: selectedWeek?.dates?.start || null,
        endDate: selectedWeek?.dates?.end || null,
      });
    },
    [navigation, selectedWeek?.dates?.end, selectedWeek?.dates?.start]
  );

  const filteredShelters = useMemo(() => {
    const list = Array.isArray(shelterData) ? shelterData : [];
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return list.filter((item) => {
      const band = getAttendanceBand(item.attendanceRate);
      const matchesBand =
        !selectedBands.length || (band && selectedBands.some((id) => id === band.id));

      if (!matchesBand) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const wilbinValue = (() => {
        if (!item.wilbin) {
          return '';
        }

        if (typeof item.wilbin === 'string') {
          return item.wilbin;
        }

        return item.wilbin.name || item.wilbin.label || item.wilbin.title || '';
      })()
        .toString()
        .toLowerCase();

      return (
        item.name?.toLowerCase().includes(normalizedQuery) ||
        wilbinValue.includes(normalizedQuery)
      );
    });
  }, [shelterData, searchQuery, selectedBands]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await Promise.all([refetchWeekly(), refetchShelters()]);
    } catch (error) {
      // noop: errors handled by hooks
    } finally {
      setRefreshing(false);
    }
  }, [refetchShelters, refetchWeekly]);

  const renderShelterItem = useCallback(
    ({ item }) => (
      <ShelterAttendanceCard
        shelter={item}
        band={getAttendanceBand(item.attendanceRate)}
        onPress={handleShelterPress}
      />
    ),
    [handleShelterPress]
  );

  const renderEmptyState = useCallback(() => {
    if (isShelterLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator color="#0984e3" />
          <Text style={styles.emptyText}>Memuat data shelter...</Text>
        </View>
      );
    }

    if (shelterError) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#e74c3c" />
          <Text style={styles.emptyTitle}>Gagal memuat data shelter</Text>
          <Text style={styles.emptyText}>{shelterError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetchShelters}>
            <Ionicons name="refresh" size={16} color="#ffffff" />
            <Text style={styles.retryLabel}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="home-outline" size={28} color="#b2bec3" />
        <Text style={styles.emptyTitle}>Belum ada data shelter</Text>
        <Text style={styles.emptyText}>Gunakan filter untuk menyesuaikan pencarian Anda.</Text>
      </View>
    );
  }, [isShelterLoading, refetchShelters, shelterError]);

  const listHeader = useMemo(() => {
    const weekBand = getAttendanceBand(selectedWeek?.attendanceRate);

    return (
      <View style={styles.headerContent}>
        <WeeklySummaryCard
          summary={selectedWeek}
          weeks={weeklyData}
          selectedWeekId={selectedWeek?.id}
          onSelectWeek={setSelectedWeekId}
          band={weekBand}
          isLoading={isWeeklyLoading}
          error={weeklyError}
          onRetry={refetchWeekly}
          overview={summaryData}
        />
        <View style={styles.chartSection}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>Tren Kehadiran</Text>
          </View>
          {isTrendLoading ? (
            <View style={styles.chartPlaceholder}>
              <ActivityIndicator color="#0984e3" />
            </View>
          ) : (
            <AttendanceTrendChart data={trendData} />
          )}
        </View>
      </View>
    );
  }, [
    isTrendLoading,
    isWeeklyLoading,
    refetchWeekly,
    selectedWeek,
    setSelectedWeekId,
    summaryData,
    trendData,
    weeklyData,
    weeklyError,
  ]);

  const openFilterSheet = useCallback(() => setFilterVisible(true), []);
  const closeFilterSheet = useCallback(() => setFilterVisible(false), []);

  const handleBandChange = useCallback((nextBands) => {
    setSelectedBands(nextBands);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedBands([]);
    setSearchQuery('');
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerButton} onPress={openFilterSheet}>
          <Ionicons name="filter-outline" size={22} color="#2d3436" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, openFilterSheet]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredShelters}
        keyExtractor={(item) => item.id?.toString() || item.name}
        renderItem={renderShelterItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#0984e3"]} />
        }
      />

      <WeeklyAttendanceFilterSheet
        visible={isFilterVisible}
        onClose={closeFilterSheet}
        bands={ATTENDANCE_BANDS}
        selectedBands={selectedBands}
        onBandsChange={handleBandChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onReset={handleResetFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContent: {
    marginBottom: 16,
  },
  chartSection: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  chartPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0984e3',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  headerButton: {
    marginRight: 12,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 132, 227, 0.12)',
  },
});

export default AdminCabangAttendanceWeeklyScreen;
