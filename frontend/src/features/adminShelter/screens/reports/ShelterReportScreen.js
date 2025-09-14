import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ShelterReportScreen = ({ navigation }) => {
  const reportMenus = [
    {
      id: 'raport',
      title: 'Laporan Raport Anak',
      description: 'Laporan nilai dan prestasi akademik anak binaan',
      icon: 'document-text-outline',
      color: '#3498db',
      screen: 'LaporanRaportAnak'
    },
    {
      id: 'histori',
      title: 'Laporan Histori Anak',
      description: 'Riwayat perkembangan dan perubahan data anak',
      icon: 'time-outline',
      color: '#e74c3c',
      screen: 'LaporanHistoriAnak'
    },
    {
      id: 'aktivitas',
      title: 'Laporan Aktivitas',
      description: 'Laporan kegiatan dan partisipasi anak binaan',
      icon: 'calendar-outline',
      color: '#2ecc71',
      screen: 'LaporanAktivitas'
    },
    {
      id: 'surat',
      title: 'Laporan Surat Anak',
      description: 'Laporan korespondensi dan komunikasi anak',
      icon: 'mail-outline',
      color: '#f39c12',
      screen: 'LaporanSuratAnak'
    }
  ];

  const handleMenuPress = (screen) => {
    navigation.navigate(screen);
  };

  const renderReportCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.reportCard}
      onPress={() => handleMenuPress(item.screen)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={32} color={item.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Laporan Shelter</Text>
          <Text style={styles.headerSubtitle}>
            Pilih jenis laporan yang ingin Anda lihat
          </Text>
        </View>

        <View style={styles.menuContainer}>
          {reportMenus.map(renderReportCard)}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Laporan akan menampilkan data sesuai dengan shelter yang Anda kelola
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 20
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22
  },
  menuContainer: {
    paddingHorizontal: 16
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  cardContent: {
    flex: 1,
    paddingRight: 8
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4
  },
  cardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20
  },
  chevronContainer: {
    padding: 4
  },
  footer: {
    marginTop: 24,
    paddingHorizontal: 16
  },
  footerText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    fontStyle: 'italic'
  }
});

export default ShelterReportScreen;