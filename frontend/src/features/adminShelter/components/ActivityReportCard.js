import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPercentage } from '../utils/reportUtils';

/**
 * Activity Report Card Component
 * Displays activity information with expandable attendance details
 * 
 * @param {Object} props - Component props
 * @param {Object} props.activity - Activity data
 * @param {boolean} props.isExpanded - Whether the card is expanded
 * @param {Function} props.onToggle - Function called when card is toggled
 * @param {Function} props.onActivityPress - Function called when activity is pressed
 */
const ActivityReportCard = ({ 
  activity, 
  isExpanded, 
  onToggle, 
  onActivityPress 
}) => {
  const handleActivityPress = () => {
    if (onActivityPress) {
      onActivityPress(activity);
    }
  };

  const handleCardToggle = () => {
    if (onToggle) {
      onToggle();
    }
  };

  const getAttendanceStatusColor = (percentage) => {
    if (percentage >= 80) return '#2ecc71';
    if (percentage >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const renderBasicInfo = () => (
    <View style={styles.basicInfo}>
      <View style={styles.headerRow}>
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle} numberOfLines={2}>
            {activity.materi || 'Aktivitas'}
          </Text>
          <Text style={styles.activityDate}>
            {activity.tanggal_formatted}
          </Text>
          <View style={styles.metaInfo}>
            <Text style={styles.jenisKegiatan}>
              {activity.jenis_kegiatan}
            </Text>
            {activity.level && (
              <Text style={styles.level}>• {activity.level}</Text>
            )}
          </View>
        </View>
        
        {activity.foto_1_url && (
          <Image 
            source={{ uri: activity.foto_1_url }} 
            style={styles.activityImage}
          />
        )}
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {activity.attendance_stats?.total_participants || 0}
          </Text>
          <Text style={styles.summaryLabel}>Peserta</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[
            styles.summaryValue,
            { color: getAttendanceStatusColor(activity.attendance_stats?.attendance_percentage || 0) }
          ]}>
            {formatPercentage(activity.attendance_stats?.attendance_percentage || 0)}%
          </Text>
          <Text style={styles.summaryLabel}>Kehadiran</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {activity.attendance_stats?.present_count || 0}
          </Text>
          <Text style={styles.summaryLabel}>Hadir</Text>
        </View>
      </View>
    </View>
  );

  const renderExpandedInfo = () => (
    <View style={styles.expandedInfo}>
      <View style={styles.separator} />
      
      {/* Tutor Info */}
      {activity.tutor_nama && (
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.infoLabel}>Tutor:</Text>
          <Text style={styles.infoValue}>{activity.tutor_nama}</Text>
        </View>
      )}

      {/* Time Info */}
      {activity.start_time && (
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.infoLabel}>Waktu:</Text>
          <Text style={styles.infoValue}>
            {activity.start_time} - {activity.end_time || ''}
          </Text>
        </View>
      )}

      {/* Group Info */}
      {activity.nama_kelompok && (
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.infoLabel}>Kelompok:</Text>
          <Text style={styles.infoValue}>{activity.nama_kelompok}</Text>
        </View>
      )}

      {/* Detailed Attendance Stats */}
      <View style={styles.attendanceDetails}>
        <Text style={styles.detailsTitle}>Detail Kehadiran</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIndicator, { backgroundColor: '#2ecc71' }]} />
            <Text style={styles.statLabel}>Hadir</Text>
            <Text style={styles.statValue}>
              {activity.attendance_stats?.present_count || 0}
            </Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIndicator, { backgroundColor: '#f39c12' }]} />
            <Text style={styles.statLabel}>Terlambat</Text>
            <Text style={styles.statValue}>
              {activity.attendance_stats?.late_count || 0}
            </Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIndicator, { backgroundColor: '#e74c3c' }]} />
            <Text style={styles.statLabel}>Tidak Hadir</Text>
            <Text style={styles.statValue}>
              {activity.attendance_stats?.absent_count || 0}
            </Text>
          </View>
        </View>
      </View>

      {/* Additional Photos */}
      {(activity.foto_2_url || activity.foto_3_url) && (
        <View style={styles.photosSection}>
          <Text style={styles.photosTitle}>Foto Kegiatan</Text>
          <View style={styles.photosGrid}>
            {activity.foto_2_url && (
              <Image 
                source={{ uri: activity.foto_2_url }} 
                style={styles.additionalPhoto}
              />
            )}
            {activity.foto_3_url && (
              <Image 
                source={{ uri: activity.foto_3_url }} 
                style={styles.additionalPhoto}
              />
            )}
          </View>
        </View>
      )}

      {/* View Details Button */}
      <TouchableOpacity 
        style={styles.detailButton} 
        onPress={handleActivityPress}
        activeOpacity={0.7}
      >
        <Text style={styles.detailButtonText}>Lihat Detail Lengkap</Text>
        <Ionicons name="chevron-forward" size={16} color="#9b59b6" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.card}
        onPress={handleCardToggle}
        activeOpacity={0.7}
      >
        {renderBasicInfo()}
        
        <View style={styles.expandButton}>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9b59b6" 
          />
        </View>
      </TouchableOpacity>

      {isExpanded && renderExpandedInfo()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  basicInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activityInfo: {
    flex: 1,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    color: '#9b59b6',
    marginBottom: 4,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jenisKegiatan: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  level: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  activityImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  expandButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  expandedInfo: {
    backgroundColor: '#fafafa',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  attendanceDetails: {
    marginTop: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  photosSection: {
    marginTop: 16,
  },
  photosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photosGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  additionalPhoto: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f3ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9b59b6',
    marginRight: 4,
  },
});

export default ActivityReportCard;