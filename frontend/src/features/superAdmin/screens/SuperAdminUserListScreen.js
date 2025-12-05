import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../common/components/Button';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { useAuth } from '../../../common/hooks/useAuth';
import { useSuperAdminUsers } from '../hooks/useSuperAdminUsers';
import { useImportSsoUser, useSsoDirectory } from '../hooks/useSsoDirectory';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin_pusat: 'Admin Pusat',
  admin_cabang: 'Admin Cabang',
  admin_shelter: 'Admin Shelter',
  donatur: 'Donatur',
  siswa: 'Siswa',
};

const SuperAdminUserListScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [showDirectory, setShowDirectory] = useState(false);
  const [ssoSearchInput, setSsoSearchInput] = useState('');
  const [appliedSsoSearch, setAppliedSsoSearch] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const usersQuery = useSuperAdminUsers(appliedSearch);
  const ssoDirectoryQuery = useSsoDirectory(appliedSsoSearch, {
    enabled: showDirectory,
  });
  const importMutation = useImportSsoUser();

  const getErrorMessage = (err, fallback) =>
    err?.response?.data?.message || err?.message || fallback;

  const usersErrorMessage = usersQuery.error
    ? getErrorMessage(usersQuery.error, 'Gagal memuat daftar pengguna.')
    : null;

  const ssoDirectoryErrorMessage =
    showDirectory && ssoDirectoryQuery.error
      ? getErrorMessage(
          ssoDirectoryQuery.error,
          'Gagal memuat daftar pengguna dari IdP.'
        )
      : null;

  const importErrorMessage =
    importMutation.isError && importMutation.error
      ? getErrorMessage(
          importMutation.error,
          'Gagal mengimpor pengguna dari IdP.'
        )
      : null;

  const ssoErrorMessage = ssoDirectoryErrorMessage || importErrorMessage;

  const users = usersQuery.data ?? [];
  const ssoUsers = ssoDirectoryQuery.data ?? [];
  const importingSub = importMutation.variables;
  const isImporting = importMutation.isPending;
  const usersLoading = usersQuery.isLoading;
  const usersRefreshing = usersQuery.isRefetching && !usersQuery.isLoading;
  const ssoLoading = ssoDirectoryQuery.isLoading || ssoDirectoryQuery.isFetching;
  const refetchUsers = usersQuery.refetch;
  const refetchDirectory = ssoDirectoryQuery.refetch;

  const handleLogout = useCallback(async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      const result = await logout();

      if (result?.success === false && result?.message) {
        Alert.alert(
          'Logout Kilau SSO',
          `${result.message}\nSesi lokal sudah dibersihkan oleh aplikasi.`,
          [{ text: 'Mengerti' }]
        );
      }
    } finally {
      setLoggingOut(false);
    }
  }, [loggingOut, logout]);

  const handleConfirmLogout = useCallback(() => {
    if (loggingOut) {
      return;
    }

    Alert.alert(
      'Keluar dari Kilau SSO',
      'Anda akan keluar sebagai super admin. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: handleLogout },
      ]
    );
  }, [handleLogout, loggingOut]);

  useFocusEffect(
    useCallback(() => {
      refetchUsers();
      if (showDirectory) {
        refetchDirectory();
      }
    }, [refetchDirectory, refetchUsers, showDirectory])
  );

  const handleRefresh = () => {
    usersQuery.refetch();
  };

  const handleSearch = () => {
    const next = searchInput.trim();
    if (next === appliedSearch) {
      usersQuery.refetch();
    }
    setAppliedSearch(next);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
  };

  const handleToggleDirectory = () => {
    const next = !showDirectory;
    setShowDirectory(next);
    if (!showDirectory) {
      ssoDirectoryQuery.refetch();
    }
  };

  const handleSsoSearch = () => {
    const next = ssoSearchInput.trim();
    if (next === appliedSsoSearch) {
      ssoDirectoryQuery.refetch();
    }
    setAppliedSsoSearch(next);
  };

  const handleSsoReset = () => {
    setSsoSearchInput('');
    setAppliedSsoSearch('');
  };

  const handleImport = async (sub) => {
    try {
      await importMutation.mutateAsync(sub);
      await ssoDirectoryQuery.refetch();
      await usersQuery.refetch();
    } catch (err) {
      // Error state ditangani oleh mutation (importMutation)
    }
  };

  const renderSsoItem = ({ item }) => (
    <View style={styles.ssoCard} key={item.sub}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name || 'Tanpa Nama'}</Text>
        <View
          style={[
            styles.badge,
            item.status === 'active' ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              item.status === 'active' ? styles.activeText : styles.inactiveText,
            ]}
          >
            {item.status === 'active' ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardEmail}>{item.email || '-'}</Text>
      <Text style={styles.subtleMeta}>
        SUB: <Text style={styles.highlight}>{item.sub}</Text>
      </Text>
      <View style={styles.ssoActions}>
        <View
          style={[
            styles.badge,
            item.exists_locally ? styles.syncedBadge : styles.roleBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              item.exists_locally ? styles.syncedText : styles.highlight,
            ]}
          >
            {item.exists_locally ? 'Sudah Ada' : 'Belum Ada'}
          </Text>
        </View>
        {!item.exists_locally && (
          <Button
            title="Import"
            size="small"
            onPress={() => handleImport(item.sub)}
            loading={isImporting && importingSub === item.sub}
          />
        )}
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('SuperAdminUserForm', { userId: item.id_users })
      }
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{item.username || 'Tanpa Nama'}</Text>
          <View style={styles.ssoBadge}>
            <Text style={styles.ssoBadgeText}>SSO</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#bdc3c7" />
      </View>
      <Text style={styles.cardEmail}>{item.email || '-'}</Text>
      <View style={styles.cardMeta}>
        <View style={styles.rolesWrap}>
          {(item.roles && item.roles.length > 0
            ? item.roles
            : [{ slug: item.level, scope_type: null, scope_id: null }]
          ).map((role, index) => (
            <View key={`${role.slug}-${role.scope_id ?? index}`} style={[styles.badge, styles.roleBadge]}>
              <Text style={styles.badgeText}>
                {ROLE_LABELS[role.slug] || role.slug || 'Tidak diketahui'}
                {role.scope_type && role.scope_id
                  ? ` • ${role.scope_type} #${role.scope_id}`
                  : ''}
              </Text>
            </View>
          ))}
        </View>
        <View
          style={[
            styles.badge,
            item.status === 'Aktif' ? styles.activeBadge : styles.inactiveBadge,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              item.status === 'Aktif' ? styles.activeText : styles.inactiveText,
            ]}
          >
            {item.status || 'Tidak Aktif'}
          </Text>
        </View>
      </View>
      <Text style={styles.subtleMeta}>
        SSO SUB: <Text style={styles.highlight}>{item.token_api || '-'}</Text>
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Kelola Super Admin</Text>
          <Text style={styles.headerSubtitle}>
            Pantau akun Kilau SSO dan sinkronisasi pengguna
          </Text>
        </View>
        <Button
          title="Keluar"
          type="danger"
          size="small"
          onPress={handleConfirmLogout}
          loading={loggingOut}
          disabled={loggingOut}
          style={styles.logoutButton}
        />
      </View>
      <View style={styles.infoBanner}>
        <Ionicons name="shield-checkmark" size={20} color="#2c3e50" />
        <Text style={styles.infoBannerText}>
          Daftar ini hanya menampilkan akun yang sudah autentikasi via Kilau SSO.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.infoBanner,
          { backgroundColor: '#eef2ff', borderWidth: 1, borderColor: '#c7d2fe' },
        ]}
        onPress={handleToggleDirectory}
        activeOpacity={0.8}
      >
        <Ionicons name="cloud-download-outline" size={20} color="#1d4ed8" />
        <Text style={styles.infoBannerText}>
          {showDirectory
            ? 'Sembunyikan user IdP'
            : 'Tampilkan user IdP untuk import sebelum login'}
        </Text>
        <Ionicons
          name={showDirectory ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#1d4ed8"
        />
      </TouchableOpacity>

      {showDirectory && (
        <View style={styles.ssoSection}>
          <Text style={styles.sectionTitle}>Direktori IdP</Text>
          <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama/email IdP"
          value={ssoSearchInput}
          onChangeText={setSsoSearchInput}
          returnKeyType="search"
          onSubmitEditing={handleSsoSearch}
        />
        <Button
          title="Cari"
          size="small"
          onPress={handleSsoSearch}
          style={styles.searchButton}
        />
        <Button
          title="Reset"
          type="secondary"
          size="small"
          onPress={handleSsoReset}
        />
      </View>
      {ssoErrorMessage && (
        <ErrorMessage
          message={ssoErrorMessage}
          visible
          onRetry={handleSsoSearch}
        />
      )}
          {ssoLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="small" color="#2563eb" />
            </View>
          ) : ssoUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Tidak ada user IdP yang cocok.</Text>
            </View>
          ) : (
            <View>{ssoUsers.map((item) => renderSsoItem({ item }))}</View>
          )}
        </View>
      )}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama, email, atau SUB"
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Button
          title="Cari"
          onPress={handleSearch}
          style={styles.searchButton}
          size="small"
        />
        <Button
          title="Reset"
          type="secondary"
          onPress={handleClearSearch}
          style={styles.searchButton}
          size="small"
        />
      </View>

      {usersErrorMessage && (
        <ErrorMessage message={usersErrorMessage} visible onRetry={usersQuery.refetch} />
      )}

      {usersLoading && !usersRefreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#9b59b6" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, index) =>
            (item.id_users && String(item.id_users)) || `user-${index}`
          }
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={usersRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-checkmark" size={48} color="#bdc3c7" />
              <Text style={styles.emptyText}>
                Belum ada user Kilau SSO yang disinkronkan.
              </Text>
            </View>
          }
          contentContainerStyle={
            users.length === 0 ? styles.emptyContainer : undefined
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f6fb',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  headerTextGroup: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
  },
  logoutButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#eef3ff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  infoBannerText: {
    flex: 1,
    color: '#2c3e50',
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dcdde1',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  searchButton: {
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  ssoBadge: {
    backgroundColor: '#dff5e5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  ssoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f8a4c',
    textTransform: 'uppercase',
  },
  cardEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadge: {
    backgroundColor: '#f0f3ff',
  },
  activeBadge: {
    backgroundColor: '#eafaf1',
  },
  inactiveBadge: {
    backgroundColor: '#fdecea',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rolesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  activeText: {
    color: '#27ae60',
  },
  inactiveText: {
    color: '#c0392b',
  },
  subtleMeta: {
    marginTop: 8,
    fontSize: 12,
    color: '#95a5a6',
  },
  highlight: {
    fontWeight: '600',
    color: '#2c3e50',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
  },
  ssoSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  ssoCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
  },
  ssoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  syncedBadge: {
    backgroundColor: '#e0f2fe',
  },
  syncedText: {
    color: '#0369a1',
  },
});

export default SuperAdminUserListScreen;
