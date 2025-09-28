import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const AdminCabangTutorReportScreen = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Laporan Tutor</Text>
    <Text style={styles.description}>
      Modul laporan tutor akan tersedia segera untuk membantu Anda memonitor performa tutor.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AdminCabangTutorReportScreen;
