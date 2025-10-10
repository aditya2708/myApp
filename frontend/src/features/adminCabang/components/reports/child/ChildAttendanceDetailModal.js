import React, { useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../../common/components/LoadingSpinner';
import AttendanceProgressBar from '../attendance/AttendanceProgressBar';
import AttendanceStatusChip from '../attendance/AttendanceStatusChip';

const BAND_META = {
  high: { label: 'Baik', color: '#00b894', icon: 'checkmark-circle' },
  medium: { label: 'Cukup', color: '#fdcb6e', icon: 'alert-circle' },
  low: { label: 'Rendah', color: '#e17055', icon: 'close-circle' },
};

const formatPercentage = (value) => {
  if (value === null || value === undefined) {
    return '0%';
  }

  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return '0%';
  }

  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
};

const ChildAttendanceDetailModal = ({
  visible,
  onClose,
  child,
  summary,
  monthlyBreakdown,
  timeline,
  verificationSummary,
  streaks,
  loading,
}) => {
  const statusMeta = useMemo(() => {
    const band = summary?.attendance_band || summary?.band;
    return BAND_META[band] || { label: 'Perlu Data', color: '#b2bec3', icon: 'help-circle' };
  }, [summary?.attendance_band, summary?.band]);

  const present = summary?.present_count ?? 0;
  const late = summary?.late_count ?? 0;
  const absent = summary?.absent_count ?? 0;
  const totalSessions = summary?.total_sessions ?? present + late + absent;

  const breakdown = useMemo(
    () => [
      {
        label: 'Hadir',
        count: present,
        percentage:
          totalSessions > 0 ? Math.round((Number(present) / Number(totalSessions)) * 1000) / 10 : 0,
        color: '#00b894',
        icon: 'checkbox-outline',
      },
      {
        label: 'Terlambat',
        count: late,
        percentage:
          totalSessions > 0 ? Math.round((Number(late) / Number(totalSessions)) * 1000) / 10 : 0,
        color: '#fdcb6e',
        icon: 'time',
      },
      {
        label: 'Tidak Hadir',
        count: absent,
        percentage:
          totalSessions > 0 ? Math.round((Number(absent) / Number(totalSessions)) * 1000) / 10 : 0,
        color: '#e17055',
        icon: 'close-circle',
      },
    ],
    [absent, late, present, totalSessions],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{child?.full_name || 'Detail Anak'}</Text>
            {child?.shelter?.name ? (
              <Text style={styles.subtitle}>
                {child.shelter.name}
                {child?.group?.name ? ` • ${child.group.name}` : ''}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#2d3436" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <LoadingSpinner message="Memuat detail anak..." />
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.summaryCard}>
              <AttendanceStatusChip
                label={`${statusMeta.label} (${formatPercentage(summary?.attendance_percentage)})`}
                color={statusMeta.color}
                icon={statusMeta.icon}
                active
                disabled
              />
              <Text style={styles.summaryMeta}>
                Total pertemuan: {totalSessions.toLocaleString('id-ID')}
              </Text>
              {summary?.last_present_on ? (
                <Text style={styles.summaryMeta}>Terakhir hadir: {summary.last_present_on}</Text>
              ) : null}
              {summary?.consecutive_absent ? (
                <Text style={styles.summaryMeta}>
                  Absen beruntun: {summary.consecutive_absent} pertemuan
                </Text>
              ) : null}
              {streaks?.present?.longest ? (
                <Text style={styles.summaryMeta}>
                  Streak hadir terbaik: {streaks.present.longest} sesi
                </Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Komposisi Kehadiran</Text>
              <View style={styles.progressList}>
                {breakdown.map((item) => (
                  <AttendanceProgressBar
                    key={item.label}
                    label={item.label}
                    count={item.count}
                    percentage={item.percentage}
                    color={item.color}
                    icon={item.icon}
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rincian Bulanan</Text>
              {Array.isArray(monthlyBreakdown) && monthlyBreakdown.length ? (
                monthlyBreakdown.map((item, index) => (
                  <View key={item.month ?? index} style={styles.monthItem}>
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthLabel}>{item.label || item.month}</Text>
                      <Text style={styles.monthPercentage}>{formatPercentage(item.attendance_percentage)}</Text>
                    </View>
                    <Text style={styles.monthMeta}>
                      Hadir {item.attended_count}/{item.activities_count} kegiatan
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Belum ada catatan bulanan.</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Timeline Aktivitas</Text>
              {Array.isArray(timeline) && timeline.length ? (
                timeline.map((item, index) => (
                  <View key={`${item.activity_id ?? index}-${item.date ?? index}`} style={styles.timelineItem}>
                    <View style={styles.timelineHeader}>
                      <Text style={styles.timelineDate}>{item.date}</Text>
                      <Text style={styles.timelineStatus}>{item.status}</Text>
                    </View>
                    <Text style={styles.timelineTitle}>{item.activity_name}</Text>
                    {item.tutor ? (
                      <Text style={styles.timelineMeta}>Tutor: {item.tutor}</Text>
                    ) : null}
                    {Array.isArray(item.notes) && item.notes.length ? (
                      <Text style={styles.timelineNote}>{item.notes.join('\n')}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Belum ada aktivitas pada periode ini.</Text>
              )}
            </View>

            {verificationSummary ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Verifikasi Kehadiran</Text>
                <Text style={styles.summaryMeta}>Terverifikasi: {verificationSummary.verified}</Text>
                <Text style={styles.summaryMeta}>Menunggu: {verificationSummary.pending}</Text>
                <Text style={styles.summaryMeta}>Ditolak: {verificationSummary.rejected}</Text>
                <Text style={styles.summaryMeta}>Manual: {verificationSummary.manual}</Text>
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

ChildAttendanceDetailModal.defaultProps = {
  child: null,
  summary: null,
  monthlyBreakdown: [],
  timeline: [],
  verificationSummary: null,
  streaks: null,
  loading: false,
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '12%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  subtitle: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 24,
  },
  summaryCard: {
    backgroundColor: '#f5f9ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryMeta: {
    fontSize: 12,
    color: '#57606f',
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 12,
  },
  progressList: {
    gap: 10,
  },
  monthItem: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  monthPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0984e3',
  },
  monthMeta: {
    fontSize: 12,
    color: '#636e72',
  },
  timelineItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    marginBottom: 12,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timelineDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
  },
  timelineStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0984e3',
  },
  timelineTitle: {
    fontSize: 14,
    color: '#2d3436',
    marginBottom: 4,
  },
  timelineMeta: {
    fontSize: 12,
    color: '#636e72',
  },
  timelineNote: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyText: {
    fontSize: 13,
    color: '#8395a7',
  },
});

export default ChildAttendanceDetailModal;
