import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert
} from 'react-native';
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

/**
 * Semester Management Screen - API Integrated
 * CRUD interface for semester management
 */
const SemesterManagementScreen = ({ navigation }) => {
  const { selectedKurikulumId, selectedKurikulum } = useSelector(state => state?.kurikulum || {});
  const activeKurikulumId = selectedKurikulumId
    ?? selectedKurikulum?.id_kurikulum
    ?? selectedKurikulum?.kurikulum_id
    ?? selectedKurikulum?.id
    ?? null;
  const activeKurikulumName = selectedKurikulum?.nama_kurikulum || '';

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
    if (!activeKurikulumId) {
      Alert.alert(
        'Kurikulum Belum Dipilih',
        'Pilih kurikulum terlebih dahulu sebelum menambah semester baru.'
      );
      return;
    }

    navigation.navigate('SemesterForm', {
      mode: 'create',
      kurikulumId: activeKurikulumId,
      kurikulumName: activeKurikulumName,
    });
  };

  const handleEditSemester = (semester) => {
    navigation.navigate('SemesterForm', {
      mode: 'edit',
      semester,
      kurikulumId: activeKurikulumId,
      kurikulumName: activeKurikulumName,
    });
  };

  const handleDeleteSemester = async (semester) => {
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
              await deleteSemester(semester.id_semester).unwrap();
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
    Alert.alert(
      'Aktifkan Semester',
      `Aktifkan semester "${semester.nama_semester}"? Semester aktif lainnya akan dinonaktifkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Aktifkan',
          onPress: async () => {
            try {
              await setActiveSemester(semester.id_semester).unwrap();
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
});

export default SemesterManagementScreen;
