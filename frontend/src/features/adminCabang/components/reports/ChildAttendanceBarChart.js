import React, { memo, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { BarChart, XAxis, YAxis } from 'react-native-svg-charts';
import { Text as SvgText } from 'react-native-svg';

const DEFAULT_CONTENT_INSET = { top: 16, bottom: 16 };
const Y_AXIS_WIDTH = 44;
const MODE_STYLES = {
  compact: { height: 200, paddingHorizontal: 16, xAxisHeight: 140, rotation: -45, chartPadding: 40 },
  fullscreen: { height: 280, paddingHorizontal: 24, xAxisHeight: 160, rotation: -45, chartPadding: 60 },
};

const DEFAULT_MAX_ITEMS = 5;
const COMPACT_LABEL_MAX_LENGTH = 12;

const ATTENDANCE_ACTIVE_COLOR = '#2563eb';
const ATTENDANCE_INACTIVE_COLOR = '#9ca3af';

export const getAttendanceColor = (value) =>
  Number(value) > 0 ? ATTENDANCE_ACTIVE_COLOR : ATTENDANCE_INACTIVE_COLOR;

const truncateLabel = (label, maxLength) => {
  if (typeof label !== 'string') {
    return '';
  }

  if (label.length <= maxLength) {
    return label;
  }

  return `${label.slice(0, Math.max(0, maxLength - 1))}…`;
};

const formatPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return '';
  }

  const rounded = Number.parseFloat(Number(value).toFixed(1));

  return `${rounded}%`;
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
        {formatPercentage(value)}
      </SvgText>
    );
  });

const ChildAttendanceBarChart = ({
  data = [],
  mode = 'compact',
  containerStyle,
  contentInset = DEFAULT_CONTENT_INSET,
  categories: categoriesProp,
  maxItems = DEFAULT_MAX_ITEMS,
  onOpenFullScreen,
}) => {
  const normalizedData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const resolvedCategories = Array.isArray(categoriesProp) ? categoriesProp : [];

    return data.map((item, index) => {
      const shelterName = typeof item?.shelter === 'string' ? item.shelter : '';
      const resolvedCategory = resolvedCategories[index];
      const categoryLabel =
        typeof resolvedCategory === 'string' || typeof resolvedCategory === 'number'
          ? String(resolvedCategory)
          : shelterName;

      return {
        shelter: shelterName,
        category: categoryLabel,
        value: Number(item?.value) || 0,
      };
    });
  }, [categoriesProp, data]);

  const isCompactMode = mode === 'compact';
  const canOpenFullScreen = typeof onOpenFullScreen === 'function';

  const effectiveData = useMemo(() => {
    // Di fullscreen mode, tampilkan SEMUA data tanpa batasan
    if (!isCompactMode) {
      return normalizedData;
    }

    // Di compact mode, batasi dan urutkan
    const sorted = [...normalizedData].sort((a, b) => Number(b.value) - Number(a.value));
    const limit = Number(maxItems);
    const hasValidLimit = Number.isFinite(limit) && limit > 0;

    if (!hasValidLimit) {
      return sorted;
    }

    return sorted.slice(0, limit);
  }, [isCompactMode, maxItems, normalizedData]);

  const values = useMemo(() => effectiveData.map((item) => item.value), [effectiveData]);

  const displayCategories = useMemo(() => {
    return effectiveData.map((item) => {
      const label = item.category || item.shelter || '';

      if (!isCompactMode) {
        return label;
      }

      return truncateLabel(label, COMPACT_LABEL_MAX_LENGTH);
    });
  }, [effectiveData, isCompactMode]);

  const chartData = useMemo(
    () =>
      effectiveData.map((item) => ({
        value: item.value,
        svg: { fill: getAttendanceColor(item.value) },
      })),
    [effectiveData]
  );

  const { height, paddingHorizontal, xAxisHeight, rotation, chartPadding } =
    MODE_STYLES[mode] || MODE_STYLES.compact;
  const itemWidth = isCompactMode ? 60 : 88;
  const minWidth = isCompactMode ? 240 : 360;
  const chartWidth = Math.max((effectiveData.length || 1) * itemWidth, minWidth);
  const resolvedRotation = typeof rotation === 'number' ? rotation : -45;
  const resolvedXAxisHeight = Number.isFinite(xAxisHeight) ? xAxisHeight : (isCompactMode ? 140 : 160);
  const resolvedChartPadding = chartPadding || 40;
  const totalHeight = height + resolvedXAxisHeight + 40;

  return (
    <View style={[containerStyle, { minHeight: totalHeight }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={mode === 'fullscreen'}
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            paddingHorizontal,
            paddingLeft: paddingHorizontal + resolvedChartPadding,
            paddingRight: paddingHorizontal + resolvedChartPadding,
          }
        ]}
        accessibilityRole={canOpenFullScreen ? 'button' : undefined}
        accessibilityHint={canOpenFullScreen ? 'Buka tampilan grafik layar penuh' : undefined}
        onAccessibilityTap={canOpenFullScreen ? onOpenFullScreen : undefined}
      >
        <View style={[styles.chartWrapper, { width: chartWidth + Y_AXIS_WIDTH }]}>
          <View style={styles.chartRow}>
            <YAxis
              style={[styles.yAxis, { height }]}
              data={values.length > 0 ? values : [0]}
              contentInset={contentInset}
              svg={{ fill: '#2563eb', fontSize: 12 }}
              formatLabel={formatPercentage}
            />
            <View>
              <BarChart
                style={{ height, width: chartWidth }}
                data={chartData}
                yAccessor={({ item }) => item.value}
                contentInset={contentInset}
                spacingInner={0.3}
                spacingOuter={0.4}
              >
                <Labels />
              </BarChart>
              <XAxis
                style={[styles.xAxis, { width: chartWidth, height: resolvedXAxisHeight }]}
                data={values.length > 0 ? values : [0]}
                formatLabel={(value, index) => displayCategories[index] ?? ''}
                svg={{
                  fontSize: 11,
                  fill: '#4b5563',
                  rotation: resolvedRotation,
                  originY: 0,
                  y: 20,
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
    paddingBottom: 12,
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
    marginTop: 8,
  },
});
