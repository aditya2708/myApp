import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

const FileUploadInput = ({
  onFileSelect,
  fileTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'],
  maxSize = 10 * 1024 * 1024, // 10MB default
  value = null,
  label = 'Pilih File',
  error = null,
  disabled = false,
  showProgress = false,
  uploadProgress = 0,
}) => {
  const [uploading, setUploading] = useState(false);

  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileExtension = (fileName) => {
    return fileName.split('.').pop().toLowerCase();
  };

  const isValidFileType = (fileName) => {
    const extension = getFileExtension(fileName);
    return fileTypes.includes(extension);
  };

  const isValidFileSize = (fileSize) => {
    return fileSize <= maxSize;
  };

  const handleFilePicker = async () => {
    if (disabled || uploading) return;

    try {
      setUploading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'cancel') {
        setUploading(false);
        return;
      }

      // Validate file type
      if (!isValidFileType(result.name)) {
        Alert.alert(
          'File Tidak Valid',
          `Tipe file tidak didukung. Pilih file dengan ekstensi: ${fileTypes.join(', ')}`
        );
        setUploading(false);
        return;
      }

      // Validate file size
      if (!isValidFileSize(result.size)) {
        Alert.alert(
          'File Terlalu Besar',
          `Ukuran file maksimal ${formatFileSize(maxSize)}`
        );
        setUploading(false);
        return;
      }

      const fileData = {
        uri: result.uri,
        name: result.name,
        type: result.mimeType,
        size: result.size,
      };

      if (onFileSelect) {
        await onFileSelect(fileData);
      }

    } catch (error) {
      Alert.alert('Kesalahan', 'Gagal memilih file. Silakan coba lagi.');
      console.error('File picker error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    Alert.alert(
      'Hapus File',
      'Apakah Anda yakin ingin menghapus file ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive',
          onPress: () => onFileSelect && onFileSelect(null)
        }
      ]
    );
  };

  const renderFilePreview = () => {
    if (!value) return null;

    const extension = getFileExtension(value.name || '').toUpperCase();
    const getIconName = () => {
      switch (extension) {
        case 'PDF': return 'document-text';
        case 'DOC':
        case 'DOCX': return 'document';
        case 'PPT':
        case 'PPTX': return 'easel';
        case 'JPG':
        case 'JPEG':
        case 'PNG': return 'image';
        default: return 'document-outline';
      }
    };

    return (
      <View style={styles.filePreview}>
        <View style={styles.fileInfo}>
          <Ionicons name={getIconName()} size={24} color="#1976d2" />
          <View style={styles.fileDetails}>
            <Text style={styles.fileName} numberOfLines={1}>
              {value.name}
            </Text>
            <Text style={styles.fileSize}>
              {formatFileSize(value.size || 0)}
            </Text>
          </View>
          <View style={styles.fileExtension}>
            <Text style={styles.fileExtensionText}>{extension}</Text>
          </View>
        </View>
        
        {!disabled && (
          <TouchableOpacity 
            style={styles.removeButton}
            onPress={handleRemoveFile}
          >
            <Ionicons name="close" size={20} color="#d32f2f" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderProgress = () => {
    if (!showProgress) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${uploadProgress}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{uploadProgress}%</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {value ? (
        <>
          {renderFilePreview()}
          {renderProgress()}
        </>
      ) : (
        <TouchableOpacity
          style={[
            styles.uploadButton,
            disabled && styles.uploadButtonDisabled,
            error && styles.uploadButtonError,
          ]}
          onPress={handleFilePicker}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#1976d2" />
          ) : (
            <Ionicons name="cloud-upload" size={24} color="#1976d2" />
          )}
          
          <Text style={[
            styles.uploadText,
            disabled && styles.uploadTextDisabled,
          ]}>
            {uploading ? 'Memilih file...' : 'Tap untuk pilih file'}
          </Text>
          
          <Text style={styles.uploadHint}>
            Format: {fileTypes.join(', ')} • Max: {formatFileSize(maxSize)}
          </Text>
        </TouchableOpacity>
      )}

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#e3f2fd',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  uploadButtonDisabled: {
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
  },
  uploadButtonError: {
    borderColor: '#ffcdd2',
    backgroundColor: '#ffebee',
  },
  uploadText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '500',
    marginTop: 8,
  },
  uploadTextDisabled: {
    color: '#999',
  },
  uploadHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  fileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#666',
  },
  fileExtension: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  fileExtensionText: {
    fontSize: 10,
    color: '#1976d2',
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
    marginLeft: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 30,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 6,
  },
});

export default FileUploadInput;