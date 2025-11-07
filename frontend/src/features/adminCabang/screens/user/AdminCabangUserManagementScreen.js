// FEATURES PATH: features/adminCabang/screens/user/AdminCabangUserManagementScreen.js
// DESC: Screen daftar user untuk Admin Cabang (kelola admin cabang & admin shelter)

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { adminCabangUserManagementApi } from '../../api/adminCabangUserManagementApi';
import { useAuth } from '../../../../common/hooks/useAuth';

const LEVELS = [
  { key: 'admin_cabang', label: 'Admin Cabang' },
  { key: 'admin_shelter', label: 'Admin Shelter' },
];

const DEFAULT_PER_PAGE = 10;

const AdminCabangUserManagementScreen = () => {
  const navigation = useNavigation();
  const { profile } = useAuth();
  const [level, setLevel] = useState('admin_cabang');
  const [q, setQ] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const hasFocusedRef = useRef(false);

  const kacabId = profile?.id_kacab;
  const isQueryEnabled = Boolean(kacabId && level);

  const {
    data,
    error,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: [
      'adminCabangUsers',
      { level, search: searchTerm, kacabId },
    ],
    enabled: isQueryEnabled,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await adminCabangUserManagementApi.getUsers({
        level,
        page: pageParam,
        perPage: DEFAULT_PER_PAGE,
        search: searchTerm || undefined,
      });

      return response;
    },
    getNextPageParam: (lastPage) => {
      const meta = lastPage?.meta ?? {};
      const links = lastPage?.links ?? {};
      const current = Number(meta.current_page ?? meta.page ?? 1);
      const last = Number(meta.last_page ?? meta.total_pages ?? current);

      if (Number.isFinite(current) && Number.isFinite(last) && current < last) {
        return current + 1;
      }

      const nextLinkRaw = typeof links?.next === 'string' ? links.next : links?.next?.url;

      if (typeof nextLinkRaw === 'string') {
        const match = nextLinkRaw.match(/[?&]page=(\d+)/);
        if (match) {
          const nextPage = Number(match[1]);
          if (Number.isInteger(nextPage) && nextPage > current) {
            return nextPage;
          }
        }
      }

      return undefined;
    },
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(q.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [q]);

  useFocusEffect(
    useCallback(() => {
      if (!isQueryEnabled) {
        return;
      }

      if (hasFocusedRef.current) {
        refetch();
      } else {
        hasFocusedRef.current = true;
      }
    }, [isQueryEnabled, refetch])
  );

  const onRefresh = () => {
    if (!isQueryEnabled) {
      return;
    }
    refetch();
  };

  const loadMore = () => {
    if (!isQueryEnabled || !hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage();
  };

  const users = useMemo(() => {
    if (!data?.pages?.length) {
      return [];
    }

    return data.pages.flatMap((page) => {
      if (!page) {
        return [];
      }
      const list = Array.isArray(page?.data) ? page.data : [];
      return list;
    });
  }, [data]);

  const hasData = users.length > 0;
  const isInitialLoading = isLoading && !hasData;
  const isRefreshing = isRefetching && !isFetchingNextPage && !isInitialLoading;

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }

    const responseMessage =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.response?.message;

    if (responseMessage) {
      return String(responseMessage);
    }

    if (error?.message) {
      return String(error.message);
    }

    return 'Gagal memuat data user';
  }, [error]);

  const showFullError = Boolean(errorMessage && !hasData && !isInitialLoading);
  const showInlineError = Boolean(errorMessage && hasData);


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

      {!isQueryEnabled ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Data cabang tidak ditemukan.</Text>
        </View>
      ) : isInitialLoading ? (
        <View style={{ paddingTop: 40 }}>
          <ActivityIndicator size="large" />
        </View>
      ) : showFullError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {showInlineError ? (
            <View style={styles.inlineErrorBox}>
              <Ionicons name="warning-outline" size={16} color="#e67e22" />
              <Text style={styles.inlineErrorText}>{errorMessage}</Text>
            </View>
          ) : null}
          <FlatList
            data={users}
            keyExtractor={(item, idx) =>
              String(item?.user?.id_users ?? item?.id_users ?? item?.id ?? idx)
            }
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isFetching ? 'Memuat data...' : 'Belum ada data.'}
              </Text>
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={{ paddingVertical: 16 }}>
                  <ActivityIndicator size="small" />
                </View>
              ) : null
            }
          />
        </>
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
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3e6',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  inlineErrorText: { flex: 1, color: '#d35400', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 24 },
});

export default AdminCabangUserManagementScreen;
