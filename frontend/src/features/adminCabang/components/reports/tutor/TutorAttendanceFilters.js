import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const TutorAttendanceFilters = ({ visible = true }) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter Laporan Tutor</Text>
      <Text style={styles.description}>
        Fitur filter sedang dalam pengembangan. Silakan cek kembali nanti.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  description: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default TutorAttendanceFilters;
