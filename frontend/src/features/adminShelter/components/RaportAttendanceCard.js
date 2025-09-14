import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RaportChart from './RaportChart';
import { formatDateToIndonesian } from '../../../common/utils/dateFormatter';

const RaportAttendanceCard = ({ 
  child, 
  isExpanded, 
  onToggle,
  onChildPress 
}) => {
  const getGradeColor = (grade) => {
    if (grade >= 85) return '#2ecc71';
    if (grade >= 75) return '#f39c12';
    if (grade >= 65) return '#e67e22';
    return '#e74c3c';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return '#2ecc71';
      case 'draft':
        return '#f39c12';
      case 'archived':
        return '#95a5a6';
      default:
        return '#3498db';
    }
  };

  const renderRaportBreakdown = () => {
    if (!child.raport_data || child.raport_data.length === 0) {
      return (
        <View style={styles.emptyBreakdown}>
          <Text style={styles.emptyText}>Belum ada data raport</Text>
        </View>
      );
    }

    return (
      <View style={styles.raportBreakdown}>
        <Text style={styles.breakdownTitle}>Detail Raport</Text>
        {child.raport_data.map((raport, index) => (
          <View key={raport.id_raport || index} style={styles.raportRow}>
            <View style={styles.raportInfo}>
              <Text style={styles.semesterName}>{raport.semester}</Text>
              <Text style={styles.raportStats}>
                {raport.subjects_count} mapel • Avg: {raport.average_grade?.toFixed(1) || '0.0'}
              </Text>
              {raport.tanggal_terbit && (
                <Text style={styles.publishDate}>
                  {formatDateToIndonesian(raport.tanggal_terbit)}
                </Text>
              )}
            </View>
            <View style={styles.raportStatusContainer}>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(raport.status) }
              ]}>
                <Text style={styles.statusText}>{raport.status}</Text>
              </View>
              <Text style={[
                styles.gradeText,
                { color: getGradeColor(raport.average_grade || 0) }
              ]}>
                {raport.average_grade?.toFixed(1) || '0.0'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Card Header */}
      <TouchableOpacity 
        style={styles.header}
        onPress={onToggle}
      >
        <View style={styles.childInfo}>
          <TouchableOpacity onPress={() => onChildPress?.(child)}>
            <Image 
              source={{ uri: child.foto_url }}
              style={styles.photo}
              defaultSource={require('../../../../src/assets/images/logo.png')}
            />
          </TouchableOpacity>
          
          <View style={styles.details}>
            <Text style={styles.name}>{child.full_name}</Text>
            {child.nick_name && (
              <Text style={styles.nickname}>({child.nick_name})</Text>
            )}
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                {child.total_raport} raport • {child.published_count} terbit
              </Text>
              <Text style={[
                styles.averageText,
                { color: getGradeColor(child.average_grade || 0) }
              ]}>
                Avg: {child.average_grade?.toFixed(1) || '0.0'}
              </Text>
            </View>
            {child.latest_semester && (
              <Text style={styles.latestInfo}>
                Terakhir: {child.latest_semester}
              </Text>
            )}
          </View>
        </View>
        
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#666" 
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {child.raport_data && child.raport_data.length > 0 && (
            <RaportChart raportData={child.raport_data} />
          )}
          {renderRaportBreakdown()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16
  },
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  photo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12
  },
  details: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  nickname: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic'
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  statText: {
    fontSize: 12,
    color: '#666'
  },
  averageText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  latestInfo: {
    fontSize: 11,
    color: '#999',
    marginTop: 2
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16
  },
  raportBreakdown: {
    marginTop: 16
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  raportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  raportInfo: {
    flex: 1
  },
  semesterName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333'
  },
  raportStats: {
    fontSize: 11,
    color: '#666',
    marginTop: 2
  },
  publishDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 1
  },
  raportStatusContainer: {
    alignItems: 'flex-end'
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500'
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  emptyBreakdown: {
    alignItems: 'center',
    paddingVertical: 20
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic'
  }
});

export default RaportAttendanceCard;