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
  getTutorAttendanceByActivity
} from '../../redux/tutorAttendanceSlice';

const DEFAULT_FILTERS = {
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
  onClose,
  filters,
  onApply,
  onClear,
  typeOptions
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
    setLocalFilters(DEFAULT_FILTERS);
    onClear();
  };

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
            <Text style={styles.modalTitle}>Filter Aktivitas</Text>
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

          <View style={styles.modalSection}>
            <Text style={styles.modalLabel}>Status Kehadiran Tutor</Text>
            <View style={styles.modalOptionGrid}>
              {statusOptions.map(option => (
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

  const activities = useSelector(selectAktivitasList);
  const activitiesLoading = useSelector(selectAktivitasLoading);
  const activitiesError = useSelector(selectAktivitasError);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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

  const fetchActivities = useCallback(async () => {
    const params = { page: 1, per_page: 20 };

    if (filters.date_from) {
      params.date_from = filters.date_from;
    }

    if (filters.date_to) {
      params.date_to = filters.date_to;
    }

    if (filters.jenis_kegiatan && filters.jenis_kegiatan !== 'all') {
      params.jenis_kegiatan = filters.jenis_kegiatan;
    }

    try {
      await dispatch(fetchAllAktivitas(params)).unwrap();
    } catch (err) {
      console.error('Failed to fetch activities', err);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, filters.date_from, filters.date_to, filters.jenis_kegiatan]);

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
    setRefreshing(true);
    setAttendanceCache({});
    setExpandedActivityId(null);
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => () => {
    dispatch(resetAktivitasError());
  }, [dispatch]);

  useEffect(() => {
    if (filters.status !== 'all' && activities.length) {
      activities.forEach(activity => {
        const cached = attendanceCache[activity.id_aktivitas];
        if (!cached || cached.status === 'error') {
          fetchAttendanceForActivity(activity.id_aktivitas, { silent: true });
        }
      });
    }
  }, [activities, attendanceCache, fetchAttendanceForActivity, filters.status]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
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
    if (filters.status === 'all') {
      return activities;
    }

    if (filters.status === 'none') {
      return activities.filter(activity => {
        const cached = attendanceCache[activity.id_aktivitas];
        return cached?.status === 'loaded' && !cached.data;
      });
    }

    return activities.filter(activity => {
      const cached = attendanceCache[activity.id_aktivitas];
      return cached?.status === 'loaded' && cached.data?.absen === filters.status;
    });
  }, [activities, attendanceCache, filters.status]);

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
    const isExpanded = expandedActivityId === item.id_aktivitas;
    const status = cached?.data?.absen ?? (cached?.status === 'loaded' ? null : undefined);

    return (
      <View style={styles.activityCard}>
        <TouchableOpacity
          style={styles.activityHeader}
          onPress={() => handleToggleActivity(item.id_aktivitas)}
          activeOpacity={0.8}
        >
          <View style={styles.activityInfo}>
            <Text style={styles.activityType}>{item.jenis_kegiatan || 'Aktivitas'}</Text>
            <Text style={styles.activityTitle}>{item.materi || 'Tanpa materi'}</Text>
            <Text style={styles.activityDate}>{formatDate(item.tanggal)}</Text>
            {item.nama_kelompok ? (
              <Text style={styles.activityGroup}>Kelompok: {item.nama_kelompok}</Text>
            ) : null}
          </View>

          <View style={styles.activityStatusContainer}>
            {cached && (cached.status === 'loading' || cached.status === 'prefetching') ? (
              <LoadingSpinner size="small" message="" />
            ) : status ? (
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusBadgeEmpty]}>
                <Text style={styles.statusText}>Belum Ada</Text>
              </View>
            )}
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

  if (activitiesLoading && !activities.length) {
    return <LoadingSpinner fullScreen message="Memuat daftar aktivitas..." />;
  }

  if (activitiesError) {
    return (
      <View style={styles.screenContainer}>
        <ErrorMessage
          message={activitiesError}
          onRetry={() => {
            dispatch(resetAktivitasError());
            handleRefresh();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      {filteredActivities.length === 0 ? (
        <View style={styles.emptyListState}>
          <Ionicons name="clipboard-outline" size={64} color="#bdc3c7" />
          <Text style={styles.emptyListTitle}>Tidak ada aktivitas</Text>
          <Text style={styles.emptyListMessage}>
            Sesuaikan filter untuk menemukan aktivitas yang membutuhkan laporan kehadiran tutor.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.id_aktivitas?.toString() ?? String(item.id_aktivitas)}
          renderItem={renderActivityItem}
          contentContainerStyle={styles.listContent}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3498db"]}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      <ReportFilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        typeOptions={typeOptions}
      />
    </View>
  );
};

export default TutorAttendanceReportScreen;

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  headerFilterButton: {
    marginRight: 12,
    padding: 6,
    backgroundColor: '#3498db',
    borderRadius: 16
  },
  listContent: {
    paddingBottom: 24
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16
  },
  activityInfo: {
    flex: 1,
    gap: 4
  },
  activityType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db',
    textTransform: 'uppercase'
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
  emptyListState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12
  },
  emptyListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50'
  },
  emptyListMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center'
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
    gap: 12
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50'
  },
  modalDateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ecf0f1'
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    backgroundColor: '#fff'
  },
  modalOptionButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db'
  },
  modalOptionText: {
    fontSize: 13,
    color: '#2c3e50'
  },
  modalOptionTextActive: {
    color: '#fff'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12
  },
  modalClearButton: {
    flex: 1
  },
  modalApplyButton: {
    flex: 1
  }
});
