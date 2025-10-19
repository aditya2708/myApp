import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import Button from '../../../../common/components/Button';
import {
  fetchAllAktivitas,
  resetAktivitasError,
  selectAktivitasError,
  selectAktivitasList,
  selectAktivitasLoading
} from '../../redux/aktivitasSlice';
import {
  fetchTutorAttendanceSummary,
  getTutorAttendanceByActivity,
  selectTutorAttendanceSummary,
  selectTutorAttendanceSummaryError,
  selectTutorAttendanceSummaryLoading,
  selectTutorAttendanceSummaryStats
} from '../../redux/tutorAttendanceSlice';
import TutorAttendanceCard from '../../components/TutorAttendanceCard';
import TutorAttendanceSummary from '../../components/TutorAttendanceSummary';

const DEFAULT_TUTOR_FILTERS = {
  date_from: null,
  date_to: null,
  jenis_kegiatan: 'all',
  performance: 'all'
};

const DEFAULT_ACTIVITY_FILTERS = {
  date_from: null,
  date_to: null,
  jenis_kegiatan: 'all',
  status: 'all'
};

const statusOptions = [
  { key: 'all', label: 'Semua Status' },
  { key: 'Ya', label: 'Hadir' },
  { key: 'Terlambat', label: 'Terlambat' },
  { key: 'Tidak', label: 'Tidak Hadir' },
  { key: 'none', label: 'Belum Ada Absen' }
];

const performanceOptions = [
  { key: 'all', label: 'Semua Kinerja' },
  { key: 'high', label: 'Baik' },
  { key: 'medium', label: 'Sedang' },
  { key: 'low', label: 'Rendah' },
  { key: 'no_data', label: 'Tidak Ada Data' }
];

const getStatusColor = (status) => {
  switch (status) {
    case 'Ya':
      return '#27ae60';
    case 'Terlambat':
      return '#f39c12';
    case 'Tidak':
      return '#e74c3c';
    default:
      return '#95a5a6';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'Ya':
      return 'Hadir';
    case 'Terlambat':
      return 'Terlambat';
    case 'Tidak':
      return 'Tidak Hadir';
    default:
      return 'Belum Ada Absen';
  }
};

const formatTime = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  if (typeof value === 'string' && value.length >= 5) {
    return value.substring(0, 5);
  }

  return value;
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return value;
};

const ReportFilterModal = ({
  visible,
  mode,
  filters,
  defaults,
  onClose,
  onApply,
  onClear,
  typeOptions,
  statusOptions: statusList,
  performanceOptions: performanceList
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleDateChange = (event, selectedDate, key) => {
    setActiveDatePicker(null);
    if (selectedDate) {
      setLocalFilters(prev => ({
        ...prev,
        [key]: selectedDate.toISOString().split('T')[0]
      }));
    }
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleClear = () => {
    setLocalFilters(defaults);
    onClear(defaults);
  };

  const headerTitle = mode === 'tutor' ? 'Filter Tutor' : 'Filter Aktivitas';

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{headerTitle}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Tanggal Mulai</Text>
            <TouchableOpacity
              style={styles.modalDateButton}
              onPress={() => setActiveDatePicker('date_from')}
            >
              <Text style={styles.modalDateText}>
                {localFilters.date_from || 'Pilih tanggal mulai'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Tanggal Selesai</Text>
            <TouchableOpacity
              style={styles.modalDateButton}
              onPress={() => setActiveDatePicker('date_to')}
            >
              <Text style={styles.modalDateText}>
                {localFilters.date_to || 'Pilih tanggal selesai'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Jenis Aktivitas</Text>
            <View style={styles.modalOptionGrid}>
              {typeOptions.map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.modalOptionButton,
                    localFilters.jenis_kegiatan === option.key && styles.modalOptionButtonActive
                  ]}
                  onPress={() => setLocalFilters(prev => ({
                    ...prev,
                    jenis_kegiatan: option.key
                  }))}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      localFilters.jenis_kegiatan === option.key && styles.modalOptionTextActive
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {mode === 'activity' ? (
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Status Kehadiran Tutor</Text>
              <View style={styles.modalOptionGrid}>
                {statusList.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.modalOptionButton,
                      localFilters.status === option.key && styles.modalOptionButtonActive
                    ]}
                    onPress={() => setLocalFilters(prev => ({
                      ...prev,
                      status: option.key
                    }))}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        localFilters.status === option.key && styles.modalOptionTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Kategori Kinerja</Text>
              <View style={styles.modalOptionGrid}>
                {performanceList.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.modalOptionButton,
                      localFilters.performance === option.key && styles.modalOptionButtonActive
                    ]}
                    onPress={() => setLocalFilters(prev => ({
                      ...prev,
                      performance: option.key
                    }))}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        localFilters.performance === option.key && styles.modalOptionTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.modalActions}>
            <Button
              title="Hapus Filter"
              type="outline"
              onPress={handleClear}
              style={styles.modalClearButton}
            />
            <Button
              title="Terapkan"
              onPress={handleApply}
              style={styles.modalApplyButton}
            />
          </View>
        </View>
      </View>

      {activeDatePicker && (
        <DateTimePicker
          value={localFilters[activeDatePicker] ? new Date(localFilters[activeDatePicker]) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, activeDatePicker)}
        />
      )}
    </Modal>
  );
};

const TutorAttendanceReportScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const summary = useSelector(selectTutorAttendanceSummary);
  const summaryStats = useSelector(selectTutorAttendanceSummaryStats);
  const summaryLoading = useSelector(selectTutorAttendanceSummaryLoading);
  const summaryError = useSelector(selectTutorAttendanceSummaryError);

  const activities = useSelector(selectAktivitasList);
  const activitiesLoading = useSelector(selectAktivitasLoading);
  const activitiesError = useSelector(selectAktivitasError);

  const [activeTab, setActiveTab] = useState('tutor');
  const [showFilters, setShowFilters] = useState(false);
  const [tutorFilters, setTutorFilters] = useState(DEFAULT_TUTOR_FILTERS);
  const [activityFilters, setActivityFilters] = useState(DEFAULT_ACTIVITY_FILTERS);
  const [summaryRefreshing, setSummaryRefreshing] = useState(false);
  const [activityRefreshing, setActivityRefreshing] = useState(false);
  const [expandedActivityId, setExpandedActivityId] = useState(null);
  const [attendanceCache, setAttendanceCache] = useState({});

  const typeOptions = useMemo(() => {
    const uniqueTypes = new Set(['all']);
    activities.forEach(activity => {
      if (activity.jenis_kegiatan) {
        uniqueTypes.add(activity.jenis_kegiatan);
      }
    });

    return Array.from(uniqueTypes).map(type => ({
      key: type,
      label: type === 'all' ? 'Semua Jenis' : type
    }));
  }, [activities]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.headerFilterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="filter" size={22} color="#fff" />
        </TouchableOpacity>
      )
    });
  }, [navigation]);

  const buildSummaryParams = useCallback(() => {
    const params = {};
    if (tutorFilters.date_from) {
      params.date_from = tutorFilters.date_from;
    }
    if (tutorFilters.date_to) {
      params.date_to = tutorFilters.date_to;
    }
    if (tutorFilters.jenis_kegiatan && tutorFilters.jenis_kegiatan !== 'all') {
      params.jenis_kegiatan = tutorFilters.jenis_kegiatan;
    }
    return params;
  }, [tutorFilters]);

  const buildActivityParams = useCallback(() => {
    const params = { page: 1, per_page: 20 };

    if (activityFilters.date_from) {
      params.date_from = activityFilters.date_from;
    }

    if (activityFilters.date_to) {
      params.date_to = activityFilters.date_to;
    }

    if (activityFilters.jenis_kegiatan && activityFilters.jenis_kegiatan !== 'all') {
      params.jenis_kegiatan = activityFilters.jenis_kegiatan;
    }

    return params;
  }, [activityFilters]);

  useEffect(() => {
    dispatch(fetchTutorAttendanceSummary(buildSummaryParams()));
  }, [dispatch, buildSummaryParams]);

  const fetchAttendanceForActivity = useCallback(async (id_aktivitas, { force = false, silent = false } = {}) => {
    setAttendanceCache(prev => {
      const existing = prev[id_aktivitas];
      if (!force && existing?.status === 'loaded') {
        return prev;
      }

      return {
        ...prev,
        [id_aktivitas]: {
          data: existing?.data ?? null,
          error: null,
          status: silent ? 'prefetching' : 'loading'
        }
      };
    });

    try {
      const response = await dispatch(getTutorAttendanceByActivity(id_aktivitas)).unwrap();
      const attendanceData = response ?? null;
      setAttendanceCache(prev => ({
        ...prev,
        [id_aktivitas]: {
          data: attendanceData,
          error: null,
          status: 'loaded'
        }
      }));
      return attendanceData;
    } catch (error) {
      const message = error?.message || error?.data?.message || 'Gagal memuat kehadiran tutor';
      setAttendanceCache(prev => ({
        ...prev,
        [id_aktivitas]: {
          data: null,
          error: message,
          status: 'error'
        }
      }));
      return null;
    }
  }, [dispatch]);

  useEffect(() => {
    const load = async () => {
      setActivityRefreshing(true);
      setAttendanceCache({});
      setExpandedActivityId(null);
      try {
        await dispatch(fetchAllAktivitas(buildActivityParams())).unwrap();
      } catch (err) {
        console.error('Failed to fetch activities', err);
      } finally {
        setActivityRefreshing(false);
      }
    };

    load();
  }, [dispatch, buildActivityParams]);

  useEffect(() => () => {
    dispatch(resetAktivitasError());
  }, [dispatch]);

  useEffect(() => {
    if (activityFilters.status !== 'all' && activities.length) {
      activities.forEach(activity => {
        const cached = attendanceCache[activity.id_aktivitas];
        if (!cached || cached.status === 'error') {
          fetchAttendanceForActivity(activity.id_aktivitas, { silent: true });
        }
      });
    }
  }, [activities, attendanceCache, activityFilters.status, fetchAttendanceForActivity]);

  const handleSummaryRefresh = useCallback(async () => {
    setSummaryRefreshing(true);
    try {
      await dispatch(fetchTutorAttendanceSummary(buildSummaryParams())).unwrap();
    } catch (error) {
      console.error('Failed to refresh summary', error);
    } finally {
      setSummaryRefreshing(false);
    }
  }, [dispatch, buildSummaryParams]);

  const handleActivityRefresh = useCallback(async () => {
    setActivityRefreshing(true);
    try {
      await dispatch(fetchAllAktivitas(buildActivityParams())).unwrap();
    } catch (error) {
      console.error('Failed to fetch activities', error);
    } finally {
      setActivityRefreshing(false);
    }
  }, [dispatch, buildActivityParams]);

  const handleApplyFilters = (newFilters) => {
    if (activeTab === 'tutor') {
      setTutorFilters(prev => ({ ...prev, ...newFilters }));
    } else {
      setActivityFilters(prev => ({ ...prev, ...newFilters }));
    }
    setShowFilters(false);
  };

  const handleClearFilters = (defaults) => {
    if (activeTab === 'tutor') {
      setTutorFilters(defaults || DEFAULT_TUTOR_FILTERS);
    } else {
      setActivityFilters(defaults || DEFAULT_ACTIVITY_FILTERS);
    }
    setShowFilters(false);
  };

  const handleToggleActivity = async (activityId) => {
    setExpandedActivityId(prev => (prev === activityId ? null : activityId));
    const cached = attendanceCache[activityId];
    if (!cached || cached.status === 'error') {
      await fetchAttendanceForActivity(activityId);
    }
  };

  const filteredActivities = useMemo(() => {
    if (activityFilters.status === 'all') {
      return activities;
    }

    if (activityFilters.status === 'none') {
      return activities.filter(activity => {
        const cached = attendanceCache[activity.id_aktivitas];
        return cached?.status === 'loaded' && !cached.data;
      });
    }

    return activities.filter(activity => {
      const cached = attendanceCache[activity.id_aktivitas];
      return cached?.status === 'loaded' && cached.data?.absen === activityFilters.status;
    });
  }, [activities, attendanceCache, activityFilters.status]);

  const filteredSummary = useMemo(() => {
    if (!Array.isArray(summary)) {
      return [];
    }

    if (tutorFilters.performance === 'all') {
      return summary;
    }

    return summary.filter(item => item.category === tutorFilters.performance);
  }, [summary, tutorFilters.performance]);

  const renderAttendanceDetails = (activity) => {
    const cached = attendanceCache[activity.id_aktivitas];

    if (!cached || cached.status === 'loading') {
      return (
        <LoadingSpinner size="small" message="Memuat kehadiran tutor..." />
      );
    }

    if (cached.status === 'prefetching') {
      return (
        <Text style={styles.prefetchingText}>Memproses data kehadiran...</Text>
      );
    }

    if (cached.status === 'error') {
      return (
        <ErrorMessage
          message={cached.error}
          onRetry={() => fetchAttendanceForActivity(activity.id_aktivitas, { force: true })}
        />
      );
    }

    if (!cached.data) {
      return (
        <View style={styles.emptyAttendanceState}>
          <Ionicons name="time-outline" size={36} color="#bdc3c7" />
          <Text style={styles.emptyAttendanceTitle}>Belum Ada Absen</Text>
          <Text style={styles.emptyAttendanceMessage}>
            Tutor belum mencatat kehadiran untuk aktivitas ini.
          </Text>
          <Button
            title="Catat Manual"
            onPress={() => navigation.navigate('ManualAttendance', {
              id_aktivitas: activity.id_aktivitas,
              mode: 'tutor'
            })}
            style={styles.manualButton}
            leftIcon={<Ionicons name="create-outline" size={18} color="#fff" />}
          />
        </View>
      );
    }

    const record = cached.data;
    const tutorName = record?.absen_user?.tutor?.nama || record?.nama_tutor || '-';
    const verification = record.latest_verification || record.verifications?.[0] || null;

    return (
      <View style={styles.attendanceDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Tutor</Text>
          <Text style={styles.detailValue}>{tutorName}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.absen) }]}>
            <Text style={styles.statusText}>{getStatusLabel(record.absen)}</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Waktu Hadir</Text>
          <Text style={styles.detailValue}>{formatTime(record.time_arrived)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Verifikasi</Text>
          <Text style={[styles.detailValue, { color: record.is_verified ? '#27ae60' : '#f39c12' }]}> 
            {record.is_verified ? 'Terverifikasi' : 'Belum Diverifikasi'}
          </Text>
        </View>

        {verification?.verification_notes ? (
          <View style={styles.verificationNotes}>
            <Text style={styles.notesLabel}>Catatan Verifikasi</Text>
            <Text style={styles.notesValue}>{verification.verification_notes}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderActivityItem = ({ item }) => {
    const cached = attendanceCache[item.id_aktivitas];
    const status = cached?.data?.absen || (cached?.status === 'loaded' ? 'none' : null);
    const isExpanded = expandedActivityId === item.id_aktivitas;

    return (
      <View style={styles.activityCard}>
        <TouchableOpacity
          style={styles.activityHeader}
          onPress={() => handleToggleActivity(item.id_aktivitas)}
        >
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>{item.jenis_kegiatan || 'Aktivitas Shelter'}</Text>
            <Text style={styles.activityDate}>{formatDate(item.tanggal)}</Text>
            {item.nama_kelompok ? (
              <Text style={styles.activityGroup}>{item.nama_kelompok}</Text>
            ) : null}
          </View>

          <View style={styles.activityStatusContainer}>
            <View style={[
              styles.statusBadge,
              !status && styles.statusBadgeEmpty,
              status && { backgroundColor: getStatusColor(status) }
            ]}>
              <Text style={styles.statusText}>
                {status ? getStatusLabel(status) : 'Lihat Detail'}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#7f8c8d"
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.activityBody}>
            {renderAttendanceDetails(item)}
          </View>
        )}
      </View>
    );
  };

  const renderTutorTab = () => {
    if (summaryLoading && (!summary || summary.length === 0)) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="Memuat ringkasan kehadiran tutor..." />
        </View>
      );
    }

    if (summaryError) {
      return (
        <ErrorMessage
          message={summaryError}
          onRetry={() => dispatch(fetchTutorAttendanceSummary(buildSummaryParams()))}
        />
      );
    }

    if (!summaryLoading && filteredSummary.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyTitle}>Belum ada data kehadiran tutor</Text>
          <Text style={styles.emptySubtitle}>
            Coba ubah filter waktu atau jenis kegiatan untuk melihat data lainnya.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredSummary}
        keyExtractor={(item, index) => item.id_tutor ? item.id_tutor.toString() : `tutor-${index}`}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TutorAttendanceCard
            tutor={item}
            onPress={() => navigation.navigate('TutorActivityHistory', {
              id_tutor: item.id_tutor,
              nama: item.nama
            })}
          />
        )}
        ListHeaderComponent={summaryStats ? (
          <TutorAttendanceSummary summary={summaryStats} />
        ) : null}
        refreshControl={(
          <RefreshControl
            refreshing={summaryRefreshing}
            onRefresh={handleSummaryRefresh}
          />
        )}
      />
    );
  };

  const renderActivityTab = () => {
    if (activitiesLoading && (!activities || activities.length === 0)) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner message="Memuat daftar aktivitas..." />
        </View>
      );
    }

    if (activitiesError) {
      return (
        <ErrorMessage
          message={activitiesError}
          onRetry={handleActivityRefresh}
        />
      );
    }

    if (!activitiesLoading && filteredActivities.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
          <Text style={styles.emptyTitle}>Belum ada aktivitas yang sesuai</Text>
          <Text style={styles.emptySubtitle}>
            Atur kembali filter status atau tanggal untuk melihat aktivitas lainnya.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredActivities}
        keyExtractor={(item) => item.id_aktivitas.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={renderActivityItem}
        refreshControl={(
          <RefreshControl
            refreshing={activityRefreshing}
            onRefresh={handleActivityRefresh}
          />
        )}
      />
    );
  };

  const currentFilters = activeTab === 'tutor' ? tutorFilters : activityFilters;
  const currentDefaults = activeTab === 'tutor' ? DEFAULT_TUTOR_FILTERS : DEFAULT_ACTIVITY_FILTERS;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tutor' && styles.tabButtonActive]}
          onPress={() => setActiveTab('tutor')}
        >
          <Text style={[styles.tabButtonLabel, activeTab === 'tutor' && styles.tabButtonLabelActive]}>
            Per Tutor
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'activity' && styles.tabButtonActive]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabButtonLabel, activeTab === 'activity' && styles.tabButtonLabelActive]}>
            Per Aktivitas
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'tutor' ? renderTutorTab() : renderActivityTab()}

      <ReportFilterModal
        visible={showFilters}
        mode={activeTab === 'tutor' ? 'tutor' : 'activity'}
        filters={currentFilters}
        defaults={currentDefaults}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        typeOptions={typeOptions}
        statusOptions={statusOptions}
        performanceOptions={performanceOptions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb'
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#e0e6ed',
    margin: 16,
    padding: 4,
    borderRadius: 12
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  tabButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  tabButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5d6d7e'
  },
  tabButtonLabelActive: {
    color: '#2c3e50'
  },
  headerFilterButton: {
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50'
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center'
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  activityInfo: {
    flex: 1,
    gap: 4
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50'
  },
  activityDate: {
    fontSize: 13,
    color: '#7f8c8d'
  },
  activityGroup: {
    fontSize: 12,
    color: '#95a5a6'
  },
  activityStatusContainer: {
    alignItems: 'center',
    gap: 6
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#95a5a6'
  },
  statusBadgeEmpty: {
    backgroundColor: '#dfe6e9'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
  activityBody: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    padding: 16,
    backgroundColor: '#fafafa'
  },
  attendanceDetails: {
    gap: 12
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  verificationNotes: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1'
  },
  notesLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4
  },
  notesValue: {
    fontSize: 14,
    color: '#2c3e50'
  },
  emptyAttendanceState: {
    alignItems: 'center',
    gap: 8
  },
  emptyAttendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50'
  },
  emptyAttendanceMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center'
  },
  manualButton: {
    alignSelf: 'stretch',
    marginTop: 8
  },
  prefetchingText: {
    fontSize: 13,
    color: '#7f8c8d'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50'
  },
  modalSection: {
    gap: 8
  },
  modalLabel: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  modalDateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 12,
    padding: 12
  },
  modalDateText: {
    fontSize: 14,
    color: '#2c3e50'
  },
  modalOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  modalOptionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ecf0f1'
  },
  modalOptionButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9'
  },
  modalOptionText: {
    fontSize: 13,
    color: '#7f8c8d'
  },
  modalOptionTextActive: {
    color: '#fff'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  modalClearButton: {
    flex: 1
  },
  modalApplyButton: {
    flex: 1
  }
});

export default TutorAttendanceReportScreen;
