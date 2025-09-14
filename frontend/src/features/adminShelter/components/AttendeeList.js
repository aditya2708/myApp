import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Components
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import VerificationStatusBadge from './VerificationStatusBadge';

// API Service
import { attendanceApi } from '../api/attendanceApi';

const AttendeeList = ({ activityId, onRefresh }) => {
  const navigation = useNavigation();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [error, setError] = useState(null);
  
  // Ref untuk prevent multiple simultaneous requests
  const fetchingRef = useRef(false);
  const lastFetchTime = useRef(0);
  
  // Load attendees on mount and when activityId changes
  useEffect(() => {
    if (activityId) {
      // Debounce untuk prevent multiple calls
      const timeoutId = setTimeout(() => {
        fetchAttendees();
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activityId]);
  
  // Fetch attendees for the activity
  const fetchAttendees = async () => {
    if (!activityId) return;
    
    // Prevent multiple simultaneous requests
    if (fetchingRef.current) return;
    
    // Rate limiting - minimum 1 second between requests
    const now = Date.now();
    if (now - lastFetchTime.current < 1000) return;
    
    try {
      fetchingRef.current = true;
      lastFetchTime.current = now;
      setError(null);
      
      const response = await attendanceApi.getAttendanceByActivity(activityId);
      setAttendees(response.data.data || []);
    } catch (err) {
      console.error('Error mengambil daftar hadir:', err);
      setError('Gagal memuat catatan kehadiran');
    } finally {
      fetchingRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttendees();
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Handle view attendance details
  const handleViewDetails = (attendanceRecord) => {
    navigation.navigate('AttendanceDetail', {
      id_absen: attendanceRecord.id_absen
    });
  };
  
  // Render attendee item
  const renderAttendeeItem = ({ item: attendanceRecord }) => {
    const student = attendanceRecord.absen_user?.anak || {};
    const isPresent = attendanceRecord.absen === 'Ya';
    
    return (
      <TouchableOpacity 
        style={styles.attendeeCard}
        onPress={() => handleViewDetails(attendanceRecord)}
        activeOpacity={0.7}
      >
        {/* Student Image */}
        <View style={styles.avatarContainer}>
          {student.foto_url ? (
            <Image source={{ uri: student.foto_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={24} color="#bdc3c7" />
            </View>
          )}
        </View>
        
        {/* Student Details */}
        <View style={styles.studentDetails}>
         <Text style={styles.studentName}>{student.name || student.full_name || student.nick_name || 'Siswa Tidak Dikenal'}</Text>
          
          <View style={styles.statusContainer}>
            {/* Attendance Status */}
            <View style={[
              styles.attendanceStatus,
              { backgroundColor: isPresent ? '#2ecc71' : '#e74c3c' }
            ]}>
              <Text style={styles.attendanceStatusText}>
                {isPresent ? 'Present' : 'Absent'}
              </Text>
            </View>
            
            {/* Verification Status */}
            <VerificationStatusBadge
              isVerified={attendanceRecord.is_verified}
              status={attendanceRecord.verification_status}
              method={attendanceRecord.latest_verification?.verification_method}
              compact={true}
            />
          </View>
        </View>
        
        {/* Action Icon */}
        <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
      </TouchableOpacity>
    );
  };
  
  // Render empty list
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color="#bdc3c7" />
      <Text style={styles.emptyText}>Belum ada riwayat aktivitas</Text>
     
    </View>
  );
  
  // Show loading spinner
  if (loading && !refreshing && attendees.length === 0) {
    return <LoadingSpinner message="Memuat Data..." />;
  }
  
  return (
    <View style={styles.container}>
      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchAttendees}
        />
      )}
      
      {/* Attendees List */}
      <FlatList
        data={attendees}
        renderItem={renderAttendeeItem}
        keyExtractor={(item) => item.id_absen.toString()}
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
  listContainer: {
    flexGrow: 1,
  },
  attendeeCard: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  attendanceStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
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

export default AttendeeList;