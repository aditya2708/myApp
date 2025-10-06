import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AttendanceFilterBar = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filter Kehadiran</Text>
      <Text style={styles.description}>
        Komponen filter akan ditempatkan di sini untuk mengatur rentang waktu dan penyaringan data.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f1f2f6',
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#2d3436',
  },
  description: {
    fontSize: 14,
    color: '#636e72',
  },
});

export default AttendanceFilterBar;
