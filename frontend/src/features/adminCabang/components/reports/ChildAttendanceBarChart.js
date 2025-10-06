import React, { memo, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Svg, { G, Line, Path, Text as SvgText } from 'react-native-svg';

const DEFAULT_CONTENT_INSET = { top: 16, bottom: 16 };
const Y_AXIS_WIDTH = 44;
const MODE_STYLES = {
  compact: { height: 200, paddingHorizontal: 16, xAxisHeight: 140, rotation: -45, chartPadding: 40 },
  fullscreen: { height: 280, paddingHorizontal: 24, xAxisHeight: 160, rotation: -45, chartPadding: 60 },
};

const DEFAULT_MAX_ITEMS = 5;
const COMPACT_LABEL_MAX_LENGTH = 12;
const DEFAULT_TICKS = [0, 25, 50, 75, 100];
const DEFAULT_TICK_COUNT = 4;
const BAR_CORNER_RADIUS = 8;

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

const niceNumber = (value, round = false) => {
  if (!Number.isFinite(value) || value === 0) {
    return 0;
  }

  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const fraction = Math.abs(value) / Math.pow(10, exponent);
  let niceFraction;

  if (round) {
    if (fraction < 1.5) {
      niceFraction = 1;
    } else if (fraction < 3) {
      niceFraction = 2;
    } else if (fraction < 7) {
      niceFraction = 5;
    } else {
      niceFraction = 10;
    }
  } else {
    if (fraction <= 1) {
      niceFraction = 1;
    } else if (fraction <= 2) {
      niceFraction = 2;
    } else if (fraction <= 5) {
      niceFraction = 5;
    } else {
      niceFraction = 10;
    }
  }

  return niceFraction * Math.pow(10, exponent);
};

const buildYAxisTicks = (maxValue, desiredTickCount = DEFAULT_TICK_COUNT) => {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return {
      max: DEFAULT_TICKS[DEFAULT_TICKS.length - 1],
      ticks: DEFAULT_TICKS,
    };
  }

  const step = niceNumber(maxValue / desiredTickCount, true) || 1;
  const requiredTickCount = Math.max(desiredTickCount, Math.ceil(maxValue / step));
  const ticks = Array.from({ length: requiredTickCount + 1 }, (_, index) => Number((step * index).toFixed(6)));
  const lastTick = ticks[ticks.length - 1];

  return {
    max: Number.isFinite(lastTick) && lastTick > 0 ? lastTick : step * desiredTickCount,
    ticks,
  };
};

const createRoundedTopRectPath = (x, y, width, height, radius) => {
  if (height <= 0 || width <= 0) {
    return '';
  }

  const effectiveRadius = Math.min(radius, width / 2, height);
  const right = x + width;
  const bottom = y + height;

  return [
    `M${x} ${bottom}`,
    `V${y + effectiveRadius}`,
    `A${effectiveRadius} ${effectiveRadius} 0 0 1 ${x + effectiveRadius} ${y}`,
    `H${right - effectiveRadius}`,
    `A${effectiveRadius} ${effectiveRadius} 0 0 1 ${right} ${y + effectiveRadius}`,
    `V${bottom}`,
    'Z',
  ].join(' ');
};

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

  const displayCategories = useMemo(() => {
    return effectiveData.map((item) => {
      const label = item.category || item.shelter || '';

      if (!isCompactMode) {
        return label;
      }

      return truncateLabel(label, COMPACT_LABEL_MAX_LENGTH);
    });
  }, [effectiveData, isCompactMode]);

  const values = useMemo(() => effectiveData.map((item) => Number(item.value) || 0), [effectiveData]);
  const maxValue = useMemo(() => (values.length > 0 ? Math.max(...values) : 0), [values]);
  const { max: yDomainMax, ticks: yTicks } = useMemo(() => buildYAxisTicks(maxValue), [maxValue]);

  const { height, paddingHorizontal, xAxisHeight, rotation, chartPadding } =
    MODE_STYLES[mode] || MODE_STYLES.compact;
  const itemWidth = isCompactMode ? 60 : 88;
  const minWidth = isCompactMode ? 240 : 360;
  const chartWidth = Math.max((effectiveData.length || 1) * itemWidth, minWidth);
  const resolvedRotation = typeof rotation === 'number' ? rotation : -45;
  const resolvedXAxisHeight = Number.isFinite(xAxisHeight) ? xAxisHeight : isCompactMode ? 140 : 160;
  const resolvedChartPadding = chartPadding || 40;
  const topInset = Number.isFinite(contentInset?.top) ? Number(contentInset.top) : DEFAULT_CONTENT_INSET.top;
  const bottomInset = Number.isFinite(contentInset?.bottom)
    ? Number(contentInset.bottom)
    : DEFAULT_CONTENT_INSET.bottom;

  const svgWidth = chartWidth + Y_AXIS_WIDTH;
  const svgHeight = height + resolvedXAxisHeight;
  const chartTop = topInset;
  const chartBottom = height - bottomInset;
  const chartInnerHeight = Math.max(chartBottom - chartTop, 1);
  const safeDomainMax = yDomainMax > 0 ? yDomainMax : 1;
  const barWidth = itemWidth * 0.5;
  const barOffset = (itemWidth - barWidth) / 2;
  const axisLineColor = '#d1d5db';
  const gridLineColor = '#e5e7eb';
  const tickColor = '#9ca3af';

  const getBarY = (value) => {
    const clampedValue = Math.max(0, Number(value) || 0);
    const ratio = clampedValue / safeDomainMax;
    return chartBottom - ratio * chartInnerHeight;
  };

  const labelYPosition = (value) => {
    const barTop = getBarY(value);
    return Math.max(barTop - 8, chartTop + 12);
  };

  return (
    <View style={[containerStyle, { minHeight: svgHeight + 24 }]}> 
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={mode === 'fullscreen'}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal,
            paddingLeft: paddingHorizontal + resolvedChartPadding,
            paddingRight: paddingHorizontal + resolvedChartPadding,
          },
        ]}
        accessibilityRole={canOpenFullScreen ? 'button' : undefined}
        accessibilityHint={canOpenFullScreen ? 'Buka tampilan grafik layar penuh' : undefined}
        onAccessibilityTap={canOpenFullScreen ? onOpenFullScreen : undefined}
      >
        <View style={[styles.chartWrapper, { width: svgWidth }]}>
          <Svg width={svgWidth} height={svgHeight}>
            <G>
              {/* Horizontal grid lines and labels */}
              {yTicks.map((tick) => {
                const rawY = getBarY(tick);
                const y = Math.min(Math.max(rawY, chartTop), chartBottom);

                return (
                  <G key={`y-tick-${tick}`}>
                    <Line x1={Y_AXIS_WIDTH} y1={y} x2={Y_AXIS_WIDTH + chartWidth} y2={y} stroke={gridLineColor} strokeWidth={1} />
                    <SvgText
                      x={Y_AXIS_WIDTH - 8}
                      y={y}
                      fill="#4b5563"
                      fontSize={12}
                      alignmentBaseline="middle"
                      textAnchor="end"
                    >
                      {formatPercentage(tick)}
                    </SvgText>
                  </G>
                );
              })}

              {/* Vertical axis line */}
              <Line x1={Y_AXIS_WIDTH} y1={chartTop} x2={Y_AXIS_WIDTH} y2={chartBottom} stroke={axisLineColor} strokeWidth={1} />

              {/* X-axis baseline */}
              <Line
                x1={Y_AXIS_WIDTH}
                y1={chartBottom}
                x2={Y_AXIS_WIDTH + chartWidth}
                y2={chartBottom}
                stroke={axisLineColor}
                strokeWidth={1}
              />

              {/* Bars */}
              {effectiveData.map((item, index) => {
                const barX = Y_AXIS_WIDTH + index * itemWidth + barOffset;
                const barY = getBarY(item.value);
                const barHeight = chartBottom - barY;
                const shouldRenderBar = barHeight > 0;
                const path = shouldRenderBar
                  ? createRoundedTopRectPath(barX, barY, barWidth, barHeight, BAR_CORNER_RADIUS)
                  : '';

                return (
                  <G key={`bar-${index}`}>
                    {shouldRenderBar && path ? (
                      <Path d={path} fill={getAttendanceColor(item.value)} />
                    ) : null}
                    <SvgText
                      x={barX + barWidth / 2}
                      y={labelYPosition(item.value)}
                      fill="#1f2937"
                      fontSize={12}
                      textAnchor="middle"
                    >
                      {formatPercentage(item.value)}
                    </SvgText>
                  </G>
                );
              })}

              {/* X-axis ticks */}
              {effectiveData.map((_, index) => {
                const tickX = Y_AXIS_WIDTH + index * itemWidth + barOffset + barWidth / 2;

                return (
                  <Line
                    key={`x-tick-${index}`}
                    x1={tickX}
                    y1={chartBottom}
                    x2={tickX}
                    y2={chartBottom + 8}
                    stroke={tickColor}
                    strokeWidth={1}
                  />
                );
              })}

              {/* Category labels */}
              {displayCategories.map((label, index) => {
                const labelX = Y_AXIS_WIDTH + index * itemWidth + barOffset + barWidth / 2;
                const labelY = chartBottom + 20;

                return (
                  <SvgText
                    key={`x-label-${index}`}
                    x={labelX}
                    y={labelY}
                    fill="#4b5563"
                    fontSize={11}
                    textAnchor="end"
                    transform={`rotate(${resolvedRotation}, ${labelX}, ${labelY})`}
                  >
                    {label}
                  </SvgText>
                );
              })}
            </G>
          </Svg>
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
});
