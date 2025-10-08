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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import AttendanceStatusChip from '../../../components/reports/attendance/AttendanceStatusChip';
import GroupAttendanceSummaryCard from '../../../components/reports/attendance/GroupAttendanceSummaryCard';
import StudentAttendanceRow from '../../../components/reports/attendance/StudentAttendanceRow';
import useWeeklyAttendanceGroupStudents from '../../../hooks/reports/attendance/useWeeklyAttendanceGroupStudents';

const STATUS_OPTIONS = [
  { code: 'ALL', label: 'Semua', icon: 'layers-outline', color: '#0984e3' },
  { code: 'H', label: 'Hadir', icon: 'checkmark-circle', color: '#2ecc71' },
  { code: 'A', label: 'Alpha', icon: 'close-circle', color: '#e74c3c' },
  { code: 'T', label: 'Terlambat', icon: 'time', color: '#f1c40f' },
  { code: 'S', label: 'Sakit', icon: 'medkit', color: '#00cec9', disabled: true },
  { code: 'I', label: 'Izin', icon: 'document-text', color: '#0984e3', disabled: true },
];

const AdminCabangAttendanceGroupScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    groupId,
    groupName,
    groupMentor,
    membersCount,
    summary: initialSummary,
    shelterId,
    shelterName,
    startDate,
    endDate,
    periodLabel,
  } = route.params ?? {};

  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
    }, 300);

    return () => clearTimeout(handler);
  }, [searchValue]);

  const {
    students,
    summary,
    isLoading,
    isFetchingMore,
    error,
    refresh,
    loadMore,
    hasNextPage,
  } = useWeeklyAttendanceGroupStudents({
    groupId,
    shelterId,
    startDate,
    endDate,
    search: debouncedSearch,
    status: statusFilter === 'ALL' ? null : statusFilter,
    pageSize: 20,
  });

  const isInitialLoading = useMemo(() => isLoading && students.length === 0, [isLoading, students.length]);
  const combinedSummary = useMemo(() => summary || initialSummary || null, [initialSummary, summary]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: groupName || 'Detail Kelompok',
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
          style={[styles.headerButton, styles.headerButtonDisabled]}
          accessibilityRole="button"
          disabled
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#b2bec3" />
        </TouchableOpacity>
      ),
    });
  }, [groupName, navigation]);

  const handleStatusPress = useCallback((option) => {
    if (!option || option.disabled) {
      return;
    }

    if (option.code === 'ALL') {
      setStatusFilter('ALL');
      return;
    }

    setStatusFilter((prev) => (prev === option.code ? 'ALL' : option.code));
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [refresh]);

  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isLoading || isFetchingMore) {
      return;
    }

    loadMore();
  }, [hasNextPage, isFetchingMore, isLoading, loadMore]);

  const renderStudentItem = useCallback(
    ({ item, index }) => (
      <StudentAttendanceRow student={item} showDivider={index < students.length - 1} />
    ),
    [students.length]
  );

  const keyExtractor = useCallback((item, index) => {
    if (!item) {
      return `student-${index}`;
    }

    const idCandidate =
      item.id || item.attendanceId || item.attendance_id || item.studentId || item.student_id;

    if (idCandidate) {
      return idCandidate.toString();
    }

    return `student-${index}`;
  }, []);

  const listHeader = useMemo(() => {
    return (
      <View>
        <GroupAttendanceSummaryCard
          groupName={groupName}
          shelterName={shelterName}
          mentor={groupMentor}
          membersCount={membersCount}
          periodLabel={periodLabel}
          summary={combinedSummary}
        />

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#636e72" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchValue}
            onChangeText={setSearchValue}
            placeholder="Cari nama atau kode siswa"
            placeholderTextColor="#b2bec3"
            autoCorrect={false}
          />
        </View>

        <View style={styles.filterRow}>
          {STATUS_OPTIONS.map((option) => (
            <AttendanceStatusChip
              key={option.code}
              label={option.label}
              status={option.code}
              icon={option.icon}
              color={option.color}
              disabled={option.disabled}
              active={statusFilter === option.code || (statusFilter === 'ALL' && option.code === 'ALL')}
              onPress={() => handleStatusPress(option)}
            />
          ))}
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh} style={styles.retryInlineButton} accessibilityRole="button">
              <Text style={styles.retryInlineText}>Coba lagi</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Daftar Kehadiran Siswa</Text>
      </View>
    );
  }, [
    combinedSummary,
    error,
    groupMentor,
    groupName,
    handleStatusPress,
    membersCount,
    periodLabel,
    refresh,
    searchValue,
    shelterName,
    statusFilter,
  ]);

  const listEmptyComponent = useMemo(() => {
    if (isInitialLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#0984e3" />
          <Text style={styles.emptyText}>Memuat data kehadiran...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={28} color="#e74c3c" />
          <Text style={styles.emptyTitle}>Gagal memuat kehadiran</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refresh}
            accessibilityRole="button"
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
        <Text style={styles.emptyTitle}>Belum ada catatan</Text>
        <Text style={styles.emptyText}>
          Tidak ditemukan data kehadiran siswa untuk filter yang dipilih.
        </Text>
      </View>
    );
  }, [error, isInitialLoading, refresh]);

  const listFooterComponent = useMemo(() => {
    if (!isFetchingMore) {
      return null;
    }

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator color="#0984e3" size="small" />
      </View>
    );
  }, [isFetchingMore]);

  return (
    <View style={styles.container}>
      <FlatList
        data={students}
        keyExtractor={keyExtractor}
        renderItem={renderStudentItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooterComponent}
        contentContainerStyle={students.length ? styles.listContent : styles.emptyListContent}
        onEndReachedThreshold={0.4}
        onEndReached={handleEndReached}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#0984e3"]}
            tintColor="#0984e3"
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
    flexGrow: 1,
    padding: 16,
    paddingBottom: 32,
  },
  headerButton: {
    marginHorizontal: 8,
    padding: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(9, 132, 227, 0.08)',
  },
  headerButtonDisabled: {
    opacity: 0.6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#2d3436',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#c0392b',
  },
  retryInlineButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
  },
  retryInlineText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 4,
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
    marginTop: 18,
    backgroundColor: '#0984e3',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryLabel: {
    marginLeft: 8,
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  footerLoading: {
    paddingVertical: 20,
  },
});

export default AdminCabangAttendanceGroupScreen;
