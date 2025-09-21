import React, { useCallback, useState } from 'react';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminPusatApi } from '../../api/adminPusatApi';

const normalizeListResponse = (payload) => {
  if (!payload) {
    return { items: [], meta: null };
  }

  if (Array.isArray(payload)) {
    return { items: payload, meta: null };
  }

  if (Array.isArray(payload.data)) {
    return { items: payload.data, meta: payload.meta ?? null };
  }

  return { items: [], meta: payload.meta ?? null };
};

const ShelterListScreen = () => {
  const navigation = useNavigation();
  const [shelterList, setShelterList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const resetPagination = useCallback((options = {}) => {
    const { clearData = false } = options;

    setPage(1);
    setLastPage(1);
    setLoadingMore(false);

    if (clearData) {
      setShelterList([]);
      setMeta(null);
    }
  }, []);

  const fetchShelter = useCallback(
    async (options = {}) => {
      const { silent = false, page: requestedPage = 1 } = options;

      try {
        if (requestedPage === 1) {
          setError('');
        }

        if (requestedPage > 1) {
          setLoadingMore(true);
        } else if (!silent) {
          setLoading(true);
        }

        const response = await adminPusatApi.getShelter({ page: requestedPage });
        const payload = response?.data ?? null;
        const { items, meta: pagination } = normalizeListResponse(payload);
        const normalizedItems = Array.isArray(items) ? items : [];

        setMeta((prevMeta) =>
          pagination ?? (requestedPage > 1 ? prevMeta : null)
        );

        const derivedLastPageRaw =
          pagination?.last_page ??
          pagination?.lastPage ??
          pagination?.total_pages ??
          pagination?.totalPages ??
          pagination?.pages ??
          pagination?.pageCount ??
          pagination?.page_count ??
          pagination?.max_page ??
          pagination?.maxPage ??
          pagination?.last ??
          null;
        const derivedLastPage =
          typeof derivedLastPageRaw === 'number'
            ? derivedLastPageRaw
            : Number(derivedLastPageRaw) || requestedPage;
        setLastPage((prevLastPage) =>
          derivedLastPage || (requestedPage > 1 ? prevLastPage : 1)
        );

        setShelterList((prev) =>
          requestedPage > 1 ? [...prev, ...normalizedItems] : normalizedItems
        );
        setPage(requestedPage);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Gagal memuat data shelter';
        if (requestedPage > 1) {
          Alert.alert('Error', String(message));
        } else {
          setError(String(message));
        }
      } finally {
        if (requestedPage > 1) {
          setLoadingMore(false);
        } else {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      resetPagination({ clearData: true });
      fetchShelter({ page: 1 });
    }, [fetchShelter, resetPagination])
  );

  const onRefresh = () => {
    setRefreshing(true);
    resetPagination();
    fetchShelter({ page: 1, silent: true });
  };

  const handleLoadMore = useCallback(() => {
    if (loadingMore || loading || refreshing || page >= lastPage) {
      return;
    }

    const nextPage = page + 1;
    fetchShelter({ page: nextPage, silent: true });
  }, [fetchShelter, lastPage, loading, loadingMore, page, refreshing]);

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color="#3498db" />
        </View>
      );
    }

    if (!loading && page < lastPage) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
          <Text style={styles.loadMoreText}>Muat Lebih</Text>
        </TouchableOpacity>
      );
    }

    return null;
  }, [handleLoadMore, lastPage, loading, loadingMore, page]);

  const goToCreate = () => {
    navigation.navigate('ShelterForm', { mode: 'create' });
  };

  const goToDetail = (item) => {
    const id = item?.id_shelter ?? item?.id;
    if (!id && id !== 0) {
      Alert.alert('Tidak bisa membuka detail', 'ID shelter tidak ditemukan.');
      return;
    }
    navigation.navigate('ShelterDetail', { idShelter: id });
  };

  const goToEdit = (item) => {
    const id = item?.id_shelter ?? item?.id;
    if (!id && id !== 0) {
      Alert.alert('Tidak bisa mengedit', 'ID shelter tidak ditemukan.');
      return;
    }
    navigation.navigate('ShelterForm', { mode: 'edit', idShelter: id });
  };

  const handleDelete = async (item) => {
    const id = item?.id_shelter ?? item?.id;
    if (!id && id !== 0) {
      Alert.alert('Tidak bisa menghapus', 'ID shelter tidak ditemukan.');
      return;
    }

    try {
      setDeletingId(id);
      await adminPusatApi.deleteShelter(id);
      Alert.alert('Berhasil', 'Shelter berhasil dihapus.');
      resetPagination({ clearData: true });
      await fetchShelter({ page: 1 });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal menghapus shelter';
      Alert.alert('Error', String(message));
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (item) => {
    Alert.alert(
      'Hapus Shelter',
      `Apakah Anda yakin ingin menghapus ${item?.nama_shelter || 'shelter ini'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => handleDelete(item) },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const shelterId = item?.id_shelter ?? item?.id;
    const shelterName = item?.nama_shelter || item?.nama || 'Shelter';
    const wilbinName =
      item?.wilbin?.nama_wilbin ||
      item?.wilbin_name ||
      item?.nama_wilbin ||
      'Wilayah binaan belum ditentukan';
    const kacabName =
      item?.wilbin?.kacab?.nama_kacab ||
      item?.kacab?.nama_kacab ||
      item?.nama_kacab ||
      null;

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardHeader}
          onPress={() => goToDetail(item)}
        >
          <View style={styles.avatar}>
            <Ionicons name="home" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{shelterName}</Text>
            <Text style={styles.subText} numberOfLines={2}>
              {wilbinName}
            </Text>
            {kacabName ? (
              <Text style={styles.subTextSecondary} numberOfLines={1}>
                {kacabName}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.metaRow}>
          <Ionicons name="id-card-outline" size={16} color="#7f8c8d" />
          <Text style={styles.metaText}>ID Shelter: {shelterId ?? '-'}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="map-outline" size={16} color="#7f8c8d" />
          <Text style={styles.metaText}>ID Wilbin: {item?.id_wilbin ?? '-'}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => goToEdit(item)}>
            <Ionicons name="create-outline" size={18} color="#2980b9" />
            <Text style={[styles.actionText, { color: '#2980b9' }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => goToDetail(item)}>
            <Ionicons name="eye-outline" size={18} color="#27ae60" />
            <Text style={[styles.actionText, { color: '#27ae60' }]}>Detail</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => confirmDelete(item)}
            disabled={deletingId === shelterId}
          >
            {deletingId === shelterId ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={[styles.actionText, { color: '#fff' }]}>Hapus</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const listEmptyComponent = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-open" size={40} color="#bdc3c7" />
        <Text style={styles.emptyText}>Belum ada data shelter.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Shelter</Text>
          <Text style={styles.subtitle}>
            Total {meta?.total ?? shelterList.length} shelter terdaftar
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={goToCreate}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchShelter()}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={shelterList}
          keyExtractor={(item, index) => String(item?.id_shelter ?? item?.id ?? index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={listEmptyComponent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={renderFooter}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#7f8c8d',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    marginLeft: 6,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#fdecea',
    padding: 16,
    borderRadius: 10,
  },
  errorText: {
    color: '#e74c3c',
    fontWeight: '500',
    marginBottom: 12,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e67e22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  subTextSecondary: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#95a5a6',
  },
  footerLoading: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3498db',
  },
  loadMoreText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ShelterListScreen;
