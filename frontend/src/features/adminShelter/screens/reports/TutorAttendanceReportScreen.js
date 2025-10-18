import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TutorAttendanceReportScreen = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Laporan kehadiran tutor akan tersedia di sini.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 24
  },
  text: {
    fontSize: 16,
    color: '#52606d',
    textAlign: 'center'
  }
});

export default TutorAttendanceReportScreen;
