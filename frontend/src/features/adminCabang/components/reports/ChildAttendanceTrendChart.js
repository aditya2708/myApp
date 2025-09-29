import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Rect, Text as SvgText, Circle, Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const parseNumericValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const normalized = trimmed
      .replace(/%/g, '')
      .replace(/[^0-9,.-]/g, '')
      .replace(',', '.');

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = parseNumericValue(item);
      if (parsed !== null) {
        return parsed;
      }
    }
    return null;
  }

  if (typeof value === 'object') {
    const candidate =
      value.value ??
      value.percentage ??
      value.percent ??
      value.count ??
      value.total ??
      null;

    return candidate !== null ? parseNumericValue(candidate) : null;
  }

  return null;
};

const normalizeMonthlyDataset = (monthlyData) => {
  if (!monthlyData) {
    return [];
  }

  const entries = Array.isArray(monthlyData)
    ? monthlyData.map((value, index) => [String(index), value])
    : Object.entries(monthlyData);

  return entries
    .map(([key, rawValue], index) => {
      const item = rawValue && typeof rawValue === 'object' ? rawValue : { value: rawValue };

      const labelCandidate =
        item.month_name ??
        item.month ??
        item.label ??
        item.title ??
        item.name ??
        item.periode ??
        (typeof key === 'string' && key.trim() ? key : null);

      const totalActivities = parseNumericValue(
        item.activities_count ??
          item.total_activities ??
          item.totalActivity ??
          item.activities ??
          item.total ??
          item.jumlah ??
          item.jumlah_aktivitas ??
          null,
      );

      const totalAttended = parseNumericValue(
        item.attended_count ??
          item.total_attended ??
          item.attended ??
          item.hadir ??
          item.kehadiran ??
          item.present ??
          null,
      );

      let percentage = parseNumericValue(
        item.percentage ??
          item.attendance_percentage ??
          item.overall_percentage ??
          item.persentase ??
          item.percent ??
          item.percentage_value ??
          item.nilai ??
          item.value ??
          null,
      );

      if (
        (percentage === null || Number.isNaN(percentage)) &&
        totalActivities !== null &&
        totalActivities !== 0 &&
        totalAttended !== null
      ) {
        percentage = (totalAttended / totalActivities) * 100;
      }

      if (percentage === null || Number.isNaN(percentage)) {
        return null;
      }

      const clampedValue = Math.max(0, Math.min(100, Number(percentage)));

      return {
        key: String(key ?? index),
        label: labelCandidate || `Bulan ${index + 1}`,
        value: Math.round(clampedValue * 10) / 10,
        totalActivities,
        totalAttended,
      };
    })
    .filter(Boolean);
};

const ChildAttendanceTrendChart = ({
  monthlyData,
  type = 'line',
  height = 220,
  title = 'Tren Kehadiran Bulanan',
}) => {
  const dataset = useMemo(() => normalizeMonthlyDataset(monthlyData), [monthlyData]);

  const hasSufficientData = dataset.length >= 2;

  const chartWidth = width - 32;
  const chartHeight = height;
  const padding = 24;
  const graphWidth = chartWidth - padding * 2;
  const graphHeight = chartHeight - padding * 2;

  const maxValueInDataset = dataset.reduce((max, item) => Math.max(max, item.value), 0);
  const yAxisMax = Math.max(100, Math.ceil(maxValueInDataset / 10) * 10 || 100);
  const yAxisSteps = 4;
  const yAxisValues = Array.from({ length: yAxisSteps + 1 }, (_, idx) =>
    Math.round((yAxisMax / yAxisSteps) * idx),
  );

  const renderEmptyState = () => (
    <View style={[styles.chartWrapper, styles.emptyState]}>
      <Text style={styles.emptyText}>
        Data kehadiran bulanan belum mencukupi untuk menampilkan grafik.
      </Text>
    </View>
  );

  const renderBarChart = () => {
    const barWidth = dataset.length > 0 ? (graphWidth / dataset.length) * 0.6 : 0;
    const barSpacing = dataset.length > 0 ? (graphWidth / dataset.length) * 0.4 : 0;

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* Y-axis */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke="#d5dfe5"
          strokeWidth="1"
        />

        {/* X-axis */}
        <Line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="#d5dfe5"
          strokeWidth="1"
        />

        {/* Y-axis labels */}
        {yAxisValues.map((value, index) => {
          const y = chartHeight - padding - (value / yAxisMax) * graphHeight;
          return (
            <React.Fragment key={`y-label-${index}`}>
              <Line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke="#eef2f5"
                strokeWidth="1"
              />
              <SvgText
                x={padding - 10}
                y={y + 4}
                fontSize="10"
                fill="#7f8c8d"
                textAnchor="end"
              >
                {value}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Bars */}
        {dataset.map((item, index) => {
          const barHeight = (item.value / yAxisMax) * graphHeight;
          const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = chartHeight - padding - barHeight;

          return (
            <React.Fragment key={item.key || index}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#3498db"
                rx="6"
                ry="6"
              />

              <SvgText
                x={x + barWidth / 2}
                y={y - 6}
                fontSize="11"
                fill="#2c3e50"
                textAnchor="middle"
                fontWeight="600"
              >
                {item.value}%
              </SvgText>

              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - padding + 14}
                fontSize="10"
                fill="#7f8c8d"
                textAnchor="middle"
              >
                {item.label.length > 10 ? `${item.label.substring(0, 10)}…` : item.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    );
  };

  const renderLineChart = () => {
    const points = dataset.map((item, index) => {
      const denominator = Math.max(dataset.length - 1, 1);
      const x = padding + (index / denominator) * graphWidth;
      const y = chartHeight - padding - (item.value / yAxisMax) * graphHeight;
      return { ...item, x, y };
    });

    const pathData = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    return (
      <Svg width={chartWidth} height={chartHeight}>
        {/* Grid lines */}
        {yAxisValues.map((value, index) => {
          const y = chartHeight - padding - (value / yAxisMax) * graphHeight;
          return (
            <Line
              key={`grid-${index}`}
              x1={padding}
              y1={y}
              x2={chartWidth - padding}
              y2={y}
              stroke="#eef2f5"
              strokeWidth="1"
            />
          );
        })}

        {/* Y-axis */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke="#d5dfe5"
          strokeWidth="1"
        />

        {/* X-axis */}
        <Line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke="#d5dfe5"
          strokeWidth="1"
        />

        {/* Axis labels */}
        {yAxisValues.map((value, index) => {
          const y = chartHeight - padding - (value / yAxisMax) * graphHeight;
          return (
            <SvgText
              key={`y-axis-${index}`}
              x={padding - 10}
              y={y + 4}
              fontSize="10"
              fill="#7f8c8d"
              textAnchor="end"
            >
              {value}
            </SvgText>
          );
        })}

        {/* Line */}
        <Path d={pathData} stroke="#3498db" strokeWidth="2" fill="none" />

        {/* Points */}
        {points.map((point) => (
          <React.Fragment key={point.key}>
            <Circle cx={point.x} cy={point.y} r={4} fill="#3498db" />
            <SvgText
              x={point.x}
              y={point.y - 8}
              fontSize="11"
              fill="#2c3e50"
              textAnchor="middle"
              fontWeight="600"
            >
              {point.value}%
            </SvgText>
            <SvgText
              x={point.x}
              y={chartHeight - padding + 14}
              fontSize="10"
              fill="#7f8c8d"
              textAnchor="middle"
            >
              {point.label.length > 10 ? `${point.label.substring(0, 10)}…` : point.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {!hasSufficientData ? (
        renderEmptyState()
      ) : (
        <View style={styles.chartWrapper}>
          {type === 'bar' ? renderBarChart() : renderLineChart()}
        </View>
      )}
      {hasSufficientData ? (
        <Text style={styles.caption}>Persentase kehadiran setiap bulan (0-100%).</Text>
      ) : null}
    </View>
  );
};

export default ChildAttendanceTrendChart;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  chartWrapper: {
    height: 220,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  caption: {
    marginTop: 12,
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
  },
});
