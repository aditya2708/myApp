import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { useGetMataPelajaranQuery } from '../../api/kurikulumApi';

/**
 * Mata Pelajaran List Screen - API Integrated
 * Shows list of subjects for selected jenjang and kelas
 */
const MataPelajaranListScreen = ({ navigation, route }) => {
  const { jenjang, kelas } = route.params;

  // API hooks
  const {
    data: mataPelajaranResponse,
    isLoading,
    error,
    refetch
  } = useGetMataPelajaranQuery({
    jenjang: jenjang.id_jenjang,
    kelas: kelas.id_kelas
  });

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleMataPelajaranSelect = (mataPelajaran) => {
    navigation.navigate('MateriManagement', { jenjang, kelas, mataPelajaran });
  };

  // Get mata pelajaran list from API response
  const mataPelajaranList = mataPelajaranResponse?.data || [];

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Memuat mata pelajaran..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        message="Gagal memuat mata pelajaran"
        onRetry={refetch}
      />
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          colors={['#ffc107']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mata Pelajaran</Text>
        <Text style={styles.subtitle}>
          {jenjang.nama_jenjang} - {kelas.nama_kelas}
        </Text>
      </View>

      <View style={styles.content}>
        {mataPelajaranList.map((mataPelajaran) => (
          <TouchableOpacity
            key={mataPelajaran.id_mata_pelajaran}
            style={styles.mataPelajaranCard}
            onPress={() => handleMataPelajaranSelect(mataPelajaran)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="book" 
                  size={20} 
                  color="#ffc107" 
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.mataPelajaranName}>{mataPelajaran.nama_mata_pelajaran}</Text>
                <Text style={styles.kategori}>
                  {mataPelajaran.kategori === 'wajib' ? 'Mata Pelajaran Wajib' : 
                   mataPelajaran.kategori === 'pilihan' ? 'Mata Pelajaran Pilihan' :
                   `Kategori: ${mataPelajaran.kategori || 'Umum'}`}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.materiCount}>{mataPelajaran.materi_count || 0}</Text>
                <Text style={styles.materiLabel}>Materi</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))}

        {mataPelajaranList.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Belum Ada Mata Pelajaran</Text>
            <Text style={styles.emptySubtitle}>
              Mata pelajaran belum tersedia untuk kelas ini
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#17a2b8" />
          <Text style={styles.infoText}>
            Data mata pelajaran sudah terintegrasi dengan backend API. 
            Tap mata pelajaran untuk mengelola materi pembelajaran.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  content: {
    padding: 20,
  },
  mataPelajaranCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff3cd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  mataPelajaranName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
  },
  kategori: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'center',
    marginRight: 10,
  },
  materiCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  materiLabel: {
    fontSize: 10,
    color: '#6c757d',
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0056b3',
    marginLeft: 10,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default MataPelajaranListScreen;