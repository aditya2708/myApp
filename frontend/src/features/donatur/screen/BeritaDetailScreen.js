import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Share
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturBeritaApi } from '../api/donaturBeritaApi';

const { width } = Dimensions.get('window');

const BeritaDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { beritaId, beritaTitle } = route.params;
  const [berita, setBerita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    navigation.setOptions({
      title: beritaTitle || 'Berita Detail',
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color="#9b59b6" />
        </TouchableOpacity>
      ),
    });
  }, [beritaTitle]);

  const fetchBeritaDetail = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const [detailResponse] = await Promise.all([
        donaturBeritaApi.getBeritaDetail(beritaId),
        donaturBeritaApi.incrementView(beritaId).catch(() => {})
      ]);
      
      setBerita(detailResponse.data.data);
    } catch (err) {
      console.error('Error fetching berita detail:', err);
      setError('Failed to load berita detail. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeritaDetail();
  }, [beritaId]);

  const handleShare = async () => {
    if (!berita) return;
    
    try {
      await Share.share({
        message: `${berita.judul}\n\nBaca selengkapnya di aplikasi Berbagi Pendidikan`,
        title: berita.judul
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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

  const renderImageCarousel = () => {
    if (!berita.photos || berita.photos.length === 0) return null;

    return (
      <View style={styles.imageContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(newIndex);
          }}
        >
          {berita.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo }}
              style={styles.beritaImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
        
        {berita.photos.length > 1 && (
          <View style={styles.imageIndicator}>
            {berita.photos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicatorDot,
                  index === currentImageIndex && styles.activeDot
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading berita detail..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={fetchBeritaDetail}
        />
      </View>
    );
  }

  if (!berita) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message="Berita not found"
          onRetry={fetchBeritaDetail}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderImageCarousel()}
      
      <View style={styles.content}>
        <Text style={styles.title}>{berita.judul}</Text>
        
        <View style={styles.metaInfo}>
          <Text style={styles.date}>{formatDate(berita.tanggal)}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.statText}>{berita.views_berita || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="heart-outline" size={16} color="#666" />
              <Text style={styles.statText}>{berita.likes_berita || 0}</Text>
            </View>
          </View>
        </View>

        {berita.kategori && (
          <View style={styles.categoryContainer}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{berita.kategori.nama}</Text>
            </View>
          </View>
        )}

        <View style={styles.contentTextContainer}>
          <Text style={styles.contentText}>{berita.konten}</Text>
        </View>

        {berita.tags && berita.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Tags:</Text>
            <View style={styles.tagsWrapper}>
              {berita.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag.nama}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerButton: {
    marginRight: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  beritaImage: {
    width: width,
    height: 250,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#fff',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 32,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  date: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTag: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  contentTextContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
    textAlign: 'justify',
  },
  tagsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tagsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#9b59b6',
    fontWeight: '500',
  },
});

export default BeritaDetailScreen;