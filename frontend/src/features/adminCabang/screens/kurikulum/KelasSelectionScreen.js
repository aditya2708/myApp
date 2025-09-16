import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useGetKelasByJenjangQuery } from '../../api/kurikulumApi';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

/**
 * Kelas Selection Screen - Sprint 1 Placeholder
 * Allows user to select class within a jenjang
 */
const KelasSelectionScreen = ({ navigation, route }) => {
  const { jenjang, kurikulumId: routeKurikulumId, kurikulum: routeKurikulum } = route.params || {};

  const { selectedKurikulumId, selectedKurikulum } = useSelector(state => state?.kurikulum || {});

  const activeKurikulum = routeKurikulum || selectedKurikulum;
  const activeKurikulumId = routeKurikulumId ?? selectedKurikulumId ?? activeKurikulum?.id_kurikulum;
  const shouldSkipQuery = !jenjang?.id_jenjang || !activeKurikulumId;

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
      kurikulumId: activeKurikulumId,
      kurikulum: activeKurikulum
    });
  };

  if (!activeKurikulumId) {
    return (
      <View style={styles.emptyWrapper}>
        <Ionicons name="library-outline" size={56} color="#adb5bd" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Kurikulum Belum Dipilih</Text>
        <Text style={styles.emptySubtitle}>
          Pilih kurikulum terlebih dahulu untuk melihat daftar kelas.
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
        {activeKurikulum && (
          <View style={styles.kurikulumBadge}>
            <Ionicons name="ribbon-outline" size={18} color="#28a745" style={{ marginRight: 6 }} />
            <Text style={styles.kurikulumBadgeText} numberOfLines={1}>
              {activeKurikulum?.nama_kurikulum || 'Kurikulum tanpa nama'}
            </Text>
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
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  kurikulumBadgeText: {
    flex: 1,
    fontSize: 13,
    color: '#28a745',
    fontWeight: '600',
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