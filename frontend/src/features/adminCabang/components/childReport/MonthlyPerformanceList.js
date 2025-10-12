import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AttendanceProgressBar from '../reports/attendance/AttendanceProgressBar';
import ReportSection from './ReportSection';

const resolveColor = (percentage) => {
  if (percentage >= 85) return '#2ecc71';
  if (percentage >= 60) return '#f39c12';
  return '#e74c3c';
};

const MonthlyPerformanceList = ({ items = [] }) => {
  return (
    <ReportSection title="Performa Bulanan">
      {items.length ? (
        <View style={styles.list}>
          {items.map((item) => {
            const percentageValue = Number(item.percentage) || 0;
            return (
              <View key={item.id} style={styles.item}>
                <AttendanceProgressBar
                  label={item.label}
                  percentage={percentageValue}
                  color={resolveColor(percentageValue)}
                  showCount={false}
                  backgroundColor="rgba(236, 240, 241, 0.6)"
                />
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.emptyText}>Belum ada data performa bulanan.</Text>
      )}
    </ReportSection>
  );
};

const styles = StyleSheet.create({
  list: {
    // Intentionally left blank to preserve parent spacing while enabling overrides.
  },
  item: {
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#95a5a6',
  },
});

export default MonthlyPerformanceList;
