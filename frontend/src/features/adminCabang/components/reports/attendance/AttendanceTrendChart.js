import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AttendanceTrendChart = ({ data, title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || 'Tren Kehadiran'}</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Komponen grafik akan ditempatkan di sini setelah integrasi data dan chart library.
        </Text>
      </View>
    </View>
  );
};

AttendanceTrendChart.defaultProps = {
  data: [],
  title: null,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f6fa',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 12,
  },
  placeholder: {
    minHeight: 180,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: '#b2bec3',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderText: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
  },
});

export default AttendanceTrendChart;
