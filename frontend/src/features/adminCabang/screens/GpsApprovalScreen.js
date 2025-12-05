import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import ErrorMessage from '../../../common/components/ErrorMessage';
import EmptyState from '../../../common/components/EmptyState';
import adminCabangApi from '../api/adminCabangApi';

const formatDateTime = (value) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    return `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch (error) {
    return value;
  }
};

const FlagBadge = ({ text, color = '#e67e22' }) => (
  <View style={[styles.badge, { backgroundColor: color }]}>
    <Text style={styles.badgeText}>{text}</Text>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '-'}</Text>
  </View>
);

const FlagItem = ({ item, type }) => {
  const flags = item?.auto_flag_payload || [];
  const flagMessages = flags.length
    ? flags.map((flag) => `• ${flag.message || flag.code || 'Perlu peninjauan'}`).join('\n')
    : 'Catatan tidak tersedia';

  const locationBlock = item?.gps
    ? {
        coordinate: item.gps.latitude && item.gps.longitude
          ? `${item.gps.latitude}, ${item.gps.longitude}`
          : 'Tidak tersedia',
        accuracy: item.gps.accuracy ? `${Math.round(item.gps.accuracy)} m` : 'Tidak diketahui',
        recorded_at: item.gps.recorded_at ? formatDateTime(item.gps.recorded_at) : '-',
        distance: item.gps.distance
          ? `${Math.round(item.gps.distance)} m`
          : item.gps.distance_from_activity
            ? `${Math.round(item.gps.distance_from_activity)} m`
            : null,
      }
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons
            name={type === 'attendance' ? 'people-circle' : 'document-text'}
            size={22}
            color={type === 'attendance' ? '#0984e3' : '#6c5ce7'}
          />
          <View>
            <Text style={styles.cardTitle}>
              {item?.member?.name || item?.shelter?.name || 'Tidak diketahui'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {type === 'attendance'
                ? `Kegiatan: ${item.activity_type || '-'}`
                : `Aktivitas: ${item.activity_type || '-'}`}
            </Text>
          </View>
        </View>
        <FlagBadge
          text={type === 'attendance' ? 'Kehadiran' : 'Laporan Kegiatan'}
          color={type === 'attendance' ? '#00a8ff' : '#9b59b6'}
        />
      </View>

      {type === 'attendance' && (
        <>
          <InfoRow
            label="Anggota"
            value={
              item?.member?.name
                ? `${item.member.name} (${item.member?.type === 'tutor' ? 'Tutor' : 'Siswa'})`
                : '-'
            }
          />
          <InfoRow label="Status" value={item?.status || '-'} />
        </>
      )}

      <InfoRow label="Shelter" value={item?.shelter?.name || '-'} />
      <InfoRow label="Tanggal Aktivitas" value={formatDateTime(item?.activity_date)} />

      {locationBlock && (
        <View style={styles.locationContainer}>
          <Text style={styles.locationHeading}>Detail Lokasi</Text>
          <InfoRow label="Koordinat" value={locationBlock.coordinate} />
          <InfoRow label="Akurasi" value={locationBlock.accuracy} />
          {locationBlock.distance && <InfoRow label="Jarak" value={locationBlock.distance} />}
          <InfoRow label="Dicatat" value={locationBlock.recorded_at} />
        </View>
      )}

      <View style={styles.flagsContainer}>
        <Text style={styles.flagHeading}>Auto Flag</Text>
        <Text style={styles.flagText}>{flagMessages}</Text>
      </View>

      <TouchableOpacity
        style={styles.reviewHint}
        onPress={() => {
          // future: navigate ke detail atau copy ID
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="information-circle-outline" size={16} color="#6c5ce7" />
        <Text style={styles.reviewHintText}>
          Tandai valid/invalid via dashboard web atau koordinasikan dengan admin shelter.
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const Section = ({ title, count, data, type }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlagBadge text={`${count} data`} color="#34495e" />
    </View>
    {count === 0 ? (
      <EmptyState
        title="Tidak ada data"
        description="Semua catatan aman. Tidak ada flag otomatis untuk diselesaikan."
      />
    ) : (
      data.map((item) => (
        <FlagItem
          key={`${type}-${item.id_absen || item.id_activity_report || item.id}`}
          item={item}
          type={type}
        />
      ))
    )}
  </View>
);

const GpsApprovalScreen = () => {
  const [data, setData] = useState({ attendance: [], activity_reports: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNeedsReview = useCallback(async (opts = { silent: false }) => {
    if (!opts.silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await adminCabangApi.getGpsNeedsReview();
      const payload = response?.data?.data || { attendance: [], activity_reports: [] };
      setData({
        attendance: payload.attendance || [],
        activity_reports: payload.activity_reports || [],
      });
      setError(null);
    } catch (err) {
      console.error('Failed to load GPS review data:', err);
      setError(err?.response?.data?.message || err?.message || 'Gagal memuat data monitoring GPS');
      setData({ attendance: [], activity_reports: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNeedsReview();
    }, [fetchNeedsReview])
  );

  const stats = useMemo(() => {
    const attendanceCount = data.attendance.length;
    const reportCount = data.activity_reports.length;
    return {
      attendanceCount,
      reportCount,
      total: attendanceCount + reportCount,
    };
  }, [data]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Memuat data monitoring GPS...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchNeedsReview({ silent: true })} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Monitoring GPS & Aktivitas</Text>
          <Text style={styles.subtitle}>
            Pantau catatan kehadiran dan laporan kegiatan yang ditandai otomatis karena masalah lokasi.
          </Text>
        </View>

        {error && (
          <ErrorMessage message={error} onRetry={() => fetchNeedsReview()} />
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Flag</Text>
            <Text style={styles.summaryValue}>{stats.total}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Kehadiran</Text>
            <Text style={styles.summaryValue}>{stats.attendanceCount}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Laporan</Text>
            <Text style={styles.summaryValue}>{stats.reportCount}</Text>
          </View>
        </View>

        <Section
          title="Flag Kehadiran"
          count={data.attendance.length}
          data={data.attendance}
          type="attendance"
        />

        <Section
          title="Flag Laporan Kegiatan"
          count={data.activity_reports.length}
          data={data.activity_reports}
          type="report"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#7f8c8d',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#ecf0f1',
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#95a5a6',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#95a5a6',
  },
  infoValue: {
    fontSize: 13,
    color: '#2c3e50',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  locationContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f6fb',
    borderRadius: 10,
  },
  locationHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 6,
  },
  flagsContainer: {
    marginTop: 12,
    backgroundColor: '#fff5f5',
    borderRadius: 10,
    padding: 12,
  },
  flagHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c0392b',
    marginBottom: 4,
  },
  flagText: {
    fontSize: 13,
    color: '#c0392b',
    lineHeight: 18,
  },
  reviewHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#f3e9ff',
    padding: 10,
    borderRadius: 10,
    gap: 6,
  },
  reviewHintText: {
    fontSize: 12,
    color: '#6c5ce7',
    flex: 1,
  },
});

export default GpsApprovalScreen;
