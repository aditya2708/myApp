import React from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';

import AttendanceFilterBar from '../../../components/reports/attendance/AttendanceFilterBar';
import AttendanceSummarySection from '../../../components/reports/attendance/AttendanceSummarySection';
import WeeklyBreakdownList from '../../../components/reports/attendance/WeeklyBreakdownList';
import ShelterAttendanceTable from '../../../components/reports/attendance/ShelterAttendanceTable';
import AttendanceTrendChart from '../../../components/reports/attendance/AttendanceTrendChart';

const AdminCabangAttendanceReportScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AttendanceFilterBar />

      <View style={styles.section}>
        <AttendanceSummarySection
          title="Ringkasan Kehadiran"
          description="Area ringkasan akan menampilkan metrik utama kehadiran."
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rekap Mingguan Cabang</Text>
        <WeeklyBreakdownList data={[]} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rekap Bulanan per Shelter</Text>
        <ShelterAttendanceTable data={[]} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tren Kehadiran</Text>
        <AttendanceTrendChart data={[]} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2d3436',
  },
});

export default AdminCabangAttendanceReportScreen;
