import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart, Grid } from 'react-native-svg-charts';

const attendanceData = [50, 80, 45, 60, 70, 90, 100];

export const ChildAttendanceLineChart = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tren Kehadiran Anak</Text>
      <Text style={styles.subtitle}>Perkembangan kehadiran mingguan untuk evaluasi cepat cabang.</Text>
      <LineChart
        style={styles.chart}
        data={attendanceData}
        svg={{ stroke: '#4a90e2', strokeWidth: 3 }}
        contentInset={{ top: 20, bottom: 20 }}
        animate
      >
        <Grid svg={{ strokeDasharray: [4, 4], strokeOpacity: 0.25 }} />
      </LineChart>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    marginBottom: 12,
  },
  chart: {
    height: 180,
    width: '100%',
  },
});

export default ChildAttendanceLineChart;
