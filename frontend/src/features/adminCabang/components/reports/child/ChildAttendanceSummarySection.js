import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ReportSummaryCard from '../ReportSummaryCard';

const buildSummaryItems = (summary) => {
  if (!summary) {
    return [];
  }

  const totalChildren = summary.totalChildren ?? summary?.totals?.totalChildren ?? 0;
  const present = summary?.breakdown?.present ?? summary.presentCount ?? 0;
  const absent = summary?.breakdown?.absent ?? summary.absentCount ?? 0;
  const late = summary?.breakdown?.late ?? summary.lateCount ?? 0;
  const attendanceRate = summary?.attendanceRate?.label ?? summary?.attendance_percentage ?? '0%';

  return [
    {
      id: 'attendance-rate',
      icon: 'stats-chart',
      label: 'Rata-rata Kehadiran',
      value: attendanceRate,
      description: `${present + late} hadir dari ${summary?.totals?.totalSessions ?? summary.totalSessions ?? 0} sesi`,
      color: '#0984e3',
    },
    {
      id: 'present',
      icon: 'checkmark-circle',
      label: 'Jumlah Hadir',
      value: present,
      description: `Terlambat: ${late}`,
      color: '#2ecc71',
    },
    {
      id: 'absent',
      icon: 'close-circle',
      label: 'Jumlah Tidak Hadir',
      value: absent,
      description: `Total sesi: ${summary?.totals?.totalSessions ?? summary.totalSessions ?? 0}`,
      color: '#e74c3c',
    },
    {
      id: 'children',
      icon: 'people',
      label: 'Total Anak Dipantau',
      value: totalChildren,
      description: `Aktif: ${summary?.activeChildren ?? '-'}`,
      color: '#8e44ad',
    },
  ];
};

const ChildAttendanceSummarySection = ({
  summary,
  loading = false,
  reportDate,
  periodLabel,
  style,
  emptyMessage = 'Belum ada data ringkasan kehadiran.',
}) => {
  const dateLabel = periodLabel || summary?.dateRange?.label || null;
  const generatedAt = reportDate || summary?.generatedAt || summary?.meta?.generatedAt || null;
  const items = buildSummaryItems(summary);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.title}>Ringkasan Kehadiran</Text>
          {dateLabel ? <Text style={styles.subtitle}>{dateLabel}</Text> : null}
        </View>
        {generatedAt ? (
          <View style={styles.badge}>
            <Ionicons name="time-outline" size={14} color="#636e72" style={styles.badgeIcon} />
            <Text style={styles.badgeText}>Laporan: {generatedAt}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.skeletonWrapper}>
          {[0, 1, 2, 3].map((index) => (
            <View key={index} style={styles.skeletonCard} />
          ))}
          <ActivityIndicator color="#0984e3" style={styles.loadingIndicator} />
        </View>
      ) : items.length ? (
        <View style={styles.cardsGrid}>
          {items.map((item) => (
            <View key={item.id} style={styles.cardWrapper}>
              <ReportSummaryCard
                icon={item.icon}
                label={item.label}
                value={item.value}
                description={item.description}
                color={item.color}
                variant="compact"
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={32} color="#b2bec3" />
          <Text style={styles.emptyStateText}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTextWrapper: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#636e72',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f2f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeIcon: {
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#636e72',
    fontWeight: '600',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cardWrapper: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  skeletonWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    position: 'relative',
    minHeight: 120,
  },
  skeletonCard: {
    width: '50%',
    height: 92,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
    marginHorizontal: 8,
  },
  loadingIndicator: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 8,
    left: 0,
    right: 0,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    marginTop: 8,
    color: '#95a5a6',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ChildAttendanceSummarySection;
