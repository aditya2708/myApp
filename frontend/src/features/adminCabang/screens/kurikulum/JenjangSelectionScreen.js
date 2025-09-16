import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useGetKurikulumStrukturQuery } from '../../api/kurikulumApi';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

/**
 * Jenjang Selection Screen - Sprint 1 Placeholder
 * Allows user to select educational level (SD, SMP, SMA)
 */
const JenjangSelectionScreen = ({ navigation, route }) => {
  const { kurikulumId: routeKurikulumId, kurikulum: routeKurikulum } = route?.params || {};

  const { selectedKurikulumId, selectedKurikulum } = useSelector(state => state?.kurikulum || {});

  const activeKurikulum = routeKurikulum || selectedKurikulum;
  const activeKurikulumId = routeKurikulumId ?? selectedKurikulumId ?? activeKurikulum?.id_kurikulum;
  const shouldSkipQuery = !activeKurikulumId;

  const {
    data: struktur,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetKurikulumStrukturQuery(activeKurikulumId, {
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
      kurikulumId: activeKurikulumId,
      kurikulum: activeKurikulum
    });
  };

  if (shouldSkipQuery) {
    return (
      <View style={styles.emptyWrapper}>
        <Ionicons name="library-outline" size={56} color="#adb5bd" style={styles.emptyIcon} />
        <Text style={styles.emptyTitle}>Pilih Kurikulum Terlebih Dahulu</Text>
        <Text style={styles.emptySubtitle}>
          Untuk mengelola jenjang, pilih kurikulum yang ingin digunakan.
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
        {activeKurikulum && (
          <View style={styles.kurikulumBadge}>
            <Ionicons name="ribbon-outline" size={18} color="#007bff" style={{ marginRight: 6 }} />
            <Text style={styles.kurikulumBadgeText} numberOfLines={1}>
              {activeKurikulum?.nama_kurikulum || 'Kurikulum tanpa nama'}
            </Text>
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
    backgroundColor: '#e7f1ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  kurikulumBadgeText: {
    flex: 1,
    fontSize: 13,
    color: '#0d6efd',
    fontWeight: '600',
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