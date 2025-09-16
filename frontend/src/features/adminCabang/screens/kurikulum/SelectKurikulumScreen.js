import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { useGetKurikulumListQuery } from '../../api/kurikulumApi';
import { setSelectedKurikulum } from '../../redux/kurikulumSlice';

const getKurikulumId = (item) => item?.id_kurikulum ?? item?.id;

const normalizeKurikulumList = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
};

const getStatusInfo = (item) => {
  const rawStatus = typeof item?.status_text === 'string' ? item.status_text : item?.status;
  const normalized = rawStatus ? rawStatus.toLowerCase() : null;

  if (normalized) {
    if (normalized.includes('aktif')) {
      return { color: '#28a745', label: 'Aktif' };
    }

    if (normalized.includes('draft')) {
      return { color: '#ffc107', label: 'Draft' };
    }

    if (normalized.includes('pending') || normalized.includes('menunggu')) {
      return { color: '#ff9800', label: rawStatus };
    }

    if (normalized.includes('non') || normalized.includes('tidak')) {
      return { color: '#dc3545', label: rawStatus };
    }

    return { color: '#6c757d', label: rawStatus };
  }

  if (typeof item?.is_active === 'boolean') {
    return {
      color: item.is_active ? '#28a745' : '#dc3545',
      label: item.is_active ? 'Aktif' : 'Tidak Aktif'
    };
  }

  return null;
};

const SelectKurikulumScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { selectedKurikulumId, selectedKurikulum } = useSelector(state => state?.kurikulum || {});

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetKurikulumListQuery();

  const kurikulumList = React.useMemo(() => normalizeKurikulumList(data), [data]);
  const selectedId = React.useMemo(() => {
    if (selectedKurikulumId) {
      return selectedKurikulumId.toString();
    }

    const fallbackId = getKurikulumId(selectedKurikulum);
    return fallbackId ? fallbackId.toString() : null;
  }, [selectedKurikulumId, selectedKurikulum]);

  const handleSelect = (kurikulum) => {
    dispatch(setSelectedKurikulum(kurikulum));
    navigation.navigate('JenjangSelection', {
      kurikulumId: getKurikulumId(kurikulum),
      kurikulum
    });
  };

  const handleCreateNew = () => {
    navigation.navigate('TemplateAdoption');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Pilih Kurikulum Cabang</Text>
      <Text style={styles.headerSubtitle}>
        Pilih salah satu kurikulum untuk mulai mengelola jenjang, kelas, dan materi.
      </Text>
      {selectedKurikulum && (
        <View style={styles.currentSelectionCard}>
          <Ionicons name="checkmark-circle" size={20} color="#28a745" style={styles.currentSelectionIcon} />
          <View style={styles.currentSelectionTextContainer}>
            <Text style={styles.currentSelectionLabel}>Terakhir dipilih</Text>
            <Text style={styles.currentSelectionTitle} numberOfLines={1}>
              {selectedKurikulum?.nama_kurikulum || 'Kurikulum tanpa nama'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderCreateButton = () => (
    <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
      <Ionicons name="add-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.createButtonText}>Buat Kurikulum Baru</Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="school-outline" size={72} color="#ced4da" style={{ marginBottom: 16 }} />
      <Text style={styles.emptyTitle}>Belum Ada Kurikulum</Text>
      <Text style={styles.emptySubtitle}>
        Mulai dengan membuat kurikulum baru agar materi pembelajaran dapat dikelola.
      </Text>
      {renderCreateButton()}
    </View>
  );

  const renderItem = ({ item }) => {
    const itemId = getKurikulumId(item);
    const isSelected = itemId && selectedId ? itemId.toString() === selectedId : false;
    const statusInfo = getStatusInfo(item);

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="library" size={22} color="#0d6efd" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item?.nama_kurikulum || 'Kurikulum tanpa nama'}
            </Text>
            {(item?.tahun_berlaku || item?.kode_kurikulum) && (
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {item?.tahun_berlaku ? `Tahun ${item.tahun_berlaku}` : ''}
                {item?.tahun_berlaku && item?.kode_kurikulum ? ' • ' : ''}
                {item?.kode_kurikulum || ''}
              </Text>
            )}
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#28a745" />
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.statItem}>
            <Ionicons name="book-outline" size={16} color="#6c757d" style={{ marginRight: 6 }} />
            <Text style={styles.statText}>
              {(item?.mata_pelajaran_count ?? item?.total_mata_pelajaran ?? 0)} Mata Pelajaran
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="document-text-outline" size={16} color="#6c757d" style={{ marginRight: 6 }} />
            <Text style={styles.statText}>
              {(item?.kurikulum_materi_count ?? item?.total_materi ?? 0)} Materi
            </Text>
          </View>
        </View>

        {statusInfo && (
          <View style={styles.statusBadge}>
            <Ionicons name="ellipse" size={10} color={statusInfo.color} style={{ marginRight: 6 }} />
            <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Memuat daftar kurikulum..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Gagal memuat daftar kurikulum"
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={kurikulumList}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${getKurikulumId(item) ?? index}`}
        extraData={selectedId}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={kurikulumList.length > 0 ? (
          <View style={styles.footer}>{renderCreateButton()}</View>
        ) : null}
        contentContainerStyle={styles.listContent}
        refreshControl={(
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            colors={['#0d6efd']}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  currentSelectionCard: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f6ed',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  currentSelectionIcon: {
    marginRight: 12,
  },
  currentSelectionTextContainer: {
    flex: 1,
  },
  currentSelectionLabel: {
    fontSize: 12,
    color: '#198754',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentSelectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#14532d',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  cardSelected: {
    borderColor: '#0d6efd',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#edf2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '600',
  },
  statusBadge: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f3f5',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d6efd',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#343a40',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  footer: {
    marginTop: 8,
  },
});

export default SelectKurikulumScreen;
