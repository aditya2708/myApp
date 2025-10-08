import React, { useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import ReportQuickLinkTile from '../../../components/reports/ReportQuickLinkTile';

const AdminCabangAttendanceReportScreen = () => {
  const navigation = useNavigation();

  const handleWeeklyPress = useCallback(() => {
    navigation.navigate('AdminCabangAttendanceWeekly');
  }, [navigation]);

  const handleDevelopmentPress = useCallback(() => {
    Alert.alert('Sedang Dikembangkan', 'Fitur ini sedang dalam pengembangan.');
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Laporan Kehadiran Cabang</Text>
        <Text style={styles.subtitle}>
          Pilih jenis rekap yang ingin Anda lihat untuk memantau kehadiran tutor dan anak binaan.
        </Text>
      </View>

      <ReportQuickLinkTile
        title="Rekap Mingguan Cabang"
        description="Lihat ringkasan kehadiran mingguan untuk seluruh cabang."
        icon="calendar"
        color="#16a085"
        onPress={handleWeeklyPress}
      />
      <ReportQuickLinkTile
        title="Rekap Bulanan per Shelter"
        description="Ringkasan kehadiran bulanan yang dikelompokkan per shelter."
        icon="business"
        color="#2980b9"
        onPress={handleDevelopmentPress}
      />
      <ReportQuickLinkTile
        title="Rekap Bulanan Cabang"
        description="Laporan kehadiran bulanan teragregasi di tingkat cabang."
        icon="bar-chart"
        color="#8e44ad"
        onPress={handleDevelopmentPress}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
  },
});

export default AdminCabangAttendanceReportScreen;
