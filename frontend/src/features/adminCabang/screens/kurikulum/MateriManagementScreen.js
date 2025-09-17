import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import FloatingActionButton from '../../../../common/components/FloatingActionButton';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import {
  useGetKurikulumMateriQuery,
  useDeleteKurikulumMateriMutation,
  useAddKurikulumMateriMutation,
  useLazyGetMateriListQuery
} from '../../api/kurikulumApi';

const getFirstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

/**
 * Materi Management Screen - API Integrated
 * CRUD interface for learning materials
 */
const MateriManagementScreen = ({ navigation, route }) => {
  const { jenjang, kelas, mataPelajaran, kurikulumId: routeKurikulumId, kurikulum } = route.params || {};

  const kurikulumState = useSelector(state => state?.kurikulum);
  const activeKurikulum = kurikulum || kurikulumState?.selectedKurikulum || null;
  const kurikulumId = getFirstDefined(
    routeKurikulumId,
    kurikulum?.id_kurikulum,
    kurikulum?.id,
    kurikulumState?.selectedKurikulumId,
    kurikulumState?.selectedKurikulum?.id_kurikulum,
    kurikulumState?.selectedKurikulum?.kurikulum_id,
    mataPelajaran?.kurikulum_id,
    mataPelajaran?.id_kurikulum,
    kelas?.kurikulum_id,
    kelas?.id_kurikulum,
    jenjang?.kurikulum_id,
    jenjang?.id_kurikulum,
    kurikulumState?.currentMataPelajaran?.kurikulum_id,
    kurikulumState?.currentMataPelajaran?.id_kurikulum,
    kurikulumState?.currentKelas?.kurikulum_id,
    kurikulumState?.currentKelas?.id_kurikulum,
    kurikulumState?.currentJenjang?.kurikulum_id,
    kurikulumState?.currentJenjang?.id_kurikulum
  );

  const mataPelajaranId = getFirstDefined(
    mataPelajaran?.id_mata_pelajaran,
    mataPelajaran?.id,
    mataPelajaran?.mata_pelajaran_id,
    kurikulumState?.currentMataPelajaran?.id_mata_pelajaran,
    kurikulumState?.currentMataPelajaran?.id,
    kurikulumState?.currentMataPelajaran?.mata_pelajaran_id
  );

  // Get auth state for debugging
  const auth = useSelector(state => state.auth);

  // API hooks
  const shouldSkipQuery = !kurikulumId || !mataPelajaranId;

  const {
    data: materiResponse,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetKurikulumMateriQuery(
    {
      kurikulumId,
      mataPelajaranId,
      kelasId: kelas?.id_kelas
    },
    {
      skip: shouldSkipQuery
    }
  );

  const [deleteKurikulumMateri, { isLoading: isDeleting }] = useDeleteKurikulumMateriMutation();
  const [addKurikulumMateri, { isLoading: isAdding }] = useAddKurikulumMateriMutation();
  const [triggerMateriLibrary, {
    data: materiLibraryResponse,
    isFetching: isFetchingMateriLibrary,
    isLoading: isLoadingMateriLibrary,
    error: materiLibraryError
  }] = useLazyGetMateriListQuery();

  const [deletingMateriId, setDeletingMateriId] = React.useState(null);
  const [attachingMateriId, setAttachingMateriId] = React.useState(null);
  const [isAddExistingVisible, setIsAddExistingVisible] = React.useState(false);

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (!shouldSkipQuery) {
        refetch();
      }
    }, [refetch, shouldSkipQuery])
  );

  const handleAddMateri = () => {
    if (!kurikulumId) {
      Alert.alert('Informasi', 'Kurikulum tidak ditemukan. Mohon kembali dan pilih kurikulum terlebih dahulu.');
      return;
    }

    navigation.navigate('MateriForm', {
      jenjang,
      kelas,
      mataPelajaran,
      kurikulumId,
      kurikulum: activeKurikulum,
      isEdit: false
    });
  };

  const handleEditMateri = (materiItem) => {
    const materiData = materiItem?.materi ? {
      ...materiItem.materi,
      pivot: materiItem
    } : materiItem;

    navigation.navigate('MateriForm', {
      jenjang,
      kelas,
      mataPelajaran,
      kurikulumId,
      kurikulum: activeKurikulum,
      isEdit: true,
      materi: materiData
    });
  };

  const handleDeleteMateri = (materiItem) => {
    const materiData = materiItem?.materi || materiItem;
    const materiId = materiItem?.id_materi || materiData?.id_materi;

    if (!kurikulumId || !materiId) {
      Alert.alert('Error', 'Data kurikulum atau materi tidak ditemukan.');
      return;
    }

    Alert.alert(
      'Lepas Materi dari Kurikulum',
      `Apakah Anda yakin ingin melepas materi "${materiData?.nama_materi}" dari kurikulum?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: async () => {
          try {
            setDeletingMateriId(materiId);
            await deleteKurikulumMateri({
              kurikulumId,
              materiId
            }).unwrap();
            Alert.alert('Sukses', 'Materi berhasil dilepas dari kurikulum');
            refetch();
          } catch (error) {
            Alert.alert('Error', error?.data?.message || error?.message || 'Gagal melepas materi dari kurikulum');
          } finally {
            setDeletingMateriId(null);
          }
        }}
      ]
    );
  };

  const fetchMateriLibrary = React.useCallback(() => {
    if (!kurikulumId || !mataPelajaranId || !kelas?.id_kelas) {
      return;
    }

    triggerMateriLibrary({
      kurikulumId,
      mataPelajaranId,
      mata_pelajaran: mataPelajaranId,
      kelas: kelas.id_kelas
    });
  }, [triggerMateriLibrary, kurikulumId, mataPelajaranId, kelas?.id_kelas]);

  const handleOpenAddExisting = () => {
    if (!kurikulumId) {
      Alert.alert('Informasi', 'Kurikulum tidak ditemukan. Mohon kembali dan pilih kurikulum terlebih dahulu.');
      return;
    }

    if (!mataPelajaranId || !kelas?.id_kelas) {
      Alert.alert('Informasi', 'Data mata pelajaran atau kelas tidak valid untuk menampilkan daftar materi.');
      return;
    }

    setIsAddExistingVisible(true);
    fetchMateriLibrary();
  };

  const handleCloseAddExisting = () => {
    setIsAddExistingVisible(false);
    setAttachingMateriId(null);
  };

  const handleAttachExistingMateri = async (materi) => {
    if (!kurikulumId || !mataPelajaranId || !materi?.id_materi) {
      Alert.alert('Error', 'Data materi tidak lengkap untuk ditambahkan ke kurikulum.');
      return;
    }

    try {
      setAttachingMateriId(materi.id_materi);
      await addKurikulumMateri({
        kurikulumId,
        mataPelajaranId,
        materiId: materi.id_materi
      }).unwrap();
      Alert.alert('Sukses', 'Materi berhasil ditambahkan ke kurikulum');
      handleCloseAddExisting();
      refetch();
    } catch (error) {
      Alert.alert('Error', error?.data?.message || error?.message || 'Gagal menambahkan materi ke kurikulum');
    } finally {
      setAttachingMateriId(null);
    }
  };

  const materiEntries = React.useMemo(() => {
    if (!materiResponse) {
      return [];
    }

    if (Array.isArray(materiResponse?.data)) {
      return materiResponse.data;
    }

    if (Array.isArray(materiResponse?.data?.data)) {
      return materiResponse.data.data;
    }

    return [];
  }, [materiResponse]);

  const materiItems = React.useMemo(() => (
    materiEntries.map(entry => ({
      materi: entry?.materi ?? entry,
      mapping: entry
    }))
  ), [materiEntries]);

  const attachedMateriIds = React.useMemo(() => new Set(
    materiItems
      .map(item => item?.mapping?.id_materi ?? item?.materi?.id_materi)
      .filter(Boolean)
  ), [materiItems]);

  const libraryMateriRaw = React.useMemo(() => {
    if (!materiLibraryResponse) {
      return [];
    }

    if (Array.isArray(materiLibraryResponse?.data?.data)) {
      return materiLibraryResponse.data.data;
    }

    if (Array.isArray(materiLibraryResponse?.data)) {
      return materiLibraryResponse.data;
    }

    return [];
  }, [materiLibraryResponse]);

  const availableMateriList = React.useMemo(() => (
    libraryMateriRaw.filter(item => !attachedMateriIds.has(item?.id_materi))
  ), [libraryMateriRaw, attachedMateriIds]);

  const isLibraryLoading = isLoadingMateriLibrary || isFetchingMateriLibrary;
  const isRefreshing = isFetching && !isLoading;
  const canManageMateri = !!kurikulumId && !!mataPelajaranId && !!kelas?.id_kelas;

  // DEBUG LOGGING FOR PHYSICAL DEVICE
  console.log('=== MATERI MANAGEMENT SCREEN DEBUG ===');
  console.log('Authentication state:');
  console.log('- isAuthenticated:', !!auth?.token);
  console.log('- user:', auth?.user ? `${auth.user.name} (${auth.user.role})` : 'No user');
  console.log('- token exists:', !!auth?.token);
  console.log('- token length:', auth?.token ? auth.token.length : 'No token');
  console.log('Route params received:');
  console.log('- jenjang:', JSON.stringify(jenjang, null, 2));
  console.log('- kelas:', JSON.stringify(kelas, null, 2));
  console.log('- mataPelajaran:', JSON.stringify(mataPelajaran, null, 2));
  console.log('- kurikulumId (derived):', kurikulumId);
  console.log('- query skipped:', shouldSkipQuery);
  console.log('Query params:', {
    kurikulumId,
    mataPelajaranId
  });

  console.log('RTK Query State:');
  console.log('- isLoading:', isLoading);
  console.log('- isFetching:', isFetching);
  console.log('- error:', error ? JSON.stringify(error, null, 2) : 'No error');
  console.log('API Response:');
  console.log('- materiResponse:', materiResponse ? JSON.stringify(materiResponse, null, 2) : 'No response');
  console.log('Processed Data:');
  console.log('- materiEntries length:', materiEntries.length);
  console.log('- materiEntries:', JSON.stringify(materiEntries, null, 2));
  console.log('- availableMateriList length:', availableMateriList.length);
  console.log('=== END DEBUG ===');

  if (!kurikulumId) {
    return (
      <View style={[styles.container, styles.missingKurikulumContainer]}>
        <Ionicons name="library-outline" size={56} color="#adb5bd" style={styles.missingKurikulumIcon} />
        <Text style={styles.missingKurikulumTitle}>Kurikulum Belum Dipilih</Text>
        <Text style={styles.missingKurikulumSubtitle}>
          Pilih kurikulum terlebih dahulu untuk mulai mengelola materi pembelajaran.
        </Text>
        <TouchableOpacity
          style={styles.missingKurikulumButton}
          onPress={() => navigation.navigate('SelectKurikulum')}
        >
          <Ionicons name="search-outline" size={18} color="#fff" style={styles.missingKurikulumButtonIcon} />
          <Text style={styles.missingKurikulumButtonText}>Pilih Kurikulum</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!mataPelajaranId) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message="Data mata pelajaran tidak ditemukan. Mohon kembali dan pilih mata pelajaran terlebih dahulu."
          onRetry={() => navigation.goBack()}
        />
      </View>
    );
  }

  // Loading state
  if (isLoading && !materiEntries.length) {
    return <LoadingSpinner message="Memuat data materi kurikulum..." />;
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        message="Gagal memuat data materi"
        onRetry={refetch}
      />
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#28a745';
      case 'draft': return '#ffc107';
      case 'archived': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getFileIcon = (fileName) => {
    if (!fileName) return 'document';
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'document-text';
      case 'doc': case 'docx': return 'document';
      case 'jpg': case 'jpeg': case 'png': return 'image';
      default: return 'document';
    }
  };

  const getStatusLabel = (materi) => {
    if (!materi) return 'Draft';

    const status = materi.status?.toLowerCase();
    if (status === 'published') return 'Terbit';
    if (status === 'draft') return 'Draft';

    const kategori = materi.kategori?.toLowerCase();
    if (kategori === 'published') return 'Terbit';
    if (kategori === 'draft') return 'Draft';
    if (kategori) {
      return kategori.charAt(0).toUpperCase() + kategori.slice(1);
    }

    return materi.file_name ? 'Ada File' : 'Draft';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetch}
            colors={['#dc3545']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Kelola Materi</Text>
          <Text style={styles.subtitle}>
            {(mataPelajaran?.nama_mata_pelajaran) || 'Mata Pelajaran'} - {(kelas?.nama_kelas) || 'Kelas'}
          </Text>
          <TouchableOpacity
            style={[styles.secondaryButton, !canManageMateri && styles.secondaryButtonDisabled]}
            onPress={handleOpenAddExisting}
            disabled={!canManageMateri}
          >
            <Ionicons
              name="link-outline"
              size={16}
              color={canManageMateri ? '#17a2b8' : '#adb5bd'}
            />
            <Text style={[styles.secondaryButtonText, !canManageMateri && styles.secondaryButtonTextDisabled]}>
              Tambah Materi Eksisting
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {materiItems.map(({ materi, mapping }, index) => {
            const materiId = mapping?.id_materi ?? materi?.id_materi ?? `materi-${index}`;
            const materiItem = mapping || materi;
            const statusKey = (materi?.status || materi?.kategori || (materi?.file_name ? 'published' : 'draft'))?.toLowerCase();
            const urutan = mapping?.urutan ?? materi?.pivot?.urutan ?? materi?.urutan;

            const kurikulumKey = mapping?.id_kurikulum ?? kurikulumId ?? 'kurikulum';
            const mataPelajaranKey = mapping?.id_mata_pelajaran ?? mataPelajaranId ?? 'mapel';
            const key = materiId
              ? `${kurikulumKey}-${mataPelajaranKey}-${materiId}`
              : `materi-index-${index}`;

            return (
              <View key={key} style={styles.materiCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={getFileIcon(materi?.file_name)}
                      size={20}
                      color="#dc3545"
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.materiName}>{materi?.nama_materi || 'Tanpa Nama'}</Text>
                    <Text style={styles.materiDescription}>{materi?.deskripsi || 'Belum ada deskripsi materi.'}</Text>
                    <View style={styles.materiMeta}>
                      <Text style={styles.urutanText}>Urutan: {urutan ?? '-'}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(statusKey) }
                        ]}
                      >
                        <Text style={styles.statusText}>{getStatusLabel(materi)}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditMateri(materiItem)}
                  >
                    <Ionicons name="pencil" size={16} color="#007bff" />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteMateri(materiItem)}
                    disabled={isDeleting && deletingMateriId === (mapping?.id_materi ?? materi?.id_materi)}
                  >
                    {deletingMateriId === (mapping?.id_materi ?? materi?.id_materi) ? (
                      <>
                        <ActivityIndicator size="small" color="#dc3545" style={styles.actionSpinner} />
                        <Text style={[styles.actionText, styles.deleteText, styles.processingText]}>Memproses...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="trash" size={16} color="#dc3545" />
                        <Text style={[styles.actionText, styles.deleteText]}>Lepas</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {materiItems.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>Belum Ada Materi</Text>
              <Text style={styles.emptySubtitle}>
                Tap tombol + untuk menambah materi baru atau gunakan opsi "Tambah Materi Eksisting" di atas.
              </Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#17a2b8" />
            <Text style={styles.infoText}>
              Daftar materi menampilkan materi yang sudah ditautkan ke kurikulum aktif.
              Gunakan tombol di atas untuk menautkan materi yang sudah ada atau tambahkan materi baru dengan tombol +.
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isAddExistingVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseAddExisting}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Materi Eksisting</Text>
              <TouchableOpacity onPress={handleCloseAddExisting} style={styles.modalCloseButton}>
                <Ionicons name="close" size={20} color="#6c757d" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Pilih materi yang sudah ada untuk ditautkan ke kurikulum ini.
            </Text>

            {isLibraryLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.modalLoadingText}>Memuat materi tersedia...</Text>
              </View>
            ) : materiLibraryError ? (
              <View style={styles.modalError}>
                <Ionicons name="warning" size={20} color="#dc3545" />
                <Text style={styles.modalErrorText}>
                  {materiLibraryError?.data?.message || materiLibraryError?.error || 'Gagal memuat daftar materi.'}
                </Text>
                <TouchableOpacity style={styles.modalRetryButton} onPress={fetchMateriLibrary}>
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={styles.modalRetryText}>Coba Lagi</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {availableMateriList.map((materi, index) => (
                  <View key={materi.id_materi ?? `available-${index}`} style={styles.modalMateriCard}>
                    <View style={styles.modalMateriInfo}>
                      <Text style={styles.modalMateriName}>{materi.nama_materi}</Text>
                      <Text style={styles.modalMateriDescription}>
                        {materi.deskripsi || 'Belum ada deskripsi materi.'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.modalAttachButton,
                        (attachingMateriId === materi.id_materi || isAdding) && styles.modalAttachButtonDisabled
                      ]}
                      onPress={() => handleAttachExistingMateri(materi)}
                      disabled={attachingMateriId === materi.id_materi || isAdding}
                    >
                      {attachingMateriId === materi.id_materi ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="add-circle" size={16} color="#fff" />
                          <Text style={styles.modalAttachText}>Tautkan</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}

                {availableMateriList.length === 0 && (
                  <View style={styles.modalEmptyState}>
                    <Ionicons name="checkmark-circle" size={36} color="#17a2b8" />
                    <Text style={styles.modalEmptyTitle}>Semua materi sudah ditautkan</Text>
                    <Text style={styles.modalEmptySubtitle}>
                      Anda dapat membuat materi baru dengan menekan tombol + pada layar utama.
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <FloatingActionButton
        onPress={handleAddMateri}
        icon="add"
        backgroundColor="#007bff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  missingKurikulumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  missingKurikulumIcon: {
    marginBottom: 16,
  },
  missingKurikulumTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    textAlign: 'center',
  },
  missingKurikulumSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  missingKurikulumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  missingKurikulumButtonIcon: {
    marginRight: 8,
  },
  missingKurikulumButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e8f4ff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  secondaryButtonDisabled: {
    backgroundColor: '#f1f3f5',
  },
  secondaryButtonText: {
    marginLeft: 6,
    color: '#0c5460',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButtonTextDisabled: {
    color: '#adb5bd',
  },
  content: {
    padding: 20,
  },
  materiCard: {
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
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8d7da',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  materiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 4,
  },
  materiDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 18,
  },
  materiMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urutanText: {
    fontSize: 12,
    color: '#6c757d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  actionSpinner: {
    marginRight: 6,
  },
  deleteButton: {
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#007bff',
  },
  deleteText: {
    color: '#dc3545',
  },
  processingText: {
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#0056b3',
    marginLeft: 10,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 15,
  },
  modalList: {
    maxHeight: 320,
  },
  modalMateriCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalMateriInfo: {
    flex: 1,
    marginRight: 12,
  },
  modalMateriName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 4,
  },
  modalMateriDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
  modalAttachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalAttachButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  modalAttachText: {
    color: '#fff',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  modalLoading: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalLoadingText: {
    marginTop: 10,
    color: '#6c757d',
    fontSize: 12,
  },
  modalError: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalErrorText: {
    fontSize: 12,
    color: '#dc3545',
    textAlign: 'center',
    marginVertical: 10,
  },
  modalRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalRetryText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  modalEmptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  modalEmptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343a40',
    marginTop: 12,
  },
  modalEmptySubtitle: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 6,
  },
});

export default MateriManagementScreen;
