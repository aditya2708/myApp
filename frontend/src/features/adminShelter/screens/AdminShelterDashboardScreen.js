import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, SafeAreaView } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import TodayActivitiesCard from '../components/TodayActivitiesCard';
import { adminShelterApi } from '../api/adminShelterApi';
import { useDispatch } from 'react-redux';
import { fetchNotifications } from '../redux/notificationSlice';
import { useDonationAd } from '../../../common/hooks/useDonationAd';
import DonationAdModal from '../../../common/components/DonationAdModal';

const { width, height } = Dimensions.get('window');

const AdminShelterDashboardScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
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
  const menuItems = [
    { title: 'Keluarga', icon: 'home', color: '#1abc9c', onPress: () => navigation.navigate('Management', { screen: 'KeluargaManagement' }) },
    { title: 'Anak Binaan', icon: 'people', color: '#e74c3c', onPress: () => navigation.navigate('Management', { screen: 'AnakManagement' }) },
    { title: 'Tutor', icon: 'school', color: '#2ecc71', onPress: () => navigation.navigate('Management', { screen: 'TutorManagement' }) },
    { title: 'Keuangan', icon: 'wallet', color: '#f39c12', onPress: () => navigation.navigate('Management', { screen: 'KeuanganList' }) },
    { title: 'Kelola Kurikulum', icon: 'library', color: '#9b59b6', onPress: () => navigation.navigate('KurikulumHome') },
    { title: 'Laporan Kegiatan', icon: 'bar-chart', color: '#e67e22', onPress: () => navigation.navigate('Reports') }
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const response = await adminShelterApi.getDashboard();
      setDashboardData(response.data.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchNotifications());
    }, [dispatch])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    refreshAd();
  };

  if (loading && !refreshing) return <LoadingSpinner fullScreen message="Loading dashboard..." />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {error && <ErrorMessage message={error} onRetry={fetchDashboardData} />}

        <DonationAdModal
          visible={adVisible}
          ad={donationAd}
          onClose={dismissAd}
          onActionPress={markActionTaken}
        />

        {/* Today's Activities Card */}
        <TodayActivitiesCard />
        
        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map(({ title, icon, color, onPress }, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={onPress}>
              <View style={[styles.menuIcon, { backgroundColor: color }]}>
                <Ionicons name={icon} size={28} color="#ffffff" />
              </View>
              <Text style={styles.menuText}>{title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  scrollView: {
    flex: 1
  },
  content: { 
    flexGrow: 1,
    padding: 12,
    paddingBottom: 20
  },
  menuContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    marginTop: 8
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 100
  },
  menuIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  menuText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#333', 
    textAlign: 'center',
    lineHeight: 16
  }
});

export default AdminShelterDashboardScreen;
