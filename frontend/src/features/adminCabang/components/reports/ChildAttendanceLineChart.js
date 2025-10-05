import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LineChart, Grid, XAxis } from 'react-native-svg-charts';
import { Defs, LinearGradient, Stop, Circle, Text as SvgText } from 'react-native-svg';

const DEFAULT_DATA = [50, 80, 45, 60, 70, 90, 100];
const DEFAULT_CONTENT_INSET = { top: 20, bottom: 20 };
const MODE_STYLES = {
  compact: { height: 180, paddingHorizontal: 16 },
  fullscreen: { height: 260, paddingHorizontal: 24 },
};
const LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul'];

const Decorator = ({ x, y, data }) =>
  data.map((value, index) => (
    <Circle
      key={`decorator-${index}`}
      cx={x(index)}
      cy={y(value)}
      r={4}
      stroke="#4a90e2"
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
      fill="#4a90e2"
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
  ...rest
}) => {
  const { height, paddingHorizontal } = useMemo(
    () => MODE_STYLES[mode] || MODE_STYLES.compact,
    [mode]
  );

  const lineSvg = useMemo(
    () => ({ stroke: '#4a90e2', strokeWidth: 2, fill: `url(#${gradientId})`, ...(svgProps || {}) }),
    [gradientId, svgProps]
  );

  const combinedChartStyle = useMemo(() => {
    const styleArray = Array.isArray(style) ? style : style ? [style] : [];
    return [{ height }, ...styleArray];
  }, [height, style]);

  const chartWidth = useMemo(() => {
    const dataLength = Array.isArray(data) ? data.length : 0;
    return Math.max(dataLength * 60, 240);
  }, [data]);

  return (
    <View style={containerStyle}>
      <Text style={styles.title}>Tren Kehadiran Bulanan</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal }]}
      >
        <View style={[styles.chartWrapper, { width: chartWidth }]}>
          <LineChart
            style={combinedChartStyle}
            data={data}
            svg={lineSvg}
            contentInset={contentInset}
            {...rest}
          >
            <Defs key="gradient">
              <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#4a90e2" stopOpacity={0.2} />
                <Stop offset="100%" stopColor="#4a90e2" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Grid {...gridProps} />
            <Decorator />
            <Labels />
            {children}
          </LineChart>
          <XAxis
            style={styles.xAxis}
            data={data}
            formatLabel={(value, index) => {
              const label = LABELS[index] ?? '';
              if (mode === 'fullscreen') {
                return label;
              }
              return index % 3 === 0 ? label : '';
            }}
            contentInset={contentInset}
            svg={{ fontSize: 12, fill: '#4a4a4a' }}
          />
        </View>
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
    color: '#1f2937',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  chartWrapper: {
    flexGrow: 1,
  },
  xAxis: {
    marginTop: 12,
  },
});
