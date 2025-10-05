import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import ChildAttendanceLineChart, {
  DEFAULT_DATA,
} from './ChildAttendanceLineChart';

const ChartFullScreenScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    year: routeYear,
    data: routeData,
    contentInset: routeContentInset,
    gradientId: routeGradientId,
    ...chartProps
  } = route.params || {};

  const year = routeYear ?? new Date().getFullYear();

  const chartData = useMemo(() => routeData ?? DEFAULT_DATA, [routeData]);

  const resolvedContentInset = useMemo(
    () => routeContentInset ?? undefined,
    [routeContentInset]
  );

  const resolvedGradientId = useMemo(
    () => routeGradientId ?? undefined,
    [routeGradientId]
  );

  const childChartProps = useMemo(() => {
    const props = { ...chartProps };

    if (resolvedContentInset) {
      props.contentInset = resolvedContentInset;
    }

    if (resolvedGradientId) {
      props.gradientId = resolvedGradientId;
    }

    props.year = year;

    return props;
  }, [chartProps, resolvedContentInset, resolvedGradientId, year]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Detail Tren Kehadiran</Text>
          <Text style={styles.subtitle}>{`Tahun ${year}`}</Text>
        </View>
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
            mode="fullscreen"
            showAllMonthLabels
            compactLabelStep={1}
            containerStyle={styles.chartContainer}
            {...childChartProps}
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
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
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
    paddingBottom: 24,
  },
  chartWrapper: {
    flexGrow: 1,
  },
  chartContainer: {
    backgroundColor: '#ffffff',
  },
});
