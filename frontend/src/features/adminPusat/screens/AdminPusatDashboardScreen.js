import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import API
import { adminPusatApi } from '../api/adminPusatApi';

// Import hooks
import { useAuth } from '../../../common/hooks/useAuth';

const AdminPusatDashboardScreen = () => {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await adminPusatApi.getDashboard();
      setDashboardData(response.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Navigation handlers
  const navigateToTemplates = () =>
    Alert.alert(
      'Maintenance',
      'Fitur ini sedang dalam perbaikan / maintenance.'
    );
  const navigateToProfile = () => navigation.navigate('ProfileTab');
  const navigateToTutorHonorSettings = () => navigation.navigate('TutorHonorSettings');
  const navigateToUserManagement = () => navigation.navigate('UserManagement');
  const navigateToDataWilayah = () => navigation.navigate('DataWilayah');

  // Show loading indicator
  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Loading dashboard..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchDashboardData}
        />
      )}

      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeText}>
            Selamat datang kembali,
          </Text>
          <Text style={styles.nameText}>
            {profile?.nama_lengkap || user?.email || 'Admin Pusat'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={navigateToProfile}
        >
          {profile?.foto ? (
            <Image
              source={{ uri: `http://192.168.8.105:8000/storage/AdminPusat/${profile.id_admin_pusat}/${profile.foto}` }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={30} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Cards - Template Focus */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="library-outline" size={24} color="#3498db" />
          <Text style={styles.statNumber}>
            {dashboardData?.template_count || 0}
          </Text>
          <Text style={styles.statLabel}>Template</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="send-outline" size={24} color="#e74c3c" />
          <Text style={styles.statNumber}>
            {dashboardData?.distribution_count || 0}
          </Text>
          <Text style={styles.statLabel}>Distribusi</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#2ecc71" />
          <Text style={styles.statNumber}>
            {dashboardData?.adoption_count || 0}
          </Text>
          <Text style={styles.statLabel}>Adopsi</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="business-outline" size={24} color="#9b59b6" />
          <Text style={styles.statNumber}>
            {dashboardData?.active_cabang || 0}
          </Text>
          <Text style={styles.statLabel}>Cabang Aktif</Text>
        </View>
      </View>

      {/* Quick Access */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Akses Cepat</Text>
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity 
            style={styles.quickAccessItem} 
            onPress={navigateToTemplates}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#3498db' }]}>
              <Ionicons name="library" size={24} color="#fff" />
            </View>
            <Text style={styles.quickAccessText}>Template Kurikulum</Text>
            <Text style={styles.quickAccessSubtext}>Fitur ini sedang dalam perbaikan / maintenance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={navigateToTutorHonorSettings}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#e74c3c' }]}>
              <Ionicons name="card" size={24} color="#fff" />
            </View>
            <Text style={styles.quickAccessText}>Setting Honor</Text>
            <Text style={styles.quickAccessSubtext}>Atur honor tutor</Text>
          </TouchableOpacity>

          {/* NEW: Manajemen User */}
          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={navigateToUserManagement}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#2ecc71' }]}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <Text style={styles.quickAccessText}>Manajemen User</Text>
            <Text style={styles.quickAccessSubtext}>Kelola user pusat/cabang/shelter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessItem}
            onPress={navigateToDataWilayah}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#9b59b6' }]}>
              <Ionicons name="map" size={24} color="#fff" />
            </View>
            <Text style={styles.quickAccessText}>Data Wilayah</Text>
            <Text style={styles.quickAccessSubtext}>Lihat kantor cabang & shelter</Text>
          </TouchableOpacity>
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 4,
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    width: '48%',
    marginBottom: 16,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickAccessText: {
    fontWeight: '500',
    color: '#333',
  },
  singleItem: {
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  quickAccessSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default AdminPusatDashboardScreen;
