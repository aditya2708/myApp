import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AttendanceTrendChart = ({ data, title }) => {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || 'Tren Kehadiran'}</Text>
      {hasData ? (
        <View>
          {data.map((item) => {
            const rateValue = Math.max(0, Math.min(100, item.attendanceRate ?? 0));

            return (
              <View key={item.monthLabel} style={styles.barRow}>
                <Text style={styles.barLabel}>{item.monthLabel}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${rateValue}%` }]} />
                </View>
                <Text style={styles.barValue}>{`${rateValue}%`}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Komponen grafik akan ditempatkan di sini setelah integrasi data dan chart library.
          </Text>
        </View>
      )}
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
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barLabel: {
    width: 80,
    fontSize: 13,
    color: '#2d3436',
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 8,
    backgroundColor: '#dfe6e9',
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#0984e3',
  },
  barValue: {
    width: 48,
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
    textAlign: 'right',
  },
});

export default AttendanceTrendChart;
