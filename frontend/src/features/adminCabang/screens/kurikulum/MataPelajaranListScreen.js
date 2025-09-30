import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { useGetMataPelajaranQuery } from '../../api/kurikulumApi';
import {
  selectSelectedKurikulum,
  selectSelectedKurikulumId,
  selectActiveKurikulum,
  selectActiveKurikulumId,
} from '../../redux/kurikulumSlice';

const getFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

/**
 * Mata Pelajaran List Screen - API Integrated
 * Shows list of subjects for selected jenjang and kelas
 */
const resolveKurikulumId = (value) => (
  value?.id_kurikulum
  ?? value?.kurikulum_id
  ?? value?.id
  ?? null
);

const MataPelajaranListScreen = ({ navigation, route }) => {
  const { jenjang, kelas, kurikulumId: routeKurikulumId, kurikulum: routeKurikulum } = route.params || {};

  const selectedKurikulumId = useSelector(selectSelectedKurikulumId);
  const selectedKurikulum = useSelector(selectSelectedKurikulum);
  const activeKurikulumId = useSelector(selectActiveKurikulumId);
  const activeKurikulum = useSelector(selectActiveKurikulum);

  const resolvedRouteId = getFirstDefined(routeKurikulumId, resolveKurikulumId(routeKurikulum));
  const resolvedSelectedId = getFirstDefined(selectedKurikulumId, resolveKurikulumId(selectedKurikulum));
  const resolvedActiveId = getFirstDefined(activeKurikulumId, resolveKurikulumId(activeKurikulum));

  const effectiveKurikulumId = getFirstDefined(resolvedRouteId, resolvedSelectedId, resolvedActiveId);
  const effectiveKurikulum = routeKurikulum || selectedKurikulum || activeKurikulum || null;
  const shouldSkipQuery = !jenjang?.id_jenjang || !kelas?.id_kelas || !effectiveKurikulumId;
  const isUsingActive = Boolean(
    effectiveKurikulumId && resolvedActiveId && String(effectiveKurikulumId) === String(resolvedActiveId)
  );

  // API hooks
  const {
    data: mataPelajaranResponse,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetMataPelajaranQuery({
    jenjang: jenjang?.id_jenjang,
    kelas: kelas?.id_kelas
  }, {
    skip: shouldSkipQuery
  });

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!shouldSkipQuery) {
        refetch();
      }
    }, [refetch, shouldSkipQuery])
  );

  const handleMataPelajaranSelect = (mataPelajaran) => {
    navigation.navigate('MateriManagement', {
      jenjang,
      kelas,
      mataPelajaran,
      kurikulumId: effectiveKurikulumId,
      kurikulum: effectiveKurikulum
    });
  };

  if (!effectiveKurikulumId) {
    return (
      <View style={styles.emptyWrapper}>
        <Ionicons name="library-outline" size={56} color="#adb5bd" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Tetapkan Kurikulum Lebih Dulu</Text>
        <Text style={styles.emptySubtitle}>
          Tetapkan kurikulum aktif atau pilih kurikulum untuk melihat daftar mata pelajaran.
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('SelectKurikulum')}
        >
          <Ionicons name="search-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.emptyButtonText}>Pilih Kurikulum</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          refreshing={isFetching}
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
        {effectiveKurikulum && (
          <View
            style={[
              styles.kurikulumBadge,
              isUsingActive ? styles.kurikulumBadgeActive : styles.kurikulumBadgeSelected,
            ]}
          >
            <Ionicons
              name={isUsingActive ? 'flash-outline' : 'checkmark-circle-outline'}
              size={18}
              color={isUsingActive ? '#0d6efd' : '#f59f00'}
              style={{ marginRight: 8 }}
            />
            <View style={styles.kurikulumBadgeTextContainer}>
              <Text
                style={[
                  styles.kurikulumBadgeLabel,
                  isUsingActive ? styles.kurikulumBadgeLabelActive : styles.kurikulumBadgeLabelSelected,
                ]}
              >
                {isUsingActive ? 'Menggunakan kurikulum aktif' : 'Menggunakan kurikulum terpilih'}
              </Text>
              <Text
                style={[
                  styles.kurikulumBadgeText,
                  isUsingActive ? styles.kurikulumBadgeTextActive : styles.kurikulumBadgeTextSelected,
                ]}
                numberOfLines={1}
              >
                {effectiveKurikulum?.nama_kurikulum || 'Kurikulum tanpa nama'}
              </Text>
            </View>
          </View>
        )}
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
  kurikulumBadge: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  kurikulumBadgeActive: {
    backgroundColor: '#e7f1ff',
    borderWidth: 1,
    borderColor: '#cfe2ff',
  },
  kurikulumBadgeSelected: {
    backgroundColor: '#fff7e0',
    borderWidth: 1,
    borderColor: '#ffe08a',
  },
  kurikulumBadgeTextContainer: {
    flex: 1,
  },
  kurikulumBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kurikulumBadgeLabelActive: {
    color: '#0d6efd',
  },
  kurikulumBadgeLabelSelected: {
    color: '#d97706',
  },
  kurikulumBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  kurikulumBadgeTextActive: {
    color: '#0d3b66',
  },
  kurikulumBadgeTextSelected: {
    color: '#b45309',
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
  emptyWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default MataPelajaranListScreen;