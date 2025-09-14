import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../../common/components/Button';

const ViewReportScreen = ({ navigation, route }) => {
  const { report, activityName, activityDate } = route.params || {};
  
  const photos = [
    { key: 'foto_1', url: report?.foto_1_url, label: 'Foto 1' },
    { key: 'foto_2', url: report?.foto_2_url, label: 'Foto 2' },
    { key: 'foto_3', url: report?.foto_3_url, label: 'Foto 3' }
  ].filter(photo => photo.url); // Only show photos that exist

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="document-text" size={32} color="#27ae60" />
        </View>
        <Text style={styles.title}>Laporan Kegiatan</Text>
        <Text style={styles.subtitle}>{activityName}</Text>
        {activityDate && <Text style={styles.date}>{activityDate}</Text>}
      </View>

      <View style={styles.statusContainer}>
        <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
        <Text style={styles.statusText}>Laporan sudah dikirim</Text>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar" size={16} color="#7f8c8d" />
          <Text style={styles.infoLabel}>Tanggal dibuat:</Text>
          <Text style={styles.infoValue}>{formatDate(report?.created_at)}</Text>
        </View>
        
        {report?.updated_at && report.updated_at !== report.created_at && (
          <View style={styles.infoRow}>
            <Ionicons name="refresh" size={16} color="#7f8c8d" />
            <Text style={styles.infoLabel}>Terakhir diperbarui:</Text>
            <Text style={styles.infoValue}>{formatDate(report.updated_at)}</Text>
          </View>
        )}
      </View>

      <View style={styles.photosSection}>
        <Text style={styles.sectionTitle}>Foto Dokumentasi ({photos.length})</Text>
        
        {photos.length === 0 ? (
          <View style={styles.noPhotosContainer}>
            <Ionicons name="image-outline" size={32} color="#bdc3c7" />
            <Text style={styles.noPhotosText}>Tidak ada foto</Text>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={photo.key} style={styles.photoContainer}>
                <Image source={{ uri: photo.url }} style={styles.photo} />
                <Text style={styles.photoLabel}>{photo.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Kembali"
          onPress={() => navigation.goBack()}
          type="outline"
          fullWidth
          leftIcon={<Ionicons name="arrow-back" size={18} color="#3498db" />}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  content: { 
    padding: 16, 
    paddingBottom: 40 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 20 
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 18, 
    color: '#3498db', 
    marginTop: 4, 
    textAlign: 'center' 
  },
  date: { 
    fontSize: 14, 
    color: '#7f8c8d', 
    marginTop: 2, 
    textAlign: 'center' 
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9'
  },
  statusText: {
    marginLeft: 8,
    color: '#27ae60',
    fontSize: 16,
    fontWeight: '500'
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  infoLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6c757d',
    flex: 1
  },
  infoValue: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right'
  },
  photosSection: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16
  },
  noPhotosContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  noPhotosText: {
    marginTop: 8,
    color: '#6c757d',
    fontSize: 14
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  photoContainer: {
    width: '32%',
    marginBottom: 12
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#f8f9fa'
  },
  photoLabel: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500'
  },
  buttonContainer: {
    marginTop: 20
  }
});

export default ViewReportScreen;