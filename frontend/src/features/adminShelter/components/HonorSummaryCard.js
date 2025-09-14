import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import {
  fetchTutorHonor,
  selectHonorSummary,
  selectHonorLoading
} from '../redux/tutorHonorSlice';

const HonorSummaryCard = ({ tutorId, onPress }) => {
  const dispatch = useDispatch();
  
  const summary = useSelector(selectHonorSummary);
  const loading = useSelector(selectHonorLoading);

  useEffect(() => {
    if (tutorId) {
      dispatch(fetchTutorHonor({ 
        tutorId, 
        params: { year: new Date().getFullYear() } 
      }));
    }
  }, [dispatch, tutorId]);

  const getCurrentMonthHonor = () => {
    const currentMonth = new Date().getMonth() + 1;
    return 0;
  };

  if (loading) {
    return (
      <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={styles.header}>
          <Ionicons name="cash-outline" size={24} color="#2ecc71" />
          <Text style={styles.title}>Honor Tutor</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Memuat Data...</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <Ionicons name="cash-outline" size={24} color="#2ecc71" />
        <Text style={styles.title}>Honor Tutor</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
      
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            Rp {summary.yearlyTotal?.toLocaleString('id-ID') || '0'}
          </Text>
          <Text style={styles.summaryLabel}>Total Tahun Ini</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {summary.totalActivities || 0}
          </Text>
          <Text style={styles.summaryLabel}>Total Aktivitas</Text>
        </View>
      </View>
      
      <View style={styles.monthlyInfo}>
        <View style={styles.monthlyItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.monthlyText}>
            Bulan ini: Rp {getCurrentMonthHonor().toLocaleString('id-ID')}
          </Text>
        </View>
        
        <View style={styles.monthlyItem}>
          <Ionicons name="trending-up-outline" size={16} color="#666" />
          <Text style={styles.monthlyText}>
            Rata-rata: Rp {summary.averageStudents?.toLocaleString('id-ID') || '0'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionHint}>
        <Text style={styles.hintText}>Ketuk untuk lihat detail honor</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginLeft: 12
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  loadingText: {
    fontSize: 14,
    color: '#666'
  },
  summaryGrid: {
    flexDirection: 'row',
    marginBottom: 16
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  monthlyInfo: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12
  },
  monthlyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  monthlyText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#666'
  },
  actionHint: {
    alignItems: 'center'
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic'
  }
});

export default HonorSummaryCard;