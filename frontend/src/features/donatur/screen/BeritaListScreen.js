import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import EmptyState from '../../../common/components/EmptyState';
import { donaturBeritaApi } from '../api/donaturBeritaApi';

const BeritaListScreen = () => {
  const navigation = useNavigation();
  const [beritaList, setBeritaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);

  const fetchBeritaList = async (page = 1, search = '', isRefresh = false) => {
    try {
      if (page === 1) {
        setError(null);
        if (!isRefresh) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = {
        page,
        per_page: 10,
        ...(search && { search })
      };

      const response = await donaturBeritaApi.getBeritaList(params);
      const newData = response.data.data;

      if (page === 1) {
        setBeritaList(newData);
      } else {
        setBeritaList(prev => [...prev, ...newData]);
      }

      setCurrentPage(page);
      setHasMorePages(response.data.pagination.has_more_pages);
    } catch (err) {
      console.error('Error fetching berita:', err);
      setError('Failed to load berita. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchBeritaList();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchBeritaList(1, searchQuery, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMorePages) {
      fetchBeritaList(currentPage + 1, searchQuery);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchBeritaList(1, searchQuery);
  };

  const navigateToDetail = (berita) => {
    navigation.navigate('BeritaDetail', { 
      beritaId: berita.id_berita,
      beritaTitle: berita.judul 
    });
  };

 const formatDate = (dateString) => {
    if (!dateString) return '';
    
    let date;
    if (dateString.includes('-')) {
      const parts = dateString.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          date = new Date(parts[0], parts[1] - 1, parts[2]);
        } else {
          date = new Date(parts[2], parts[1] - 1, parts[0]);
        }
      } else {
        date = new Date(dateString);
      }
    } else {
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderBeritaItem = ({ item }) => (
    <TouchableOpacity style={styles.beritaCard} onPress={() => navigateToDetail(item)}>
      {item.photos && item.photos.length > 0 && (
        <Image source={{ uri: item.photos[0] }} style={styles.beritaImage} />
      )}
      <View style={styles.beritaContent}>
        <Text style={styles.beritaTitle} numberOfLines={2}>{item.judul}</Text>
        <Text style={styles.beritaDate}>{formatDate(item.tanggal)}</Text>
        <View style={styles.beritaStats}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.views_berita || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={14} color="#666" />
            <Text style={styles.statText}>{item.likes_berita || 0}</Text>
          </View>
          {item.kategori && (
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{item.kategori.nama}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#9b59b6" />
      </View>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Loading berita..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari berita..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              fetchBeritaList(1, '');
            }}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchBeritaList(1, searchQuery)}
        />
      )}

      {beritaList.length === 0 && !loading && !error ? (
        <EmptyState
          icon="newspaper-outline"
          title="No Berita Found"
          message={searchQuery ? "No berita match your search." : "No berita available at the moment."}
          onRetry={() => fetchBeritaList(1, searchQuery)}
        />
      ) : (
        <FlatList
          data={beritaList}
          renderItem={renderBeritaItem}
          keyExtractor={(item) => item.id_berita.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingHorizontal: 16,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  beritaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  beritaImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  beritaContent: {
    padding: 16,
  },
  beritaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  beritaDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  beritaStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  categoryTag: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  categoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default BeritaListScreen;