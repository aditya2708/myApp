import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getCurrentLocation,
  requestLocationPermissions,
  isLocationServicesEnabled,
  showGpsPermissionAlert,
  showGpsDisabledAlert,
  getAccuracyDescription,
  formatCoordinates,
  DEFAULT_GPS_CONFIG
} from '../utils/gpsUtils';

const GpsPermissionModal = ({
  visible = false,
  onClose,
  onLocationSuccess,
  onLocationError,
  title = "Izin GPS Diperlukan",
  subtitle = "Kami perlu mengakses lokasi Anda untuk mencatat absensi",
  showLocationPreview = true,
  requiredAccuracy = 20, // meters
  autoCloseOnSuccess = true
}) => {
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);
  const [locationData, setLocationData] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('permission'); // permission, location, success, error

  useEffect(() => {
    if (visible) {
      checkInitialPermissions();
    } else {
      resetState();
    }
  }, [visible]);

  const resetState = () => {
    setLoading(false);
    setPermissionStatus(null);
    setLocationData(null);
    setError(null);
    setStep('permission');
  };

  const checkInitialPermissions = async () => {
    setLoading(true);
    try {
      const permissionResult = await requestLocationPermissions();
      setPermissionStatus(permissionResult);
      
      if (permissionResult.granted) {
        setStep('location');
        await getCurrentLocationData();
      } else {
        setStep('permission');
      }
    } catch (error) {
      setError(error.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocationData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if location services are enabled
      const servicesEnabled = await isLocationServicesEnabled();
      if (!servicesEnabled) {
        showGpsDisabledAlert(
          () => handleClose(),
          () => getCurrentLocationData()
        );
        return;
      }

      const location = await getCurrentLocation(DEFAULT_GPS_CONFIG);
      
      if (location.success) {
        setLocationData(location);
        
        // Check accuracy
        if (location.accuracy > requiredAccuracy) {
          const suggestions = [
            '• Coba di luar ruangan untuk signal GPS yang lebih baik',
            '• Tunggu beberapa detik untuk GPS lock yang lebih akurat', 
            '• Pastikan Location Services aktif penuh',
            '• Hindari area dengan banyak gedung tinggi'
          ];
          
          setError(`Akurasi GPS (${location.accuracy.toFixed(1)}m) kurang baik.\n\nDiperlukan: ${requiredAccuracy}m atau lebih baik.\n\nTips untuk GPS yang lebih akurat:\n${suggestions.join('\n')}`);
          setStep('error');
        } else {
          setStep('success');
          if (autoCloseOnSuccess) {
            setTimeout(() => {
              handleLocationSuccess(location);
            }, 1500);
          }
        }
      } else {
        setError(location.error);
        setStep('error');
      }
    } catch (error) {
      setError(error.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const permissionResult = await requestLocationPermissions();
      setPermissionStatus(permissionResult);
      
      if (permissionResult.granted) {
        setStep('location');
        await getCurrentLocationData();
      } else if (!permissionResult.canAskAgain) {
        showGpsPermissionAlert(
          () => handleClose(),
          () => handleRequestPermission()
        );
      }
    } catch (error) {
      setError(error.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSuccess = (location) => {
    if (onLocationSuccess) {
      onLocationSuccess(location);
    }
    handleClose();
  };

  const handleLocationError = (errorMessage) => {
    if (onLocationError) {
      onLocationError(errorMessage);
    }
    handleClose();
  };

  const handleClose = () => {
    resetState();
    if (onClose) {
      onClose();
    }
  };

  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const renderPermissionStep = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Ionicons name="location-outline" size={64} color="#3498db" />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      
      <View style={styles.bulletPoints}>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
          <Text style={styles.bulletText}>Pastikan Anda berada di lokasi yang benar</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
          <Text style={styles.bulletText}>Jaga keakuratan data absensi</Text>
        </View>
        <View style={styles.bulletPoint}>
          <Ionicons name="checkmark-circle" size={16} color="#27ae60" />
          <Text style={styles.bulletText}>Cegah kecurangan absensi</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]} 
          onPress={handleClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.allowButton]}
          onPress={handleRequestPermission}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.allowButtonText}>Izinkan Lokasi</Text>
          )}
        </TouchableOpacity>
      </View>

      {permissionStatus && !permissionStatus.granted && !permissionStatus.canAskAgain && (
        <TouchableOpacity style={styles.settingsLink} onPress={openAppSettings}>
          <Text style={styles.settingsLinkText}>Buka Pengaturan untuk Mengaktifkan Lokasi</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>

      <Text style={styles.title}>Mengambil Lokasi Anda</Text>
      <Text style={styles.subtitle}>Mohon tunggu, kami sedang mengambil koordinat GPS Anda...</Text>

      <View style={styles.loadingInfo}>
        <Text style={styles.loadingText}>• Pastikan berada di luar ruangan atau dekat jendela</Text>
        <Text style={styles.loadingText}>• Akurasi GPS meningkat seiring waktu</Text>
        <Text style={styles.loadingText}>• Akurasi yang dibutuhkan: {requiredAccuracy}m atau lebih baik</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={handleClose}
      >
        <Text style={styles.cancelButtonText}>Batal</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#27ae60" />
      </View>

      <Text style={styles.title}>Lokasi Berhasil Didapat!</Text>
      <Text style={styles.subtitle}>Koordinat GPS berhasil diambil</Text>

      {showLocationPreview && locationData && (
        <View style={styles.locationPreview}>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Koordinat:</Text>
            <Text style={styles.locationValue}>
              {formatCoordinates(locationData.latitude, locationData.longitude, 4)}
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Akurasi:</Text>
            <Text style={styles.locationValue}>
              {locationData.accuracy?.toFixed(1)}m ({getAccuracyDescription(locationData.accuracy)})
            </Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Waktu:</Text>
            <Text style={styles.locationValue}>
              {new Date(locationData.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      )}

      {!autoCloseOnSuccess && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.allowButton]}
            onPress={() => handleLocationSuccess(locationData)}
          >
            <Text style={styles.allowButtonText}>Lanjutkan</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderErrorStep = () => (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <Ionicons name="warning" size={64} color="#e74c3c" />
      </View>

      <Text style={styles.title}>Lokasi Bermasalah</Text>
      <Text style={styles.subtitle}>Kami tidak dapat memperoleh lokasi Anda</Text>

      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => handleLocationError(error)}
        >
          <Text style={styles.cancelButtonText}>Batal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={getCurrentLocationData}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 'permission':
        return renderPermissionStep();
      case 'location':
        return renderLocationStep();
      case 'success':
        return renderSuccessStep();
      case 'error':
        return renderErrorStep();
      default:
        return renderPermissionStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  bulletPoints: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletText: {
    fontSize: 14,
    color: '#5d6d7e',
    marginLeft: 8,
    flex: 1,
  },
  loadingInfo: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
    textAlign: 'center',
  },
  locationPreview: {
    alignSelf: 'stretch',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
  },
  errorContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#fdf2f2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#e74c3c',
  },
  errorText: {
    fontSize: 14,
    color: '#c0392b',
    lineHeight: 22,
    textAlign: 'left',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  allowButton: {
    backgroundColor: '#3498db',
  },
  allowButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#f39c12',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  settingsLinkText: {
    color: '#3498db',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});

export default GpsPermissionModal;