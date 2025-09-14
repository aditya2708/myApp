import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SemesterCard = ({ 
  semester, 
  onPress, 
  onEdit,
  onSetActive,
  onDelete,
  showActions = true 
}) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (isActive) => {
    return isActive ? '#2ecc71' : '#95a5a6';
  };

  const getPeriodeIcon = (periode) => {
    return periode === 'ganjil' ? 'chevron-up' : 'chevron-down';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.semesterName}>{semester.nama_semester}</Text>
          <Text style={styles.tahunAjaran}>{semester.tahun_ajaran}</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(semester.is_active) }]}>
            <Text style={styles.statusText}>
              {semester.is_active ? 'AKTIF' : 'NON-AKTIF'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.periodeRow}>
          <Ionicons 
            name={getPeriodeIcon(semester.periode)} 
            size={16} 
            color="#3498db" 
          />
          <Text style={styles.periodeText}>
            {semester.periode === 'ganjil' ? 'Semester Ganjil' : 'Semester Genap'}
          </Text>
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
          <Text style={styles.dateText}>
            {formatDate(semester.tanggal_mulai)} - {formatDate(semester.tanggal_selesai)}
          </Text>
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Ionicons name="create-outline" size={20} color="#3498db" />
          </TouchableOpacity>
          
          {!semester.is_active && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onSetActive();
              }}
            >
              <Ionicons name="power-outline" size={20} color="#2ecc71" />
            </TouchableOpacity>
          )}
          
          {!semester.is_active && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  semesterName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  tahunAjaran: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    padding: 16,
  },
  periodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodeText: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 8,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    backgroundColor: '#f8f9fa',
  },
  actionButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    elevation: 1,
  },
});

export default SemesterCard;