import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SummaryItem = ({ label, count, percentage, accentColor }) => {
  const countLabel =
    typeof count === 'number' ? count.toLocaleString('id-ID') : count ?? '-';
  const percentageLabel =
    typeof percentage === 'number' ? `${percentage}%` : percentage ?? null;

  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryCount, accentColor ? { color: accentColor } : null]}>
        {countLabel}
      </Text>
      {percentageLabel ? (
        <Text style={styles.summaryPercentage}>{percentageLabel}</Text>
      ) : null}
    </View>
  );
};

const StateMessage = ({ title, description, actionLabel, onAction, loading }) => (
  <View style={styles.stateContainer}>
    {loading ? (
      <ActivityIndicator size="small" color="#0984e3" style={styles.stateIndicator} />
    ) : null}
    {title ? <Text style={styles.stateTitle}>{title}</Text> : null}
    {description ? <Text style={styles.stateDescription}>{description}</Text> : null}
    {actionLabel && onAction ? (
      <TouchableOpacity onPress={onAction} style={styles.retryButton}>
        <Text style={styles.retryButtonLabel}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const WeeklyBreakdownList = ({ data, isLoading, error, onRetry }) => {
  if (isLoading) {
    return (
      <StateMessage
        loading
        title="Memuat rekap mingguan"
        description="Harap tunggu, kami sedang menyiapkan data terbaru."
      />
    );
  }

  if (error) {
    return (
      <StateMessage
        title="Gagal memuat data"
        description={error}
        actionLabel="Coba lagi"
        onAction={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <StateMessage
        title="Belum ada data mingguan"
        description="Ringkasan mingguan akan muncul di sini setelah data tersedia."
      />
    );
  }

  return (
    <View>
      {data.map((item, index) => {
        const attendanceRate =
          typeof item?.attendanceRate === 'number' ? `${item.attendanceRate}%` : '-';

        const weekLabel = item?.label || item?.weekLabel || `Minggu ${index + 1}`;
        const dateRangeLabel = item?.dates?.label ?? item?.dateRange ?? null;

        const present = item?.summary?.present ?? {};
        const late = item?.summary?.late ?? {};
        const absent = item?.summary?.absent ?? {};

        const pendingVerification = item?.verification?.pending ?? 0;
        const hasPendingVerification = Number(pendingVerification) > 0;

        const lateCount = Number.isFinite(late?.count) ? late.count : 0;
        const hasLate = lateCount > 0;

        const verifiedCount = item?.verification?.verified ?? 0;
        const totalVerification = item?.verification?.total ?? null;

        return (
          <View
            key={item?.id || `week-${index}`}
            style={[styles.item, index === data.length - 1 && styles.lastItem]}
          >
            <View style={styles.itemHeader}>
              <View style={styles.itemHeaderText}>
                <Text style={styles.itemTitle}>{weekLabel}</Text>
                {dateRangeLabel ? (
                  <Text style={styles.itemSubtitle}>{dateRangeLabel}</Text>
                ) : null}
              </View>
              <View style={styles.itemRateContainer}>
                <Text style={styles.itemRate}>{attendanceRate}</Text>
                <Text style={styles.itemRateCaption}>Rata-rata hadir</Text>
              </View>
            </View>

            {(hasLate || hasPendingVerification) && (
              <View style={styles.badgesRow}>
                {hasLate ? (
                  <View style={[styles.badge, styles.badgeLate]}>
                    <Text style={styles.badgeText}>{`${lateCount} terlambat`}</Text>
                  </View>
                ) : null}
                {hasPendingVerification ? (
                  <View style={[styles.badge, styles.badgePending]}>
                    <Text style={styles.badgeText}>{`${pendingVerification} pending`}</Text>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.summaryRow}>
              <SummaryItem
                label="Hadir"
                count={present?.count ?? '-'}
                percentage={present?.percentage}
                accentColor="#00b894"
              />
              <SummaryItem
                label="Terlambat"
                count={late?.count ?? '-'}
                percentage={late?.percentage}
                accentColor="#f39c12"
              />
              <SummaryItem
                label="Absen"
                count={absent?.count ?? '-'}
                percentage={absent?.percentage}
                accentColor="#d63031"
              />
            </View>

            <View style={styles.verificationRow}>
              <Text style={styles.verificationLabel}>Verifikasi</Text>
              <Text style={styles.verificationValue}>
                {`${verifiedCount} selesai`}
                {hasPendingVerification ? ` · ${pendingVerification} menunggu` : ''}
                {Number.isFinite(totalVerification) && totalVerification !== null
                  ? ` · ${totalVerification} total`
                  : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

WeeklyBreakdownList.defaultProps = {
  data: [],
  isLoading: false,
  error: null,
  onRetry: undefined,
};

const styles = StyleSheet.create({
  item: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dfe6e9',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  itemHeaderText: {
    flex: 1,
    paddingRight: 12,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
  },
  itemSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#636e72',
  },
  itemRateContainer: {
    alignItems: 'flex-end',
  },
  itemRate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00b894',
  },
  itemRateCaption: {
    fontSize: 11,
    color: '#636e72',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  badgeLate: {
    backgroundColor: 'rgba(243, 156, 18, 0.12)',
  },
  badgePending: {
    backgroundColor: 'rgba(9, 132, 227, 0.12)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2d3436',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#636e72',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  summaryPercentage: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 2,
  },
  verificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  verificationLabel: {
    fontSize: 12,
    color: '#636e72',
    fontWeight: '600',
  },
  verificationValue: {
    fontSize: 12,
    color: '#2d3436',
  },
  stateContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  stateIndicator: {
    marginBottom: 8,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: 13,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0984e3',
    borderRadius: 8,
  },
  retryButtonLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default WeeklyBreakdownList;
