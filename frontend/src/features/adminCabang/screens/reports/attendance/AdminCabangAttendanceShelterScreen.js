import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import ShelterSummaryCard from '../../../components/reports/attendance/ShelterSummaryCard';
import ShelterGroupCard from '../../../components/reports/attendance/ShelterGroupCard';
import useAttendanceWeeklyShelterDetail from '../../../hooks/reports/attendance/useAttendanceWeeklyShelterDetail';

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
    startDate,
    endDate,
    periodLabel: initialPeriodLabel,
  } = route.params ?? {};

  const [refreshing, setRefreshing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const { data, isLoading, error, refetch } = useAttendanceWeeklyShelterDetail({
    shelterId,
    startDate,
    endDate,
  });

  const derivedShelter = useMemo(() => {
    if (data?.shelter) {
      return data.shelter;
    }

    return {
      id: shelterId,
      name: shelterName,
      period: {
        start: startDate,
        end: endDate,
        label: initialPeriodLabel || formatDateRangeLabel(startDate, endDate),
      },
    };
  }, [data?.shelter, shelterId, shelterName, startDate, endDate, initialPeriodLabel]);

  const selectedWeek = useMemo(() => {
    const weeks = Array.isArray(data?.weeks) ? data.weeks : [];

    if (!weeks.length) {
      return null;
    }

    if (startDate || endDate) {
      const matchedWeek = weeks.find((week) => {
        const weekStart = week?.dateRange?.start;
        const weekEnd = week?.dateRange?.end;

        const startMatches = startDate ? weekStart === startDate : true;
        const endMatches = endDate ? weekEnd === endDate : true;

        return startMatches && endMatches;
      });

      if (matchedWeek) {
        return matchedWeek;
      }
    }

    return weeks[0];
  }, [data?.weeks, endDate, startDate]);

  const periodLabel = useMemo(() => {
    return (
      selectedWeek?.dateRange?.label ||
      derivedShelter?.period?.label ||
      initialPeriodLabel ||
      formatDateRangeLabel(startDate, endDate)
    );
  }, [derivedShelter?.period?.label, initialPeriodLabel, selectedWeek?.dateRange?.label, startDate, endDate]);

  const groups = useMemo(() => {
    if (!selectedWeek?.kelompok || !Array.isArray(selectedWeek.kelompok)) {
      return [];
    }

    return selectedWeek.kelompok;
  }, [selectedWeek?.kelompok]);

  const handleRefetch = useCallback(() => {
    if (typeof refetch === 'function') {
      refetch({ shelterId, startDate, endDate });
    }
  }, [endDate, refetch, shelterId, startDate]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch({ shelterId, startDate, endDate });
    } catch (err) {
      // errors handled by hook state
    } finally {
      setRefreshing(false);
    }
  }, [endDate, refetch, shelterId, startDate]);

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

      const summary = selectedWeek?.summary ?? {};
      const messageLines = [
        `Laporan Kehadiran Shelter ${derivedShelter.name || 'Tidak diketahui'}`,
        periodLabel ? `Periode: ${periodLabel}` : null,
        shareSummaryLine('Hadir', summary.present),
        shareSummaryLine('Terlambat', summary.late),
        shareSummaryLine('Tidak Hadir', summary.absent),
        typeof summary.attendanceRate === 'number'
          ? `Rata-rata Kehadiran: ${formatPercentage(summary.attendanceRate)}`
          : null,
        `Jumlah Kelompok: ${groups.length}`,
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
    derivedShelter,
    error,
    groups.length,
    isLoading,
    periodLabel,
    selectedWeek?.summary,
    shareSummaryLine,
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

  const renderGroupItem = useCallback(({ item }) => <ShelterGroupCard group={item} />, []);

  const listHeader = useMemo(() => {
    return (
      <View style={styles.listHeader}>
        <ShelterSummaryCard
          shelter={derivedShelter}
          periodLabel={periodLabel}
          summary={selectedWeek?.summary}
          isLoading={isLoading && !data?.shelter}
          error={error}
          onRetry={handleRefetch}
        />
        <Text style={styles.sectionTitle}>Rincian Kelompok</Text>
      </View>
    );
  }, [
    data?.shelter,
    derivedShelter,
    error,
    handleRefetch,
    isLoading,
    periodLabel,
    selectedWeek?.summary,
  ]);

  const listEmptyComponent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#0984e3" />
          <Text style={styles.emptyText}>Memuat data kelompok...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={28} color="#e74c3c" />
          <Text style={styles.emptyTitle}>Gagal memuat data kelompok</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefetch}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={16} color="#ffffff" />
            <Text style={styles.retryLabel}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="people-circle-outline" size={32} color="#b2bec3" />
        <Text style={styles.emptyTitle}>Belum ada data kelompok</Text>
        <Text style={styles.emptyText}>Kelompok binaan belum memiliki catatan kehadiran pada periode ini.</Text>
      </View>
    );
  }, [error, handleRefetch, isLoading]);

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item, index) => item?.id?.toString() || item?.name || `group-${index}`}
        renderItem={renderGroupItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmptyComponent}
        contentContainerStyle={groups.length ? styles.listContent : styles.emptyListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#0984e3"]}
          />
        }
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
  emptyListContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: 20,
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
