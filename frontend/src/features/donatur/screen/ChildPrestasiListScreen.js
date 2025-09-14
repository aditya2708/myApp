import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturPrestasiApi } from '../api/donaturPrestasiApi';

const ChildPrestasiListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName } = route.params;

  const [prestasiList, setPrestasiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: `Prestasi - ${childName}`,
    });
  }, [navigation, childName]);

  const fetchPrestasiList = async () => {
    try {
      setError(null);
      const response = await donaturPrestasiApi.getPrestasiList(childId);
      setPrestasiList(response.data.data);
    } catch (err) {
      console.error('Error fetching prestasi:', err);
      setError('Gagal memuat prestasi. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPrestasiList();
  }, [childId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPrestasiList();
  };

  const handleViewPrestasi = (prestasiId) => {
    navigation.navigate('ChildPrestasiDetail', { 
      childId, 
      prestasiId, 
      childName,
      onGoBack: fetchPrestasiList 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderPrestasiItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.prestasiCard, !item.is_read && styles.unreadCard]}
      onPress={() => handleViewPrestasi(item.id_prestasi)}
    >
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {item.foto_url ? (
            <Image
              source={{ uri: item.foto_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="trophy" size={32} color="#f39c12" />
            </View>
          )}
          {!item.is_read && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>BARU</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, !item.is_read && styles.unreadText]}>
            {item.nama_prestasi}
          </Text>
          
          <View style={styles.meta}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.jenis_prestasi}</Text>
            </View>
            <Text style={styles.level}>{item.level_prestasi}</Text>
          </View>
          
          <Text style={styles.date}>
            {formatDate(item.tgl_upload)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={24} color="#cccccc" />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat prestasi..." />;
  }

  return (
    <View style={styles.container}>
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchPrestasiList}
        />
      )}

      {prestasiList.length > 0 ? (
        <FlatList
          data={prestasiList}
          renderItem={renderPrestasiItem}
          keyExtractor={(item) => item.id_prestasi.toString()}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={60} color="#cccccc" />
          <Text style={styles.emptyText}>Belum ada prestasi</Text>
          <Text style={styles.emptySubText}>
            Prestasi {childName} akan muncul di sini ketika tersedia
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  prestasiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  level: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ChildPrestasiListScreen;