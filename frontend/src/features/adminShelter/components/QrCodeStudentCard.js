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
 * QR Code Student Card Component
 * Displays student information with QR code status and generation options
 * 
 * @param {Object} props - Component props
 * @param {Object} props.student - Student data
 * @param {boolean} props.hasToken - Whether student has a token
 * @param {boolean} props.isSelected - Whether student is selected
 * @param {Function} props.onSelect - Callback when selection changes
 * @param {Function} props.onGenerate - Callback to generate token
 * @param {Function} props.onView - Callback to view QR code
 */
const QrCodeStudentCard = ({ 
  student, 
  hasToken, 
  isSelected, 
  onSelect, 
  onGenerate, 
  onView 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Selection checkbox */}
        <TouchableOpacity
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected
          ]}
          onPress={onSelect}
        >
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </TouchableOpacity>
        
        {/* Student photo */}
        <View style={styles.photoContainer}>
          {student.foto_url ? (
            <Image 
              source={{ uri: student.foto_url }} 
              style={styles.photo} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="person" size={24} color="#bdc3c7" />
            </View>
          )}
        </View>
        
        {/* Student info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {student.full_name || student.nick_name || 'Unknown'}
          </Text>
          <Text style={styles.id}>ID: {student.id_anak}</Text>
        </View>
        
        {/* Status indicator */}
        <View style={[
          styles.statusIndicator,
          hasToken ? styles.hasToken : styles.noToken
        ]}>
          <Ionicons 
            name={hasToken ? "qr-code" : "qr-code-outline"} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.statusText}>
            {hasToken ? 'Active' : 'No QR'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        {/* Generate Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onGenerate}
        >
          <Ionicons name="refresh" size={16} color="#3498db" />
          <Text style={styles.actionButtonText}>
            {hasToken ? 'Regenerate' : 'Generate QR'}
          </Text>
        </TouchableOpacity>
        
        {/* View Button */}
        {hasToken && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onView}
          >
            <Ionicons name="eye" size={16} color="#3498db" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: '#3498db',
  },
  photoContainer: {
    marginRight: 10,
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  photoPlaceholder: {
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  id: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  hasToken: {
    backgroundColor: '#2ecc71',
  },
  noToken: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#3498db',
    marginLeft: 4,
  },
});

export default QrCodeStudentCard;