import React, { memo, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { BarChart, XAxis, YAxis } from 'react-native-svg-charts';
import { Text as SvgText } from 'react-native-svg';

const DEFAULT_CONTENT_INSET = { top: 16, bottom: 16 };
const Y_AXIS_WIDTH = 44;
const MODE_STYLES = {
  compact: { height: 200, paddingHorizontal: 16 },
  fullscreen: { height: 280, paddingHorizontal: 24 },
};

export const getAttendanceColor = (value) => {
  if (Number(value) > 90) {
    return '#16a34a';
  }

  if (Number(value) >= 80) {
    return '#facc15';
  }

  return '#dc2626';
};

const Labels = ({ x, y, bandwidth, data }) =>
  data.map((item, index) => {
    const value = Number(item?.value ?? item ?? 0);
    if (!Number.isFinite(value)) {
      return null;
    }

    return (
      <SvgText
        key={`label-${index}`}
        x={x(index) + bandwidth / 2}
        y={y(value) - 8}
        fontSize={12}
        fill="#1f2937"
        alignmentBaseline="baseline"
        textAnchor="middle"
      >
        {`${value}%`}
      </SvgText>
    );
  });

const ChildAttendanceBarChart = ({
  data = [],
  mode = 'compact',
  containerStyle,
  contentInset = DEFAULT_CONTENT_INSET,
  categories: categoriesProp,
}) => {
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((item) => ({
      shelter: typeof item?.shelter === 'string' ? item.shelter : '',
      value: Number(item?.value) || 0,
    }));
  }, [data]);

  const values = useMemo(() => normalizedData.map((item) => item.value), [normalizedData]);
  const categories = useMemo(() => {
    if (Array.isArray(categoriesProp) && categoriesProp.length > 0) {
      return categoriesProp.slice(0, normalizedData.length).map((category) => String(category ?? ''));
    }

    return normalizedData.map((item) => item.shelter || '');
  }, [categoriesProp, normalizedData]);

  const chartData = useMemo(
    () =>
      normalizedData.map((item) => ({
        value: item.value,
        svg: { fill: getAttendanceColor(item.value) },
      })),
    [normalizedData]
  );

  const { height, paddingHorizontal } = MODE_STYLES[mode] || MODE_STYLES.compact;
  const chartWidth = Math.max((normalizedData.length || 1) * 60, 240);
  const rotation = mode === 'fullscreen' ? -30 : -45;

  return (
    <View style={containerStyle}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal }]}
      >
        <View style={[styles.chartWrapper, { width: chartWidth + Y_AXIS_WIDTH }]}
        >
          <View style={styles.chartRow}>
            <YAxis
              style={[styles.yAxis, { height }]}
              data={values.length > 0 ? values : [0]}
              contentInset={contentInset}
              svg={{ fill: '#2563eb', fontSize: 12 }}
              formatLabel={(value) => `${value}%`}
            />
            <View>
              <BarChart
                style={{ height, width: chartWidth }}
                data={chartData}
                yAccessor={({ item }) => item.value}
                contentInset={contentInset}
                spacingInner={0.3}
                spacingOuter={0.2}
              >
                <Labels />
              </BarChart>
              <XAxis
                style={[styles.xAxis, { width: chartWidth }]}
                data={values.length > 0 ? values : [0]}
                formatLabel={(value, index) => categories[index] ?? ''}
                svg={{
                  fontSize: 12,
                  fill: '#4b5563',
                  rotation,
                  originY: 12,
                  y: 12,
                  textAnchor: 'end',
                }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default memo(ChildAttendanceBarChart);

const styles = StyleSheet.create({
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
  yAxis: {
    width: Y_AXIS_WIDTH,
    marginRight: 8,
  },
  xAxis: {
    marginTop: 16,
  },
});
