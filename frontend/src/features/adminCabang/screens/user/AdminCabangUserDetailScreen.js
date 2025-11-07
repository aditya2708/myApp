// FEATURES PATH: features/adminCabang/screens/user/AdminCabangUserDetailScreen.js
// DESC: Detail user admin cabang (user + relasi cabang/wilbin/shelter)

import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { adminCabangUserManagementApi } from '../../api/adminCabangUserManagementApi';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';

const Line = () => <View style={styles.separator} />;

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={18} color="#555" style={{ width: 22 }} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={3}>{value ?? '-'}</Text>
  </View>
);

const Box = ({ title, children }) => (
  <View style={styles.box}>
    <Text style={styles.boxTitle}>{title}</Text>
    <View style={{ marginTop: 8 }}>{children}</View>
  </View>
);

const safePickId = (userObj) => {
  if (!userObj) return null;
  return userObj.id_users ?? userObj.id ?? userObj.user_id ?? null;
};

const extractProfile = (container) => {
  if (!container) return null;
  return container.profile || container.admin_cabang || container.admin_shelter || null;
};

const normalizeProfile = (p) => {
  if (!p) return null;
  return {
    nama_lengkap: p.nama_lengkap ?? p.nama ?? null,
    no_hp: p.no_hp ?? p.no_telp ?? null,
    alamat: p.alamat ?? p.alamat_adm ?? null,
    nama_cabang: p.nama_cabang ?? p.nama_kacab ?? null,
    nama_wilbin: p.nama_wilbin ?? null,
    nama_shelter: p.nama_shelter ?? null,
  };
};

const formatTanggal = (tgl) => {
  if (!tgl) return '-';
  try {
    return format(new Date(tgl), 'd MMMM yyyy', { locale: localeId });
  } catch {
    return String(tgl);
  }
};

const AdminCabangUserDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { idUsers, preset } = route.params || {};

  const {
    data: detail,
    error,
    isLoading,
    isFetching,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['adminCabangUserDetail', idUsers],
    enabled: Boolean(idUsers),
    initialData: preset || null,
    queryFn: async () => {
      const res = await adminCabangUserManagementApi.getUserDetail(idUsers);
      return res?.data ?? null;
    },
  });

  const container = useMemo(() => (detail?.data ? detail.data : detail) || {}, [detail]);
  const user = useMemo(() => container?.user ?? container ?? null, [container]);
  const resolvedProfileRaw = useMemo(() => extractProfile(container) || extractProfile(preset) || null, [container, preset]);
  const profile = useMemo(() => normalizeProfile(resolvedProfileRaw), [resolvedProfileRaw]);

  const isInitialLoading = isLoading && !detail;
  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }

    const responseMessage =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.response?.message ??
      error?.message;

    if (!responseMessage) {
      return 'Gagal memuat detail user';
    }

    return String(responseMessage);
  }, [error]);

  const showErrorView = Boolean(errorMessage && !detail);
  const isRefreshing = isRefetching && !isInitialLoading;

  useEffect(() => {
    const uname = user?.username || preset?.user?.username || preset?.username;
    if (uname) {
      navigation.setOptions({ headerTitle: `Detail: ${uname}` });
    }
  }, [navigation, preset, user?.username]);

  const onRefresh = () => {
    if (!idUsers) {
      return;
    }
    refetch();
  };

  const computedId = useMemo(() => safePickId(user), [user]);

  if (isInitialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Memuat detail...</Text>
      </View>
    );
  }

  if (showErrorView) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={28} color="#e74c3c" />
        <Text style={{ color: '#e74c3c', marginTop: 8, textAlign: 'center' }}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.containerRoot}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {errorMessage && detail ? (
        <View style={styles.inlineErrorBox}>
          <Ionicons name="warning-outline" size={16} color="#e67e22" />
          <Text style={styles.inlineErrorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.avatarLg}>
          <Ionicons name="person" size={28} color="#fff" />
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.username}>{user?.username ?? '-'}</Text>
          <Text style={styles.email}>{user?.email ?? '-'}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.badge, { backgroundColor: '#3498db' }]}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#fff" />
            <Text style={styles.badgeText}>{user?.level ?? '-'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#95a5a6', marginTop: 6 }]}>
            <Ionicons name="radio-button-on-outline" size={14} color="#fff" />
            <Text style={styles.badgeText}>{user?.status ?? '-'}</Text>
          </View>
        </View>
      </View>

      <Box title="Informasi Akun">
        <InfoRow icon="person-circle-outline" label="User ID" value={computedId ?? '-'} />
        <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '-'} />
        <InfoRow icon="time-outline" label="Dibuat" value={formatTanggal(user?.created_at)} />
        <InfoRow icon="refresh-outline" label="Diupdate" value={formatTanggal(user?.updated_at)} />

        <Line />

        <InfoRow icon="id-card-outline" label="Nama Lengkap" value={profile?.nama_lengkap ?? '-'} />
        <InfoRow icon="call-outline" label="No HP" value={profile?.no_hp ?? '-'} />
        <InfoRow icon="home-outline" label="Alamat" value={profile?.alamat ?? '-'} />
        {profile?.nama_cabang && (
          <InfoRow icon="business-outline" label="Cabang" value={profile?.nama_cabang} />
        )}
        {profile?.nama_wilbin && (
          <InfoRow icon="map-outline" label="Wilbin" value={profile?.nama_wilbin} />
        )}
        {profile?.nama_shelter && (
          <InfoRow icon="home-outline" label="Shelter" value={profile?.nama_shelter} />
        )}
      </Box>

      {isFetching && !isInitialLoading ? (
        <View style={{ paddingTop: 10 }}>
          <ActivityIndicator />
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  containerRoot: { flex: 1, backgroundColor: '#f5f5f5' },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  avatarLg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  username: { fontSize: 18, fontWeight: '700', color: '#333' },
  email: { color: '#666', marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontWeight: '600' },
  box: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  boxTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: { flex: 1.5, color: '#555', fontWeight: '500' },
  infoValue: { flex: 3, color: '#333' },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3e6',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  inlineErrorText: { flex: 1, color: '#d35400', fontSize: 12 },
});

export default AdminCabangUserDetailScreen;
