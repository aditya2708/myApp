import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const FileUploadInput = ({
  value,
  onFileSelect,
  onFileRemove,
  label = "Upload File",
  placeholder = "Pilih file untuk diupload",
  allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'],
  maxSizeInMB = 10,
  required = false,
  error = null,
  disabled = false,
  uploadProgress = 0,
  isUploading = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Helper functions
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'document-text';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'document';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return 'easel';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'grid';
    if (mimeType?.includes('image')) return 'image';
    return 'document-attach';
  };

  const getFileTypeLabel = (mimeType) => {
    if (mimeType?.includes('pdf')) return 'PDF';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return 'Word Document';
    if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) return 'PowerPoint';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return 'Excel';
    if (mimeType?.includes('image')) return 'Image';
    return 'Document';
  };

  const validateFile = (file) => {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size && file.size > maxSizeInBytes) {
      return `Ukuran file terlalu besar. Maksimal ${maxSizeInMB}MB`;
    }

    // Check file type
    if (allowedTypes.length > 0 && file.mimeType && !allowedTypes.includes(file.mimeType)) {
      const allowedExtensions = allowedTypes.map(type => {
        if (type.includes('pdf')) return 'PDF';
        if (type.includes('word') || type.includes('document')) return 'Word';
        if (type.includes('powerpoint') || type.includes('presentation')) return 'PowerPoint';
        if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
        return type;
      }).join(', ');
      return `Tipe file tidak didukung. Hanya ${allowedExtensions} yang diizinkan`;
    }

    return null;
  };

  // Event handlers
  const handleFilePicker = async () => {
    if (disabled || isUploading) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes.length > 0 ? allowedTypes : '*/*',
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
          Alert.alert('File Tidak Valid', validationError);
          return;
        }

        // Create file object with consistent structure
        const fileObject = {
          uri: file.uri,
          name: file.name,
          size: file.size,
          mimeType: file.mimeType || 'application/octet-stream',
          type: file.mimeType || 'application/octet-stream'
        };

        if (onFileSelect) {
          onFileSelect(fileObject);
        }
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Kesalahan', 'Gagal memilih file. Silakan coba lagi.');
    }
  };

  const handleRemoveFile = () => {
    if (disabled || isUploading) return;
    
    Alert.alert(
      'Hapus File',
      'Apakah Anda yakin ingin menghapus file ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: () => {
            if (onFileRemove) {
              onFileRemove();
            }
          }
        }
      ]
    );
  };

  // Render components
  const renderUploadArea = () => (
    <TouchableOpacity
      style={[
        styles.uploadArea,
        isDragOver && styles.uploadAreaDragOver,
        error && styles.uploadAreaError,
        disabled && styles.uploadAreaDisabled
      ]}
      onPress={handleFilePicker}
      disabled={disabled || isUploading}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="cloud-upload-outline" 
        size={48} 
        color={error ? '#e74c3c' : disabled ? '#bdc3c7' : '#3498db'} 
      />
      <Text style={[
        styles.uploadText,
        error && styles.uploadTextError,
        disabled && styles.uploadTextDisabled
      ]}>
        {placeholder}
      </Text>
      <Text style={[
        styles.uploadSubtext,
        disabled && styles.uploadSubtextDisabled
      ]}>
        Tap untuk memilih file
      </Text>
      {allowedTypes.length > 0 && (
        <Text style={styles.allowedTypes}>
          Format: {allowedTypes.map(type => {
            if (type.includes('pdf')) return 'PDF';
            if (type.includes('word') || type.includes('document')) return 'Word';
            if (type.includes('powerpoint') || type.includes('presentation')) return 'PowerPoint';
            if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
            return type;
          }).join(', ')}
        </Text>
      )}
      {maxSizeInMB > 0 && (
        <Text style={styles.sizeLimit}>
          Maksimal {maxSizeInMB}MB
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderFilePreview = () => (
    <View style={[
      styles.filePreview,
      error && styles.filePreviewError
    ]}>
      <View style={styles.fileInfo}>
        <View style={styles.fileIconContainer}>
          <Ionicons 
            name={getFileIcon(value.mimeType)} 
            size={32} 
            color="#3498db" 
          />
        </View>
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={2}>
            {value.name}
          </Text>
          <Text style={styles.fileType}>
            {getFileTypeLabel(value.mimeType)} • {formatFileSize(value.size)}
          </Text>
          
          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${uploadProgress}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {uploadProgress}%
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.fileActions}>
        {!isUploading && (
          <>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleFilePicker}
              disabled={disabled}
            >
              <Ionicons name="refresh" size={20} color="#3498db" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRemoveFile}
              disabled={disabled}
            >
              <Ionicons name="trash" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, error && styles.labelError]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        </View>
      )}

      {/* Upload Area or File Preview */}
      {value ? renderFilePreview() : renderUploadArea()}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Upload Status */}
      {isUploading && (
        <View style={styles.uploadingContainer}>
          <Ionicons name="cloud-upload" size={16} color="#3498db" />
          <Text style={styles.uploadingText}>Mengupload file...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  labelError: {
    color: '#e74c3c',
  },
  required: {
    color: '#e74c3c',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#bdc3c7',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  uploadAreaDragOver: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
  },
  uploadAreaError: {
    borderColor: '#e74c3c',
    backgroundColor: '#ffebee',
  },
  uploadAreaDisabled: {
    borderColor: '#ecf0f1',
    backgroundColor: '#f8f9fa',
    opacity: 0.6,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginTop: 12,
    textAlign: 'center',
  },
  uploadTextError: {
    color: '#e74c3c',
  },
  uploadTextDisabled: {
    color: '#bdc3c7',
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'center',
  },
  uploadSubtextDisabled: {
    color: '#bdc3c7',
  },
  allowedTypes: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  sizeLimit: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    textAlign: 'center',
  },
  filePreview: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    backgroundColor: 'white',
  },
  filePreviewError: {
    borderColor: '#e74c3c',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
    lineHeight: 20,
  },
  fileType: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    minWidth: 35,
  },
  fileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#e74c3c',
    marginLeft: 6,
    flex: 1,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 6,
  },
});

export default FileUploadInput;