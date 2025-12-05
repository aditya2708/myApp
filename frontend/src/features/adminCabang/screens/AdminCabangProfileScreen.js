import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';

import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { useAuth } from '../../../common/hooks/useAuth';
import { adminCabangApi } from '../api/adminCabangApi';

const AdminCabangProfileScreen = () => {
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
  
  const [profileData, setProfileData] = useState({
    nama_lengkap: '', alamat: '', no_hp: '', email: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [roleSwitching, setRoleSwitching] = useState(false);
  const [roleSwitchError, setRoleSwitchError] = useState(null);

  useEffect(() => {
    if (profile) {
      setProfileData({
        nama_lengkap: profile.nama_lengkap || '',
        alamat: profile.alamat || '',
        no_hp: profile.no_hp || '',
        email: user?.email || '',
      });

      if (profile.foto) {
        setProfileImage(`https://bp.berbagipendidikan.org/storage/AdminCabang/${profile.id_admin_cabang}/${profile.foto}`);
      }
    }
  }, [profile, user]);

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin untuk mengakses galeri foto diperlukan');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions?.Images ?? MediaTypeOptions.All,
        allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Kesalahan', 'Gagal memilih gambar');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      Object.keys(profileData).forEach(key => {
        if (key !== 'email') formData.append(key, profileData[key]);
      });

      if (profileImage && !profileImage.startsWith('http')) {
        const filename = profileImage.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('foto', { uri: profileImage, name: filename, type });
      }

      await adminCabangApi.updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } catch (err) {
      setError('Gagal memperbarui profil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: logout },
    ], { cancelable: true });
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

  const renderField = (label, field, placeholder, props = {}) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing ? (
        <TextInput
          value={profileData[field]}
          onChangeText={(value) => handleChange(field, value)}
          placeholder={placeholder}
          {...props}
        />
      ) : (
        <Text style={styles.fieldValue}>{profileData[field] || '-'}</Text>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {error && <ErrorMessage message={error} onRetry={() => setError(null)} />}

      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={50} color="#ffffff" />
            </View>
          )}
          
          {isEditing && (
            <TouchableOpacity style={styles.editImageButton} onPress={handleSelectImage}>
              <Ionicons name="camera" size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.profileName}>{profileData.nama_lengkap || 'Admin Cabang'}</Text>
        <Text style={styles.profileRole}>Admin Cabang</Text>
        {profile?.kacab && (
          <Text style={styles.cabangName}>{profile.kacab.nama_cabang}</Text>
        )}
      </View>

      <View style={styles.profileContent}>
        <View style={styles.roleCard}>
          <View>
            <Text style={styles.sectionTitle}>Peran Aktif</Text>
            <Text style={styles.activeRoleValue}>{currentRole?.name || currentRole?.slug || user?.level || 'Admin Cabang'}</Text>
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
              <Ionicons name="swap-horizontal-outline" size={18} color="#27ae60" />
              <Text style={styles.switchRoleText}>Ganti Peran</Text>
            </TouchableOpacity>
          )}
        </View>

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
              <Button title="Batal" onPress={() => setIsEditing(false)} type="outline" style={styles.cancelButton} />
              <Button title="Simpan" onPress={handleUpdateProfile} loading={loading} disabled={loading} type="primary" style={styles.saveButton} />
            </View>
          )}
        </View>

        <View style={styles.profileFields}>
          {renderField('Nama Lengkap', 'nama_lengkap', 'Masukkan nama lengkap Anda')}
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{profileData.email || '-'}</Text>
          </View>

          {renderField('Nomor Telepon', 'no_hp', 'Masukkan nomor telepon Anda', {
            inputProps: { keyboardType: 'phone-pad' }
          })}

          {renderField('Alamat', 'alamat', 'Masukkan alamat Anda', {
            multiline: true, inputProps: { numberOfLines: 3 }
          })}
        </View>

        {profile?.kacab && (
          <View style={styles.cabangInfoContainer}>
            <Text style={styles.sectionTitle}>Informasi Cabang</Text>
            <View style={styles.cabangInfoCard}>
              {[
                ['Nama Cabang:', profile.kacab.nama_cabang],
                ['Alamat:', profile.kacab.alamat],
                ['Telepon:', profile.kacab.no_telp],
                ...(profile.kacab.email ? [['Email:', profile.kacab.email]] : [])
              ].map(([label, value], index) => (
                <View key={index} style={styles.cabangInfoRow}>
                  <Text style={styles.cabangInfoLabel}>{label}</Text>
                  <Text style={styles.cabangInfoValue}>{value || '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.settingsContainer}>
          {[
            { icon: 'settings-outline', text: 'Pengaturan', color: '#2ecc71', onPress: () => navigation.navigate('Settings') },
            roles?.length > 1 && { icon: 'swap-horizontal-outline', text: 'Ganti Peran Aktif', color: '#d35400', onPress: handleOpenRoleModal },
            { icon: 'log-out-outline', text: 'Keluar', color: '#e74c3c', onPress: handleLogout }
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.settingsItem} onPress={item.onPress}>
              <Ionicons name={item.icon} size={24} color={item.color} />
              <Text style={[styles.settingsText, { color: item.color }]}>{item.text}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
                      <Ionicons name="checkmark-circle" size={22} color="#27ae60" />
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

      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message="Memperbarui profil..." />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileHeader: { backgroundColor: '#2ecc71', padding: 20, alignItems: 'center', paddingBottom: 80 },
  profileImageContainer: { width: 120, height: 120, borderRadius: 60, marginBottom: 16, position: 'relative', borderWidth: 4, borderColor: '#fff', overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  profileImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#27ae60', justifyContent: 'center', alignItems: 'center' },
  editImageButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#27ae60', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileRole: { fontSize: 16, color: '#fff', opacity: 0.8 },
  cabangName: { fontSize: 16, color: '#fff', marginTop: 4, opacity: 0.9, fontWeight: '500' },
  profileContent: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -50, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40 },
  roleCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e8f8f1', borderWidth: 1, borderColor: '#b7e4c7', padding: 12, borderRadius: 12, marginBottom: 14 },
  activeRoleValue: { fontSize: 16, fontWeight: '700', color: '#27ae60' },
  scopeInfo: { fontSize: 12, color: '#7f8c8d', marginTop: 2 },
  switchRoleButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#27ae60', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
  switchRoleText: { marginLeft: 6, color: '#27ae60', fontWeight: '600' },
  editButtonContainer: { alignItems: 'flex-end', marginBottom: 20 },
  editButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelButton: { marginRight: 10 },
  saveButton: { minWidth: 100 },
  profileFields: { marginBottom: 20 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#333', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  cabangInfoContainer: { marginTop: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  cabangInfoCard: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  cabangInfoRow: { flexDirection: 'row', marginBottom: 8 },
  cabangInfoLabel: { width: 100, fontSize: 14, fontWeight: '500', color: '#666' },
  cabangInfoValue: { flex: 1, fontSize: 14, color: '#333' },
  settingsContainer: { marginTop: 20 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  settingsText: { flex: 1, marginLeft: 15, fontSize: 16, color: '#333' },
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
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
});

export default AdminCabangProfileScreen;
