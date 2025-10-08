import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import useAttendanceWeeklyShelterDetail from '../../../hooks/reports/attendance/useAttendanceWeeklyShelterDetail';

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'number') {
    return value.toLocaleString('id-ID');
  }

  return String(value);
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return `${numeric.toFixed(1)}%`;
  }

  const stringValue = String(value);

  if (stringValue.includes('%')) {
    return stringValue;
  }

  return `${stringValue}%`;
};

const formatDateLabel = (filters = {}, fallbackLabel = null) => {
  const { startDate, endDate, label } = filters;

  if (label) {
    return label;
  }

  if (!startDate && !endDate) {
    return fallbackLabel;
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
    console.warn('Failed to format shelter attendance detail filter label:', error);
    return fallbackLabel;
  }
};

const MetricBadge = ({ label, value, percentage, accent, style }) => {
  if (value === null || value === undefined) {
    return null;
  }

  return (
    <View style={[styles.metricBadge, accent ? styles[accent] : null, style]}>
      <Text style={[styles.metricBadgeLabel, accent ? styles[`${accent}Label`] : null]}>{label}</Text>
      <Text style={[styles.metricBadgeValue, accent ? styles[`${accent}Value`] : null]}>{formatNumber(value)}</Text>
      {percentage !== null && percentage !== undefined ? (
        <Text style={[styles.metricBadgePercentage, accent ? styles[`${accent}Percentage`] : null]}>
          {formatPercentage(percentage)}
        </Text>
      ) : null}
    </View>
  );
};

const ActivityMetrics = ({ metrics }) => {
  if (!metrics) {
    return null;
  }

  const metricItems = [
    { key: 'present', label: 'Hadir', accent: 'present', data: metrics?.present },
    { key: 'late', label: 'Terlambat', accent: 'late', data: metrics?.late },
    { key: 'absent', label: 'Alpa', accent: 'absent', data: metrics?.absent },
  ];

  return (
    <View style={styles.activityMetricsRow}>
      {metricItems.map((item, index) => (
        <MetricBadge
          key={item.key}
          label={item.label}
          value={item.data?.count}
          percentage={item.data?.percentage}
          accent={item.accent}
          style={index === metricItems.length - 1 ? styles.metricBadgeLast : null}
        />
      ))}
    </View>
  );
};

const ShelterAttendanceDetailModal = ({
  visible,
  onClose,
  shelterId,
  shelterName,
  shelterWilbin,
  filters,
}) => {
  const effectiveFilters = useMemo(() => filters ?? {}, [filters]);
  const params = useMemo(
    () =>
      visible
        ? {
            shelterId,
            startDate: effectiveFilters?.startDate ?? effectiveFilters?.start,
            endDate: effectiveFilters?.endDate ?? effectiveFilters?.end,
          }
        : { shelterId: null },
    [visible, shelterId, effectiveFilters]
  );

  const { data, isLoading, error, refetch } = useAttendanceWeeklyShelterDetail(params);

  const shelterInfo = useMemo(() => {
    if (data?.shelter) {
      return data.shelter;
    }

    return {
      id: shelterId,
      name: shelterName,
      wilbin: shelterWilbin,
    };
  }, [data?.shelter, shelterId, shelterName, shelterWilbin]);

  const handleRetry = () => {
    if (typeof refetch === 'function') {
      refetch({ shelterId });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.feedbackState}>
          <ActivityIndicator size="small" color="#0984e3" />
          <Text style={styles.feedbackText}>Memuat detail kehadiran shelter...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.feedbackState}>
          <Text style={[styles.feedbackText, styles.errorText]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!data?.weeks || data.weeks.length === 0) {
      return (
        <View style={styles.feedbackState}>
          <Text style={styles.feedbackTitle}>Belum ada data mingguan</Text>
          <Text style={styles.feedbackText}>
            Tidak ditemukan aktivitas kehadiran untuk periode yang dipilih.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {data.weeks.map((week) => (
          <View key={week.id} style={styles.weekSection}>
            <View style={styles.weekHeader}>
              <View>
                <Text style={styles.weekLabel}>{week.label}</Text>
                {week?.dateRange?.label ? (
                  <Text style={styles.weekDateLabel}>{week.dateRange.label}</Text>
                ) : null}
              </View>
              {week?.kelompok?.length ? (
                <Text style={styles.weekSummary}>{`${week.kelompok.length} kelompok`}</Text>
              ) : null}
            </View>

            {week?.kelompok?.length ? (
              week.kelompok.map((kelompok) => (
                <View key={kelompok.id} style={styles.kelompokCard}>
                  <View style={styles.kelompokHeader}>
                    <View style={styles.kelompokTitleContainer}>
                      <Text style={styles.kelompokName}>{kelompok.name}</Text>
                      {kelompok.mentor ? (
                        <Text style={styles.kelompokMentor}>{`Pendamping: ${kelompok.mentor}`}</Text>
                      ) : null}
                      {typeof kelompok.membersCount === 'number' ? (
                        <Text style={styles.kelompokMembers}>{`${kelompok.membersCount.toLocaleString('id-ID')} anggota`}</Text>
                      ) : null}
                    </View>
                    <View style={styles.kelompokRateContainer}>
                      {typeof kelompok?.summary?.attendanceRate === 'number' ? (
                        <Text style={styles.kelompokRate}>{`${kelompok.summary.attendanceRate.toFixed(1)}%`}</Text>
                      ) : null}
                      <Text style={styles.kelompokRateLabel}>Rata-rata hadir</Text>
                    </View>
                  </View>

                  <ActivityMetrics metrics={kelompok?.summary} />

                  <View style={styles.activitiesSection}>
                    <Text style={styles.activitiesTitle}>Aktivitas</Text>
                    {kelompok?.activities?.length ? (
                      kelompok.activities.map((activity) => (
                        <View key={activity.id} style={styles.activityRow}>
                          <View style={styles.activityInfo}>
                            <Text style={styles.activityName}>{activity.name}</Text>
                            {activity.schedule ? (
                              <Text style={styles.activitySchedule}>{activity.schedule}</Text>
                            ) : null}
                            {typeof activity?.metrics?.attendanceRate === 'number' ? (
                              <Text style={styles.activityRate}>{`${activity.metrics.attendanceRate.toFixed(1)}% hadir`}</Text>
                            ) : null}
                          </View>
                          <ActivityMetrics metrics={activity.metrics} />
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyActivitiesText}>Belum ada aktivitas yang tercatat.</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyKelompokText}>Tidak ada data kelompok untuk minggu ini.</Text>
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{shelterInfo?.name ?? 'Detail Shelter'}</Text>
              {shelterInfo?.wilbin ? (
                <Text style={styles.headerSubtitle}>{shelterInfo.wilbin}</Text>
              ) : null}
              <Text style={styles.headerPeriodLabel}>
                Periode: {formatDateLabel({ ...effectiveFilters, ...shelterInfo?.period }, 'Tidak diketahui')}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button">
              <Text style={styles.closeButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>

          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

ShelterAttendanceDetailModal.defaultProps = {
  visible: false,
  onClose: () => {},
  shelterId: null,
  shelterName: null,
  shelterWilbin: null,
  filters: {},
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ecf0f1',
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
  },
  headerPeriodLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 6,
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#dfe6e9',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#2d3436',
    fontWeight: '600',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  weekSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ecf0f1',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  weekLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  weekDateLabel: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
  },
  weekSummary: {
    fontSize: 13,
    color: '#0984e3',
    fontWeight: '600',
  },
  kelompokCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9fbfd',
  },
  kelompokHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kelompokTitleContainer: {
    flex: 1,
    paddingRight: 16,
  },
  kelompokName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
  },
  kelompokMentor: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  kelompokMembers: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  kelompokRateContainer: {
    alignItems: 'flex-end',
  },
  kelompokRate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0984e3',
  },
  kelompokRateLabel: {
    fontSize: 11,
    color: '#636e72',
  },
  activitiesSection: {
    marginTop: 8,
  },
  activitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2d3436',
  },
  activityRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  activityInfo: {
    marginBottom: 12,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  activitySchedule: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  activityRate: {
    fontSize: 12,
    color: '#0984e3',
    marginTop: 4,
    fontWeight: '600',
  },
  activityMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBadge: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ecf0f1',
    marginRight: 8,
  },
  metricBadgeLast: {
    marginRight: 0,
  },
  metricBadgeLabel: {
    fontSize: 11,
    color: '#636e72',
  },
  metricBadgeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 2,
  },
  metricBadgePercentage: {
    fontSize: 11,
    color: '#2d3436',
    marginTop: 2,
  },
  present: {
    backgroundColor: '#e8f8f5',
  },
  presentLabel: {
    color: '#1abc9c',
  },
  presentValue: {
    color: '#16a085',
  },
  presentPercentage: {
    color: '#16a085',
  },
  late: {
    backgroundColor: '#fff5e6',
  },
  lateLabel: {
    color: '#e67e22',
  },
  lateValue: {
    color: '#d35400',
  },
  latePercentage: {
    color: '#d35400',
  },
  absent: {
    backgroundColor: '#fdecef',
  },
  absentLabel: {
    color: '#e84393',
  },
  absentValue: {
    color: '#d63072',
  },
  absentPercentage: {
    color: '#d63072',
  },
  emptyKelompokText: {
    fontSize: 13,
    color: '#636e72',
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  emptyActivitiesText: {
    fontSize: 12,
    color: '#636e72',
    fontStyle: 'italic',
  },
  feedbackState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2d3436',
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 13,
    color: '#636e72',
    textAlign: 'center',
  },
  errorText: {
    color: '#d63031',
    marginBottom: 12,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0984e3',
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default ShelterAttendanceDetailModal;
