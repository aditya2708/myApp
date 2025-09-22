import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Import components
import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import hooks and API
import { useAuth } from '../../../common/hooks/useAuth';
import { adminPusatApi } from '../api/adminPusatApi';

const AdminPusatProfileScreen = () => {
  const navigation = useNavigation();
  const { user, profile, refreshUser, logout } = useAuth();
  
  // Profile state
  const [profileData, setProfileData] = useState({
    nama_lengkap: '',
    alamat: '',
    no_hp: '',
    email: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize profile data from Redux state
  useEffect(() => {
    if (profile) {
      setProfileData({
        nama_lengkap: profile.nama_lengkap || '',
        alamat: profile.alamat || '',
        no_hp: profile.no_hp || '',
        email: user?.email || '',
      });

      if (profile.foto) {
        setProfileImage(`http://192.168.8.105:8000/storage/AdminPusat/${profile.id_admin_pusat}/${profile.foto}`);
      }
    }
  }, [profile, user]);

  // Handle profile image selection
  const handleSelectImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin untuk mengakses galeri diperlukan');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Kesalahan', 'Gagal memilih gambar');
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create form data
      const formData = new FormData();
      
      // Add profile data
      formData.append('nama_lengkap', profileData.nama_lengkap);
      formData.append('alamat', profileData.alamat);
      formData.append('no_hp', profileData.no_hp);

      // Add profile image if selected
      if (profileImage && !profileImage.startsWith('http')) {
        const filename = profileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('foto', {
          uri: profileImage,
          name: filename,
          type,
        });
      }

      // Update profile
      await adminPusatApi.updateProfile(formData);
      
      // Refresh user data
      await refreshUser();
      
      // Exit edit mode
      setIsEditing(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Gagal memperbarui profil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle text input changes
  const handleChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar?',
      [
        {
          text: 'Batal',
          style: 'cancel',
        },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => {
            // Call logout from useAuth hook
            logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => setError(null)}
        />
      )}

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={50} color="#ffffff" />
            </View>
          )}
          
          {isEditing && (
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={handleSelectImage}
            >
              <Ionicons name="camera" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.profileName}>
          {profileData.nama_lengkap || 'Admin Pusat'}
        </Text>
        <Text style={styles.profileRole}>Admin Pusat</Text>
      </View>

      {/* Profile Content */}
      <View style={styles.profileContent}>
        {/* Edit/Save Button */}
        <View style={styles.editButtonContainer}>
          {!isEditing ? (
            <Button
              title="Edit Profil"
              onPress={() => setIsEditing(true)}
              leftIcon={<Ionicons name="create-outline" size={20} color="white" />}
              type="primary"
            />
          ) : (
            <View style={styles.editButtonsRow}>
              <Button
                title="Batal"
                onPress={() => setIsEditing(false)}
                type="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Simpan"
                onPress={handleUpdateProfile}
                loading={loading}
                disabled={loading}
                type="primary"
                style={styles.saveButton}
              />
            </View>
          )}
        </View>

        {/* Profile Fields */}
        <View style={styles.profileFields}>
          {/* Name */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nama Lengkap</Text>
            {isEditing ? (
              <TextInput
                value={profileData.nama_lengkap}
                onChangeText={(value) => handleChange('nama_lengkap', value)}
                placeholder="Masukkan nama lengkap Anda"
              />
            ) : (
              <Text style={styles.fieldValue}>
                {profileData.nama_lengkap || '-'}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>
              {profileData.email || '-'}
            </Text>
          </View>

          {/* Phone */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nomor Telepon</Text>
            {isEditing ? (
              <TextInput
                value={profileData.no_hp}
                onChangeText={(value) => handleChange('no_hp', value)}
                placeholder="Masukkan nomor telepon Anda"
                inputProps={{
                  keyboardType: 'phone-pad',
                }}
              />
            ) : (
              <Text style={styles.fieldValue}>
                {profileData.no_hp || '-'}
              </Text>
            )}
          </View>

          {/* Address */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Alamat</Text>
            {isEditing ? (
              <TextInput
                value={profileData.alamat}
                onChangeText={(value) => handleChange('alamat', value)}
                placeholder="Masukkan alamat Anda"
                multiline
                inputProps={{
                  numberOfLines: 3,
                }}
              />
            ) : (
              <Text style={styles.fieldValue}>
                {profileData.alamat || '-'}
              </Text>
            )}
          </View>
        </View>

        {/* Settings and Logout */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#3498db" />
            <Text style={styles.settingsText}>Pengaturan</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsItem}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
            <Text style={[styles.settingsText, { color: '#e74c3c' }]}>Keluar</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message="Memperbarui profil..." />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#3498db',
    padding: 20,
    alignItems: 'center',
    paddingBottom: 80,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    position: 'relative',
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2980b9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2980b9',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileRole: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  profileContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -50,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  editButtonContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 10,
  },
  saveButton: {
    minWidth: 100,
  },
  profileFields: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingsContainer: {
    marginTop: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingsText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default AdminPusatProfileScreen;