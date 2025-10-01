import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import FloatingActionButton from '../../../../common/components/FloatingActionButton';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import {
  useGetSemesterListQuery,
  useDeleteSemesterMutation,
  useSetActiveSemesterMutation
} from '../../api/kurikulumApi';
import SemesterListSection from './components/SemesterListSection';
import {
  selectSelectedKurikulum,
  selectSelectedKurikulumId,
  selectActiveKurikulum,
  selectActiveKurikulumId,
} from '../../redux/kurikulumSlice';

// --- Helpers ---
const resolveSemesterId = (semester) => (
  semester?.id_semester ?? semester?.id ?? null
);

const resolveKurikulumId = (value) => (
  value?.id_kurikulum
  ?? value?.kurikulum_id
  ?? value?.id
  ?? null
);

const resolveSemesterKurikulumId = (semester) => (
  semester?.kurikulum_id
  ?? semester?.id_kurikulum
  ?? semester?.kurikulum?.id_kurikulum
  ?? semester?.kurikulum?.kurikulum_id
  ?? semester?.kurikulum?.id
  ?? null
);

const normalizeSemesterList = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

// --- Screen Component ---
const SemesterManagementScreen = ({ navigation }) => {
  const selectedKurikulumId = useSelector(selectSelectedKurikulumId);
  const selectedKurikulum = useSelector(selectSelectedKurikulum);
  const activeKurikulumIdFromStore = useSelector(selectActiveKurikulumId);
  const activeKurikulum = useSelector(selectActiveKurikulum);

  const resolvedSelectedId = selectedKurikulumId ?? resolveKurikulumId(selectedKurikulum);
  const resolvedActiveId = activeKurikulumIdFromStore ?? resolveKurikulumId(activeKurikulum);
  const effectiveKurikulumId = resolvedSelectedId ?? resolvedActiveId ?? null;
  const effectiveKurikulum = selectedKurikulum || activeKurikulum || null;
  const effectiveKurikulumName = effectiveKurikulum?.nama_kurikulum || '';
  const isUsingActiveKurikulum = Boolean(
    effectiveKurikulumId && resolvedActiveId && String(effectiveKurikulumId) === String(resolvedActiveId)
  );

  const [selectedTab, setSelectedTab] = useState('active');

  const semesterQueryParams = useMemo(() => {
    const params = { status: 'all' };
    if (effectiveKurikulumId) params.kurikulum_id = effectiveKurikulumId;
    return params;
  }, [effectiveKurikulumId]);

  const {
    data: semesterResponse,
    isLoading,
    isFetching,
    error,
    refetch
  } = useGetSemesterListQuery(semesterQueryParams, {
    skip: !effectiveKurikulumId,
  });

  const [deleteSemester, { isLoading: isDeleting }] = useDeleteSemesterMutation();
  const [setActiveSemester, { isLoading: isActivating }] = useSetActiveSemesterMutation();

  useFocusEffect(
    React.useCallback(() => {
      if (!effectiveKurikulumId) return;
      refetch();
    }, [refetch, effectiveKurikulumId])
  );

  const handleAddSemester = () => {
    if (!effectiveKurikulumId) {
      Alert.alert(
        'Kurikulum Belum Ditentukan',
        'Tetapkan kurikulum aktif atau pilih kurikulum sebelum menambah semester baru.'
      );
      return;
    }

    navigation.navigate('SemesterForm', {
      mode: 'create',
      kurikulumId: effectiveKurikulumId,
      kurikulumName: effectiveKurikulumName,
    });
  };

  const handleEditSemester = (semester) => {
    navigation.navigate('SemesterForm', {
      mode: 'edit',
      semester,
      kurikulumId: effectiveKurikulumId,
      kurikulumName: effectiveKurikulumName,
    });
  };

  const handleDeleteSemester = async (semester) => {
    const semesterId = resolveSemesterId(semester);
    if (!semesterId) {
      Alert.alert('Error', 'ID semester tidak ditemukan');
      return;
    }

    Alert.alert(
      'Hapus Semester',
      `Apakah Anda yakin ingin menghapus semester "${semester.nama_semester}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSemester(semesterId).unwrap();
              Alert.alert('Berhasil', 'Semester berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', error?.data?.message || 'Gagal menghapus semester');
            }
          }
        }
      ]
    );
  };

  const handleSetActive = async (semester) => {
    const semesterId = resolveSemesterId(semester);
    if (!semesterId) {
      Alert.alert('Error', 'ID semester tidak ditemukan');
      return;
    }

    Alert.alert(
      'Aktifkan Semester',
      `Aktifkan semester "${semester.nama_semester}"? Semester aktif lainnya akan dinonaktifkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Aktifkan',
          onPress: async () => {
            try {
              await setActiveSemester(semesterId).unwrap();
              Alert.alert('Berhasil', 'Semester berhasil diaktifkan');
            } catch (error) {
              Alert.alert('Error', error?.data?.message || 'Gagal mengaktifkan semester');
            }
          }
        }
      ]
    );
  };

  const allSemesters = useMemo(() => normalizeSemesterList(semesterResponse), [semesterResponse]);

  const normalizedEffectiveId = effectiveKurikulumId ? String(effectiveKurikulumId) : null;
  const filteredSemesters = useMemo(() => {
    if (!normalizedEffectiveId) return [];
    return allSemesters.filter((semester) => {
      const semesterKurikulumId = resolveSemesterKurikulumId(semester);
      return semesterKurikulumId && String(semesterKurikulumId) === normalizedEffectiveId;
    });
  }, [allSemesters, normalizedEffectiveId]);

  const semesterData = useMemo(() => ({
    active: filteredSemesters.filter((semester) => semester.is_active),
    draft: filteredSemesters.filter(
      (semester) => !semester.is_active && (!semester.status || semester.status === 'draft')
    ),
    completed: filteredSemesters.filter((semester) => semester.status === 'completed'),
    archived: filteredSemesters.filter((semester) => semester.status === 'archived'),
  }), [filteredSemesters]);

  const hasMismatchedSemesters = useMemo(() => {
    if (!normalizedEffectiveId || allSemesters.length === 0) return false;
    return allSemesters.some((semester) => {
      const semesterKurikulumId = resolveSemesterKurikulumId(semester);
      return semesterKurikulumId && String(semesterKurikulumId) !== normalizedEffectiveId;
    });
  }, [allSemesters, normalizedEffectiveId]);

  const tabs = [
    { key: 'active', label: 'Aktif', count: semesterData.active.length },
    { key: 'draft', label: 'Draft', count: semesterData.draft.length },
    { key: 'completed', label: 'Selesai', count: semesterData.completed.length },
  ];

  const currentData = semesterData[selectedTab] || [];
  const isRefreshing = isFetching || isDeleting || isActivating;

  if (!effectiveKurikulumId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Kelola Semester</Text>
          <Text style={styles.subtitle}>
            Manajemen semester untuk kurikulum cabang
          </Text>
          <View style={[styles.noticeBanner, styles.noticeBannerInfo]}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#0d6efd"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.noticeText, styles.noticeTextInfo]}>
              Pilih atau aktifkan kurikulum terlebih dahulu sebelum mengelola semester.
            </Text>
          </View>
        </View>

        <View style={styles.emptyStateContainer}>
          <Ionicons name="school-outline" size={48} color="#94a3b8" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyStateTitle}>Belum ada kurikulum yang dipilih</Text>
          <Text style={styles.emptyStateSubtitle}>
            Silakan pilih kurikulum dari daftar kurikulum cabang untuk melihat semester yang terkait.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) return <LoadingSpinner message="Memuat data semester..." />;

  if (error) {
    return <ErrorMessage message="Gagal memuat data semester" onRetry={refetch} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kelola Semester</Text>
        <Text style={styles.subtitle}>
          Manajemen semester untuk kurikulum cabang
        </Text>
        {effectiveKurikulum && (
          <View
            style={[
              styles.kurikulumContextBanner,
              isUsingActiveKurikulum
                ? styles.kurikulumContextBannerActive
                : styles.kurikulumContextBannerSelected,
            ]}
          >
            <Ionicons
              name={isUsingActiveKurikulum ? 'flash-outline' : 'checkmark-circle-outline'}
              size={18}
              color={isUsingActiveKurikulum ? '#0d6efd' : '#198754'}
              style={{ marginRight: 8 }}
            />
            <View style={styles.kurikulumContextTextContainer}>
              <Text
                style={[
                  styles.kurikulumContextLabel,
                  isUsingActiveKurikulum
                    ? styles.kurikulumContextLabelActive
                    : styles.kurikulumContextLabelSelected,
                ]}
              >
                {isUsingActiveKurikulum
                  ? 'Mengelola kurikulum aktif'
                  : 'Mengelola kurikulum terpilih'}
              </Text>
              <Text
                style={[
                  styles.kurikulumContextName,
                  isUsingActiveKurikulum
                    ? styles.kurikulumContextNameActive
                    : styles.kurikulumContextNameSelected,
                ]}
                numberOfLines={1}
              >
                {effectiveKurikulumName || 'Kurikulum tanpa nama'}
              </Text>
            </View>
          </View>
        )}
        {normalizedEffectiveId && currentData.length === 0 && hasMismatchedSemesters && (
          <View style={styles.noticeBanner}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#b45309"
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.noticeText, styles.noticeTextWarning]}>
              Tidak ada semester yang terhubung dengan kurikulum ini. Tambahkan semester baru agar data selaras.
            </Text>
          </View>
        )}
      </View>

      <SemesterListSection
        tabs={tabs}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        data={currentData}
        isRefreshing={isRefreshing}
        onRefresh={refetch}
        onEdit={handleEditSemester}
        onDelete={handleDeleteSemester}
        onSetActive={handleSetActive}
      />

      {effectiveKurikulumId ? (
        <FloatingActionButton
          onPress={handleAddSemester}
          icon="add"
          backgroundColor="#28a745"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#343a40', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6c757d' },
  kurikulumContextBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  kurikulumContextBannerActive: {
    backgroundColor: '#e7f1ff',
    borderWidth: 1,
    borderColor: '#cfe2ff',
  },
  kurikulumContextBannerSelected: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  kurikulumContextTextContainer: { flex: 1 },
  kurikulumContextLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kurikulumContextLabelActive: { color: '#0d6efd' },
  kurikulumContextLabelSelected: { color: '#198754' },
  kurikulumContextName: { fontSize: 13, fontWeight: '600', color: '#1f2937', marginTop: 4 },
  kurikulumContextNameActive: { color: '#0d3b66' },
  kurikulumContextNameSelected: { color: '#166534' },
  noticeBanner: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  noticeBannerInfo: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  noticeText: { flex: 1, fontSize: 12 },
  noticeTextWarning: { color: '#92400e' },
  noticeTextInfo: { color: '#1d4ed8' },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#f8f9fa',
  },
  emptyStateTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', textAlign: 'center', marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 13, color: '#4b5563', textAlign: 'center', lineHeight: 18 },
});

export default SemesterManagementScreen;
