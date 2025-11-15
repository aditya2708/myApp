import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

const AdminCabangActivityReport = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Laporan Kegiatan</Text>
        <Text style={styles.subtitle}>
          Lihat ringkasan kegiatan yang telah dilaksanakan.
        </Text>
      </View>

      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>Fitur ini sedang dikembangkan</Text>
        <Text style={styles.descriptionText}>
          Halaman ini akan menampilkan laporan kegiatan seperti:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>• Jadwal kegiatan harian/mingguan</Text>
          <Text style={styles.featureItem}>• Partisipasi anak binaan</Text>
          <Text style={styles.featureItem}>• Laporan pelaksanaan kegiatan</Text>
          <Text style={styles.featureItem}>• Evaluasi hasil kegiatan</Text>
          <Text style={styles.featureItem}>• Dokumentasi kegiatan</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d3436',
  },
  subtitle: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 6,
  },
  messageContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  messageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e67e22',
    marginBottom: 16,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  featureList: {
    alignSelf: 'flex-start',
    width: '100%',
  },
  featureItem: {
    fontSize: 14,
    color: '#2d3436',
    marginBottom: 8,
    paddingLeft: 8,
  },
});

export default AdminCabangActivityReport;
