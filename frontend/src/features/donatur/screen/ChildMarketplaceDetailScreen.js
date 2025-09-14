import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturMarketplaceApi } from '../api/donaturMarketplaceApi';
import { calculateAge } from '../../../common/utils/ageCalculator';

const { width } = Dimensions.get('window');

const ChildMarketplaceDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId } = route.params;

  const [child, setChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sponsoring, setSponsoring] = useState(false);
  const [error, setError] = useState(null);

  const fetchChildProfile = async () => {
    try {
      setError(null);
      const response = await donaturMarketplaceApi.getChildProfile(childId);
      setChild(response.data.data);
    } catch (err) {
      console.error('Error fetching child profile:', err);
      setError('Failed to load child profile. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChildProfile();
  }, [childId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChildProfile();
  };

  const handleSponsorChild = () => {
    if (!child) return;
    
    Alert.alert(
      'Konfirmasi Sponsorship',
      `Apakah Anda yakin ingin menjadikan ${child.full_name} sebagai anak asuh?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Ya, Lanjutkan', onPress: () => proceedToSponsorship() }
      ]
    );
  };

  const proceedToSponsorship = () => {
    navigation.navigate('SponsorshipConfirmation', { 
      childId: child.id_anak, 
      childData: child 
    });
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Loading child profile..." />;
  }

  if (!child) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error || "Child profile not found"}
          onRetry={fetchChildProfile}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.heroSection}>
          <View style={styles.imageContainer}>
            {child.foto_url ? (
              <Image
                source={{ uri: child.foto_url }}
                style={styles.heroImage}
              />
            ) : (
              <View style={styles.heroImagePlaceholder}>
                <Ionicons name="person" size={80} color="#ffffff" />
              </View>
            )}
            {child.marketplace_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={16} color="#ffffff" />
                <Text style={styles.featuredText}>Pilihan</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.heroName}>{child.full_name}</Text>
          <Text style={styles.heroNickname}>"{child.nick_name || '-'}"</Text>
          
          <View style={styles.basicInfoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Usia</Text>
              <Text style={styles.infoValue}>{calculateAge(child.tanggal_lahir)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Jenis Kelamin</Text>
              <Text style={styles.infoValue}>
                {child.jenis_kelamin === 'Laki-laki' ? 'Laki-laki' : child.jenis_kelamin === 'Perempuan' ? 'Perempuan' : '-'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Hafalan</Text>
              <Text style={styles.infoValue}>{child.hafalan || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kisah {child.full_name}</Text>
          <View style={styles.storyCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="book-outline" size={20} color="#9b59b6" />
              <Text style={styles.cardTitle}>Latar Belakang</Text>
            </View>
            <Text style={styles.storyText}>{child.background_story || '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.storyCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="school-outline" size={20} color="#2ecc71" />
              <Text style={styles.cardTitle}>Cita-cita & Tujuan Pendidikan</Text>
            </View>
            <Text style={styles.storyText}>{child.educational_goals || '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kepribadian</Text>
          <View style={styles.traitsContainer}>
            {child.personality_traits && child.personality_traits.length > 0 ? (
              child.personality_traits.map((trait, index) => (
                <View key={index} style={styles.traitTag}>
                  <Text style={styles.traitText}>{trait}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>-</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={[styles.storyCard, styles.specialNeedsCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="medical-outline" size={20} color="#e74c3c" />
              <Text style={styles.cardTitle}>Kebutuhan Khusus</Text>
            </View>
            <Text style={styles.storyText}>{child.special_needs || '-'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Personal</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tempat Lahir</Text>
              <Text style={styles.detailValue}>{child.tempat_lahir || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tanggal Lahir</Text>
              <Text style={styles.detailValue}>{child.tanggal_lahir || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Agama</Text>
              <Text style={styles.detailValue}>{child.agama || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Anak ke</Text>
              <Text style={styles.detailValue}>
                {child.anak_ke && child.dari_bersaudara ? 
                  `${child.anak_ke} dari ${child.dari_bersaudara} bersaudara` : '-'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tinggal Bersama</Text>
              <Text style={styles.detailValue}>{child.tinggal_bersama || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minat & Prestasi</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mata Pelajaran Favorit</Text>
              <Text style={styles.detailValue}>{child.pelajaran_favorit || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Hobi</Text>
              <Text style={styles.detailValue}>{child.hobi || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Prestasi</Text>
              <Text style={styles.detailValue}>{child.prestasi || '-'}</Text>
            </View>
          </View>
        </View>

        {child.shelter && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Shelter</Text>
            <View style={styles.shelterCard}>
              <Text style={styles.shelterName}>{child.shelter.nama_shelter}</Text>
              <Text style={styles.shelterAddress}>{child.shelter.alamat}</Text>
              {child.kelompok && (
                <Text style={styles.groupInfo}>
                  Kelompok: {child.kelompok.nama_kelompok} (Level {child.kelompok.level})
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.ctaContainer}>
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={handleSponsorChild}
        >
          <Ionicons name="heart" size={20} color="#ffffff" />
          <Text style={styles.ctaButtonText}>Jadikan Anak Asuh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  heroSection: {
    backgroundColor: '#9b59b6',
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  heroImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#fff',
  },
  heroImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#8e44ad',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  featuredBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#f39c12',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  heroName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  heroNickname: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  basicInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  shelterCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  shelterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  shelterAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  groupInfo: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '500',
  },
  storyCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  specialNeedsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  traitTag: {
    backgroundColor: '#fff3cd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#f39c12',
  },
  traitText: {
    fontSize: 12,
    color: '#f39c12',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ctaButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ChildMarketplaceDetailScreen;