import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const SponsorshipSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childData } = route.params;

  const handleViewMyChildren = () => {
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Home' },
        { 
          name: 'Children', 
          params: { 
            screen: 'ChildProfile', 
            params: { childId, childName: childData.full_name }
          }
        }
      ],
    });
  };

  const handleBackToMarketplace = () => {
    navigation.navigate('Marketplace', { screen: 'MarketplaceList' });
  };

  const nextSteps = [
    {
      icon: 'chatbubbles-outline',
      title: 'Mulai Berkomunikasi',
      description: 'Kirim pesan pertama kepada anak asuh Anda',
      action: 'Kirim Pesan'
    },
    {
      icon: 'document-text-outline',
      title: 'Laporan Bulanan',
      description: 'Dapatkan update perkembangan setiap bulan',
      action: 'Lihat Laporan'
    },
    {
      icon: 'calendar-outline',
      title: 'Jadwal Kunjungan',
      description: 'Atur waktu untuk bertemu langsung',
      action: 'Atur Jadwal'
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.successHeader}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#2ecc71" />
        </View>
        <Text style={styles.successTitle}>Sponsorship Berhasil!</Text>
        <Text style={styles.successSubtitle}>
          Selamat! Anda telah menjadi donatur untuk {childData.full_name}
        </Text>
      </View>

      <View style={styles.childCard}>
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
            {childData.jenis_kelamin === 'Laki-laki' ? ' Laki-laki' : ' Perempuan'}
          </Text>
          {childData.shelter && (
            <Text style={styles.childLocation}>
              <Ionicons name="location-outline" size={14} color="#666" /> 
              {childData.shelter.nama_shelter}
            </Text>
          )}
        </View>
        
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Anak Asuh</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Ringkasan Sponsorship</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Kontribusi Bulanan</Text>
          <Text style={styles.summaryValue}>Rp 500.000</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tanggal Mulai</Text>
          <Text style={styles.summaryValue}>Bulan Ini</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Komitmen</Text>
          <Text style={styles.summaryValue}>12 Bulan</Text>
        </View>
      </View>

      <View style={styles.nextStepsSection}>
        <Text style={styles.nextStepsTitle}>Langkah Selanjutnya</Text>
        {nextSteps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={styles.stepIcon}>
              <Ionicons name={step.icon} size={24} color="#9b59b6" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
            <TouchableOpacity style={styles.stepAction}>
              <Text style={styles.stepActionText}>{step.action}</Text>
              <Ionicons name="chevron-forward" size={16} color="#9b59b6" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.congratsMessage}>
        <Ionicons name="heart" size={24} color="#e74c3c" />
        <Text style={styles.congratsText}>
          Terima kasih telah menjadi bagian dari perjalanan pendidikan {childData.full_name}. 
          Kontribusi Anda akan sangat berarti untuk masa depannya.
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewMyChildren}
        >
          <Text style={styles.primaryButtonText}>Lihat Profil Anak</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBackToMarketplace}
        >
          <Text style={styles.secondaryButtonText}>Cari Anak Lain</Text>
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
  successHeader: {
    backgroundColor: '#ffffff',
    padding: 40,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  childCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
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
  statusBadge: {
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  nextStepsSection: {
    margin: 16,
    marginTop: 0,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#f8f4ff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
  },
  stepAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepActionText: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '500',
    marginRight: 4,
  },
  congratsMessage: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  congratsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  actionButtons: {
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});

export default SponsorshipSuccessScreen;