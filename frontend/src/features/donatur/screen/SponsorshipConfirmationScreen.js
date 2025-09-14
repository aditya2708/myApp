import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import { donaturMarketplaceApi } from '../api/donaturMarketplaceApi';

const SponsorshipConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childData } = route.params;

  const [loading, setLoading] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  const handleConfirmSponsorship = async () => {
    if (!agreementAccepted) {
      Alert.alert('Persetujuan Diperlukan', 'Harap setujui syarat dan ketentuan terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      await donaturMarketplaceApi.sponsorChild(childId, {
        agreement_accepted: true,
        sponsorship_date: new Date().toISOString(),
      });

      navigation.navigate('SponsorshipSuccess', { 
        childId, 
        childData 
      });
    } catch (error) {
      console.error('Error sponsoring child:', error);
      Alert.alert(
        'Sponsorship Gagal',
        'Terjadi kesalahan saat memproses sponsorship. Silakan coba lagi.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const sponsorshipTerms = [
    'Komitmen sponsorship minimal 1 tahun',
    'Kontribusi bulanan sebesar Rp 500.000',
    'Laporan perkembangan anak setiap bulan',
    'Komunikasi dengan anak melalui aplikasi',
    'Kunjungan ke shelter dapat diatur',
    'Dana akan digunakan untuk pendidikan dan kebutuhan anak'
  ];

  if (loading) {
    return <LoadingSpinner fullScreen message="Memproses sponsorship..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Konfirmasi Sponsorship</Text>
        <Text style={styles.headerSubtitle}>Langkah terakhir untuk menjadi donatur</Text>
      </View>

      <View style={styles.childSummary}>
        <View style={styles.childImageContainer}>
          {childData.foto_url ? (
            <Image
              source={{ uri: childData.foto_url }}
              style={styles.childImage}
            />
          ) : (
            <View style={styles.childImagePlaceholder}>
              <Ionicons name="person" size={40} color="#ffffff" />
            </View>
          )}
        </View>
        
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{childData.full_name}</Text>
          <Text style={styles.childDetails}>
            {childData.umur ? `${childData.umur} tahun` : 'Usia tidak diketahui'} • 
            {childData.jenis_kelamin === 'L' ? ' Laki-laki' : ' Perempuan'}
          </Text>
          {childData.shelter && (
            <Text style={styles.childLocation}>
              <Ionicons name="location-outline" size={14} color="#666" /> 
              {childData.shelter.nama_shelter}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Syarat & Ketentuan Sponsorship</Text>
        <View style={styles.termsList}>
          {sponsorshipTerms.map((term, index) => (
            <View key={index} style={styles.termItem}>
              <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
              <Text style={styles.termText}>{term}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informasi Sponsorship</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Kontribusi Bulanan</Text>
            <Text style={styles.infoValue}>Rp 500.000</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Komitmen Minimal</Text>
            <Text style={styles.infoValue}>12 Bulan</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mulai Berlaku</Text>
            <Text style={styles.infoValue}>Bulan Ini</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yang Akan Anda Dapatkan</Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Ionicons name="document-text-outline" size={20} color="#9b59b6" />
            <Text style={styles.benefitText}>Laporan perkembangan bulanan</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="chatbubbles-outline" size={20} color="#9b59b6" />
            <Text style={styles.benefitText}>Komunikasi langsung dengan anak</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="trophy-outline" size={20} color="#9b59b6" />
            <Text style={styles.benefitText}>Update prestasi dan pencapaian</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="images-outline" size={20} color="#9b59b6" />
            <Text style={styles.benefitText}>Foto dan video aktivitas</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.agreementContainer}
        onPress={() => setAgreementAccepted(!agreementAccepted)}
      >
        <Ionicons 
          name={agreementAccepted ? "checkbox" : "square-outline"} 
          size={24} 
          color={agreementAccepted ? "#2ecc71" : "#ccc"} 
        />
        <Text style={styles.agreementText}>
          Saya setuju dengan syarat dan ketentuan sponsorship di atas
        </Text>
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Kembali</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.confirmButton,
            !agreementAccepted && styles.confirmButtonDisabled
          ]}
          onPress={handleConfirmSponsorship}
          disabled={!agreementAccepted}
        >
          <Text style={styles.confirmButtonText}>Konfirmasi Sponsorship</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#9b59b6',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  childSummary: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  childImageContainer: {
    marginRight: 16,
  },
  childImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  childImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  childLocation: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  termsList: {
    gap: 12,
  },
  termItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 12,
    flex: 1,
  },
  agreementContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
  },
  agreementText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#9b59b6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SponsorshipConfirmationScreen;