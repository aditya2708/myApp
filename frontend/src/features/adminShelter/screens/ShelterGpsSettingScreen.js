import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert, Switch, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { useAuth } from '../../../common/hooks/useAuth';
import { adminShelterApi } from '../api/adminShelterApi';
import GpsPermissionModal from '../../../common/components/GpsPermissionModal';
import { getCurrentLocation, prepareGpsDataForApi } from '../../../common/utils/gpsUtils';

const ShelterGpsSettingScreen = ({ navigation }) => {
  const { profile, refreshUser } = useAuth();
  
  const [gpsConfig, setGpsConfig] = useState({
    require_gps: false,
    latitude: '',
    longitude: '',
    max_distance_meters: 100,
    gps_accuracy_required: 25,
    location_name: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Load current shelter GPS config
  useEffect(() => {
    loadGpsConfig();
  }, []);

  // Also reload when profile changes (backup)
  useEffect(() => {
    if (profile?.shelter) {
      setGpsConfig({
        require_gps: profile.shelter.require_gps || false,
        latitude: profile.shelter.latitude?.toString() || '',
        longitude: profile.shelter.longitude?.toString() || '',
        max_distance_meters: profile.shelter.max_distance_meters || 100,
        gps_accuracy_required: profile.shelter.gps_accuracy_required || 25,
        location_name: profile.shelter.location_name || profile.shelter.nama_shelter || ''
      });
    }
  }, [profile]);

  const loadGpsConfig = async () => {
    try {
      const response = await adminShelterApi.getShelterGpsConfig();
      if (response.data && response.data.data) {
        const data = response.data.data;
        setGpsConfig({
          require_gps: data.require_gps || false,
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          max_distance_meters: data.max_distance_meters || 100,
          gps_accuracy_required: data.gps_accuracy_required || 25,
          location_name: data.location_name || data.shelter_name || ''
        });
      }
    } catch (error) {
      console.error('Error loading GPS config:', error);
      // Fallback to profile data if API fails
      if (profile?.shelter) {
        setGpsConfig({
          require_gps: profile.shelter.require_gps || false,
          latitude: profile.shelter.latitude?.toString() || '',
          longitude: profile.shelter.longitude?.toString() || '',
          max_distance_meters: profile.shelter.max_distance_meters || 100,
          gps_accuracy_required: profile.shelter.gps_accuracy_required || 25,
          location_name: profile.shelter.location_name || profile.shelter.nama_shelter || ''
        });
      }
    }
  };

  const handleInputChange = (field, value) => {
    setGpsConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleDetectCurrentLocation = () => {
    setShowGpsModal(true);
  };

  const handleLocationSuccess = (locationData) => {
    setGpsConfig(prev => ({
      ...prev,
      latitude: locationData.latitude.toString(),
      longitude: locationData.longitude.toString()
    }));
    setShowGpsModal(false);
    Alert.alert('Berhasil', 'Lokasi saat ini berhasil terdeteksi');
  };


  const handleLocationError = (error) => {
    setShowGpsModal(false);
    Alert.alert('Error GPS', error);
  };

  const validateForm = () => {
    if (gpsConfig.require_gps) {
      const lat = parseFloat(gpsConfig.latitude);
      const lng = parseFloat(gpsConfig.longitude);
      
      if (!gpsConfig.latitude || !gpsConfig.longitude) {
        Alert.alert('Error Validasi', 'Koordinat GPS harus diisi');
        return false;
      }
      
      if (isNaN(lat) || isNaN(lng)) {
        Alert.alert('Error Validasi', 'Koordinat GPS tidak valid. Gunakan format angka desimal.');
        return false;
      }
      
      if (lat < -90 || lat > 90) {
        Alert.alert('Error Validasi', 'Latitude harus antara -90 sampai 90');
        return false;
      }
      
      if (lng < -180 || lng > 180) {
        Alert.alert('Error Validasi', 'Longitude harus antara -180 sampai 180');
        return false;
      }
      
      if (gpsConfig.max_distance_meters < 10 || gpsConfig.max_distance_meters > 1000) {
        Alert.alert('Error Validasi', 'Radius harus antara 10-1000 meter');
        return false;
      }
      
      if (!gpsConfig.location_name.trim()) {
        Alert.alert('Error Validasi', 'Nama lokasi harus diisi');
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const updateData = {
        require_gps: gpsConfig.require_gps,
        latitude: gpsConfig.require_gps ? parseFloat(gpsConfig.latitude) : null,
        longitude: gpsConfig.require_gps ? parseFloat(gpsConfig.longitude) : null,
        max_distance_meters: gpsConfig.max_distance_meters,
        gps_accuracy_required: gpsConfig.gps_accuracy_required,
        location_name: gpsConfig.require_gps ? gpsConfig.location_name.trim() : null
      };
      
      // Call API to update shelter GPS config
      const response = await adminShelterApi.updateShelterGpsConfig(updateData);
      
      // Refresh user profile to get updated shelter data
      await refreshUser();
      
      // Update local state with the response data to ensure UI shows correct values
      if (response.data && response.data.data) {
        const updatedData = response.data.data;
        setGpsConfig({
          require_gps: updatedData.require_gps || false,
          latitude: updatedData.latitude?.toString() || '',
          longitude: updatedData.longitude?.toString() || '',
          max_distance_meters: updatedData.max_distance_meters || 100,
          gps_accuracy_required: updatedData.gps_accuracy_required || 25,
          location_name: updatedData.location_name || ''
        });
      }
      
      Alert.alert('Berhasil', 'GPS setting berhasil disimpan', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      
    } catch (err) {
      console.error('Error updating GPS config:', err);
      setError(err.response?.data?.message || 'Gagal menyimpan GPS setting');
    } finally {
      setLoading(false);
    }
  };

  const renderGpsLocationSection = () => {
    if (!gpsConfig.require_gps) return null;
    
    return (
      <View style={styles.coordinateCard}>
        <View style={styles.coordinateHeader}>
          <Ionicons name="location" size={20} color="#3498db" />
          <Text style={styles.coordinateTitle}>Lokasi GPS Shelter</Text>
        </View>
        
        {gpsConfig.latitude && gpsConfig.longitude ? (
          <View style={styles.coordinateDisplay}>
            <Text style={styles.coordinateText}>
              Lat: {parseFloat(gpsConfig.latitude).toFixed(6)}
            </Text>
            <Text style={styles.coordinateText}>
              Lng: {parseFloat(gpsConfig.longitude).toFixed(6)}
            </Text>
            <Text style={styles.coordinateSubtext}>
              Koordinat saat ini aktif
            </Text>
          </View>
        ) : (
          <Text style={styles.noCoordinateText}>
            Belum ada koordinat GPS yang diatur
          </Text>
        )}
        
        <TouchableOpacity 
          style={styles.detectButton}
          onPress={handleDetectCurrentLocation}
          disabled={isDetectingLocation}
        >
          <Ionicons 
            name="navigate-circle" 
            size={20} 
            color="#fff" 
            style={styles.detectButtonIcon}
          />
          <Text style={styles.detectButtonText}>
            {isDetectingLocation ? 'Mendeteksi...' : 'Deteksi Lokasi Saat Ini'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderApprovalStatus = () => {
    if (!gpsConfig.require_gps) return null;
    
    const status = profile?.shelter?.gps_approval_status || 'draft';
    
    const getStatusInfo = (status) => {
      switch (status) {
        case 'pending':
          return {
            label: 'Menunggu Persetujuan Admin Cabang',
            color: '#f39c12',
            bgColor: '#fef9e7',
            icon: 'time-outline',
            description: 'GPS setting yang Anda kirim sedang menunggu persetujuan dari Admin Cabang. Setting GPS saat ini masih tetap aktif.'
          };
        case 'approved':
          return {
            label: 'Disetujui Admin Cabang',
            color: '#27ae60',
            bgColor: '#eafaf1',
            icon: 'checkmark-circle-outline',
            description: 'GPS setting telah disetujui dan aktif. Perubahan akan berlaku untuk semua aktivitas di shelter.'
          };
        case 'rejected':
          return {
            label: 'Ditolak Admin Cabang',
            color: '#e74c3c',
            bgColor: '#fadbd8',
            icon: 'close-circle-outline',
            description: profile?.shelter?.gps_rejection_reason || 'GPS setting ditolak oleh Admin Cabang. Silakan perbaiki dan kirim ulang.'
          };
        default:
          return {
            label: 'Belum Dikirim',
            color: '#95a5a6',
            bgColor: '#f8f9fa',
            icon: 'document-outline',
            description: 'GPS setting belum dikirim untuk persetujuan. Klik "Kirim untuk Persetujuan" untuk mengirim ke Admin Cabang.'
          };
      }
    };
    
    const statusInfo = getStatusInfo(status);
    
    return (
      <View style={styles.approvalStatusContainer}>
        <View style={[styles.approvalStatusCard, { backgroundColor: statusInfo.bgColor }]}>
          <View style={styles.approvalStatusHeader}>
            <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
            <Text style={[styles.approvalStatusLabel, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
          <Text style={styles.approvalStatusDescription}>
            {statusInfo.description}
          </Text>
          
          {status === 'pending' && profile?.shelter?.gps_submitted_at && (
            <Text style={styles.approvalStatusDate}>
              Dikirim: {new Date(profile.shelter.gps_submitted_at).toLocaleString('id-ID')}
            </Text>
          )}
          
          {status === 'approved' && profile?.shelter?.gps_approved_at && (
            <Text style={styles.approvalStatusDate}>
              Disetujui: {new Date(profile.shelter.gps_approved_at).toLocaleString('id-ID')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}
        
        <View style={styles.header}>
          <Ionicons name="location-outline" size={40} color="#3498db" />
          <Text style={styles.title}>GPS Setting Shelter</Text>
          <Text style={styles.subtitle}>
            Atur lokasi GPS untuk absensi di {profile?.shelter?.nama_shelter}
          </Text>
        </View>
        
        {/* GPS Toggle */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Aktifkan GPS untuk Absensi</Text>
            <Text style={styles.toggleDescription}>
              Jika diaktifkan, siswa dan tutor harus berada di lokasi shelter untuk absen
            </Text>
          </View>
          <Switch
            value={gpsConfig.require_gps}
            onValueChange={(value) => handleInputChange('require_gps', value)}
            trackColor={{ false: '#bdc3c7', true: '#3498db' }}
            thumbColor={gpsConfig.require_gps ? '#2980b9' : '#ecf0f1'}
          />
        </View>
        
        {/* GPS Approval Status */}
        {renderApprovalStatus()}
        
        {/* GPS Location Section */}
        {renderGpsLocationSection()}
        
        {gpsConfig.require_gps && (
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Detail Lokasi</Text>
            
            <TextInput
              label="Nama Lokasi"
              value={gpsConfig.location_name}
              onChangeText={(value) => handleInputChange('location_name', value)}
              placeholder="Contoh: Shelter Indramayu"
              style={styles.input}
            />
            
            {/* Manual Coordinate Input */}
            <View style={styles.coordinateInputs}>
              <View style={[styles.coordinateInputContainer, styles.coordinateInput]}>
                <TextInput
                  label="Latitude"
                  value={gpsConfig.latitude}
                  onChangeText={(value) => handleInputChange('latitude', value)}
                  placeholder="-6.208800"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
              <View style={[styles.coordinateInputContainer, styles.coordinateInput]}>
                <TextInput
                  label="Longitude"
                  value={gpsConfig.longitude}
                  onChangeText={(value) => handleInputChange('longitude', value)}
                  placeholder="106.845600"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>
            </View>
            
            <View style={styles.helpContainer}>
              <Ionicons name="information-circle-outline" size={16} color="#7f8c8d" />
              <Text style={styles.helpText}>
                Masukkan koordinat GPS manual atau gunakan tombol "Deteksi Lokasi Saat Ini" di atas
              </Text>
            </View>
            
            <View style={styles.advancedSettings}>
              <Text style={styles.sectionTitle}>Pengaturan Lanjutan</Text>
              
              <TextInput
                label="Radius Maksimal (meter)"
                value={gpsConfig.max_distance_meters.toString()}
                onChangeText={(value) => handleInputChange('max_distance_meters', parseInt(value) || 100)}
                placeholder="100"
                keyboardType="numeric"
                style={styles.input}
              />
              
              <TextInput
                label="Akurasi GPS Diperlukan (meter)"
                value={gpsConfig.gps_accuracy_required.toString()}
                onChangeText={(value) => handleInputChange('gps_accuracy_required', parseInt(value) || 25)}
                placeholder="25"
                keyboardType="numeric"
                style={styles.input}
              />
              
              <View style={styles.helpContainer}>
                <Ionicons name="information-circle-outline" size={16} color="#7f8c8d" />
                <Text style={styles.helpText}>
                  Siswa/tutor hanya bisa absen jika berada dalam radius {gpsConfig.max_distance_meters}m 
                  dari lokasi shelter dengan akurasi GPS minimal {gpsConfig.gps_accuracy_required}m
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <Button
            title="Kirim untuk Persetujuan"
            onPress={handleSave}
            loading={loading}
            disabled={loading || profile?.shelter?.gps_approval_status === 'pending'}
            fullWidth
          />
          
          <Button
            title="Batal"
            onPress={() => navigation.goBack()}
            type="outline"
            disabled={loading}
            fullWidth
            style={styles.cancelButton}
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle" size={20} color="#3498db" />
          <Text style={styles.infoText}>
            GPS setting yang Anda kirim akan direview oleh Admin Cabang sebelum diterapkan. 
            Setting GPS saat ini akan tetap aktif sampai perubahan disetujui.
          </Text>
        </View>
      </View>
      
      {/* GPS Permission Modal */}
      <GpsPermissionModal
        visible={showGpsModal}
        onClose={() => setShowGpsModal(false)}
        onLocationSuccess={handleLocationSuccess}
        onLocationError={handleLocationError}
        title="Deteksi Lokasi Shelter"
        subtitle="Izinkan akses GPS untuk mendeteksi koordinat lokasi shelter saat ini"
        requiredAccuracy={gpsConfig.gps_accuracy_required || 25}
        autoCloseOnSuccess={true}
      />
      
      {loading && (
        <LoadingSpinner 
          fullScreen 
          message="Menyimpan GPS setting..."
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  content: { 
    padding: 16, 
    paddingBottom: 40 
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 10,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 22
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4
  },
  toggleDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20
  },
  coordinateCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  coordinateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  coordinateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8
  },
  coordinateDisplay: {
    marginBottom: 16
  },
  coordinateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#27ae60',
    marginBottom: 4
  },
  coordinateSubtext: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  noCoordinateText: {
    fontSize: 14,
    color: '#e74c3c',
    fontStyle: 'italic',
    marginBottom: 16
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  detectButtonIcon: {
    marginRight: 8
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16
  },
  input: {
    marginBottom: 16
  },
  coordinateInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  coordinateInputContainer: {
    flex: 1
  },
  coordinateInput: {
    marginRight: 8,
    marginLeft: 8
  },
  advancedSettings: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 20,
    marginTop: 20
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 18,
    marginLeft: 8
  },
  buttonContainer: {
    marginBottom: 20
  },
  cancelButton: {
    marginTop: 12
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e8f6f3',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db'
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
    marginLeft: 10
  },
});

export default ShelterGpsSettingScreen;