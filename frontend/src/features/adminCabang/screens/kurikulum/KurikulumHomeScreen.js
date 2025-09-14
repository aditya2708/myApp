import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { useGetKurikulumStatisticsQuery, useGetTemplateAdoptionsQuery } from '../../api/kurikulumApi';
import { resetNavigation } from '../../redux/kurikulumSlice';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

/**
 * Kurikulum Home Screen - Sprint 1 Basic Implementation
 * Main entry point for kurikulum management
 */
const KurikulumHomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  
  // Get statistics from API
  const {
    data: statistics,
    isLoading,
    error,
    refetch
  } = useGetKurikulumStatisticsQuery();

  // Get pending template adoptions count
  const {
    data: pendingTemplates,
    refetch: refetchTemplates
  } = useGetTemplateAdoptionsQuery({ 
    status: 'pending' 
  });

  // Reset navigation state when entering kurikulum section
  useEffect(() => {
    dispatch(resetNavigation());
  }, [dispatch]);

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
      refetchTemplates();
    }, [refetch, refetchTemplates])
  );

  const handleMenuPress = (menuType) => {
    switch (menuType) {
      case 'kelola_kurikulum':
        navigation.navigate('JenjangSelection');
        break;
      case 'semester':
        navigation.navigate('SemesterManagement');
        break;
      case 'template_adoption':
        navigation.navigate('TemplateAdoption');
        break;
      case 'master_data':
        navigation.navigate('MasterData');
        break;
      default:
        Alert.alert('Info', 'Fitur akan segera hadir');
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Memuat data kurikulum..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Gagal memuat data kurikulum"
        onRetry={refetch}
      />
    );
  }

  const stats = statistics?.data || {};

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          colors={['#007bff']}
        />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kelola Kurikulum</Text>
        <Text style={styles.headerSubtitle}>
          Sistem manajemen kurikulum untuk Admin Cabang
        </Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="library-outline" size={24} color="#007bff" />
            <Text style={styles.statNumber}>{stats.total_jenjang || 0}</Text>
            <Text style={styles.statLabel}>Jenjang</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="school-outline" size={24} color="#28a745" />
            <Text style={styles.statNumber}>{stats.total_kelas || 0}</Text>
            <Text style={styles.statLabel}>Kelas</Text>
          </View>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color="#ffc107" />
            <Text style={styles.statNumber}>{stats.total_mata_pelajaran || 0}</Text>
            <Text style={styles.statLabel}>Mata Pelajaran</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={24} color="#dc3545" />
            <Text style={styles.statNumber}>{stats.total_materi || 0}</Text>
            <Text style={styles.statLabel}>Materi</Text>
          </View>
        </View>
      </View>

      {/* Menu Section */}
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Menu Kurikulum</Text>
        
        {/* Kelola Kurikulum */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuPress('kelola_kurikulum')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="library" size={24} color="#007bff" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Kelola Kurikulum</Text>
            <Text style={styles.menuDescription}>
              Kelola jenjang, kelas, mata pelajaran, dan materi pembelajaran
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Semester Management */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuPress('semester')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="calendar" size={24} color="#28a745" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Kelola Semester</Text>
            <Text style={styles.menuDescription}>
              Kelola semester dan periode pembelajaran
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>


        {/* Template Adoption */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuPress('template_adoption')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="download" size={24} color="#ff6b35" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Adopsi Template</Text>
            <Text style={styles.menuDescription}>
              Adopsi template materi dari Admin Pusat
            </Text>
          </View>
          <View style={styles.notificationContainer}>
            {pendingTemplates?.data?.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {pendingTemplates.data.length}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>

        {/* Master Data */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuPress('master_data')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="settings" size={24} color="#ff6b35" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Master Data</Text>
            <Text style={styles.menuDescription}>
              Kelola kelas custom & mata pelajaran custom
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#17a2b8" />
          <Text style={styles.infoText}>
            Sprint 1: Implementasi dasar kurikulum dan semester management
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  statsContainer: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343a40',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 15,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationBadge: {
    backgroundColor: '#dc3545',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  notificationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0056b3',
    marginLeft: 10,
    lineHeight: 16,
  },
});

export default KurikulumHomeScreen;