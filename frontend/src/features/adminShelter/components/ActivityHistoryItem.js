import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ActivityHistoryItem = ({ item }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Ya': return '#27ae60';
      case 'Terlambat': return '#f39c12';
      case 'Tidak': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Ya': return 'Hadir';
      case 'Terlambat': return 'Terlambat';
      case 'Tidak': return 'Tidak Hadir';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.type}>{item.aktivitas?.jenis_kegiatan}</Text>
          <Text style={styles.date}>{formatDate(item.aktivitas?.tanggal)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.absen) }]}>
          <Text style={styles.statusText}>{getStatusText(item.absen)}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{item.aktivitas?.materi}</Text>
        {item.aktivitas?.nama_kelompok && (
          <Text style={styles.groupName}>Kelompok: {item.aktivitas.nama_kelompok}</Text>
        )}
        
        <View style={styles.timeInfo}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.timeText}>
              Jadwal: {formatTime(item.aktivitas?.start_time)} - {formatTime(item.aktivitas?.end_time)}
            </Text>
          </View>
          {item.time_arrived && (
            <View style={styles.timeRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#666" />
              <Text style={styles.timeText}>
                Kedatangan: {formatTime(item.time_arrived)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.verificationInfo}>
          <View style={styles.verificationRow}>
            <Ionicons 
              name={item.is_verified ? "shield-checkmark" : "shield-outline"} 
              size={16} 
              color={item.is_verified ? "#27ae60" : "#f39c12"} 
            />
            <Text style={[styles.verificationText, { color: item.is_verified ? "#27ae60" : "#f39c12" }]}>
              {item.is_verified ? "Terverifikasi" : "Belum Verifikasi"}
            </Text>
          </View>
          {item.verification_status && (
            <Text style={styles.verificationMethod}>
              ({item.verification_status})
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
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
  info: {
    flex: 1
  },
  type: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498db',
    textTransform: 'uppercase'
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
  content: {
    gap: 8
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  groupName: {
    fontSize: 14,
    color: '#666'
  },
  timeInfo: {
    gap: 4
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  timeText: {
    fontSize: 13,
    color: '#666'
  },
  verificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  verificationText: {
    fontSize: 13,
    fontWeight: '500'
  },
  verificationMethod: {
    fontSize: 12,
    color: '#95a5a6'
  }
});

export default ActivityHistoryItem;