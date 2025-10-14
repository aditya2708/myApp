// FEATURES PATH: features/adminCabang/screens/user/AdminCabangUserManagementScreen.js
// DESC: Screen daftar user untuk Admin Cabang (kelola admin cabang & admin shelter)

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { adminCabangUserManagementApi } from '../../api/adminCabangUserManagementApi';

const LEVELS = [
  { key: 'admin_cabang', label: 'Admin Cabang' },
  { key: 'admin_shelter', label: 'Admin Shelter' },
];

const DEFAULT_PER_PAGE = 10;

const AdminCabangUserManagementScreen = () => {
  const navigation = useNavigation();
  const [level, setLevel] = useState('admin_cabang');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [meta, setMeta] = useState(null);
  const [links, setLinks] = useState(null);
  const requestTokenRef = useRef(0);
  const hasMountedRef = useRef(false);

  const resetListState = useCallback(() => {
    setUsers([]);
    setMeta(null);
    setLinks(null);
  }, []);

  const fetchUsers = useCallback(
    async ({ page: targetPage = 1, append = false, isRefresh = false } = {}) => {
      const requestToken = ++requestTokenRef.current;
      const isLoadMore = append && targetPage > 1;

      try {
        setError(null);
        if (isLoadMore) {
          setLoadingMore(true);
        } else if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const { data: list = [], meta: metaRes = null, links: linksRes = null } =
          await adminCabangUserManagementApi.getUsers({
            level,
            page: targetPage,
            perPage: DEFAULT_PER_PAGE,
            search: searchTerm || undefined,
          });

        if (requestToken !== requestTokenRef.current) {
          return;
        }

        setUsers((prev) => (append ? [...prev, ...list] : list));
        setMeta(metaRes);
        setLinks(linksRes);
      } catch (err) {
        if (requestToken === requestTokenRef.current) {
          const msg = err?.response?.data?.message || err?.message || 'Gagal memuat data user';
          setError(String(msg));
        }
      } finally {
        if (requestToken === requestTokenRef.current) {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [level, searchTerm]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(q.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [q]);

  useEffect(() => {
    resetListState();
    fetchUsers({ page: 1 });
    hasMountedRef.current = true;
  }, [level, searchTerm, fetchUsers, resetListState]);

  useFocusEffect(
    useCallback(() => {
      if (hasMountedRef.current) {
        fetchUsers({ page: 1, append: false, isRefresh: true });
      }
    }, [fetchUsers])
  );

  const onRefresh = () => {
    fetchUsers({ page: 1, append: false, isRefresh: true });
  };

  const loadMore = () => {
    if (loading || loadingMore) return;

    const hasNextPage = (() => {
      const currentPage = Number(meta?.current_page);
      const lastPage = Number(meta?.last_page);
      if (Number.isFinite(currentPage) && Number.isFinite(lastPage)) {
        return currentPage < lastPage;
      }
      return Boolean(links?.next);
    })();

    if (!hasNextPage) return;

    const derivedNextPage = (() => {
      const currentPage = Number(meta?.current_page);
      if (Number.isFinite(currentPage)) {
        const potentialNext = currentPage + 1;
        if (Number.isInteger(potentialNext) && potentialNext > 0) {
          return potentialNext;
        }
      }
      return null;
    })();

    let nextPage = derivedNextPage;

    if (!Number.isInteger(nextPage) && links?.next) {
      const match = links.next.match(/[?&]page=(\d+)/);
      const parsedPage = match ? Number(match[1]) : null;
      if (Number.isInteger(parsedPage) && parsedPage > 0) {
        nextPage = parsedPage;
      }
    }

    if (!Number.isInteger(nextPage) || !Number.isFinite(nextPage)) {
      return;
    }

    fetchUsers({ page: nextPage, append: true });
  };

  const gotoCreate = () => {
    navigation.navigate('AdminCabangUserForm', { mode: 'create', defaultLevel: level });
  };

  const gotoEdit = (item) => {
    const u = item?.user || item || {};
    const userId = u?.id_users ?? u?.id ?? u?.user_id ?? null;
    if (!userId) {
      Alert.alert('Tidak bisa buka edit', 'ID user tidak tersedia.');
      return;
    }
    navigation.navigate('AdminCabangUserForm', {
      mode: 'edit',
      idUsers: userId,
      defaultLevel: u?.level || level,
    });
  };

  const gotoDetail = (item) => {
    const u = item?.user || item || {};
    const userId = u?.id_users ?? u?.id ?? u?.user_id ?? null;

    if (!userId) {
      Alert.alert('Tidak bisa buka detail', 'ID user tidak tersedia pada data ini.');
      return;
    }

    navigation.navigate('AdminCabangUserDetail', { idUsers: userId, preset: item });
  };

  const renderItem = ({ item }) => {
    const u = item?.user || item || {};

    return (
      <View style={styles.card}>
        <TouchableOpacity style={styles.cardHeader} activeOpacity={0.85} onPress={() => gotoDetail(item)}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{u?.username || '-'}</Text>
            <Text style={styles.email}>{u?.email || '-'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="shield-checkmark-outline" size={14} />
            <Text style={styles.metaText}>{u?.level || '-'}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="radio-button-on-outline" size={14} />
            <Text style={styles.metaText}>{u?.status || '-'}</Text>
          </View>
          {u?.created_at ? (
            <View style={styles.metaBadge}>
              <Ionicons name="time-outline" size={14} />
              <Text style={styles.metaText}>{String(u.created_at).slice(0, 10)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => gotoEdit(item)}>
            <Ionicons name="create-outline" size={18} color="#2980b9" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => gotoDetail(item)}>
            <Ionicons name="eye-outline" size={18} color="#27ae60" />
            <Text style={styles.actionText}>Detail</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen User Cabang</Text>
        <TouchableOpacity style={styles.addBtn} onPress={gotoCreate}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs Level */}
      <View style={styles.tabRow}>
        {LEVELS.map((lv) => (
          <TouchableOpacity
            key={lv.key}
            style={[styles.tabItem, level === lv.key && styles.tabItemActive]}
            onPress={() => setLevel(lv.key)}
          >
            <Text style={[styles.tabText, level === lv.key && styles.tabTextActive]}>
              {lv.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari username/email"
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
        />
        {!!q && (
          <TouchableOpacity onPress={() => setQ('')}>
            <Ionicons name="close-circle" size={18} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchUsers}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, idx) =>
            String(item?.user?.id_users ?? item?.id_users ?? item?.id ?? idx)
          }
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Belum ada data.</Text>}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff'
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e74c3c', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 8, justifyContent: 'space-around' },
  tabItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  tabItemActive: { backgroundColor: '#fdecea' },
  tabText: { color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#e74c3c' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, paddingHorizontal: 12, borderRadius: 8, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 10 },
  card: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 6, padding: 12, borderRadius: 10, elevation: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3498db', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  username: { fontSize: 16, fontWeight: '600', color: '#333' },
  email: { color: '#666', fontSize: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f4f6f8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  metaText: { fontSize: 12, color: '#333' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#f4f6f8' },
  actionText: { fontSize: 12, fontWeight: '600', color: '#333' },
  errorBox: { alignItems: 'center', marginTop: 24, paddingHorizontal: 16 },
  errorText: { color: '#e74c3c', marginBottom: 10, textAlign: 'center' },
  retryBtn: { backgroundColor: '#e74c3c', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 24 },
});

export default AdminCabangUserManagementScreen;
