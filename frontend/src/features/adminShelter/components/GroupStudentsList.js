import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Components
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

// API Service
import { adminShelterKelompokApi } from '../api/adminShelterKelompokApi';

/**
 * Display a list of students in a kelompok/group
 * 
 * @param {Object} props
 * @param {string|number} props.kelompokId - ID of the kelompok to display students for
 * @param {boolean} props.showTitle - Whether to show the section title
 * @param {Function} props.onRefresh - Callback for refresh action
 */
const GroupStudentsList = ({ kelompokId, showTitle = true, onRefresh }) => {
  const navigation = useNavigation();
  
  // State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Load students on mount and when kelompokId changes
  useEffect(() => {
    if (kelompokId) {
      fetchStudents();
    } else {
      setStudents([]);
      setLoading(false);
    }
  }, [kelompokId]);
  
  // Fetch students for the kelompok
  const fetchStudents = async () => {
    if (!kelompokId) return;
    
    try {
      setError(null);
      const response = await adminShelterKelompokApi.getGroupChildren(kelompokId);
      
      if (response.data && response.data.data) {
        // Filter only active students
        const activeStudents = response.data.data.filter(
          student => student.status_validasi === 'aktif'
        );
        setStudents(activeStudents);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching kelompok students:', err);
      setError('Failed to load students in this group');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents();
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Navigate to student details
  const handleViewStudent = (student) => {
    navigation.navigate('AnakDetail', {
      id: student.id_anak,
      title: student.full_name || student.nick_name
    });
  };
  
  // Render student item
  const renderStudentItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.studentCard}
      onPress={() => handleViewStudent(item)}
      activeOpacity={0.7}
    >
      {/* Student Image */}
      <View style={styles.avatarContainer}>
        {item.foto_url ? (
          <Image source={{ uri: item.foto_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={24} color="#bdc3c7" />
          </View>
        )}
      </View>
      
      {/* Student Details */}
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
              Jenis kelamin: {item.jenis_kelamin === 'Laki-laki' ? 'Laki-Laki' : item.jenis_kelamin === 'Perempuan' ? 'Perempuan' : item.jenis_kelamin}
            </Text>
          )}
        </View>
      </View>
      
      {/* Action Icon */}
      <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
    </TouchableOpacity>
  );
  
  // Render empty list
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color="#bdc3c7" />
      <Text style={styles.emptyText}>No students in this group</Text>
      {kelompokId ? (
        <Text style={styles.emptySubText}>Try selecting a different group</Text>
      ) : (
        <Text style={styles.emptySubText}>This activity is not associated with any group</Text>
      )}
    </View>
  );
  
  // Show loading spinner
  if (loading && !refreshing && !students.length) {
    return <LoadingSpinner message="Loading students..." />;
  }
  
  return (
    <View style={styles.container}>
      {/* Section Title */}
      {showTitle && (
        <Text style={styles.sectionTitle}>
          Students in Group {students.length > 0 ? `(${students.length})` : ''}
        </Text>
      )}
      
      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchStudents}
        />
      )}
      
      {/* Students List */}
      <FlatList
        data={students}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id_anak.toString()}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3498db']}
          />
        }
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