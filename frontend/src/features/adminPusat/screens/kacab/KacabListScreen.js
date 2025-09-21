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

const statusStyles = {
  aktif: {
    container: { backgroundColor: '#eafaf1' },
    text: { color: '#27ae60' },
  },
  nonaktif: {
    container: { backgroundColor: '#fdecea' },
    text: { color: '#e74c3c' },
  },
};

const KacabListScreen = () => {
  const navigation = useNavigation();
  const [kacabList, setKacabList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchKacab = useCallback(async (options = {}) => {
    const { silent = false } = options;

    try {
      setError('');
      if (!silent) {
        setLoading(true);
      }

      const response = await adminPusatApi.getKacab();
      const payload = response?.data ?? null;
      const { items, meta: pagination } = normalizeListResponse(payload);

      setKacabList(Array.isArray(items) ? items : []);
      setMeta(pagination);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Gagal memuat kantor cabang';
      setError(String(message));
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchKacab();
    }, [fetchKacab])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchKacab({ silent: true });
  };

  const goToCreate = () => {
    navigation.navigate('KacabForm', { mode: 'create' });
  };

  const goToDetail = (item) => {
    const id = item?.id_kacab;
    if (!id) {
      Alert.alert('Tidak bisa membuka detail', 'ID kantor cabang tidak ditemukan.');
      return;
    }
    navigation.navigate('KacabDetail', { idKacab: id });
  };

  const goToEdit = (item) => {
    const id = item?.id_kacab;
    if (!id) {
      Alert.alert('Tidak bisa mengedit', 'ID kantor cabang tidak ditemukan.');
      return;
    }
    navigation.navigate('KacabForm', { mode: 'edit', idKacab: id });
  };

  const handleDelete = async (item) => {
    const id = item?.id_kacab;
    if (!id) {
      Alert.alert('Tidak bisa menghapus', 'ID kantor cabang tidak ditemukan.');
      return;
    }

    try {
      setDeletingId(id);
      await adminPusatApi.deleteKacab(id);
      Alert.alert('Berhasil', 'Kantor cabang berhasil dihapus.');
      await fetchKacab();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Gagal menghapus kantor cabang';
      Alert.alert('Error', String(message));
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDelete = (item) => {
    Alert.alert(
      'Hapus Kantor Cabang',
      `Apakah Anda yakin ingin menghapus ${item?.nama_kacab || 'kantor cabang ini'}?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => handleDelete(item) },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const statusKey = String(item?.status || '').toLowerCase();
    const statusStyle = statusStyles[statusKey] || {
      container: { backgroundColor: '#ecf0f1' },
      text: { color: '#7f8c8d' },
    };

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardHeader}
          onPress={() => goToDetail(item)}
        >
          <View style={styles.avatar}>
            <Ionicons name="business" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{item?.nama_kacab || '-'}</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {item?.alamat || 'Alamat belum tersedia'}
            </Text>
          </View>
          <View style={[styles.statusBadge, statusStyle.container]}>
            <Text style={[styles.statusText, statusStyle.text]}>
              {(item?.status || 'unknown').toString().toUpperCase()}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.metaRow}>
          <Ionicons name="call-outline" size={16} color="#7f8c8d" />
          <Text style={styles.metaText}>
            {item?.no_telp || item?.no_telpon || '-'}
          </Text>
        </View>

        {item?.email ? (
          <View style={styles.metaRow}>
            <Ionicons name="mail-outline" size={16} color="#7f8c8d" />
            <Text style={styles.metaText}>{item.email}</Text>
          </View>
        ) : null}

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
            disabled={deletingId === item?.id_kacab}
          >
            {deletingId === item?.id_kacab ? (
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
        <Text style={styles.emptyText}>Belum ada data kantor cabang.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Kantor Cabang</Text>
          <Text style={styles.subtitle}>
            Total {meta?.total ?? kacabList.length} cabang terdaftar
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
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchKacab()}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={kacabList}
          keyExtractor={(item, index) => String(item?.id_kacab ?? index)}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={listEmptyComponent}
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
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
});

export default KacabListScreen;
