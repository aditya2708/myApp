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
 * Prestasi List Item Component
 * A reusable component to display an achievement's basic information in a list
 * 
 * @param {Object} props - Component props
 * @param {Object} props.prestasi - Prestasi (achievement) data object
 * @param {Function} props.onPress - Function to call when the item is pressed
 * @param {Function} [props.onEdit] - Function to call when edit button is pressed
 * @param {Function} [props.onDelete] - Function to call when delete button is pressed
 */
const PrestasiListItem = ({ prestasi, onPress, onEdit, onDelete }) => {
  if (!prestasi) return null;

  // Get appropriate icon for the achievement type
  const getJenisIcon = (jenis) => {
    switch (jenis) {
      case 'Akademik':
        return 'school-outline';
      case 'Olahraga':
        return 'basketball-outline';
      case 'Seni':
        return 'color-palette-outline';
      case 'Non-Akademik':
        return 'heart-outline';
      default:
        return 'ribbon-outline';
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
        {prestasi.foto_url ? (
          <Image
            source={{ uri: prestasi.foto_url }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.iconContainer}>
            <Ionicons 
              name={getJenisIcon(prestasi.jenis_prestasi)} 
              size={30} 
              color="#ffffff" 
            />
          </View>
        )}
      </View>
      
      {/* Middle section - Prestasi info */}
      <View style={styles.infoSection}>
        <Text style={styles.title} numberOfLines={2}>{prestasi.nama_prestasi}</Text>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="trophy-outline" size={16} color="#666666" />
            <Text style={styles.detailText}>{prestasi.jenis_prestasi}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="medal-outline" size={16} color="#666666" />
            <Text style={styles.detailText}>{prestasi.level_prestasi}</Text>
          </View>
        </View>
        
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={14} color="#999999" />
          <Text style={styles.dateText}>
            {formatDateToIndonesian(prestasi.tgl_upload)}
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
                onEdit(prestasi);
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
                onDelete(prestasi);
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

export default PrestasiListItem;