import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminCabangSurveyApi } from '../api/adminCabangSurveyApi';

const SurveyApprovalListScreen = () => {
  const navigation = useNavigation();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({});

  const fetchSurveys = useCallback(async (params = {}) => {
    try {
      setError(null);
      const response = await adminCabangSurveyApi.getAllPendingSurveys(params);
      setSurveys(response.data.data.data);
      setPagination({
        currentPage: response.data.data.current_page,
        lastPage: response.data.data.last_page,
        total: response.data.data.total
      });
    } catch (err) {
      setError('Gagal memuat survei');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const searchTextRef = useRef(searchText);

  useEffect(() => {
    searchTextRef.current = searchText;
  }, [searchText]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSurveys({ search: searchTextRef.current });
    }, [fetchSurveys])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSurveys({ search: searchText });
  };

  const handleSearch = () => {
    setLoading(true);
    fetchSurveys({ search: searchText });
  };

  const navigateToDetail = (survey) => {
    navigation.navigate('SurveyApprovalDetail', { surveyId: survey.id_survey });
  };

  const InfoRow = ({ icon, text }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#666" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );

  const renderSurveyItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigateToDetail(item)}>
      <View style={styles.header}>
        <Text style={styles.familyName}>{item.keluarga?.kepala_keluarga}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>MENUNGGU</Text>
        </View>
      </View>
      
      <View style={styles.info}>
        <InfoRow icon="home-outline" text={item.keluarga?.shelter?.nama_shelter} />
        <InfoRow icon="people-outline" text={`${item.keluarga?.anak?.length || 0} Anak`} />
        <InfoRow icon="calendar-outline" text={new Date(item.created_at).toLocaleDateString()} />
      </View>

      {item.keluarga?.anak?.length > 0 && (
        <View style={styles.children}>
          <Text style={styles.childrenLabel}>Anak:</Text>
          {item.keluarga.anak.slice(0, 2).map((anak, index) => (
            <Text key={index} style={styles.childName}>
              {anak.full_name} ({anak.status_cpb})
            </Text>
          ))}
          {item.keluarga.anak.length > 2 && (
            <Text style={styles.moreChildren}>+{item.keluarga.anak.length - 2} lagi</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat survei..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari keluarga, nama anak, atau nomor KK..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchSurveys({ search: searchTextRef.current })}
        />
      )}

      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {pagination.total || 0} Survei Menunggu
        </Text>
      </View>

      <FlatList
        data={surveys}
        renderItem={renderSurveyItem}
        keyExtractor={(item) => item.id_survey.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada survei yang menunggu</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#2ecc71',
    padding: 12,
    borderRadius: 8,
  },
  stats: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  familyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  info: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  children: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  childrenLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  childName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  moreChildren: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default SurveyApprovalListScreen;