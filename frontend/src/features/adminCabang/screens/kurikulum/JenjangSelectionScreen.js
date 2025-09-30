import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useGetKurikulumStrukturQuery } from '../../api/kurikulumApi';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import {
  selectSelectedKurikulum,
  selectSelectedKurikulumId,
  selectActiveKurikulum,
  selectActiveKurikulumId,
} from '../../redux/kurikulumSlice';

/**
 * Jenjang Selection Screen - Sprint 1 Placeholder
 * Allows user to select educational level (SD, SMP, SMA)
 */
const resolveKurikulumId = (value) => (
  value?.id_kurikulum
  ?? value?.kurikulum_id
  ?? value?.id
  ?? null
);

const JenjangSelectionScreen = ({ navigation, route }) => {
  const { kurikulumId: routeKurikulumId, kurikulum: routeKurikulum } = route?.params || {};

  const selectedKurikulumId = useSelector(selectSelectedKurikulumId);
  const selectedKurikulum = useSelector(selectSelectedKurikulum);
  const activeKurikulumId = useSelector(selectActiveKurikulumId);
  const activeKurikulum = useSelector(selectActiveKurikulum);

  const resolvedRouteId = routeKurikulumId ?? resolveKurikulumId(routeKurikulum);
  const resolvedSelectedId = selectedKurikulumId ?? resolveKurikulumId(selectedKurikulum);
  const resolvedActiveId = activeKurikulumId ?? resolveKurikulumId(activeKurikulum);

  const effectiveKurikulumId = resolvedRouteId ?? resolvedSelectedId ?? resolvedActiveId ?? null;
  const effectiveKurikulum = routeKurikulum || selectedKurikulum || activeKurikulum || null;
  const shouldSkipQuery = !effectiveKurikulumId;
  const isUsingActive = Boolean(
    effectiveKurikulumId && resolvedActiveId && String(effectiveKurikulumId) === String(resolvedActiveId)
  );

  const {
    data: struktur,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetKurikulumStrukturQuery(effectiveKurikulumId, {
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

  const handleJenjangSelect = (jenjang) => {
    navigation.navigate('KelasSelection', {
      jenjang,
      kurikulumId: effectiveKurikulumId,
      kurikulum: effectiveKurikulum
    });
  };

  if (shouldSkipQuery) {
    return (
      <View style={styles.emptyWrapper}>
        <Ionicons name="library-outline" size={56} color="#adb5bd" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Tetapkan Kurikulum Lebih Dulu</Text>
        <Text style={styles.emptySubtitle}>
          Tetapkan kurikulum aktif atau pilih kurikulum untuk mulai mengelola jenjang.
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
    return <LoadingSpinner message="Memuat data jenjang..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Gagal memuat data jenjang"
        onRetry={refetch}
      />
    );
  }

  const jenjangList = struktur?.data || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          colors={['#007bff']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Pilih Jenjang Pendidikan</Text>
        <Text style={styles.subtitle}>
          Pilih jenjang untuk mengelola kurikulum
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
        {jenjangList.map((jenjang) => (
          <TouchableOpacity
            key={jenjang.id_jenjang}
            style={styles.jenjangCard}
            onPress={() => handleJenjangSelect(jenjang)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons 
                  name="school" 
                  size={24} 
                  color="#007bff" 
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.jenjangName}>{jenjang.nama_jenjang}</Text>
                <Text style={styles.jenjangCode}>({jenjang.kode_jenjang})</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
            
            <View style={styles.cardStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{jenjang.kelas_count || 0}</Text>
                <Text style={styles.statLabel}>Kelas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{jenjang.mata_pelajaran_count || 0}</Text>
                <Text style={styles.statLabel}>Mata Pelajaran</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    fontSize: 20,
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
  jenjangCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
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
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e7f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  jenjangName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
  },
  jenjangCode: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
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
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343a40',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default JenjangSelectionScreen;