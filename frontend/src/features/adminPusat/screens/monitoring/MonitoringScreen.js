import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

import {
  fetchDashboardStats,
  fetchCabangPerformance,
  fetchTemplatePerformance,
  setSelectedPeriod,
  selectDashboardStats,
  selectTopPerformingCabang,
  selectTopPerformingTemplates,
  selectRecentTrends,
  selectSelectedPeriod,
  selectMonitoringLoading,
  selectMonitoringError,
  selectShouldRefreshData
} from '../../redux/monitoringSlice';

const MonitoringScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  // Redux state
  const dashboardStats = useSelector(selectDashboardStats);
  const topCabang = useSelector(selectTopPerformingCabang);
  const topTemplates = useSelector(selectTopPerformingTemplates);
  const trends = useSelector(selectRecentTrends);
  const selectedPeriod = useSelector(selectSelectedPeriod);
  const loading = useSelector(selectMonitoringLoading);
  const error = useSelector(selectMonitoringError);
  const shouldRefresh = useSelector(selectShouldRefreshData);

  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Load data saat component mount
  useFocusEffect(
    React.useCallback(() => {
      if (shouldRefresh) {
        loadMonitoringData();
      }
    }, [shouldRefresh])
  );

  const loadMonitoringData = async () => {
    try {
      await Promise.all([
        dispatch(fetchDashboardStats({ period: selectedPeriod })).unwrap(),
        dispatch(fetchCabangPerformance({ period: selectedPeriod, per_page: 5 })).unwrap(),
        dispatch(fetchTemplatePerformance({ period: selectedPeriod, per_page: 5 })).unwrap()
      ]);
    } catch (err) {
      console.error('Error loading monitoring data:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMonitoringData();
    setRefreshing(false);
  };

  // Event handlers
  const handlePeriodChange = (period) => {
    dispatch(setSelectedPeriod(period));
    loadMonitoringData();
  };

  const handleNavigateToCabangPerformance = () => {
    navigation.navigate('CabangPerformance');
  };

  const handleNavigateToTemplatePerformance = () => {
    navigation.navigate('TemplatePerformance');
  };

  const handleNavigateToAdoptionTrends = () => {
    navigation.navigate('AdoptionTrends');
  };

  const handleCabangDetail = (cabang) => {
    navigation.navigate('CabangDetail', { cabangId: cabang.id_cabang });
  };

  const handleTemplateDetail = (template) => {
    navigation.navigate('TemplateDetail', { templateId: template.id_template_materi });
  };

  const handleExportReport = () => {
    Alert.alert(
      'Export Report',
      'Pilih format export:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Excel', onPress: () => exportReport('excel') },
        { text: 'PDF', onPress: () => exportReport('pdf') }
      ]
    );
  };

  const exportReport = async (format) => {
    try {
      Alert.alert('Info', `Export ${format.toUpperCase()} akan tersedia di fase selanjutnya`);
    } catch (err) {
      Alert.alert('Error', 'Gagal export report');
    }
  };

  if (loading.dashboardStats && !dashboardStats.total_templates) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Monitoring & Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Dashboard performa template dan adopsi
          </Text>
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={handleExportReport}>
          <Ionicons name="download-outline" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        <Text style={styles.periodLabel}>Periode:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodRow}>
          {[
            { key: 'week', label: '7 Hari' },
            { key: 'month', label: '30 Hari' },
            { key: 'quarter', label: '3 Bulan' },
            { key: 'year', label: '1 Tahun' }
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodChip,
                selectedPeriod === period.key && styles.periodChipActive
              ]}
              onPress={() => handlePeriodChange(period.key)}
            >
              <Text style={[
                styles.periodChipText,
                selectedPeriod === period.key && styles.periodChipTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e74c3c']}
          />
        }
      >
        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Ringkasan Utama</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Template"
              value={dashboardStats.total_templates}
              subtitle={`${dashboardStats.active_templates} aktif`}
              trend={trends.templates}
              icon="library"
              color="#3498db"
            />
            <MetricCard
              title="Distribusi"
              value={dashboardStats.total_distributions}
              subtitle={`${dashboardStats.pending_adoptions} pending`}
              trend={trends.distributions}
              icon="send"
              color="#e74c3c"
            />
            <MetricCard
              title="Adopsi"
              value={dashboardStats.total_adoptions}
              subtitle={`${dashboardStats.recent_adoptions} baru`}
              trend={trends.adoptions}
              icon="checkmark-circle"
              color="#27ae60"
            />
            <MetricCard
              title="Tingkat Adopsi"
              value={`${dashboardStats.overall_adoption_rate}%`}
              subtitle={`${dashboardStats.active_cabang}/${dashboardStats.total_cabang} cabang`}
              trend={trends.adoption_rate}
              icon="trending-up"
              color="#f39c12"
            />
          </View>
        </View>

        {/* Top Performing Cabang */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Cabang</Text>
            <TouchableOpacity onPress={handleNavigateToCabangPerformance}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            {topCabang.map((cabang, index) => (
              <CabangItem
                key={cabang.id_cabang}
                cabang={cabang}
                rank={index + 1}
                onPress={() => handleCabangDetail(cabang)}
              />
            ))}
            {topCabang.length === 0 && (
              <Text style={styles.emptyText}>Belum ada data cabang</Text>
            )}
          </View>
        </View>

        {/* Top Performing Templates */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Template</Text>
            <TouchableOpacity onPress={handleNavigateToTemplatePerformance}>
              <Text style={styles.seeAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            {topTemplates.map((template, index) => (
              <TemplateItem
                key={template.id_template_materi}
                template={template}
                rank={index + 1}
                onPress={() => handleTemplateDetail(template)}
              />
            ))}
            {topTemplates.length === 0 && (
              <Text style={styles.emptyText}>Belum ada data template</Text>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionCard
              title="Tren Adopsi"
              subtitle="Lihat grafik tren"
              icon="analytics"
              color="#9b59b6"
              onPress={handleNavigateToAdoptionTrends}
            />
            <ActionCard
              title="Performa Cabang"
              subtitle="Detail per cabang"
              icon="business"
              color="#1abc9c"
              onPress={handleNavigateToCabangPerformance}
            />
            <ActionCard
              title="Performa Template"
              subtitle="Analisis template"
              icon="document-text"
              color="#e67e22"
              onPress={handleNavigateToTemplatePerformance}
            />
            <ActionCard
              title="Export Data"
              subtitle="Download laporan"
              icon="download"
              color="#34495e"
              onPress={handleExportReport}
            />
          </View>
        </View>

        {/* Error handling */}
        {error.dashboardStats && (
          <ErrorMessage 
            message={error.dashboardStats}
            onRetry={() => dispatch(fetchDashboardStats({ period: selectedPeriod }))}
          />
        )}
      </ScrollView>
    </View>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, subtitle, trend, icon, color }) => {
  const getTrendIcon = () => {
    if (!trend || trend.change === 0) return null;
    return trend.isPositive ? 'trending-up' : 'trending-down';
  };

  const getTrendColor = () => {
    if (!trend || trend.change === 0) return '#6c757d';
    return trend.isPositive ? '#27ae60' : '#e74c3c';
  };

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="white" />
        </View>
        {trend && trend.change !== 0 && (
          <View style={styles.trendContainer}>
            <Ionicons name={getTrendIcon()} size={16} color={getTrendColor()} />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {Math.abs(trend.change)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
};

// Cabang Item Component
const CabangItem = ({ cabang, rank, onPress }) => {
  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#f1c40f';
      case 2: return '#95a5a6';
      case 3: return '#cd7f32';
      default: return '#6c757d';
    }
  };

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={[styles.rankBadge, { backgroundColor: getRankColor(rank) }]}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{cabang.nama_cabang}</Text>
        <Text style={styles.itemSubtitle}>
          {cabang.total_adoptions || 0} adopsi • {cabang.adoption_rate || 0}% tingkat adopsi
        </Text>
      </View>
      <View style={styles.itemStats}>
        <Text style={styles.statValue}>{cabang.adoption_rate || 0}%</Text>
      </View>
    </TouchableOpacity>
  );
};

// Template Item Component
const TemplateItem = ({ template, rank, onPress }) => {
  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return '#f1c40f';
      case 2: return '#95a5a6';
      case 3: return '#cd7f32';
      default: return '#6c757d';
    }
  };

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={[styles.rankBadge, { backgroundColor: getRankColor(rank) }]}>
        <Text style={styles.rankText}>{rank}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{template.nama_template}</Text>
        <Text style={styles.itemSubtitle}>
          {template.usage_count || 0} penggunaan • {template.adoption_rate || 0}% adopsi
        </Text>
      </View>
      <View style={styles.itemStats}>
        <Text style={styles.statValue}>{template.usage_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Action Card Component
const ActionCard = ({ title, subtitle, icon, color, onPress }) => {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  exportButton: {
    padding: 8,
  },
  periodContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  periodLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginRight: 12,
  },
  periodRow: {
    flex: 1,
  },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  periodChipActive: {
    backgroundColor: '#3498db',
  },
  periodChipText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  periodChipTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  metricsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 2,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#6c757d',
  },
  sectionContainer: {
    backgroundColor: 'white',
    marginBottom: 16,
    paddingTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#6c757d',
  },
  itemStats: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  actionsContainer: {
    padding: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 6,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
});

export default MonitoringScreen;