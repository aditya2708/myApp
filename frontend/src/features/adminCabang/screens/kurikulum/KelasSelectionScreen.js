import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useGetKelasByJenjangQuery } from '../../api/kurikulumApi';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import {
  selectSelectedKurikulum,
  selectSelectedKurikulumId,
  selectActiveKurikulum,
  selectActiveKurikulumId,
} from '../../redux/kurikulumSlice';

/**
 * Kelas Selection Screen - Sprint 1 Placeholder
 * Allows user to select class within a jenjang
 */
const resolveKurikulumId = (value) => (
  value?.id_kurikulum
  ?? value?.kurikulum_id
  ?? value?.id
  ?? null
);

const KelasSelectionScreen = ({ navigation, route }) => {
  const { jenjang, kurikulumId: routeKurikulumId, kurikulum: routeKurikulum } = route.params || {};

  const selectedKurikulumId = useSelector(selectSelectedKurikulumId);
  const selectedKurikulum = useSelector(selectSelectedKurikulum);
  const activeKurikulumId = useSelector(selectActiveKurikulumId);
  const activeKurikulum = useSelector(selectActiveKurikulum);

  const resolvedRouteId = routeKurikulumId ?? resolveKurikulumId(routeKurikulum);
  const resolvedSelectedId = selectedKurikulumId ?? resolveKurikulumId(selectedKurikulum);
  const resolvedActiveId = activeKurikulumId ?? resolveKurikulumId(activeKurikulum);

  const effectiveKurikulumId = resolvedRouteId ?? resolvedSelectedId ?? resolvedActiveId ?? null;
  const effectiveKurikulum = routeKurikulum || selectedKurikulum || activeKurikulum || null;
  const shouldSkipQuery = !jenjang?.id_jenjang || !effectiveKurikulumId;
  const isUsingActive = Boolean(
    effectiveKurikulumId && resolvedActiveId && String(effectiveKurikulumId) === String(resolvedActiveId)
  );

  const {
    data: kelasList,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetKelasByJenjangQuery(jenjang?.id_jenjang, {
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

  const handleKelasSelect = (kelas) => {
    navigation.navigate('MataPelajaranList', {
      jenjang,
      kelas,
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
          Tetapkan kurikulum aktif atau pilih kurikulum untuk melihat daftar kelas.
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
          refreshing={isFetching}
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
              color={isUsingActive ? '#0d6efd' : '#198754'}
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
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#bbf7d0',
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
    color: '#198754',
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
    color: '#166534',
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
    backgroundColor: '#28a745',
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

export default KelasSelectionScreen;