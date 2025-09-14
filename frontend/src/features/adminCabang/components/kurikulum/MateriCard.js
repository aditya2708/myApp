import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MateriCard = ({ 
  materi, 
  onEdit, 
  onDelete, 
  onPreview, 
  dragHandle = false,
  style 
}) => {
  const handleDelete = () => {
    Alert.alert(
      'Hapus Materi',
      `Apakah Anda yakin ingin menghapus materi "${materi.nama_materi}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: () => onDelete && onDelete(materi.id_materi)
        }
      ]
    );
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileExtension = (fileName) => {
    if (!fileName) return '';
    return fileName.split('.').pop().toUpperCase();
  };

  const getStatusColor = () => {
    if (materi.is_from_template) {
      return materi.is_customized ? '#ff9800' : '#4caf50';
    }
    return '#2196f3';
  };

  const getStatusText = () => {
    if (materi.is_from_template) {
      return materi.is_customized ? 'Template (Dimodifikasi)' : 'Template';
    }
    return 'Custom';
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          {dragHandle && (
            <Ionicons 
              name="reorder-three" 
              size={20} 
              color="#999" 
              style={styles.dragHandle}
            />
          )}
          <View style={styles.titleContent}>
            <Text style={styles.title} numberOfLines={2}>
              {materi.nama_materi}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                <Text style={styles.statusText}>{getStatusText()}</Text>
              </View>
              <Text style={styles.orderText}>Urutan: {materi.urutan}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {onPreview && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onPreview(materi)}
            >
              <Ionicons name="eye" size={20} color="#666" />
            </TouchableOpacity>
          )}
          
          {onEdit && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onEdit(materi)}
            >
              <Ionicons name="create" size={20} color="#1976d2" />
            </TouchableOpacity>
          )}
          
          {onDelete && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#d32f2f" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {materi.deskripsi && (
        <Text style={styles.description} numberOfLines={2}>
          {materi.deskripsi}
        </Text>
      )}

      <View style={styles.fileInfo}>
        <View style={styles.fileDetails}>
          <Ionicons name="document" size={16} color="#666" />
          <Text style={styles.fileName} numberOfLines={1}>
            {materi.file_name || 'Tidak ada file'}
          </Text>
          {materi.file_name && (
            <View style={styles.fileExtension}>
              <Text style={styles.fileExtensionText}>
                {getFileExtension(materi.file_name)}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.fileSize}>
          {formatFileSize(materi.file_size)}
        </Text>
      </View>

      {materi.metadata?.usageCount !== undefined && (
        <View style={styles.usageStats}>
          <Ionicons name="school" size={14} color="#666" />
          <Text style={styles.usageText}>
            Digunakan dalam {materi.metadata.usageCount} aktivitas
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#e0e0e0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dragHandle: {
    marginRight: 8,
    marginTop: 2,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  orderText: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  fileInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  fileDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  fileExtension: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  fileExtensionText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
  },
  usageStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  usageText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
});

export default MateriCard;