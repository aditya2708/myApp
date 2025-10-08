import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const clampPercentage = (value) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }

  if (numeric >= 100) {
    return 100;
  }

  return numeric;
};

const AttendanceProgressBar = ({
  label,
  count,
  percentage,
  color,
  icon,
  backgroundColor,
  showCount,
  showPercentage,
}) => {
  const normalizedPercentage = useMemo(() => clampPercentage(percentage), [percentage]);
  const formattedPercentage = useMemo(
    () => `${normalizedPercentage.toFixed(normalizedPercentage % 1 === 0 ? 0 : 1)}%`,
    [normalizedPercentage]
  );

  return (
    <View style={[styles.container, backgroundColor ? { backgroundColor } : null]}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          {icon ? <Ionicons name={icon} size={16} color={color} style={styles.icon} /> : null}
          <Text style={styles.label}>{label}</Text>
        </View>
        {showPercentage ? <Text style={[styles.percentage, { color }]}>{formattedPercentage}</Text> : null}
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${normalizedPercentage}%`, backgroundColor: color }]} />
      </View>
      {showCount && typeof count === 'number' ? (
        <Text style={styles.countText}>{count.toLocaleString('id-ID')} anak</Text>
      ) : null}
    </View>
  );
};

AttendanceProgressBar.defaultProps = {
  count: null,
  percentage: 0,
  color: '#0984e3',
  icon: null,
  backgroundColor: 'rgba(9, 132, 227, 0.08)',
  showCount: true,
  showPercentage: true,
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  percentage: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(189, 195, 199, 0.3)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  countText: {
    marginTop: 8,
    fontSize: 12,
    color: '#636e72',
    fontWeight: '500',
  },
});

export default AttendanceProgressBar;
