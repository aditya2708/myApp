import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart, Grid, XAxis, YAxis } from 'react-native-svg-charts';
import { Defs, LinearGradient, Stop, Circle, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import * as shape from 'd3-shape';

const DEFAULT_DATA = [50, 80, 45, 60, 70, 90, 100, 85, 75, 65, 55, 95];
const DEFAULT_CONTENT_INSET = { top: 20, bottom: 20 };
const PRIMARY_BLUE = '#2563eb';
const Y_AXIS_WIDTH = 44;
const MODE_STYLES = {
  compact: { height: 180, paddingHorizontal: 16 },
  fullscreen: { height: 260, paddingHorizontal: 24 },
};
const MONTH_LABELS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const Decorator = ({ x, y, data }) =>
  data.map((value, index) => (
    <Circle
      key={`decorator-${index}`}
      cx={x(index)}
      cy={y(value)}
      r={4}
      stroke={PRIMARY_BLUE}
      strokeWidth={2}
      fill="#ffffff"
    />
  ));

const Labels = ({ x, y, data }) =>
  data.map((value, index) => (
    <SvgText
      key={`label-${index}`}
      x={x(index)}
      y={y(value) - 10}
      fontSize={12}
      fill={PRIMARY_BLUE}
      alignmentBaseline="middle"
      textAnchor="middle"
    >
      {`${value}%`}
    </SvgText>
  ));

const ChildAttendanceLineChart = ({
  data = DEFAULT_DATA,
  style,
  containerStyle,
  contentInset = DEFAULT_CONTENT_INSET,
  svgProps,
  gridProps,
  gradientId = 'childAttendanceGradient',
  children,
  mode = 'compact',
  year,
  onOpenFullScreen,
  showAllMonthLabels = false,
  compactLabelStep = 3,
  ...rest
}) => {
  const navigation = useNavigation();
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data)) {
      return DEFAULT_DATA;
    }

    if (data.length === 0) {
      return [];
    }

    if (typeof data[0] === 'object' && data[0] !== null) {
      return data.map((item) => Number(item?.value) || 0);
    }

    return data.map((value) => Number(value) || 0);
  }, [data]);
  const hasCustomLabels = useMemo(
    () => Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null,
    [data],
  );
  const xAxisLabels = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return MONTH_LABELS;
    }

    if (typeof data[0] === 'object' && data[0] !== null) {
      return data.map((item) => item?.shelter ?? '');
    }

    return MONTH_LABELS;
  }, [data]);
  const { height, paddingHorizontal } = useMemo(
    () => MODE_STYLES[mode] || MODE_STYLES.compact,
    [mode]
  );

  const isPressable = mode === 'compact';

  const chartTitle = useMemo(
    () => `Tren Kehadiran Bulanan${year ? ` ${year}` : ''}`,
    [year]
  );

  const handlePress = useCallback(() => {
    if (!isPressable) {
      return;
    }

    if (typeof onOpenFullScreen === 'function') {
      onOpenFullScreen(data, year, contentInset);
      return;
    }

    navigation.navigate('ChartFullScreen', {
      data,
      contentInset,
      gradientId,
      mode,
      year,
    });
  }, [contentInset, data, gradientId, isPressable, mode, navigation, onOpenFullScreen, year]);

  const chartWidth = useMemo(() => {
    const dataLength = Array.isArray(normalizedData) ? normalizedData.length : 0;
    return Math.max(dataLength * 60, 240);
  }, [normalizedData]);

  const lineSvg = useMemo(
    () => ({ stroke: PRIMARY_BLUE, strokeWidth: 2, fill: `url(#${gradientId})`, ...(svgProps || {}) }),
    [gradientId, svgProps]
  );

  const combinedChartStyle = useMemo(() => {
    const styleArray = Array.isArray(style) ? style : style ? [style] : [];
    return [{ height, width: chartWidth }, ...styleArray];
  }, [chartWidth, height, style]);

  const shouldShowAllLabels = mode === 'fullscreen' || showAllMonthLabels || hasCustomLabels;
  const effectiveLabelStep = hasCustomLabels ? 1 : compactLabelStep;

  return (
    <View style={containerStyle}>
      <Text style={styles.title}>{chartTitle}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal }]}
      >
        <TouchableOpacity
          activeOpacity={isPressable ? 0.7 : 1}
          onPress={handlePress}
          disabled={!isPressable}
          style={[styles.chartWrapper, { width: chartWidth + Y_AXIS_WIDTH }]}
        >
          <View style={styles.chartRow}>
            <YAxis
              style={[styles.yAxis, { height }]}
              data={normalizedData}
              contentInset={contentInset}
              svg={{ fill: PRIMARY_BLUE, fontSize: 12 }}
              formatLabel={(value) => `${value}%`}
            />
            <LineChart
              style={combinedChartStyle}
              data={normalizedData}
              svg={lineSvg}
              contentInset={contentInset}
              curve={shape.curveMonotoneX}
              {...rest}
            >
              <Defs key="gradient">
                <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={PRIMARY_BLUE} stopOpacity={0.2} />
                  <Stop offset="100%" stopColor={PRIMARY_BLUE} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Grid {...gridProps} />
              <Decorator />
              <Labels />
              {children}
            </LineChart>
          </View>
          <XAxis
            style={[styles.xAxis, { marginLeft: Y_AXIS_WIDTH, width: chartWidth }]}
            data={normalizedData}
            formatLabel={(value, index) => {
              const label = xAxisLabels[index] ?? '';
              if (shouldShowAllLabels) {
                return label;
              }
              return index % effectiveLabelStep === 0 ? label : '';
            }}
            contentInset={contentInset}
            svg={{ fontSize: 12, fill: '#4a4a4a' }}
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default memo(ChildAttendanceLineChart);
export { DEFAULT_DATA };

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: PRIMARY_BLUE,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  chartWrapper: {
    flexGrow: 1,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  xAxis: {
    marginTop: 12,
  },
  yAxis: {
    width: Y_AXIS_WIDTH,
    marginRight: 8,
  },
});
