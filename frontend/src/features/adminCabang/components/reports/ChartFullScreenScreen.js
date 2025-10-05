import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import ChildAttendanceLineChart, {
  DEFAULT_DATA,
} from './ChildAttendanceLineChart';

const ChartFullScreenScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const { data, contentInset, gradientId, ...chartProps } = route.params || {};

  const chartData = useMemo(() => data || DEFAULT_DATA, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Detail Tren Kehadiran</Text>
        <TouchableOpacity style={styles.closeButton} onPress={navigation.goBack}>
          <Text style={styles.closeButtonText}>Tutup</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.chartWrapper}>
          <ChildAttendanceLineChart
            data={chartData}
            contentInset={contentInset}
            gradientId={gradientId}
            mode="fullscreen"
            containerStyle={styles.chartContainer}
            {...chartProps}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default ChartFullScreenScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  chartWrapper: {
    flexGrow: 1,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
  },
});
