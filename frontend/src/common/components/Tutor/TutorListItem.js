import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Tutor List Item Component
 * A reusable component to display a tutor's basic information in a list
 * 
 * @param {Object} props - Component props
 * @param {Object} props.tutor - Tutor data object
 * @param {Function} props.onPress - Function to call when the item is pressed
 * @param {Function} [props.onEdit] - Function to call when edit button is pressed
 * @param {Function} [props.onDelete] - Function to call when delete button is pressed
 */
const TutorListItem = ({ tutor, onPress, onEdit, onDelete }) => {
  if (!tutor) return null;

  const isActive = tutor.is_active !== undefined ? tutor.is_active : true;

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left side - Photo or Icon */}
      <View style={styles.leftSection}>
        {tutor.foto_url ? (
          <Image
            source={{ uri: tutor.foto_url }}
            style={styles.photo}
          />
        ) : (
          <View style={styles.iconContainer}>
            <Ionicons 
              name="person" 
              size={30} 
              color="#ffffff" 
            />
          </View>
        )}
      </View>
      
      {/* Middle section - Tutor info */}
      <View style={styles.infoSection}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{tutor.nama}</Text>
          <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, isActive ? styles.activeText : styles.inactiveText]}>
              {isActive ? 'Aktif' : 'Nonaktif'}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="mail-outline" size={16} color="#666666" />
            <Text style={styles.detailText}>{tutor.email}</Text>
          </View>
        </View>
        
        {tutor.maple && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="book-outline" size={16} color="#666666" />
              <Text style={styles.detailText}>{tutor.maple}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.additionalInfoRow}>
          <Ionicons name="call-outline" size={14} color="#999999" />
          <Text style={styles.additionalInfoText}>
            {tutor.no_hp}
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
                onEdit(tutor);
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
                onDelete(tutor);
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
  },
  activeBadge: {
    backgroundColor: '#e8f8f2',
  },
  inactiveBadge: {
    backgroundColor: '#fdecea',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#2ecc71',
  },
  inactiveText: {
    color: '#e74c3c',
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
  additionalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  additionalInfoText: {
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

export default TutorListItem;
