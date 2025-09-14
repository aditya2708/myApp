import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Image, TextInput, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturAnakApi } from '../api/donaturAnakApi';

const ChildListScreen = () => {
  const navigation = useNavigation();
  const [children, setChildren] = useState([]);
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchChildren = async () => {
    try {
      setError(null);
      const response = await donaturAnakApi.getSponsoredChildren();
      const data = response.data.data || [];
      setChildren(data);
      setFilteredChildren(data);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Gagal memuat data anak asuh. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchChildren(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChildren();
  };

  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    setFilteredChildren(query === '' ? children : 
      children.filter(child => child.full_name.toLowerCase().includes(query)));
  }, [searchQuery, children]);

  const handleViewChild = (childId, childName) => {
    navigation.navigate('ChildProfile', { childId, childName });
  };

  const getGenderText = (gender) => {
    switch(gender) {
      case 'Laki-laki': return 'Laki-laki';
      case 'Perempuan': return 'Perempuan';
      default: return 'Jenis kelamin tidak diketahui';
    }
  };

  const renderChildItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.childCard}
      onPress={() => handleViewChild(item.id_anak, item.full_name)}
    >
      <View style={styles.childImageContainer}>
        {item.foto_url ? (
          <Image source={{ uri: item.foto_url }} style={styles.childImage} />
        ) : (
          <View style={styles.childImagePlaceholder}>
            <Ionicons name="person" size={36} color="#ffffff" />
          </View>
        )}
      </View>
      
      <View style={styles.childInfo}>
        <Text style={styles.childName}>{item.full_name}</Text>
        <Text style={styles.childDetails}>
          {item.umur ? `${item.umur} tahun` : 'Umur tidak diketahui'}
        </Text>
        <Text style={styles.childDetails}>{getGenderText(item.jenis_kelamin)}</Text>
        {item.shelter && (
          <Text style={styles.childShelter}>
            <Ionicons name="home-outline" size={12} color="#666" /> {item.shelter.nama_shelter}
          </Text>
        )}
      </View>
      
      <Ionicons name="chevron-forward" size={24} color="#cccccc" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat anak asuh..." />;
  }

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      {searchQuery.trim() !== '' ? (
        <>
          <Ionicons name="search" size={60} color="#cccccc" />
          <Text style={styles.emptyText}>Tidak ada anak ditemukan dengan "{searchQuery}"</Text>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>Hapus Pencarian</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Ionicons name="people" size={60} color="#cccccc" />
          <Text style={styles.emptyText}>Anda belum memiliki anak asuh</Text>
          <Text style={styles.emptySubText}>
            Hubungi admin untuk mulai mengasuh anak
          </Text>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {error && <ErrorMessage message={error} onRetry={fetchChildren} />}
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari anak..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>
      
      {filteredChildren.length > 0 ? (
        <FlatList
          data={filteredChildren}
          renderItem={renderChildItem}
          keyExtractor={(item) => item.id_anak.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        />
      ) : renderEmptyState()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchContainer: {
    padding: 16, backgroundColor: '#ffffff', 
    borderBottomWidth: 1, borderBottomColor: '#eeeeee'
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f2f2f2',
    borderRadius: 8, paddingHorizontal: 12
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, fontSize: 16, color: '#333333' },
  listContainer: { padding: 16 },
  childCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2
  },
  childImageContainer: { marginRight: 16 },
  childImage: { width: 60, height: 60, borderRadius: 30 },
  childImagePlaceholder: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#9b59b6',
    justifyContent: 'center', alignItems: 'center'
  },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 4 },
  childDetails: { fontSize: 14, color: '#666666', marginBottom: 2 },
  childShelter: { fontSize: 12, color: '#999999', marginTop: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: {
    fontSize: 16, color: '#999999', textAlign: 'center', 
    marginTop: 16, marginBottom: 8
  },
  emptySubText: {
    fontSize: 14, color: '#999999', textAlign: 'center', marginBottom: 24
  },
  clearButton: {
    paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#9b59b6',
    borderRadius: 8, marginTop: 8
  },
  clearButtonText: { color: '#ffffff', fontWeight: '500' }
});

export default ChildListScreen;