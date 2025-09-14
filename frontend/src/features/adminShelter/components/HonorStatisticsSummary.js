import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Honor Statistics Summary Component
 * Displays comprehensive statistics for tutor honor data
 */
const HonorStatisticsSummary = ({ statistics, loading, onRefresh }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Memuat statistik...</Text>
      </View>
    );
  }

  if (!statistics) {
    return null;
  }

  const { summary, status_breakdown, performance, monthly_data } = statistics;

  const formatCurrency = (amount) => {
    return `Rp ${amount?.toLocaleString('id-ID') || 0}`;
  };

  const formatNumber = (num) => {
    return num?.toLocaleString('id-ID') || '0';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#f39c12';
      case 'approved': return '#27ae60';
      case 'paid': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'approved': return 'Disetujui';
      case 'paid': return 'Dibayar';
      default: return status;
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshing={loading}
      onRefresh={onRefresh}
    >
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="cash" size={24} color="#2ecc71" />
          </View>
          <Text style={styles.summaryValue}>{formatCurrency(summary.total_honor_amount)}</Text>
          <Text style={styles.summaryLabel}>Total Honor</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="calendar" size={24} color="#3498db" />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(summary.total_periods)}</Text>
          <Text style={styles.summaryLabel}>Total Periode</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="trending-up" size={24} color="#9b59b6" />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(summary.total_aktivitas)}</Text>
          <Text style={styles.summaryLabel}>Total Aktivitas</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="people" size={24} color="#e74c3c" />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(summary.total_siswa_hadir)}</Text>
          <Text style={styles.summaryLabel}>Siswa Hadir</Text>
        </View>
      </View>

      {/* Average Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rata-rata</Text>
        <View style={styles.averageGrid}>
          <View style={styles.averageItem}>
            <Text style={styles.averageValue}>{formatCurrency(summary.avg_honor_per_month)}</Text>
            <Text style={styles.averageLabel}>Per Bulan</Text>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageValue}>{summary.avg_aktivitas_per_month?.toFixed(1) || '0'}</Text>
            <Text style={styles.averageLabel}>Aktivitas/Bulan</Text>
          </View>
          <View style={styles.averageItem}>
            <Text style={styles.averageValue}>{summary.avg_siswa_per_aktivitas?.toFixed(1) || '0'}</Text>
            <Text style={styles.averageLabel}>Siswa/Aktivitas</Text>
          </View>
        </View>
      </View>

      {/* Status Breakdown */}
      {status_breakdown && Object.keys(status_breakdown).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Honor</Text>
          <View style={styles.statusContainer}>
            {Object.entries(status_breakdown).map(([status, data]) => (
              <View key={status} style={styles.statusItem}>
                <View style={styles.statusHeader}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <Text style={styles.statusName}>{getStatusText(status)}</Text>
                </View>
                <Text style={styles.statusCount}>{data.count} periode</Text>
                <Text style={styles.statusAmount}>{formatCurrency(data.total_honor)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Performance Highlights */}
      {performance && (performance.highest_month || performance.lowest_month) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performa</Text>
          
          {performance.highest_month && (
            <View style={styles.performanceCard}>
              <View style={styles.performanceIcon}>
                <Ionicons name="trending-up" size={20} color="#2ecc71" />
              </View>
              <View style={styles.performanceContent}>
                <Text style={styles.performanceTitle}>Honor Tertinggi</Text>
                <Text style={styles.performanceDetail}>
                  {performance.highest_month.bulan_nama} {performance.highest_month.tahun}
                </Text>
                <Text style={styles.performanceAmount}>
                  {formatCurrency(performance.highest_month.total_honor)}
                </Text>
              </View>
            </View>
          )}

          {performance.lowest_month && (
            <View style={styles.performanceCard}>
              <View style={styles.performanceIcon}>
                <Ionicons name="trending-down" size={20} color="#e74c3c" />
              </View>
              <View style={styles.performanceContent}>
                <Text style={styles.performanceTitle}>Honor Terendah</Text>
                <Text style={styles.performanceDetail}>
                  {performance.lowest_month.bulan_nama} {performance.lowest_month.tahun}
                </Text>
                <Text style={styles.performanceAmount}>
                  {formatCurrency(performance.lowest_month.total_honor)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Recent Trends */}
      {monthly_data && monthly_data.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trend Terbaru (5 Bulan Terakhir)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.trendContainer}>
              {monthly_data.slice(-5).map((month, index) => (
                <View key={month.period} style={styles.trendItem}>
                  <Text style={styles.trendPeriod}>{month.period}</Text>
                  <Text style={styles.trendAmount}>{formatCurrency(month.total_honor)}</Text>
                  <Text style={styles.trendActivities}>{month.total_aktivitas} aktivitas</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 14,
    color: '#666'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  summaryIcon: {
    marginBottom: 8
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  averageGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  averageItem: {
    alignItems: 'center'
  },
  averageValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db'
  },
  averageLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  statusContainer: {
    gap: 12
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8
  },
  statusName: {
    fontSize: 14,
    color: '#333'
  },
  statusCount: {
    fontSize: 12,
    color: '#666'
  },
  statusAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  performanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  performanceIcon: {
    marginRight: 12
  },
  performanceContent: {
    flex: 1
  },
  performanceTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  performanceDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  performanceAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
    marginTop: 4
  },
  trendContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 16
  },
  trendItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80
  },
  trendPeriod: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  trendAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center'
  },
  trendActivities: {
    fontSize: 10,
    color: '#666',
    marginTop: 2
  }
});

export default HonorStatisticsSummary;