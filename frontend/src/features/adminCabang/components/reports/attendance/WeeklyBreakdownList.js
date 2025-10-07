import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WeeklyBreakdownList = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Belum ada data mingguan</Text>
        <Text style={styles.emptyDescription}>
          Ringkasan mingguan akan muncul di sini setelah integrasi data selesai.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {data.map((item, index) => {
        const attendanceRate =
          typeof item.attendanceRate === 'number' ? `${item.attendanceRate}%` : '-';

        return (
          <View
            key={item.id || index}
            style={[styles.item, index === data.length - 1 && styles.lastItem]}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.weekLabel || `Minggu ${index + 1}`}</Text>
              <Text style={styles.itemRate}>{attendanceRate}</Text>
            </View>
            <Text style={styles.itemDescription}>
              {`${item.presentCount ?? '-'} hadir dari ${item.totalSessions ?? '-'} sesi`} ·
              {` ${item.absentCount ?? '-'} absen`}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

WeeklyBreakdownList.defaultProps = {
  data: [],
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dfe6e9',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
  },
  itemRate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00b894',
  },
  itemDescription: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
  },
  emptyState: {
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#636e72',
  },
});

export default WeeklyBreakdownList;
