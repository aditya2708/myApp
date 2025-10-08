import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AttendanceProgressBar from './AttendanceProgressBar';

const WeeklySummaryCard = ({
  summary,
  weeks,
  selectedWeekId,
  onSelectWeek,
  band,
  isLoading,
  error,
  onRetry,
  overview,
}) => {
  const weekOptions = useMemo(() => (Array.isArray(weeks) ? weeks : []), [weeks]);
  const showWeekSelector = weekOptions.length > 1;

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator color="#0984e3" />
          <Text style={styles.stateText}>Memuat rekap mingguan...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="alert-circle-outline" size={28} color="#e74c3c" />
          <Text style={styles.stateTitle}>Tidak dapat memuat data</Text>
          <Text style={styles.stateText}>{error}</Text>
          {onRetry ? (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Ionicons name="refresh" size={16} color="#ffffff" />
              <Text style={styles.retryLabel}>Coba Lagi</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    if (!summary) {
      return (
        <View style={styles.stateContainer}>
          <Ionicons name="information-circle-outline" size={28} color="#636e72" />
          <Text style={styles.stateTitle}>Belum ada rekap tersedia</Text>
          <Text style={styles.stateText}>Data rekap mingguan akan muncul setelah laporan dibuat.</Text>
        </View>
      );
    }

    const summaryBreakdown = summary.summary || {};
    const verification = summary.verification || {};
    const totals = summary.totals || {};

    return (
      <>
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrapper}>
            <Text style={styles.title}>Ringkasan Kehadiran Cabang</Text>
            <Text style={styles.subtitle}>
              {summary.dates?.label || summary.label || 'Periode berjalan'}
            </Text>
          </View>
          {band ? (
            <View style={[styles.bandBadge, { backgroundColor: band.backgroundColor }]}>
              <Ionicons name="speedometer" size={18} color={band.color} style={styles.bandIcon} />
              <View>
                <Text style={[styles.bandTitle, { color: band.color }]}>{band.label}</Text>
                <Text style={styles.bandRate}>{`${Number(summary.attendanceRate || 0).toFixed(1)}%`}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {showWeekSelector ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekSelectorContainer}
          >
            {weekOptions.map((week) => {
              const isActive = week.id === selectedWeekId;

              return (
                <TouchableOpacity
                  key={week.id}
                  onPress={() => (onSelectWeek ? onSelectWeek(week.id) : undefined)}
                  style={[styles.weekChip, isActive ? styles.weekChipActive : null]}
                >
                  <Text style={[styles.weekChipLabel, isActive ? styles.weekChipLabelActive : null]}>
                    {week.label || week.dates?.label || 'Minggu'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.progressGrid}>
          <View style={styles.progressItem}>
            <AttendanceProgressBar
              label="Hadir"
              count={summaryBreakdown.present?.count}
              percentage={summaryBreakdown.present?.percentage}
              color="#2ecc71"
              icon="checkmark-circle"
            />
          </View>
          <View style={styles.progressItem}>
            <AttendanceProgressBar
              label="Terlambat"
              count={summaryBreakdown.late?.count}
              percentage={summaryBreakdown.late?.percentage}
              color="#f1c40f"
              icon="time"
            />
          </View>
          <View style={[styles.progressItem, styles.progressItemLast]}>
            <AttendanceProgressBar
              label="Tidak Hadir"
              count={summaryBreakdown.absent?.count}
              percentage={summaryBreakdown.absent?.percentage}
              color="#e74c3c"
              icon="close-circle"
            />
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.footerItem}>
            <Ionicons name="people" size={18} color="#0984e3" />
            <Text style={styles.footerLabel}>Total Sesi</Text>
            <Text style={styles.footerValue}>{(totals.sessions || 0).toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
            <Text style={styles.footerLabel}>Terverifikasi</Text>
            <Text style={styles.footerValue}>{(verification.verified || 0).toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="time" size={18} color="#f1c40f" />
            <Text style={styles.footerLabel}>Menunggu</Text>
            <Text style={styles.footerValue}>{(verification.pending || 0).toLocaleString('id-ID')}</Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="close-circle" size={18} color="#e74c3c" />
            <Text style={styles.footerLabel}>Ditolak</Text>
            <Text style={styles.footerValue}>{(verification.rejected || 0).toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {overview ? (
          <View style={styles.overviewContainer}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Total Kehadiran</Text>
              <Text style={styles.overviewValue}>
                {(overview.presentCount || 0).toLocaleString('id-ID')}
              </Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Rata-rata Kehadiran</Text>
              <Text style={styles.overviewValue}>{`${Number(
                overview.attendanceRate || 0
              ).toFixed(1)}%`}</Text>
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Anak Aktif</Text>
              <Text style={styles.overviewValue}>
                {(overview.activeChildren || 0).toLocaleString('id-ID')}
              </Text>
            </View>
          </View>
        ) : null}
      </>
    );
  };

  return <View style={styles.card}>{renderContent()}</View>;
};

WeeklySummaryCard.defaultProps = {
  summary: null,
  weeks: [],
  selectedWeekId: null,
  onSelectWeek: undefined,
  band: null,
  isLoading: false,
  error: null,
  onRetry: undefined,
  overview: null,
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTextWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#636e72',
  },
  bandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bandIcon: {
    marginRight: 8,
  },
  bandTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  bandRate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d3436',
  },
  weekSelectorContainer: {
    paddingVertical: 4,
  },
  weekChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  weekChipActive: {
    borderColor: '#0984e3',
    backgroundColor: 'rgba(9, 132, 227, 0.12)',
  },
  weekChipLabel: {
    fontSize: 13,
    color: '#636e72',
    fontWeight: '600',
  },
  weekChipLabelActive: {
    color: '#0984e3',
  },
  progressGrid: {
    marginVertical: 16,
  },
  progressItem: {
    marginBottom: 12,
  },
  progressItemLast: {
    marginBottom: 0,
  },
  footerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 12,
  },
  footerItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: 70,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 6,
  },
  footerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 2,
  },
  overviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginTop: 12,
  },
  overviewItem: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: 'rgba(9, 132, 227, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 8,
  },
  stateText: {
    fontSize: 13,
    color: '#636e72',
    textAlign: 'center',
    marginTop: 4,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0984e3',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
});

export default WeeklySummaryCard;
