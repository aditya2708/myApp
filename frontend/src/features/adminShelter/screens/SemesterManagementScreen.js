import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import API service
import { adminShelterApi } from '../api/adminShelterApi';

const SemesterManagementScreen = () => {
  const navigation = useNavigation();
  
  const [semesters, setSemesters] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSemesterData();
  }, []);

  const loadSemesterData = async () => {
    try {
      setError(null);
      
      // Load all data concurrently
      const [semesterResponse, activeResponse, statsResponse] = await Promise.all([
        adminShelterApi.getSemesters(),
        adminShelterApi.getActiveSemester(),
        adminShelterApi.getSemesterStatistics()
      ]);

      if (semesterResponse.data.success) {
        setSemesters(semesterResponse.data.data || []);
      }
      
      if (activeResponse.data.success) {
        setActiveSemester(activeResponse.data.data);
      }
      
      if (statsResponse.data.success) {
        setStatistics(statsResponse.data.data);
      }
      
    } catch (err) {
      console.error('Error loading semester data:', err);
      setError('Gagal memuat data semester');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSemesterData();
  };

  const navigateToDetail = (semester) => {
    // Read-only view - show semester info in alert for now
    Alert.alert(
      `Semester: ${semester.nama || semester.nama_semester}`,
      `Tahun Ajaran: ${semester.tahun_ajaran}\nPeriode: ${semester.periode}\nStatus: ${semester.status}\n\nData semester dikelola oleh Admin Cabang`,
      [{ text: 'OK' }]
    );
  };

  const renderSemester = ({ item }) => {
    const isActive = item.status === 'active' || item.aktif;
    
    return (
      <TouchableOpacity
        style={[styles.semesterCard, isActive && styles.activeSemesterCard]}
        onPress={() => navigateToDetail(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.semesterInfo}>
            <Text style={styles.semesterName}>{item.nama || item.nama_semester}</Text>
            <Text style={styles.semesterYear}>{item.tahun_ajaran}</Text>
          </View>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>AKTIF</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>
              {item.mulai ? new Date(item.mulai).toLocaleDateString('id-ID') : 'N/A'} - {item.selesai ? new Date(item.selesai).toLocaleDateString('id-ID') : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>Periode {item.periode}</Text>
          </View>
          
          {item.kurikulum && (
            <View style={styles.infoRow}>
              <Ionicons name="book-outline" size={16} color="#7f8c8d" />
              <Text style={styles.infoText}>{item.kurikulum.nama}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.readOnlyNote}>
            Data semester dikelola oleh Admin Cabang
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat semester..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {error && (
        <ErrorMessage
          message={error}
          onRetry={loadSemesterData}
        />
      )}

      {/* Statistics Cards */}
      {statistics && (
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Total Semester</Text>
            <Text style={styles.statsValue}>{statistics.total || 0}</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Aktif</Text>
            <Text style={[styles.statsValue, styles.activeValue]}>{statistics.active || 0}</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Selesai</Text>
            <Text style={styles.statsValue}>{statistics.completed || 0}</Text>
          </View>
        </View>
      )}

      {/* Active Semester Banner */}
      {activeSemester && (
        <View style={styles.activeBanner}>
          <View style={styles.bannerHeader}>
            <Ionicons name="calendar" size={24} color="#fff" />
            <Text style={styles.bannerTitle}>Semester Aktif</Text>
          </View>
          <Text style={styles.bannerSemester}>{activeSemester.nama || activeSemester.nama_semester}</Text>
          <Text style={styles.bannerYear}>{activeSemester.tahun_ajaran}</Text>
        </View>
      )}

      {/* Semester List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Semua Semester</Text>
        
        {semesters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>Belum ada semester</Text>
            <Text style={styles.emptySubText}>Semester akan muncul setelah dibuat oleh Admin Cabang</Text>
          </View>
        ) : (
          <FlatList
            data={semesters}
            renderItem={renderSemester}
            keyExtractor={(item) => (item.id || item.id_semester).toString()}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  // Statistics Cards
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  activeValue: {
    color: '#27ae60',
  },
  
  // Active Semester Banner
  activeBanner: {
    backgroundColor: '#3498db',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  bannerSemester: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  bannerYear: {
    fontSize: 16,
    color: '#ecf0f1',
  },
  
  // List Container
  listContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  
  // Semester Cards
  semesterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeSemesterCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  semesterInfo: {
    flex: 1,
  },
  semesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  semesterYear: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  activeBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  readOnlyNote: {
    fontSize: 12,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default SemesterManagementScreen;