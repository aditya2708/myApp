import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Redux
import {
  fetchTodayActivities,
  selectTodayActivities,
  selectTodayActivitiesLoading,
  selectTodayActivitiesError,
  resetTodayActivitiesError
} from '../redux/aktivitasSlice';

// Components
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

const TodayActivitiesCard = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  
  // Redux state
  const todayActivities = useSelector(selectTodayActivities);
  const loading = useSelector(selectTodayActivitiesLoading);
  const error = useSelector(selectTodayActivitiesError);
  
  // Refresh activities when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      dispatch(fetchTodayActivities());
      
      // Cleanup function to reset errors when component unmounts or loses focus
      return () => {
        dispatch(resetTodayActivitiesError());
      };
    }, [dispatch])
  );
  
  const handleActivityPress = (activity) => {
    navigation.navigate('ActivityDetail', { id_aktivitas: activity.id_aktivitas });
  };
  
  const handleViewAllPress = () => {
    const today = new Date().toISOString().split('T')[0];
    navigation.navigate('ActivitiesList', {
      filterDate: today,
      filterType: 'today'
    });
  };
  
  const renderActivityItem = ({ item }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'draft': return '#95a5a6';
        case 'ongoing': return '#f39c12';
        case 'completed': return '#27ae60';
        case 'reported': return '#3498db';
        default: return '#bdc3c7';
      }
    };
    
    const getStatusText = (status) => {
      switch (status) {
        case 'draft': return 'Belum Dimulai';
        case 'ongoing': return 'Sedang Berlangsung';
        case 'completed': return 'Selesai';
        case 'reported': return 'Sudah Dilaporkan';
        default: return status || 'Unknown';
      }
    };
    
    const getActivityIcon = (jenisKegiatan) => {
      return jenisKegiatan === 'Bimbel' ? 'school' : 'people';
    };
    
    return (
      <TouchableOpacity 
        style={styles.activityItem}
        onPress={() => handleActivityPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.activityHeader}>
          <View style={styles.activityIconContainer}>
            <Ionicons 
              name={getActivityIcon(item.jenis_kegiatan)} 
              size={16} 
              color="#3498db" 
            />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle} numberOfLines={1}>
              {item.materi || 'Aktivitas'}
            </Text>
            <Text style={styles.activityType}>
              {item.jenis_kegiatan} • {item.nama_kelompok || 'Semua Kelompok'}
            </Text>
          </View>
          <View style={styles.activityTimeContainer}>
            <Text style={styles.activityTime}>
              {item.start_time ? format(new Date(`2000-01-01T${item.start_time}`), 'HH:mm') : '--:--'}
            </Text>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
          </View>
        </View>
        <Text style={styles.activityStatus}>
          {getStatusText(item.status)}
        </Text>
      </TouchableOpacity>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="calendar-outline" size={32} color="#bdc3c7" />
      <Text style={styles.emptyText}>Tidak ada aktivitas hari ini</Text>
      <TouchableOpacity 
        style={styles.addActivityButton}
        onPress={() => navigation.navigate('ActivityForm')}
      >
        <Ionicons name="add" size={16} color="#3498db" />
        <Text style={styles.addActivityText}>Buat Aktivitas</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Aktivitas Hari Ini</Text>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="small" />
          <Text style={styles.loadingText}>Memuat aktivitas...</Text>
        </View>
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Aktivitas Hari Ini</Text>
        </View>
        <ErrorMessage 
          message={error}
          onRetry={() => dispatch(fetchTodayActivities())}
          compact
        />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Aktivitas Hari Ini</Text>
        <Text style={styles.date}>
          {format(new Date(), 'dd MMMM yyyy', { locale: id })}
        </Text>
        {todayActivities.length > 0 && (
          <TouchableOpacity onPress={handleViewAllPress}>
            <Text style={styles.viewAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {todayActivities.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={todayActivities.slice(0, 3)} // Show max 3 items
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id_aktivitas.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      )}
      
      {todayActivities.length > 3 && (
        <TouchableOpacity style={styles.moreActivitiesButton} onPress={handleViewAllPress}>
          <Text style={styles.moreActivitiesText}>
            +{todayActivities.length - 3} aktivitas lainnya
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ebf3fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  activityType: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  activityTimeContainer: {
    alignItems: 'flex-end',
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityStatus: {
    fontSize: 12,
    color: '#95a5a6',
    marginLeft: 44,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 8,
    marginBottom: 12,
  },
  addActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ebf3fd',
  },
  addActivityText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
    marginLeft: 4,
  },
  moreActivitiesButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  moreActivitiesText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
});

export default TodayActivitiesCard;