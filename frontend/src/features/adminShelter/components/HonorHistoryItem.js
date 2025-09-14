import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Honor History Item Component
 * Displays individual honor record in history list
 * 
 * @param {Object} props - Component props
 * @param {Object} props.honor - Honor data object
 * @param {Function} props.onPress - Function to call when item is pressed
 */
const HonorHistoryItem = ({ honor, onPress }) => {
  if (!honor) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#f39c12';
      case 'approved': return '#27ae60';
      case 'paid': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'approved': return 'Disetujui';
      case 'paid': return 'Dibayar';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return 'time-outline';
      case 'approved': return 'checkmark-circle-outline';
      case 'paid': return 'cash-outline';
      default: return 'help-circle-outline';
    }
  };

  const getMonthName = (month) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1] || '';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.periodInfo}>
          <Text style={styles.monthText}>
            {getMonthName(honor.bulan)} {honor.tahun}
          </Text>
          <View style={styles.statusContainer}>
            <Ionicons 
              name={getStatusIcon(honor.status)} 
              size={16} 
              color={getStatusColor(honor.status)} 
            />
            <Text style={[styles.statusText, { color: getStatusColor(honor.status) }]}>
              {getStatusText(honor.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.honorAmount}>
          Rp {honor.total_honor?.toLocaleString('id-ID')}
        </Text>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {honor.total_aktivitas} aktivitas
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {honor.total_siswa_hadir} siswa hadir
          </Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calculator-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            Rata-rata: {honor.total_aktivitas > 0 ? 
              Math.round(honor.total_siswa_hadir / honor.total_aktivitas) : 0} siswa/aktivitas
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.viewDetailsText}>Tap untuk detail</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  periodInfo: {
    flex: 1
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4
  },
  honorAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  detailsContainer: {
    marginBottom: 12
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  viewDetailsText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic'
  }
});

export default HonorHistoryItem;