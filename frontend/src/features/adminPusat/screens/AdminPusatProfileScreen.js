import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';

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
  const {
    user,
    profile,
    refreshUser,
    logout,
    roles = [],
    currentRole,
    selectRole,
  } = useAuth();
  
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
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [roleSwitching, setRoleSwitching] = useState(false);
  const [roleSwitchError, setRoleSwitchError] = useState(null);

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
        mediaTypes: MediaTypeOptions?.Images ?? MediaTypeOptions.All,
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

  const handleOpenRoleModal = () => {
    if (!roles || roles.length === 0) {
      Alert.alert('Peran tidak ditemukan', 'Akun ini belum memiliki peran lain.');
      return;
    }
    setRoleSwitchError(null);
    setRoleModalVisible(true);
  };

  const handleSelectRole = async (role) => {
    try {
      setRoleSwitching(true);
      setRoleSwitchError(null);
      const result = await selectRole(role);
      if (result?.success) {
        setRoleModalVisible(false);
      } else {
        setRoleSwitchError(result?.message || 'Gagal mengubah peran');
      }
    } catch (err) {
      setRoleSwitchError(err?.message || 'Gagal mengubah peran');
    } finally {
      setRoleSwitching(false);
    }
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
        <View style={styles.roleCard}>
          <View>
            <Text style={styles.sectionTitle}>Peran Aktif</Text>
            <Text style={styles.activeRoleValue}>{currentRole?.name || currentRole?.slug || user?.level || 'Admin Pusat'}</Text>
            {(currentRole?.scope_type || currentRole?.scope_id) && (
              <Text style={styles.scopeInfo}>
                {currentRole?.scope_type}{currentRole?.scope_id ? ` #${currentRole.scope_id}` : ''}
              </Text>
            )}
          </View>
          {roles?.length > 0 && (
            <TouchableOpacity
              style={styles.switchRoleButton}
              onPress={handleOpenRoleModal}
              disabled={roleSwitching}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color="#3498db" />
              <Text style={styles.switchRoleText}>Ganti Peran</Text>
            </TouchableOpacity>
          )}
        </View>

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

          {roles?.length > 1 && (
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={handleOpenRoleModal}
            >
              <Ionicons name="swap-horizontal-outline" size={24} color="#d35400" />
              <Text style={[styles.settingsText, { color: '#d35400' }]}>Ganti Peran Aktif</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}

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

      <Modal
        visible={roleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Peran Aktif</Text>
            <Text style={styles.modalSubtitle}>Tanpa logout. Permintaan selanjutnya akan memakai header peran yang dipilih.</Text>
            {roleSwitchError && (
              <Text style={styles.modalError}>{roleSwitchError}</Text>
            )}
            <View style={styles.roleList}>
              {roles?.map((role, index) => {
                const isActive = currentRole?.slug === role.slug
                  && (currentRole?.scope_type ?? null) === (role.scope_type ?? null)
                  && (currentRole?.scope_id ?? null) === (role.scope_id ?? null);
                return (
                  <TouchableOpacity
                    key={`${role.slug}-${role.scope_type || 'global'}-${role.scope_id || index}`}
                    style={[
                      styles.roleItem,
                      isActive && styles.roleItemActive,
                    ]}
                    onPress={() => handleSelectRole(role)}
                    disabled={roleSwitching}
                  >
                    <View style={styles.roleItemText}>
                      <Text style={styles.roleName}>{role.name || role.slug}</Text>
                      <Text style={styles.roleSlug}>{role.slug}</Text>
                      {(role.scope_type || role.scope_id) && (
                        <Text style={styles.roleScope}>
                          {role.scope_type}{role.scope_id ? ` #${role.scope_id}` : ''}
                        </Text>
                      )}
                    </View>
                    {isActive && (
                      <Ionicons name="checkmark-circle" size={22} color="#3498db" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <Button
                title="Tutup"
                type="outline"
                onPress={() => setRoleModalVisible(false)}
                disabled={roleSwitching}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  roleCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f4fb', borderWidth: 1, borderColor: '#c5d9f6', padding: 12, borderRadius: 12, marginBottom: 14 },
  activeRoleValue: { fontSize: 16, fontWeight: '700', color: '#2980b9' },
  scopeInfo: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  switchRoleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#3498db', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  switchRoleText: { marginLeft: 6, color: '#3498db', fontWeight: '600' },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2c3e50' },
  modalSubtitle: { fontSize: 13, color: '#7f8c8d', marginTop: 4, marginBottom: 12 },
  modalError: { color: '#e74c3c', marginBottom: 10 },
  roleList: { marginBottom: 10 },
  roleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  roleItemActive: { backgroundColor: '#f8fffb' },
  roleItemText: { flex: 1 },
  roleName: { fontSize: 15, fontWeight: '700', color: '#2c3e50' },
  roleSlug: { fontSize: 12, color: '#7f8c8d' },
  roleScope: { fontSize: 12, color: '#95a5a6', marginTop: 2 },
  modalActions: { marginTop: 12 },
  modalButton: { alignSelf: 'flex-end' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default AdminPusatProfileScreen;
