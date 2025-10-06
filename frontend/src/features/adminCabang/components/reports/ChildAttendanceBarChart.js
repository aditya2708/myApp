import React, { memo, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { BarChart, XAxis, YAxis } from 'react-native-svg-charts';
import { Text as SvgText } from 'react-native-svg';

const DEFAULT_CONTENT_INSET = { top: 16, bottom: 16, left: 12, right: 16 };
const MODE_STYLES = {
  compact: {
    itemHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    chartWidth: 280,
    categoryAxisWidth: 160,
    minChartHeight: 220,
  },
  fullscreen: {
    itemHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 16,
    chartWidth: 360,
    categoryAxisWidth: 200,
    minChartHeight: 320,
  },
};

const DEFAULT_MAX_ITEMS = 5;
const COMPACT_LABEL_MAX_LENGTH = 12;
const FULLSCREEN_LABEL_MAX_LENGTH = 20;

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

const Labels = ({ x, y, bandwidth, data, chartWidth }) =>
  data.map((item, index) => {
    const value = Number(item?.value ?? item ?? 0);
    if (!Number.isFinite(value)) {
      return null;
    }

    const valueX = x(value);
    const valueY = y(index) + bandwidth / 2;
    const isValueLarge = valueX > chartWidth * 0.7;
    const textAnchor = isValueLarge ? 'end' : 'start';
    const horizontalOffset = isValueLarge ? -8 : 8;

    return (
      <SvgText
        key={`label-${index}`}
        x={valueX + horizontalOffset}
        y={valueY}
        fontSize={12}
        fill="#1f2937"
        alignmentBaseline="middle"
        textAnchor={textAnchor}
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
    if (!isCompactMode) {
      return normalizedData;
    }

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

  const {
    itemHeight,
    paddingHorizontal,
    paddingVertical,
    chartWidth: baseChartWidth,
    categoryAxisWidth,
    minChartHeight,
  } = MODE_STYLES[mode] || MODE_STYLES.compact;

  const chartHeight = Math.max((effectiveData.length || 1) * itemHeight, minChartHeight);
  const chartWidth = Math.max(baseChartWidth, 220);
  const totalHeight = chartHeight + paddingVertical * 2 + 48;
  const yAxisData = useMemo(
    () => (effectiveData.length > 0 ? effectiveData.map((_, index) => index + 1) : [0]),
    [effectiveData]
  );
  const maxValue = useMemo(
    () => (values.length > 0 ? Math.max(...values.map((value) => Number(value) || 0)) : 0),
    [values]
  );

  const axisUpperBound = useMemo(() => {
    const safeMax = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 100;
    return Math.max(100, Math.ceil(safeMax / 10) * 10);
  }, [maxValue]);

  const xAxisTicks = useMemo(() => {
    const step = axisUpperBound / 5;
    return Array.from({ length: 6 }, (_, index) => Number((index * step).toFixed(0)));
  }, [axisUpperBound]);

  return (
    <View style={[containerStyle, { minHeight: totalHeight }]}>
      <ScrollView
        showsVerticalScrollIndicator={mode === 'fullscreen'}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal, paddingVertical, minWidth: categoryAxisWidth + chartWidth + 24 },
        ]}
        accessibilityRole={canOpenFullScreen ? 'button' : undefined}
        accessibilityHint={canOpenFullScreen ? 'Buka tampilan grafik layar penuh' : undefined}
        onAccessibilityTap={canOpenFullScreen ? onOpenFullScreen : undefined}
      >
        <View
          style={[
            styles.chartWrapper,
            { width: categoryAxisWidth + chartWidth, minHeight: chartHeight },
          ]}
        >
          <View style={styles.chartRow}>
            <YAxis
              style={[styles.yAxis, { width: categoryAxisWidth, height: chartHeight }]}
              data={yAxisData}
              contentInset={contentInset}
              numberOfTicks={effectiveData.length || 1}
              svg={{ fill: '#1f2937', fontSize: 12 }}
              formatLabel={(value, index) => displayCategories[index] ?? ''}
            />
            <View>
              <BarChart
                style={{ height: chartHeight, width: chartWidth }}
                data={chartData}
                yAccessor={({ item }) => item.value}
                contentInset={contentInset}
                spacingInner={0.3}
                spacingOuter={0.2}
                yMax={axisUpperBound}
                horizontal
              >
                <Labels chartWidth={chartWidth} />
              </BarChart>
              <XAxis
                style={[styles.xAxis, { width: chartWidth, marginLeft: categoryAxisWidth }]}
                data={xAxisTicks}
                contentInset={{ left: contentInset.left ?? 0, right: contentInset.right ?? 0 }}
                numberOfTicks={xAxisTicks.length}
                svg={{ fontSize: 12, fill: '#4b5563' }}
                formatLabel={(value) => `${value}%`}
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
    flexGrow: 1,
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
    marginRight: 12,
  },
  xAxis: {
    marginTop: 12,
  },
});
