import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';

const renderMetricCell = (count, percentage, accentStyle) => {
  const hasPercentage = percentage !== null && percentage !== undefined;
  const displayCount =
    typeof count === 'number' ? count.toLocaleString('id-ID') : count ?? '-';

  return (
    <View style={styles.metricCellContent}>
      <Text style={[styles.metricValue, accentStyle]}>{displayCount}</Text>
      {hasPercentage ? (
        <Text style={styles.metricPercentage}>
          {(() => {
            const numericValue = Number(percentage);

            if (Number.isFinite(numericValue)) {
              return `${numericValue.toFixed(1)}%`;
            }

            return String(percentage).includes('%') ? String(percentage) : `${percentage}%`;
          })()}
        </Text>
      ) : null}
    </View>
  );
};

const ShelterAttendanceTable = ({ data, isLoading, error, onRetry, onRowPress }) => {
  if (isLoading) {
    return (
      <View style={[styles.feedbackState, styles.loadingState]}>
        <ActivityIndicator size="small" color="#0984e3" />
        <Text style={styles.feedbackText}>Memuat rekap kehadiran shelter...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.feedbackState, styles.errorState]}>
        <Text style={[styles.feedbackText, styles.errorText]}>{error}</Text>
        {onRetry ? (
          <TouchableOpacity onPress={onRetry} style={styles.retryButton} activeOpacity={0.7}>
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Belum ada data shelter</Text>
        <Text style={styles.emptyDescription}>
          Data per shelter akan muncul di sini setelah integrasi selesai.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.headerCell, styles.flex2]}>Shelter</Text>
        <Text style={[styles.cell, styles.headerCell]}>Hadir</Text>
        <Text style={[styles.cell, styles.headerCell]}>Terlambat</Text>
        <Text style={[styles.cell, styles.headerCell]}>Alpa</Text>
        <Text style={[styles.cell, styles.headerCell]}>Verifikasi</Text>
      </View>

      {data.map((item, index) => {
        const presentCount = item?.present?.count ?? item?.presentCount ?? item?.present ?? '-';
        const presentPercentage =
          item?.present?.percentage ?? item?.presentPercentage ?? item?.present_rate ?? null;

        const lateCount = item?.late?.count ?? item?.lateCount ?? item?.late ?? '-';
        const latePercentage =
          item?.late?.percentage ?? item?.latePercentage ?? item?.late_rate ?? null;

        const absentCount = item?.absent?.count ?? item?.absentCount ?? item?.absent ?? '-';
        const absentPercentage =
          item?.absent?.percentage ?? item?.absentPercentage ?? item?.absent_rate ?? null;

        const verification = item?.verification ?? {};
        const verified = verification?.verified ?? item?.verified ?? 0;
        const pending = verification?.pending ?? item?.pending ?? 0;
        const rejected = verification?.rejected ?? item?.rejected ?? 0;
        const verificationTotal = verification?.total ?? item?.verificationTotal ?? null;

        const formatVerificationCount = (value) =>
          typeof value === 'number' ? value.toLocaleString('id-ID') : value ?? '-';

        const verificationTotalLabel = (() => {
          if (verificationTotal === null || verificationTotal === undefined) {
            return 'Verifikasi';
          }

          const formattedTotal =
            typeof verificationTotal === 'number'
              ? verificationTotal.toLocaleString('id-ID')
              : verificationTotal;

          return `${formattedTotal} total`;
        })();

        const handlePress = () => {
          if (typeof onRowPress === 'function') {
            onRowPress(item);
          }
        };

        return (
          <TouchableOpacity
            key={item.id || index}
            style={styles.row}
            onPress={handlePress}
            activeOpacity={0.75}
          >
            <View style={[styles.cell, styles.flex2]}>
              <Text style={styles.shelterName}>{item.name || 'Nama Shelter'}</Text>
              {item.wilbin ? <Text style={styles.shelterWilbin}>{item.wilbin}</Text> : null}
              {typeof item.attendanceRate === 'number' ? (
                <Text style={styles.shelterSubtitle}>{`${item.attendanceRate.toFixed(1)}% rata-rata kehadiran`}</Text>
              ) : null}
            </View>
            <View style={styles.cell}>{renderMetricCell(presentCount, presentPercentage, styles.presentValue)}</View>
            <View style={styles.cell}>{renderMetricCell(lateCount, latePercentage, styles.lateValue)}</View>
            <View style={styles.cell}>{renderMetricCell(absentCount, absentPercentage, styles.absentValue)}</View>
            <View style={[styles.cell, styles.verificationCell]}>
              <Text style={styles.verificationTotal}>{verificationTotalLabel}</Text>
              <View style={styles.verificationSummary}>
                <Text style={[styles.verificationBadge, styles.verificationBadgeFirst, styles.verifiedBadge]}>
                  V {formatVerificationCount(verified)}
                </Text>
                <Text style={[styles.verificationBadge, styles.pendingBadge]}>
                  P {formatVerificationCount(pending)}
                </Text>
                <Text style={[styles.verificationBadge, styles.rejectedBadge]}>
                  R {formatVerificationCount(rejected)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

ShelterAttendanceTable.defaultProps = {
  data: [],
  isLoading: false,
  error: null,
  onRetry: undefined,
  onRowPress: undefined,
};

const styles = StyleSheet.create({
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ecf0f1',
  },
  headerRow: {
    backgroundColor: '#f1f2f6',
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#2d3436',
  },
  headerCell: {
    fontWeight: '600',
  },
  flex2: {
    flex: 2,
  },
  shelterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  shelterWilbin: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  shelterSubtitle: {
    fontSize: 11,
    color: '#636e72',
    marginTop: 4,
  },
  metricCellContent: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  metricPercentage: {
    fontSize: 11,
    color: '#636e72',
    marginTop: 2,
  },
  presentValue: {
    color: '#00b894',
  },
  lateValue: {
    color: '#e1b12c',
  },
  absentValue: {
    color: '#d63031',
  },
  verificationCell: {
    alignItems: 'flex-end',
  },
  verificationTotal: {
    fontSize: 11,
    color: '#636e72',
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  verificationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 999,
    overflow: 'hidden',
    color: '#ffffff',
    marginLeft: 6,
  },
  verificationBadgeFirst: {
    marginLeft: 0,
  },
  verifiedBadge: {
    backgroundColor: '#00b894',
  },
  pendingBadge: {
    backgroundColor: '#e1b12c',
  },
  rejectedBadge: {
    backgroundColor: '#d63031',
  },
  emptyState: {
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#636e72',
  },
  feedbackState: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {},
  feedbackText: {
    fontSize: 13,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 12,
  },
  errorState: {},
  errorText: {
    color: '#d63031',
  },
  retryButton: {
    backgroundColor: '#0984e3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ShelterAttendanceTable;
