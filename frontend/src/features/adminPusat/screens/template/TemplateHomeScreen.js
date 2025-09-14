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
import { templateApi } from '../../api/templateApi';
import { 
  fetchTemplateStruktur, 
  resetNavigation,
  selectHierarchyStruktur,
  selectHierarchyLoading,
  selectHierarchyError
} from '../../redux/templateHierarchySlice';

const TemplateHomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  // Redux state
  const struktur = useSelector(selectHierarchyStruktur);
  const loading = useSelector(selectHierarchyLoading);
  const error = useSelector(selectHierarchyError);
  
  // Local state untuk dashboard stats
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Reset navigation saat masuk screen
  useFocusEffect(
    React.useCallback(() => {
      dispatch(resetNavigation());
    }, [dispatch])
  );

  // Load data saat component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load hierarchy structure
      dispatch(fetchTemplateStruktur());
      
      // Load dashboard stats
      await loadDashboardStats();
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  const loadDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await templateApi.getDashboardStats();
      setDashboardStats(response.data);
      
      // Set some mock recent activity - akan diganti dengan real data nanti
      setRecentActivity([
        {
          id: 1,
          type: 'distribution',
          title: 'Template didistribusi ke Cabang Jakarta',
          time: '2 jam lalu',
          icon: 'send'
        },
        {
          id: 2,
          type: 'adoption',
          title: 'Template diadopsi oleh Cabang Bandung',
          time: '5 jam lalu',
          icon: 'checkmark-circle'
        },
        {
          id: 3,
          type: 'creation',
          title: 'Template baru dibuat: Matematika Kelas 5',
          time: '1 hari lalu',
          icon: 'add-circle'
        }
      ]);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      Alert.alert('Error', 'Gagal memuat statistik dashboard');
    } finally {
      setStatsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleNavigateToTemplates = () => {
    navigation.navigate('JenjangSelection');
  };

  const handleNavigateToDistribution = () => {
    navigation.navigate('DistributionHistory');
  };

  const handleNavigateToMonitoring = () => {
    navigation.navigate('MonitoringDashboard');
  };

  if (loading.struktur && !struktur.length) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#e74c3c']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Template Kurikulum</Text>
        <Text style={styles.headerSubtitle}>
          Kelola template pembelajaran nasional
        </Text>
      </View>

      {/* Stats Cards */}
      {statsLoading ? (
        <View style={styles.statsContainer}>
          <LoadingSpinner size="small" />
        </View>
      ) : dashboardStats ? (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatsCard
              title="Total Template"
              value={dashboardStats.total_templates || 0}
              subtitle={`${dashboardStats.active_templates || 0} aktif`}
              icon="library"
              color="#3498db"
            />
            <StatsCard
              title="Total Distribusi"
              value={dashboardStats.total_distributions || 0}
              subtitle={`${dashboardStats.pending_adoptions || 0} pending`}
              icon="send"
              color="#e74c3c"
            />
          </View>
          <View style={styles.statsRow}>
            <StatsCard
              title="Tingkat Adopsi"
              value={`${dashboardStats.overall_adoption_rate || 0}%`}
              subtitle={`${dashboardStats.recent_adoptions || 0} minggu ini`}
              icon="trending-up"
              color="#27ae60"
            />
            <StatsCard
              title="Total Cabang"
              value={dashboardStats.total_cabang || 0}
              subtitle="Cabang aktif"
              icon="business"
              color="#9b59b6"
            />
          </View>
        </View>
      ) : null}

      {/* Menu Grid */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Menu Utama</Text>
        <View style={styles.menuGrid}>
          <MenuCard
            title="Kelola Template"
            subtitle="Buat dan edit template"
            icon="library"
            color="#3498db"
            onPress={handleNavigateToTemplates}
          />
          <MenuCard
            title="Distribusi"
            subtitle="Kirim ke cabang"
            icon="send"
            color="#e74c3c"
            onPress={handleNavigateToDistribution}
          />
          <MenuCard
            title="Monitoring"
            subtitle="Pantau adopsi"
            icon="analytics"
            color="#27ae60"
            onPress={handleNavigateToMonitoring}
          />
          <MenuCard
            title="Laporan"
            subtitle="Export data"
            icon="document-text"
            color="#f39c12"
            onPress={() => Alert.alert('Info', 'Fitur laporan akan tersedia di fase selanjutnya')}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>Aktivitas Terbaru</Text>
        {recentActivity.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </View>

      {/* Error handling */}
      {error.struktur && (
        <ErrorMessage 
          message={error.struktur}
          onRetry={() => dispatch(fetchTemplateStruktur())}
        />
      )}
    </ScrollView>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon, color }) => (
  <View style={[styles.statsCard, { borderLeftColor: color }]}>
    <View style={styles.statsCardContent}>
      <View style={styles.statsCardText}>
        <Text style={styles.statsCardTitle}>{title}</Text>
        <Text style={[styles.statsCardValue, { color }]}>{value}</Text>
        <Text style={styles.statsCardSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.statsCardIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
    </View>
  </View>
);

// Menu Card Component
const MenuCard = ({ title, subtitle, icon, color, onPress }) => (
  <TouchableOpacity style={styles.menuCard} onPress={onPress}>
    <View style={[styles.menuCardIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={32} color="white" />
    </View>
    <Text style={styles.menuCardTitle}>{title}</Text>
    <Text style={styles.menuCardSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

// Activity Item Component
const ActivityItem = ({ activity }) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIcon}>
      <Ionicons name={activity.icon} size={20} color="#3498db" />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{activity.title}</Text>
      <Text style={styles.activityTime}>{activity.time}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statsCard: {
    flex: 0.48,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsCardText: {
    flex: 1,
  },
  statsCardTitle: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  statsCardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statsCardSubtitle: {
    fontSize: 10,
    color: '#6c757d',
  },
  statsCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  menuContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuCardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  menuCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 4,
  },
  menuCardSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  activityContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#6c757d',
  },
});

export default TemplateHomeScreen;