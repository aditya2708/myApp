import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { useGetKurikulumListQuery, useSetKurikulumActiveMutation } from '../../api/kurikulumApi';
import {
  setSelectedKurikulum,
  setActiveKurikulum,
  selectActiveKurikulum,
  selectActiveKurikulumId,
  selectSelectedKurikulum,
  selectSelectedKurikulumId,
} from '../../redux/kurikulumSlice';

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
  const selectedKurikulum = useSelector(selectSelectedKurikulum);
  const selectedKurikulumId = useSelector(selectSelectedKurikulumId);
  const activeKurikulum = useSelector(selectActiveKurikulum);
  const activeKurikulumId = useSelector(selectActiveKurikulumId);
  const [setKurikulumActive, { isLoading: isSettingActive }] = useSetKurikulumActiveMutation();
  const [activatingId, setActivatingId] = React.useState(null);

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
  const activeId = React.useMemo(() => {
    if (activeKurikulumId) {
      return activeKurikulumId.toString();
    }

    const fallbackId = getKurikulumId(activeKurikulum);
    return fallbackId ? fallbackId.toString() : null;
  }, [activeKurikulumId, activeKurikulum]);
  const isSelectedSameAsActive = React.useMemo(() => (
    selectedId && activeId ? selectedId === activeId : false
  ), [selectedId, activeId]);
  const activatingKey = React.useMemo(
    () => (activatingId !== null && activatingId !== undefined ? activatingId.toString() : null),
    [activatingId],
  );

  React.useEffect(() => {
    if (!Array.isArray(kurikulumList) || kurikulumList.length === 0) {
      return;
    }

    const activeFromList = kurikulumList.find((item) => item?.is_active);

    if (!activeFromList) {
      return;
    }

    const listActiveId = getKurikulumId(activeFromList);
    const normalizedListId = listActiveId ? listActiveId.toString() : null;

    if (!activeId || normalizedListId !== activeId) {
      dispatch(setActiveKurikulum(activeFromList));
      return;
    }

    if (activeKurikulum && activeKurikulum.updated_at !== activeFromList?.updated_at) {
      dispatch(setActiveKurikulum(activeFromList));
    }
  }, [kurikulumList, dispatch, activeId, activeKurikulum]);

  const handleSelect = (kurikulum) => {
    dispatch(setSelectedKurikulum(kurikulum));
    navigation.navigate('JenjangSelection', {
      kurikulumId: getKurikulumId(kurikulum),
      kurikulum
    });
  };

  const handleCreateNew = () => {
    navigation.navigate('CreateKurikulum');
  };

  const confirmActivate = async (kurikulum) => {
    const kurikulumId = getKurikulumId(kurikulum);

    if (!kurikulumId) {
      Alert.alert('Error', 'ID kurikulum tidak valid.');
      return;
    }

    try {
      setActivatingId(kurikulumId);
      const response = await setKurikulumActive({ kurikulumId }).unwrap();
      const activatedData = response?.data || { ...kurikulum, is_active: true, status: 'aktif' };

      dispatch(setActiveKurikulum(activatedData));

      if (selectedId && kurikulumId.toString() === selectedId) {
        dispatch(setSelectedKurikulum(activatedData));
      }

      await refetch();
      Alert.alert('Berhasil', 'Kurikulum berhasil dijadikan aktif.');
    } catch (err) {
      Alert.alert('Error', err?.data?.message || err?.message || 'Gagal menjadikan kurikulum aktif.');
    } finally {
      setActivatingId(null);
    }
  };

  const handleActivate = (kurikulum) => {
    const name = kurikulum?.nama_kurikulum || 'Kurikulum tanpa nama';

    Alert.alert(
      'Jadikan kurikulum aktif',
      `Kurikulum "${name}" akan menjadi kurikulum aktif cabang. Lanjutkan?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Jadikan aktif',
          style: 'default',
          onPress: () => confirmActivate(kurikulum),
        },
      ],
    );
  };

  const renderHeader = () => {
    const showSelectedBanner = Boolean(selectedKurikulum && !isSelectedSameAsActive);

    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pilih Kurikulum Cabang</Text>
        <Text style={styles.headerSubtitle}>
          Pilih salah satu kurikulum untuk mulai mengelola jenjang, kelas, dan materi.
        </Text>

        {activeKurikulum && (
          <View style={[styles.currentSelectionCard, styles.activeBannerCard]}>
            <Ionicons name="flash" size={20} color="#0d6efd" style={styles.currentSelectionIcon} />
            <View style={styles.currentSelectionTextContainer}>
              <Text style={[styles.currentSelectionLabel, styles.activeBannerLabel]}>Aktif sekarang</Text>
              <Text style={[styles.currentSelectionTitle, styles.activeBannerTitle]} numberOfLines={1}>
                {activeKurikulum?.nama_kurikulum || 'Kurikulum tanpa nama'}
              </Text>
            </View>
          </View>
        )}

        {showSelectedBanner && (
          <View style={[styles.currentSelectionCard, styles.selectedBannerCard]}>
            <Ionicons name="checkmark-circle" size={20} color="#198754" style={styles.currentSelectionIcon} />
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
  };

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
    const normalizedItemId = itemId ? itemId.toString() : null;
    const isSelected = normalizedItemId && selectedId ? normalizedItemId === selectedId : false;
    const isActive = Boolean(
      item?.is_active || (normalizedItemId && activeId ? normalizedItemId === activeId : false)
    );
    const statusInfo = getStatusInfo(item);
    const isActivatingThis = Boolean(
      isSettingActive && activatingKey && normalizedItemId === activatingKey
    );

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected, isActive && styles.cardActive]}
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
          <View style={styles.cardHeaderRight}>
            {isActive && (
              <View style={styles.activeChip}>
                <Ionicons name="flash" size={14} color="#0d6efd" style={{ marginRight: 4 }} />
                <Text style={styles.activeChipText}>Aktif</Text>
              </View>
            )}
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color="#28a745" style={styles.selectedIcon} />
            )}
          </View>
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

        <View style={styles.cardMetaRow}>
          {statusInfo && (
            <View style={styles.statusBadge}>
              <Ionicons name="ellipse" size={10} color={statusInfo.color} style={{ marginRight: 6 }} />
              <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          )}
          <View style={styles.metaSpacer} />
          {isActive ? (
            <View style={styles.activePill}>
              <Ionicons name="ribbon-outline" size={14} color="#14532d" style={{ marginRight: 6 }} />
              <Text style={styles.activePillText}>Aktif sekarang</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.activateButton, isActivatingThis && styles.activateButtonDisabled]}
              onPress={() => handleActivate(item)}
              disabled={isSettingActive}
            >
              {isActivatingThis ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="flash" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.activateButtonText}>Jadikan aktif</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f1f5f9',
  },
  activeBannerCard: {
    backgroundColor: '#e7f1ff',
    borderWidth: 1,
    borderColor: '#cfe2ff',
  },
  selectedBannerCard: {
    backgroundColor: '#e8f6ed',
    borderWidth: 1,
    borderColor: '#c7eed8',
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
  activeBannerLabel: {
    color: '#0d6efd',
  },
  activeBannerTitle: {
    color: '#0d3b66',
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
  cardActive: {
    borderColor: '#198754',
    shadowOpacity: 0.12,
    shadowRadius: 9,
    backgroundColor: '#f0fdf4',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderRight: {
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
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  metaSpacer: {
    flex: 1,
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
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf2ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  activeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0d6efd',
  },
  selectedIcon: {
    marginLeft: 4,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d6efd',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activateButtonDisabled: {
    opacity: 0.7,
  },
  activateButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
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
