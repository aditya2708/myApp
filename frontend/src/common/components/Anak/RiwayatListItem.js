import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import utils
import { formatDateToIndonesian } from '../../../common/utils/dateFormatter';

/**
 * Riwayat List Item Component
 * A reusable component to display a history record's basic information in a list
 * 
 * @param {Object} props - Component props
 * @param {Object} props.riwayat - Riwayat (history record) data object
 * @param {Function} props.onPress - Function to call when the item is pressed
 * @param {Function} [props.onEdit] - Function to call when edit button is pressed
 * @param {Function} [props.onDelete] - Function to call when delete button is pressed
 */
const RiwayatListItem = ({ riwayat, onPress, onEdit, onDelete }) => {
  if (!riwayat) return null;

  // Get appropriate icon for the history type
  const getJenisIcon = (jenis) => {
    switch (jenis?.toLowerCase()) {
      case 'kesehatan':
        return 'medkit-outline';
      case 'pendidikan':
        return 'school-outline';
      case 'keluarga':
        return 'people-outline';
      default:
        return 'document-text-outline';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left side - Photo or Icon */}
      <View style={styles.leftSection}>
        {riwayat.foto_url ? (
          <Image
            source={{ uri: riwayat.foto_url }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getJenisIcon(riwayat.jenis_histori)} 
              size={30} 
              color="#ffffff" 
            />
          </View>
        )}
      </View>
      
      {/* Middle section - Riwayat info */}
      <View style={styles.infoSection}>
        <Text style={styles.title} numberOfLines={2}>{riwayat.nama_histori}</Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="folder-outline" size={16} color="#666666" />
            <Text style={styles.detailText}>{riwayat.jenis_histori || 'Lainnya'}</Text>
          </View>
          
          {riwayat.di_opname && (
            <View style={styles.detailItem}>
              <Ionicons name="bed-outline" size={16} color="#666666" />
              <Text style={styles.detailText}>
                {riwayat.di_opname === 'YA' ? 'Dirawat' : 'Tidak Dirawat'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color="#999999" />
          <Text style={styles.dateText}>
            {formatDateToIndonesian(riwayat.tanggal)}
          </Text>
        </View>
      </View>
      
      {/* Right section - Action buttons */}
      {(onEdit || onDelete) && (
        <View style={styles.actionSection}>
          {onEdit && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onEdit(riwayat);
              }}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="create-outline" size={22} color="#3498db" />
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                onDelete(riwayat);
              }}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="trash-outline" size={22} color="#e74c3c" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftSection: {
    marginRight: 12,
  },
  photo: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 4,
  },
  actionSection: {
    justifyContent: 'space-between',
    height: 60,
    paddingVertical: 4,
  },
  actionButton: {
    padding: 6,
  },
});

export default RiwayatListItem;