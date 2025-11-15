import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminCabangApi } from '../api/adminCabangApi';
import { useAuth } from '../../../common/hooks/useAuth';
import DonationAdModal from '../../../common/components/DonationAdModal';
import { useDonationAd } from '../../../common/hooks/useDonationAd';

const { width } = Dimensions.get('window');

const AdminCabangDashboardScreen = () => {
  const navigation = useNavigation();
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const {
    ad: donationAd,
    visible: adVisible,
    dismissAd,
    markActionTaken,
    refreshAd,
  } = useDonationAd();

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const dashboardResponse = await adminCabangApi.getDashboard();
      setDashboardData(dashboardResponse.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    refreshAd();
  };
  const navigateToSurveyManagement = () => navigation.navigate('SurveyStatusFilter');
  const navigateToDonaturManagement = () => navigation.navigate('DonaturList');
  const navigateToKurikulum = () => navigation.navigate('Kurikulum', { screen: 'KurikulumHome' });
  const navigateToGpsApproval = () => navigation.navigate('GpsApprovalScreen');
  const navigateToProfile = () => navigation.navigate('Profile');
  const navigateToReports = () => navigation.navigate('Reports', { screen: 'AdminCabangReportHome' });
  const navigateToUserManagement = () =>
    navigation.navigate('AdminCabangUserManagement');

  if (loading && !refreshing) return <LoadingSpinner fullScreen message="Memuat dashboard..." />;

  const summary = dashboardData?.summary || {};

  const quickActions = [
    { 
      title: 'Manajemen Survey', 
      description: 'Kelola semua persetujuan survey', 
      icon: 'document-text', 
      color: '#f39c12', 
      onPress: navigateToSurveyManagement, 
      badge: summary.pending_surveys 
    },
    {
      title: 'Manajemen Donatur',
      description: 'Kelola data donatur cabang',
      icon: 'people',
      color: '#3498db',
      onPress: navigateToDonaturManagement,
      badge: summary.donatur
    },
    {
      title: 'Manajemen Pengguna',
      description: 'Kelola akses admin cabang & shelter',
      icon: 'people-circle',
      color: '#2980b9',
      onPress: navigateToUserManagement,
      badge: null
    },
    {
      title: 'Laporan',
      description: 'Lihat ringkasan laporan cabang',
      icon: 'stats-chart',
      color: '#1abc9c',
      onPress: navigateToReports,
      badge: null
    },
    {
      title: 'Kurikulum',
      description: 'Kelola materi pembelajaran cabang',
      icon: 'library',
      color: '#9b59b6',
      onPress: navigateToKurikulum, 
      badge: null 
    },
    { 
      title: 'Persetujuan GPS', 
      description: 'Kelola persetujuan GPS shelter', 
      icon: 'location', 
      color: '#e74c3c', 
      onPress: navigateToGpsApproval, 
      badge: summary.pending_gps_requests || null 
    }
  ];

  const statsData = [
    { icon: 'map-outline', color: '#2ecc71', value: summary.wilayah || 0, label: 'Wilayah Binaan' },
    { icon: 'home-outline', color: '#e74c3c', value: summary.shelter || 0, label: 'Shelter' },
    { icon: 'people-outline', color: '#3498db', value: summary.donatur || 0, label: 'Donatur' },
    { icon: 'document-text-outline', color: '#f39c12', value: summary.pending_surveys || 0, label: 'Survey Tertunda' },
    { icon: 'school-outline', color: '#8e44ad', value: summary.total_children || 0, label: 'Total Anak' },
    { icon: 'person-outline', color: '#16a085', value: summary.total_tutors || 0, label: 'Total Tutor' }
  ];

  const StatCard = ({ icon, color, value, label }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={28} color={color} />
      <View style={styles.statTextContainer}>
        <Text style={styles.statNumber}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {error && <ErrorMessage message={error} onRetry={fetchDashboardData} />}

      <DonationAdModal
        visible={adVisible}
        ad={donationAd}
        onClose={dismissAd}
        onActionPress={markActionTaken}
      />

      <View style={styles.headerSection}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Selamat datang kembali,</Text>
            <Text style={styles.nameText}>{profile?.nama_lengkap || user?.email || 'Admin Cabang'}</Text>
            {dashboardData?.kacab && <Text style={styles.cabangText}>{dashboardData.kacab.nama_cabang || 'Cabang'}</Text>}
          </View>
          <TouchableOpacity style={styles.profileImageContainer} onPress={navigateToProfile}>
            {profile?.foto ? (
              <Image 
                source={{ uri: `https://bp.berbagipendidikan.org/storage/AdminCabang/${profile.id_admin_cabang}/${profile.foto}` }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={24} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsOverview}>
        {statsData.map((stat, index) => <StatCard key={index} {...stat} />)}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity key={index} style={styles.actionCard} onPress={action.onPress}>
              <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                <Ionicons name={action.icon} size={26} color="#fff" />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionDescription}>{action.description}</Text>
              {action.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  contentContainer: { padding: 16 },
  headerSection: { 
    backgroundColor: '#2ecc71', 
    borderRadius: 12, 
    padding: 20, 
    marginBottom: 20, 
    ...Platform.select({ 
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 2 
      }, 
      android: { 
        elevation: 2 
      } 
    }) 
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeText: { fontSize: 14, color: '#fff', opacity: 0.8 },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  cabangText: { fontSize: 16, color: '#fff', opacity: 0.9, marginTop: 4 },
  profileImageContainer: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden', borderWidth: 2, borderColor: '#fff' },
  profileImage: { width: '100%', height: '100%' },
  profileImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center' },
  statsOverview: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 12, 
    width: '48%',
    marginBottom: 12,
    flexDirection: 'row', 
    alignItems: 'center', 
    ...Platform.select({ 
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 2 
      }, 
      android: { 
        elevation: 2 
      } 
    }) 
  },
  statTextContainer: { marginLeft: 10 },
  statNumber: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  statLabel: { fontSize: 12, color: '#666' },
  sectionContainer: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 20, 
    ...Platform.select({ 
      ios: { 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 1 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 2 
      }, 
      android: { 
        elevation: 2 
      } 
    }) 
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: { 
    width: (width - 64) / 2, 
    backgroundColor: '#f8f8f8', 
    borderRadius: 12, 
    padding: 16, 
    position: 'relative',
    marginBottom: 12
  },
  actionIconContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  actionDescription: { fontSize: 12, color: '#666' },
  badge: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    backgroundColor: '#e74c3c', 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }
});

export default AdminCabangDashboardScreen;
