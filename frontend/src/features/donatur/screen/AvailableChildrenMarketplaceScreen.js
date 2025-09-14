import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturMarketplaceApi } from '../api/donaturMarketplaceApi';

const { width } = Dimensions.get('window');

const AvailableChildrenMarketplaceScreen = () => {
  const navigation = useNavigation();
  const [children, setChildren] = useState([]);
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [featuredChildren, setFeaturedChildren] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [childrenResponse, featuredResponse] = await Promise.all([
        donaturMarketplaceApi.getAvailableChildren(),
        donaturMarketplaceApi.getFeaturedChildren()
      ]);
      
      const childrenData = childrenResponse.data.data || [];
      const featuredData = featuredResponse.data.data || [];
      
      setChildren(childrenData);
      setFilteredChildren(childrenData);
      setFeaturedChildren(featuredData);
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
      setError('Gagal Memuat Data Anak. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChildren(children);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = children.filter(child => 
        child.full_name.toLowerCase().includes(query) ||
        child.shelter?.nama_shelter.toLowerCase().includes(query)
      );
      setFilteredChildren(filtered);
    }
  }, [searchQuery, children]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const navigateToChildProfile = (childId, childName) => {
  navigation.navigate('ChildMarketplaceDetail', { childId, childName });
};

  const renderChildCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.childCard}
      onPress={() => navigateToChildProfile(item.id_anak, item.full_name)}
    >
      <View style={styles.cardImageContainer}>
        {item.foto_url ? (
          <Image
            source={{ uri: item.foto_url }}
            style={styles.cardImage}
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
        )}
        {item.marketplace_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#ffffff" />
          </View>
        )}
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.childName} numberOfLines={1}>{item.full_name}</Text>
        <Text style={styles.childDetails}>
          {item.umur ? `${item.umur} tahun` : 'Usia tidak diketahui'}
        </Text>
        <Text style={styles.childDetails}>
          {item.jenis_kelamin === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'}
        </Text>
        {item.shelter && (
          <Text style={styles.shelterName} numberOfLines={1}>
            <Ionicons name="location-outline" size={12} color="#666" /> 
            {item.shelter.nama_shelter}
          </Text>
        )}
        {item.hafalan && (
          <View style={styles.tagContainer}>
            <Text style={styles.tag}>{item.hafalan}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat..." />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchData}
        />
      )}
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari anak atau lokasi..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {featuredChildren.length > 0 && searchQuery === '' && (
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Anak Pilihan</Text>
          <FlatList
            data={featuredChildren}
            renderItem={renderChildCard}
            keyExtractor={(item) => `featured-${item.id_anak}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
          />
        </View>
      )}

      <View style={styles.allChildrenSection}>
        <Text style={styles.sectionTitle}>
          {searchQuery ? `Hasil Pencarian (${filteredChildren.length})` : 'Semua Anak Tersedia'}
        </Text>
        
        {filteredChildren.length > 0 ? (
          <FlatList
            data={filteredChildren}
            renderItem={renderChildCard}
            keyExtractor={(item) => item.id_anak.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            contentContainerStyle={styles.gridContainer}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={60} color="#cccccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? `Tidak ada anak ditemukan dengan "${searchQuery}"` : 'Belum ada anak yang tersedia'}
            </Text>
            {searchQuery && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.clearButtonText}>Hapus Filter</Text>
              </TouchableOpacity>
            )}
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333333',
  },
  featuredSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  featuredList: {
    paddingHorizontal: 16,
  },
  allChildrenSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 16,
  },
  gridContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  childCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: width * 0.43,
  },
  cardImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: -5,
    right: 15,
    backgroundColor: '#f39c12',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
  },
  childDetails: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  shelterName: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
    textAlign: 'center',
  },
  tagContainer: {
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e8f5e8',
    color: '#2ecc71',
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  clearButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#9b59b6',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});

export default AvailableChildrenMarketplaceScreen;