import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminShelterKelompokApi } from '../api/adminShelterKelompokApi';

/**
 * Display a list of students for one or many kelompok.
 *
 * @param {Object} props
 * @param {string|number} props.kelompokId - Primary kelompok ID (backward compatibility).
 * @param {Array<number>} props.kelompokIds - Optional list of kelompok IDs to aggregate.
 * @param {boolean} props.showTitle - Whether to show the section title.
 * @param {Function} props.onRefresh - Callback for refresh action.
 * @param {string} props.headerNote - Optional helper text displayed under the title.
 */
const GroupStudentsList = ({
  kelompokId,
  kelompokIds = [],
  showTitle = true,
  onRefresh,
  headerNote = null,
}) => {
  const navigation = useNavigation();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeGroupCount, setActiveGroupCount] = useState(0);

  const resolvedKelompokIds = useMemo(() => {
    const ids = [];

    if (Array.isArray(kelompokIds)) {
      ids.push(...kelompokIds.filter(Boolean));
    }

    if (kelompokId) {
      ids.push(kelompokId);
    }

    return Array.from(new Set(ids));
  }, [kelompokId, kelompokIds]);

  const fetchStudents = useCallback(async (ids = resolvedKelompokIds) => {
    if (!ids || ids.length === 0) {
      setStudents([]);
      setActiveGroupCount(0);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const responses = await Promise.all(
        ids.map(id => adminShelterKelompokApi.getGroupChildren(id)),
      );

      const aggregated = responses.flatMap(response => {
        if (response?.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        return [];
      });

      const uniqueStudentsMap = new Map();
      aggregated.forEach(student => {
        if (!student?.id_anak) return;
        if (student.status_validasi && student.status_validasi !== 'aktif') return;
        uniqueStudentsMap.set(student.id_anak, { ...student });
      });

      setStudents(Array.from(uniqueStudentsMap.values()));
      setActiveGroupCount(ids.length);
    } catch (err) {
      console.error('Error fetching kelompok students:', err);
      setError('Failed to load students in this group');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resolvedKelompokIds]);

  useEffect(() => {
    if (!resolvedKelompokIds.length) {
      setStudents([]);
      setLoading(false);
      setActiveGroupCount(0);
      return;
    }

    setLoading(true);
    fetchStudents(resolvedKelompokIds);
  }, [resolvedKelompokIds, fetchStudents]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents(resolvedKelompokIds);
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleViewStudent = (student) => {
    navigation.navigate('AnakDetail', {
      id: student.id_anak,
      title: student.full_name || student.nick_name,
    });
  };

  const renderStudentItem = ({ item }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => handleViewStudent(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.foto_url ? (
          <Image source={{ uri: item.foto_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color="#bdc3c7" />
          </View>
        )}
      </View>

      <View style={styles.studentDetails}>
        <Text style={styles.studentName} numberOfLines={1}>
          {item.full_name || item.nick_name || 'Unknown Student'}
        </Text>

        <View style={styles.studentInfo}>
          <Text style={styles.studentIdText}>ID: {item.id_anak}</Text>

          {item.agama && (
            <Text style={styles.infoText}>Agama: {item.agama}</Text>
          )}

          {item.jenis_kelamin && (
            <Text style={styles.infoText}>
              Jenis kelamin: {item.jenis_kelamin === 'Laki-laki'
                ? 'Laki-Laki'
                : item.jenis_kelamin === 'Perempuan'
                  ? 'Perempuan'
                  : item.jenis_kelamin}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="school-outline" size={48} color="#bdc3c7" />
      <Text style={styles.emptyText}>No students found</Text>
      {resolvedKelompokIds.length > 0 ? (
        <Text style={styles.emptySubText}>Try selecting a different group</Text>
      ) : (
        <Text style={styles.emptySubText}>This activity is not associated with any group</Text>
      )}
    </View>
  );

  if (loading && !refreshing && !students.length) {
    return <LoadingSpinner message="Loading students..." />;
  }

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={styles.sectionTitle}>
          Students in Group {students.length > 0 ? `(${students.length})` : ''}
        </Text>
      )}

      {(headerNote || activeGroupCount > 1) && (
        <Text style={styles.headerNote}>
          {headerNote || `Menampilkan gabungan ${activeGroupCount} kelompok`}
        </Text>
      )}

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => fetchStudents(resolvedKelompokIds)}
        />
      )}

      <FlatList
        data={students}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id_anak.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContainer}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3498db']}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  headerNote: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  studentInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  studentIdText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginRight: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default GroupStudentsList;
