import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturPrestasiApi } from '../api/donaturPrestasiApi';

const { width } = Dimensions.get('window');

const ChildPrestasiDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, prestasiId, childName, onGoBack } = route.params;

  const [prestasi, setPrestasi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: `Prestasi - ${childName}`,
    });
  }, [navigation, childName]);

  const fetchPrestasiDetail = async () => {
    try {
      setError(null);
      const response = await donaturPrestasiApi.getPrestasiDetail(childId, prestasiId);
      setPrestasi(response.data.data);
    } catch (err) {
      console.error('Error fetching prestasi detail:', err);
      setError('Gagal memuat detail prestasi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrestasiDetail();
  }, [childId, prestasiId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPrestasiIcon = (jenis) => {
    const icons = {
      akademik: 'school',
      olahraga: 'fitness',
      seni: 'color-palette',
      karakter: 'heart'
    };
    return icons[jenis?.toLowerCase()] || 'trophy';
  };

  const getPrestasiColor = (level) => {
    const colors = {
      internasional: '#e74c3c',
      nasional: '#f39c12',
      provinsi: '#3498db',
      kota: '#2ecc71',
      sekolah: '#9b59b6'
    };
    return colors[level?.toLowerCase()] || '#95a5a6';
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat prestasi..." />;
  }

  if (error || !prestasi) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error || "Prestasi tidak ditemukan"}
          onRetry={fetchPrestasiDetail}
        />
      </View>
    );
  }

  const levelColor = getPrestasiColor(prestasi.level_prestasi);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: levelColor }]}>
          <Ionicons 
            name={getPrestasiIcon(prestasi.jenis_prestasi)} 
            size={40} 
            color="#ffffff" 
          />
        </View>
        
        <Text style={styles.prestasiTitle}>{prestasi.nama_prestasi}</Text>
        
        <View style={styles.badgeContainer}>
          <View style={[styles.typeBadge, { backgroundColor: levelColor }]}>
            <Text style={styles.badgeText}>{prestasi.jenis_prestasi}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{prestasi.level_prestasi}</Text>
          </View>
        </View>
        
        <Text style={styles.dateText}>
          Diraih pada {formatDate(prestasi.tgl_upload)}
        </Text>
      </View>

      {/* Photo */}
      {prestasi.foto_url && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Foto Prestasi</Text>
          <TouchableOpacity style={styles.photoWrapper}>
            <Image
              source={{ uri: prestasi.foto_url }}
              style={styles.prestasiPhoto}
              resizeMode="cover"
            />
            <View style={styles.photoOverlay}>
              <Ionicons name="expand" size={24} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Achievement Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detail Prestasi</Text>
        
        <View style={{ gap: 12 }}>
          {[
            { label: 'Jenis', value: prestasi.jenis_prestasi },
            { label: 'Tingkat', value: prestasi.level_prestasi, color: levelColor },
            { label: 'Nama Prestasi', value: prestasi.nama_prestasi },
            { label: 'Tanggal Dicatat', value: formatDate(prestasi.tgl_upload) }
          ].map((item, idx) => (
            <View key={idx} style={styles.detailItem}>
              <Text style={styles.detailLabel}>{item.label}</Text>
              <Text style={[styles.detailValue, item.color && { color: item.color }]}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Child Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diraih Oleh</Text>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>
            {prestasi.anak?.full_name || childName}
          </Text>
          <Text style={styles.childNote}>
            Kami bangga dengan prestasi ini!
          </Text>
        </View>
      </View>

      {/* Congratulations Message */}
      <View style={styles.congratsContainer}>
        <Ionicons name="star" size={24} color="#f39c12" />
        <Text style={styles.congratsText}>
          Selamat kepada {prestasi.anak?.full_name || childName} atas prestasi yang luar biasa ini!
        </Text>
        <Ionicons name="star" size={24} color="#f39c12" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  prestasiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 26,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  levelText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  photoWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  prestasiPhoto: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  childInfo: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  childNote: {
    fontSize: 14,
    color: '#666666',
    fontStyle: 'italic',
  },
  congratsContainer: {
    backgroundColor: '#fff3e0',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  congratsText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginHorizontal: 12,
    lineHeight: 22,
  },
});

export default ChildPrestasiDetailScreen;