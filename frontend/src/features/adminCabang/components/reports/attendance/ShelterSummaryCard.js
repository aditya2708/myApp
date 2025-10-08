import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AttendanceProgressBar from './AttendanceProgressBar';

const formatNumber = (value, fallback = '-') => {
  if (typeof value === 'number') {
    return value.toLocaleString('id-ID');
  }

  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  return fallback;
};

const formatPercentage = (value, fallback = null) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
  }

  const stringValue = String(value);

  if (!stringValue.trim()) {
    return fallback;
  }

  return stringValue.includes('%') ? stringValue : `${stringValue}%`;
};

const ShelterSummaryCard = ({
  shelter,
  periodLabel,
  summary,
  isLoading,
  error,
  onRetry,
  style,
}) => {
  if (isLoading) {
    return (
      <View style={[styles.card, styles.centerContent, style]}>
        <ActivityIndicator color="#0984e3" />
        <Text style={styles.loadingText}>Memuat detail shelter...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.card, styles.centerContent, style]}>
        <Ionicons name="alert-circle" size={28} color="#e74c3c" />
        <Text style={styles.errorTitle}>Gagal memuat detail shelter</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        {typeof onRetry === 'function' ? (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.85}>
            <Ionicons name="refresh" size={16} color="#ffffff" />
            <Text style={styles.retryLabel}>Coba Lagi</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (!shelter) {
    return null;
  }

  const { name, code, wilbin, address, leader, totalChildren } = shelter;
  const attendanceRate = formatPercentage(summary?.attendanceRate);
  const wilbinLabel = (() => {
    if (!wilbin) {
      return null;
    }

    if (typeof wilbin === 'string') {
      return wilbin;
    }

    return wilbin?.name || wilbin?.label || wilbin?.title || null;
  })();

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.name}>{name || 'Shelter Tanpa Nama'}</Text>
          {periodLabel ? <Text style={styles.periodLabel}>{`Periode: ${periodLabel}`}</Text> : null}
        </View>
        {attendanceRate ? (
          <View style={styles.attendanceBadge}>
            <Text style={styles.attendanceLabel}>Kehadiran</Text>
            <Text style={styles.attendanceValue}>{attendanceRate}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        {code ? (
          <View style={styles.metaItem}>
            <Ionicons name="pricetag-outline" size={16} color="#636e72" />
            <Text style={styles.metaLabel}>{code}</Text>
          </View>
        ) : null}
        {wilbinLabel ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={16} color="#636e72" />
            <Text style={styles.metaLabel} numberOfLines={1}>
              {wilbinLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        {leader ? (
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color="#636e72" />
            <Text style={styles.metaLabel} numberOfLines={1}>
              {`Penanggung Jawab: ${leader}`}
            </Text>
          </View>
        ) : null}
        {typeof totalChildren === 'number' ? (
          <View style={styles.metaItem}>
            <Ionicons name="school-outline" size={16} color="#636e72" />
            <Text style={styles.metaLabel}>{`${formatNumber(totalChildren)} anak binaan`}</Text>
          </View>
        ) : null}
      </View>

      {address ? <Text style={styles.addressText}>{address}</Text> : null}

      <View style={styles.progressGroup}>
        <AttendanceProgressBar
          label="Hadir"
          count={summary?.present?.count}
          percentage={summary?.present?.percentage}
          color="#2ecc71"
          icon="checkmark-circle"
        />
        <AttendanceProgressBar
          label="Terlambat"
          count={summary?.late?.count}
          percentage={summary?.late?.percentage}
          color="#f1c40f"
          icon="time"
        />
        <AttendanceProgressBar
          label="Tidak Hadir"
          count={summary?.absent?.count}
          percentage={summary?.absent?.percentage}
          color="#e74c3c"
          icon="close-circle"
        />
      </View>
    </View>
  );
};

ShelterSummaryCard.defaultProps = {
  shelter: null,
  periodLabel: null,
  summary: null,
  isLoading: false,
  error: null,
  onRetry: undefined,
  style: null,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#636e72',
  },
  errorTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#d63031',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 6,
    fontSize: 13,
    color: '#636e72',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0984e3',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 18,
  },
  retryLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
  },
  periodLabel: {
    marginTop: 6,
    fontSize: 13,
    color: '#636e72',
  },
  attendanceBadge: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0984e3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  attendanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0984e3',
  },
  attendanceValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: '#0984e3',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 6,
  },
  metaLabel: {
    marginLeft: 6,
    fontSize: 13,
    color: '#636e72',
  },
  addressText: {
    marginTop: 8,
    fontSize: 12,
    color: '#636e72',
    lineHeight: 18,
  },
  progressGroup: {
    marginTop: 20,
  },
});

export default ShelterSummaryCard;
