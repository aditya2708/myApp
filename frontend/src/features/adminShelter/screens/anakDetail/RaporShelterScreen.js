import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

// Import utils
import { formatDateToIndonesian } from '../../../../common/utils/dateFormatter';

// Import API
import { raportApi } from '../../api/raportApi';

const RaportScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { anakData, anakId } = route.params || {};
  
  const [raportList, setRaportList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total_raport: 0,
    semester_count: 0
  });

  // Fetch raport data
  const fetchRaportData = async () => {
    if (!anakId) return;
    
    try {
      setError(null);
      const response = await raportApi.getRaportByAnak(anakId);
      
      if (response.data.success) {
        setRaportList(response.data.data || []);
        
        // Set summary data if available
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
      } else {
        setError(response.data.message || 'Gagal memuat data raport');
      }
    } catch (err) {
      console.error('Error fetching raport data:', err);
      setError('Gagal memuat data raport. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchRaportData();
  }, [anakId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRaportData();
  };

  // Handle view raport detail
  const handleViewRaport = (item) => {
    navigation.navigate('RaportView', { raportId: item.id_raport });
  };

  // Handle create new raport
  const handleCreateRaport = () => {
    navigation.navigate('RaportGenerate', { anakId, anakData });
  };

  // Render raport item
  const renderRaportItem = ({ item }) => (
    <TouchableOpacity
      style={styles.raportCard}
      onPress={() => handleViewRaport(item)}
    >
      <View style={styles.raportHeader}>
        <Text style={styles.raportTitle}>{item.semester}</Text>
        <Text style={styles.raportSchoolLevel}>{item.tingkat} - Kelas {item.kelas}</Text>
      </View>
      
      <View style={styles.raportDetails}>
        <View style={styles.raportScores}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Min:</Text>
            <Text style={styles.scoreValue}>{item.nilai_min || '-'}</Text>
          </View>
          
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Rata-rata:</Text>
            <Text style={styles.scoreValue}>{item.nilai_rata_rata || '-'}</Text>
          </View>
          
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Max:</Text>
            <Text style={styles.scoreValue}>{item.nilai_max || '-'}</Text>
          </View>
        </View>
        
        <View style={styles.raportMeta}>
          <Text style={styles.raportDate}>
            {item.tanggal ? formatDateToIndonesian(item.tanggal) : ''}
          </Text>
          
          {item.foto_raport && item.foto_raport.length > 0 && (
            <View style={styles.photoIndicator}>
              <Ionicons name="image" size={16} color="#666" />
              <Text style={styles.photoCount}>{item.foto_raport.length} foto</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerImageContainer}>
            {anakData?.foto_url ? (
              <Image
                source={{ uri: anakData.foto_url }}
                style={styles.headerImage}
              />
            ) : (
              <View style={styles.headerImagePlaceholder}>
                <Ionicons name="person" size={40} color="#ffffff" />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{anakData?.full_name || 'Nama Anak'}</Text>
            {anakData?.nick_name && (
              <Text style={styles.headerNickname}>{anakData.nick_name}</Text>
            )}
          </View>
        </View>
        <LoadingSpinner message="Memuat data raport..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerImageContainer}>
          {anakData?.foto_url ? (
            <Image
              source={{ uri: anakData.foto_url }}
              style={styles.headerImage}
            />
          ) : (
            <View style={styles.headerImagePlaceholder}>
              <Ionicons name="person" size={40} color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{anakData?.full_name || 'Nama Anak'}</Text>
          {anakData?.nick_name && (
            <Text style={styles.headerNickname}>{anakData.nick_name}</Text>
          )}
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Error Message */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={fetchRaportData}
          />
        )}
        
        {/* Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Raport Anak</Text>
          <Button
            title="Tambah Raport"
            onPress={handleCreateRaport}
            leftIcon={<Ionicons name="add" size={16} color="#fff" />}
            size="small"
          />
        </View>
        
        {/* Raport List */}
        {raportList.length > 0 ? (
          <FlatList
            data={raportList}
            renderItem={renderRaportItem}
            keyExtractor={(item) => item.id_raport.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={80} color="#cccccc" />
            <Text style={styles.emptyTitle}>Belum Ada Raport</Text>
            <Text style={styles.emptyText}>
              Belum ada data raport untuk anak ini. Tambahkan raport baru untuk memulai.
            </Text>
            <Button
              title="Tambah Raport Pertama"
              onPress={handleCreateRaport}
              style={styles.emptyButton}
              leftIcon={<Ionicons name="add" size={16} color="#fff" />}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerImageContainer: {
    marginRight: 16,
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerNickname: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  raportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  raportHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  raportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  raportSchoolLevel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  raportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  raportScores: {
    flex: 1,
  },
  scoreItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  scoreLabel: {
    width: 80,
    fontSize: 14,
    color: '#666666',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  raportMeta: {
    alignItems: 'flex-end',
  },
  raportDate: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCount: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default RaportScreen;