import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useGetKelasByJenjangQuery } from '../../api/kurikulumApi';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

/**
 * Kelas Selection Screen - Sprint 1 Placeholder
 * Allows user to select class within a jenjang
 */
const KelasSelectionScreen = ({ navigation, route }) => {
  const { jenjang } = route.params;
  
  const {
    data: kelasList,
    isLoading,
    error,
    refetch
  } = useGetKelasByJenjangQuery(jenjang.id_jenjang);

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleKelasSelect = (kelas) => {
    navigation.navigate('MataPelajaranList', { jenjang, kelas });
  };

  if (isLoading) {
    return <LoadingSpinner message="Memuat data kelas..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Gagal memuat data kelas"
        onRetry={refetch}
      />
    );
  }

  const kelas = kelasList?.data || [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refetch}
          colors={['#28a745']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Pilih Kelas - {jenjang.nama_jenjang}</Text>
        <Text style={styles.subtitle}>
          Pilih kelas untuk mengelola mata pelajaran dan materi
        </Text>
      </View>

      <View style={styles.content}>
        {kelas.map((kelasItem) => (
          <TouchableOpacity
            key={kelasItem.id_kelas}
            style={styles.kelasCard}
            onPress={() => handleKelasSelect(kelasItem)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="library" 
                  size={20} 
                  color="#28a745" 
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.kelasName}>{kelasItem.nama_kelas}</Text>
                <Text style={styles.kelasType}>
                  {kelasItem.jenis_kelas === 'standard' ? 'Kelas Standard' : 'Kelas Custom'}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.materiCount}>{kelasItem.materi_count || 0}</Text>
                <Text style={styles.materiLabel}>Materi</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))}

        {kelas.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Belum Ada Kelas</Text>
            <Text style={styles.emptySubtitle}>
              Belum ada kelas tersedia untuk jenjang {jenjang.nama_jenjang}
            </Text>
          </View>
        )}
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
  kelasCard: {
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
    backgroundColor: '#e8f5e8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  kelasName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
  },
  kelasType: {
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
    color: '#28a745',
  },
  materiLabel: {
    fontSize: 10,
    color: '#6c757d',
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

export default KelasSelectionScreen;