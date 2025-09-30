import React, { useState } from 'react';
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

/**
 * Semester Management Screen - API Integrated
 * CRUD interface for semester management
 */
const resolveSemesterId = (semester) => (
  semester?.id_semester ?? semester?.id ?? null
);

const resolveKurikulumId = (value) => (
  value?.id_kurikulum
  ?? value?.kurikulum_id
  ?? value?.id
  ?? null
);

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

  const {
    data: semesterResponse,
    isLoading,
    error,
    refetch
  } = useGetSemesterListQuery({ status: 'all' });

  const [deleteSemester, { isLoading: isDeleting }] = useDeleteSemesterMutation();
  const [setActiveSemester, { isLoading: isActivating }] = useSetActiveSemesterMutation();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
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

  console.log('=== SCREEN DATA PROCESSING ===');
  console.log('- semesterResponse:', semesterResponse);
  console.log('- semesterResponse type:', typeof semesterResponse);
  console.log('- semesterResponse keys:', semesterResponse ? Object.keys(semesterResponse) : 'No keys');

  let allSemesters = [];

  if (semesterResponse?.data) {
    if (Array.isArray(semesterResponse.data)) {
      allSemesters = semesterResponse.data;
      console.log('- Using transformed array data, length:', allSemesters.length);
    } else if (semesterResponse.data.data && Array.isArray(semesterResponse.data.data)) {
      allSemesters = semesterResponse.data.data;
      console.log('- Using pagination data, length:', allSemesters.length);
    } else {
      console.log('- Unknown data structure, using empty array');
      allSemesters = [];
    }
  } else {
    console.log('- No data in response, using empty array');
    allSemesters = [];
  }

  console.log('- Final allSemesters:', allSemesters);
  console.log('- Final allSemesters length:', allSemesters.length);

  const semesterData = {
    active: allSemesters.filter(semester => semester.is_active),
    draft: allSemesters.filter(semester => !semester.is_active && (!semester.status || semester.status === 'draft')),
    completed: allSemesters.filter(semester => semester.status === 'completed'),
    archived: allSemesters.filter(semester => semester.status === 'archived')
  };

  console.log('- Semester counts:', {
    active: semesterData.active.length,
    draft: semesterData.draft.length,
    completed: semesterData.completed.length,
    archived: semesterData.archived.length
  });

  const tabs = [
    { key: 'active', label: 'Aktif', count: semesterData.active.length },
    { key: 'draft', label: 'Draft', count: semesterData.draft.length },
    { key: 'completed', label: 'Selesai', count: semesterData.completed.length },
  ];

  const currentData = semesterData[selectedTab] || [];
  const isRefreshing = isLoading || isDeleting || isActivating;

  if (isLoading) {
    return <LoadingSpinner message="Memuat data semester..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message="Gagal memuat data semester"
        onRetry={refetch}
      />
    );
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

      <FloatingActionButton
        onPress={handleAddSemester}
        icon="add"
        backgroundColor="#28a745"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  kurikulumContextTextContainer: {
    flex: 1,
  },
  kurikulumContextLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kurikulumContextLabelActive: {
    color: '#0d6efd',
  },
  kurikulumContextLabelSelected: {
    color: '#198754',
  },
  kurikulumContextName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
  },
  kurikulumContextNameActive: {
    color: '#0d3b66',
  },
  kurikulumContextNameSelected: {
    color: '#166534',
  },
});

export default SemesterManagementScreen;
