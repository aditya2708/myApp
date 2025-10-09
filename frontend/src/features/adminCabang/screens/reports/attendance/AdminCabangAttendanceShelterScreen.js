import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  useEffect,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import ShelterSummaryCard from '../../../components/reports/attendance/ShelterSummaryCard';
import WeeklyActivityList from '../../../components/reports/attendance/WeeklyActivityList';
import useWeeklyAttendanceShelter from '../../../hooks/reports/attendance/useWeeklyAttendanceShelter';

const formatNumber = (value) => {
  if (typeof value === 'number') {
    return value.toLocaleString('id-ID');
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return null;
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
  }

  const stringValue = String(value);

  if (!stringValue.trim()) {
    return null;
  }

  return stringValue.includes('%') ? stringValue : `${stringValue}%`;
};

const formatDateRangeLabel = (startDate, endDate) => {
  if (!startDate && !endDate) {
    return null;
  }

  try {
    const formatter = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    if (startDate && endDate) {
      return `${formatter.format(new Date(startDate))} - ${formatter.format(new Date(endDate))}`;
    }

    const singleDate = startDate || endDate;

    return formatter.format(new Date(singleDate));
  } catch (error) {
    console.warn('Failed to format shelter detail period label:', error);
    return null;
  }
};

const AdminCabangAttendanceShelterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    shelterId,
    shelterName,
    startDate: initialStartDate,
    endDate: initialEndDate,
    periodLabel: initialPeriodLabel,
    weekId,
    weekStartDate,
    weekEndDate,
    weekLabel,
  } = route.params ?? {};

  const startDate = weekStartDate ?? initialStartDate ?? null;
  const endDate = weekEndDate ?? initialEndDate ?? null;

  const [refreshing, setRefreshing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [scheduleDateFilter, setScheduleDateFilter] = useState(null);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  const {
    shelter: shelterData,
    summary,
    selectedWeek,
    activities,
    activitiesPagination,
    activityFilters,
    periodLabel,
    isLoading,
    isLoadingActivities,
    isFetchingMoreActivities,
    error,
    refresh,
    fetchNextActivities,
    applyActivityFilters,
  } = useWeeklyAttendanceShelter({
    shelterId,
    startDate,
    endDate,
    weekId,
  });

  useEffect(() => {
    if (typeof activityFilters?.search === 'string' && activityFilters.search !== activitySearch) {
      setActivitySearch(activityFilters.search);
    }
  }, [activityFilters?.search, activitySearch]);

  useEffect(() => {
    const filterValue = activityFilters?.scheduleDate ?? null;

    if (!filterValue) {
      if (scheduleDateFilter) {
        setScheduleDateFilter(null);
      }
      return;
    }

    const parsed = new Date(filterValue);

    if (Number.isNaN(parsed.getTime())) {
      return;
    }

    if (!scheduleDateFilter) {
      setScheduleDateFilter(parsed);
      return;
    }

    const currentISO = scheduleDateFilter.toISOString().split('T')[0];

    if (currentISO !== filterValue) {
      setScheduleDateFilter(parsed);
    }
  }, [activityFilters?.scheduleDate, scheduleDateFilter]);

  const derivedShelter = useMemo(() => {
    const fallbackPeriodLabel =
      initialPeriodLabel || weekLabel || formatDateRangeLabel(startDate, endDate);
    const period = shelterData?.period ?? {
      start: startDate,
      end: endDate,
      label: periodLabel || fallbackPeriodLabel,
    };

    return {
      id: shelterData?.id ?? shelterId,
      name: shelterData?.name ?? shelterName,
      wilbin: shelterData?.wilbin ?? null,
      code: shelterData?.code ?? null,
      mentor: shelterData?.mentor ?? null,
      leader: shelterData?.mentor ?? shelterData?.leader ?? null,
      totalChildren: shelterData?.totalChildren ?? shelterData?.total_children ?? null,
      address: shelterData?.address ?? null,
      period,
    };
  }, [
    endDate,
    initialPeriodLabel,
    periodLabel,
    shelterData?.address,
    shelterData?.code,
    shelterData?.id,
    shelterData?.mentor,
    shelterData?.name,
    shelterData?.totalChildren,
    shelterData?.total_children,
    shelterData?.wilbin,
    shelterId,
    shelterName,
    startDate,
    weekLabel,
  ]);

  const resolvedPeriodLabel = useMemo(() => {
    return (
      periodLabel ||
      derivedShelter?.period?.label ||
      initialPeriodLabel ||
      weekLabel ||
      formatDateRangeLabel(startDate, endDate)
    );
  }, [
    derivedShelter?.period?.label,
    initialPeriodLabel,
    periodLabel,
    startDate,
    endDate,
    weekLabel,
  ]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refresh();
    } catch (err) {
      // errors handled by hook state
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  const shareSummaryLine = useCallback((label, metric) => {
    if (!metric) {
      return null;
    }

    const countLabel = formatNumber(metric.count);
    const percentageLabel = formatPercentage(metric.percentage);

    if (countLabel && percentageLabel) {
      return `${label}: ${countLabel} (${percentageLabel})`;
    }

    if (countLabel) {
      return `${label}: ${countLabel}`;
    }

    if (percentageLabel) {
      return `${label}: ${percentageLabel}`;
    }

    return null;
  }, []);

  const handleShare = useCallback(async () => {
    if (isLoading || error) {
      Alert.alert('Data belum siap', 'Silakan tunggu hingga data berhasil dimuat.');
      return;
    }

    if (!derivedShelter) {
      Alert.alert('Data tidak tersedia', 'Informasi shelter tidak tersedia saat ini.');
      return;
    }

    try {
      setIsSharing(true);

      const summaryData = selectedWeek?.summary ?? summary?.summary ?? {};
      const messageLines = [
        `Laporan Kehadiran Shelter ${derivedShelter.name || 'Tidak diketahui'}`,
        resolvedPeriodLabel ? `Periode: ${resolvedPeriodLabel}` : null,
        shareSummaryLine('Hadir', summaryData.present),
        shareSummaryLine('Terlambat', summaryData.late),
        shareSummaryLine('Tidak Hadir', summaryData.absent),
        typeof (summaryData.attendanceRate ?? selectedWeek?.attendanceRate) === 'number'
          ? `Rata-rata Kehadiran: ${formatPercentage(
              summaryData.attendanceRate ?? selectedWeek?.attendanceRate,
            )}`
          : null,
        `Jumlah Aktivitas: ${activities.length}`,
      ].filter(Boolean);

      if (!messageLines.length) {
        messageLines.push('Tidak ada data kehadiran yang dapat dibagikan.');
      }

      await Share.share({ message: messageLines.join('\n') });
    } catch (shareError) {
      Alert.alert('Gagal membagikan', 'Tidak dapat membagikan laporan kehadiran saat ini.');
    } finally {
      setIsSharing(false);
    }
  }, [
    activities.length,
    derivedShelter,
    error,
    isLoading,
    resolvedPeriodLabel,
    selectedWeek?.attendanceRate,
    selectedWeek?.summary,
    shareSummaryLine,
    summary?.summary,
  ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: derivedShelter?.name || 'Detail Shelter',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color="#2d3436" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={handleShare}
          style={styles.headerButton}
          disabled={isSharing || isLoading || !!error}
          accessibilityRole="button"
        >
          {isSharing ? (
            <ActivityIndicator size="small" color="#0984e3" />
          ) : (
            <Ionicons
              name="ellipsis-vertical"
              size={20}
              color={isLoading || error ? '#b2bec3' : '#2d3436'}
            />
          )}
        </TouchableOpacity>
      ),
    });
  }, [
    derivedShelter?.name,
    error,
    handleShare,
    isLoading,
    isSharing,
    navigation,
  ]);

  const handleActivityPress = useCallback(
    (activity) => {
      if (!activity || !activity.groupId) {
        return;
      }

      const periodStart = selectedWeek?.dateRange?.start || startDate;
      const periodEnd = selectedWeek?.dateRange?.end || endDate;
      const label =
        selectedWeek?.dateRange?.label ||
        resolvedPeriodLabel ||
        formatDateRangeLabel(periodStart, periodEnd) ||
        initialPeriodLabel;

      navigation.navigate('AdminCabangAttendanceGroup', {
        groupId: activity.groupId,
        groupName: activity.groupName || activity.name,
        groupMentor: activity.groupMentor ?? activity.tutor ?? null,
        membersCount: activity.participantsCount ?? null,
        summary: activity.summary,
        shelterId: derivedShelter?.id || shelterId,
        shelterName: derivedShelter?.name || shelterName,
        startDate: periodStart,
        endDate: periodEnd,
        periodLabel: label,
        activityId: activity.id,
        activityName: activity.name,
      });
    },
    [
      derivedShelter,
      endDate,
      initialPeriodLabel,
      navigation,
      resolvedPeriodLabel,
      selectedWeek,
      shelterId,
      shelterName,
      startDate,
    ]
  );

  const handleSearchSubmit = useCallback(() => {
    applyActivityFilters({
      search: activitySearch,
      scheduleDate: scheduleDateFilter,
    }).catch(() => {});
  }, [activitySearch, applyActivityFilters, scheduleDateFilter]);

  const handleClearSearch = useCallback(() => {
    if (!activitySearch) {
      return;
    }

    setActivitySearch('');
    applyActivityFilters({
      search: '',
      scheduleDate: scheduleDateFilter,
    }).catch(() => {});
  }, [activitySearch, applyActivityFilters, scheduleDateFilter]);

  const handleScheduleDatePress = useCallback(() => {
    setDatePickerVisible(true);
  }, []);

  const handleScheduleDateChange = useCallback(
    (event, selectedDate) => {
      setDatePickerVisible(false);

      if (event?.type === 'dismissed' || !selectedDate) {
        return;
      }

      setScheduleDateFilter(selectedDate);
      applyActivityFilters({
        search: activitySearch,
        scheduleDate: selectedDate,
      }).catch(() => {});
    },
    [activitySearch, applyActivityFilters],
  );

  const handleResetScheduleDate = useCallback(() => {
    setScheduleDateFilter(null);
    applyActivityFilters({
      search: activitySearch,
      scheduleDate: null,
    }).catch(() => {});
  }, [activitySearch, applyActivityFilters]);

  const scheduleDateLabel = useMemo(() => {
    if (!scheduleDateFilter) {
      return 'Tanggal jadwal';
    }

    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(scheduleDateFilter);
    } catch (err) {
      return scheduleDateFilter.toISOString().split('T')[0];
    }
  }, [scheduleDateFilter]);

  const isInitialLoading = useMemo(() => {
    return (isLoading || isLoadingActivities) && activities.length === 0;
  }, [activities.length, isLoading, isLoadingActivities]);

  const listHeader = useMemo(() => {
    return (
      <View style={styles.listHeader}>
        <ShelterSummaryCard
          shelter={derivedShelter}
          periodLabel={resolvedPeriodLabel}
          summary={selectedWeek?.summary ?? summary?.summary}
          isLoading={isLoading && !shelterData}
          error={error}
          onRetry={refresh}
        />

        <View style={styles.filtersContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color="#636e72" style={styles.searchIcon} />
            <TextInput
              value={activitySearch}
              onChangeText={setActivitySearch}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Cari aktivitas atau tutor"
              placeholderTextColor="#b2bec3"
              autoCorrect={false}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {activitySearch ? (
              <TouchableOpacity
                onPress={handleClearSearch}
                style={styles.clearButton}
                accessibilityRole="button"
                activeOpacity={0.85}
              >
                <Ionicons name="close-circle" size={18} color="#b2bec3" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSearchSubmit}
                style={styles.clearButton}
                accessibilityRole="button"
                activeOpacity={0.85}
              >
                <Ionicons name="search" size={18} color="#0984e3" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleScheduleDatePress}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Ionicons name="calendar-outline" size={16} color="#0984e3" />
              <Text style={styles.filterText}>{scheduleDateFilter ? scheduleDateLabel : 'Tanggal jadwal'}</Text>
            </TouchableOpacity>
            {scheduleDateFilter ? (
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={handleResetScheduleDate}
                accessibilityRole="button"
                activeOpacity={0.85}
              >
                <Ionicons name="close-circle" size={16} color="#e74c3c" />
                <Text style={styles.resetFilterText}>Hapus</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Daftar Aktivitas</Text>
      </View>
    );
  }, [
    activitySearch,
    derivedShelter,
    error,
    handleClearSearch,
    handleResetScheduleDate,
    handleScheduleDatePress,
    handleSearchSubmit,
    isLoading,
    refresh,
    resolvedPeriodLabel,
    scheduleDateFilter,
    scheduleDateLabel,
    selectedWeek?.summary,
    summary?.summary,
    shelterData,
  ]);

  const activityEmptyComponent = useMemo(() => {
    if (isInitialLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#0984e3" />
          <Text style={styles.emptyText}>Memuat aktivitas...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={28} color="#e74c3c" />
          <Text style={styles.emptyTitle}>Gagal memuat aktivitas</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh} activeOpacity={0.85}>
            <Ionicons name="refresh" size={16} color="#ffffff" />
            <Text style={styles.retryLabel}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={32} color="#b2bec3" />
        <Text style={styles.emptyTitle}>Belum ada aktivitas</Text>
        <Text style={styles.emptyText}>
          Aktivitas belum tersedia untuk filter atau periode ini.
        </Text>
      </View>
    );
  }, [error, isInitialLoading, refresh]);

  return (
    <View style={styles.container}>
      <WeeklyActivityList
        activities={activities}
        onActivityPress={handleActivityPress}
        onLoadMore={fetchNextActivities}
        isLoading={isInitialLoading}
        isFetchingMore={isFetchingMoreActivities}
        pagination={activitiesPagination}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={activityEmptyComponent}
        contentContainerStyle={activities.length ? styles.listContent : styles.emptyListContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {isDatePickerVisible ? (
        <DateTimePicker
          value={scheduleDateFilter ?? new Date()}
          mode="date"
          display="calendar"
          onChange={handleScheduleDateChange}
        />
      ) : null}
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
  emptyListContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: 20,
  },
  filtersContainer: {
    marginTop: 24,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2d3436',
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dfe6e9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
  },
  resetFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  resetFilterText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#e74c3c',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 18,
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
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 8,
  },
  headerButton: {
    marginHorizontal: 8,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(9, 132, 227, 0.08)',
  },
});

export default AdminCabangAttendanceShelterScreen;
