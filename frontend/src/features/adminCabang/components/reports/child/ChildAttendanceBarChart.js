import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const BAR_COLORS = ['#0984e3', '#6c5ce7', '#00b894', '#e17055', '#fdcb6e'];

const ChildAttendanceBarChart = ({ data, title }) => {
  const chartData = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    const maxValue = items.reduce((acc, item) => {
      const numeric = Number(item?.attendance_percentage ?? item?.percentage ?? 0);

      if (!Number.isFinite(numeric)) {
        return acc;
      }

      return Math.max(acc, numeric);
    }, 0);

    return {
      items: items.map((item, index) => {
        const percentage = Number(item?.attendance_percentage ?? item?.percentage ?? 0);
        const normalized = Number.isFinite(percentage) ? Math.max(0, Math.min(percentage, 100)) : 0;

        return {
          ...item,
          key: `${item?.shelter_id ?? item?.id ?? index}`,
          percentage: normalized,
          color: BAR_COLORS[index % BAR_COLORS.length],
        };
      }),
      maxValue,
    };
  }, [data]);

  const renderItem = ({ item }) => {
    const width = `${item.percentage}%`;

    return (
      <View style={styles.barItem}>
        <View style={styles.barInfo}>
          <Text style={styles.label}>{item.label || item.name || 'Shelter'}</Text>
          <Text style={styles.percentageLabel}>{item.percentage.toFixed(item.percentage % 1 === 0 ? 0 : 1)}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width, backgroundColor: item.color }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {chartData.items.length ? (
        <FlatList
          data={chartData.items}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <Text style={styles.emptyText}>Belum ada data kehadiran per shelter.</Text>
      )}
    </View>
  );
};

ChildAttendanceBarChart.defaultProps = {
  data: [],
  title: 'Persentase Kehadiran per Shelter',
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2d3436',
  },
  barItem: {
    marginBottom: 12,
  },
  barInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: '#2d3436',
    flex: 1,
    marginRight: 12,
  },
  percentageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  barTrack: {
    height: 10,
    backgroundColor: '#f1f2f6',
    borderRadius: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f2f6',
    marginVertical: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#8395a7',
  },
});

export default ChildAttendanceBarChart;
