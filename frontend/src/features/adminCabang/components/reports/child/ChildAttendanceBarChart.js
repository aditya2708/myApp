import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BAR_COLORS = ['#0984e3', '#6c5ce7', '#00b894', '#e17055', '#fdcb6e'];

const normalizeChartItems = (items) => {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => {
    const percentageValue = Number(
      item?.percentage?.value ??
        item?.percentage ??
        item?.attendanceRate ??
        item?.attendance_percentage ??
        0
    );

    return {
      id: item?.id ?? item?.shelter_id ?? `chart-${index}`,
      label: item?.label ?? item?.name ?? `Shelter ${index + 1}`,
      percentageValue: Number.isFinite(percentageValue)
        ? Math.max(0, Math.min(100, percentageValue))
        : 0,
      percentageLabel: item?.percentage?.label ??
        (Number.isFinite(percentageValue)
          ? `${percentageValue.toFixed(percentageValue % 1 === 0 ? 0 : 1)}%`
          : '0%'),
      totalChildren:
        item?.totalChildren ?? item?.childrenCount ?? item?.total_children ?? null,
      color: BAR_COLORS[index % BAR_COLORS.length],
    };
  });
};

const ChildAttendanceBarChart = ({
  data = [],
  loading = false,
  title = 'Persentase Kehadiran per Shelter',
  subtitle = 'Persentase kehadiran anak berdasarkan shelter',
  emptyMessage = 'Belum ada data kehadiran per shelter.',
  style,
}) => {
  const items = useMemo(() => normalizeChartItems(data), [data]);
  const hasData = items.length > 0;

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {loading ? <ActivityIndicator color="#0984e3" /> : null}
      </View>

      {/* Loading skeleton */}
      {loading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={[styles.skeletonItem, index > 0 && styles.skeletonItemSpacing]}>
              <View style={styles.skeletonLabel} />
              <View style={styles.skeletonBar} />
            </View>
          ))}
        </View>
      ) : hasData ? (
        // Data list
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.listContent}>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.labelColumn}>
                <Text style={styles.itemLabel} numberOfLines={2}>
                  {item.label}
                </Text>
                {typeof item.totalChildren === 'number' ? (
                  <Text style={styles.itemMeta}>{item.totalChildren.toLocaleString('id-ID')} anak</Text>
                ) : null}
              </View>

              <View style={styles.barWrapper}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${item.percentageValue}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
                <Text style={styles.percentage}>{item.percentageLabel}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        // Empty state
        <View style={styles.emptyState}>
          <Ionicons name="bar-chart-outline" size={32} color="#b2bec3" />
          <Text style={styles.emptyStateText}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 16,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#636e72',
  },
  scrollArea: {
    maxHeight: 280,
  },
  listContent: {
    paddingBottom: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  labelColumn: {
    flexBasis: '40%',
    paddingRight: 12,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: '#95a5a6',
  },
  barWrapper: {
    flex: 1,
  },
  barTrack: {
    height: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(9, 132, 227, 0.1)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  percentage: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3436',
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonList: {
    marginTop: 4,
  },
  skeletonItemSpacing: {
    marginTop: 12,
  },
  skeletonLabel: {
    width: '35%',
    height: 18,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  skeletonBar: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f4f6f7',
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

export default ChildAttendanceBarChart;
