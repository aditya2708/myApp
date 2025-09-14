import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getPercentageColor, getMonthName } from '../utils/reportUtils';

const AttendanceChart = ({ monthlyData, height = 80 }) => {
  const months = Object.values(monthlyData).slice(0, 12);
  const maxPercentage = Math.max(...months.map(m => m.percentage), 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kehadiran Bulanan</Text>
      <View style={[styles.chart, { height }]}>
        {months.map((month) => (
          <View key={month.month_number} style={styles.chartBar}>
            <View 
              style={[
                styles.bar, 
                { 
                  height: Math.max((month.percentage / maxPercentage) * (height - 30), 2),
                  backgroundColor: getPercentageColor(month.percentage)
                }
              ]} 
            />
            <Text style={styles.barLabel}>
              {getMonthName(month.month_number, true)}
            </Text>
            <Text style={styles.barValue}>{month.percentage}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4
  },
  chartBar: {
    alignItems: 'center',
    flex: 1
  },
  bar: {
    width: 18,
    borderRadius: 2,
    marginBottom: 4,
    minHeight: 2
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2
  },
  barValue: {
    fontSize: 9,
    color: '#333',
    fontWeight: '500'
  }
});

export default AttendanceChart;