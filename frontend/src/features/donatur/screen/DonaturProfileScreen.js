import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { useAuth } from '../../../common/hooks/useAuth';
import { donaturApi } from '../api/donaturApi';

const DonaturProfileScreen = () => {
  const navigation = useNavigation();
  const { user, profile, refreshUser, logout } = useAuth();
  
  const [profileData, setProfileData] = useState({
    nama_lengkap: '', alamat: '', no_hp: '', email: '', no_rekening: '', diperuntukan: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setProfileData({
        nama_lengkap: profile.nama_lengkap || '',
        alamat: profile.alamat || '',
        no_hp: profile.no_hp || '',
        email: user?.email || '',
        no_rekening: profile.no_rekening || '',
        diperuntukan: profile.diperuntukan || '',
      });

      if (profile.foto) {
        setProfileImage(`http://192.168.8.105:8000/storage/Donatur/${profile.id_donatur}/${profile.foto}`);
      }
    }
  }, [profile, user]);

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Izin akses galeri foto diperlukan');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Gagal memilih gambar');
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

      await donaturApi.updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } catch (err) {
      console.error('Error updating profile:', err);
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
        
        <Text style={styles.profileName}>{profileData.nama_lengkap || 'Donatur'}</Text>
        <Text style={styles.profileRole}>Donatur</Text>
      </View>

      <View style={styles.profileContent}>
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
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
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

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Informasi Donasi</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Bank</Text>
            <Text style={styles.fieldValue}>{profile?.bank?.nama_bank || '-'}</Text>
          </View>

          {renderField('Nomor Rekening', 'no_rekening', 'Masukkan nomor rekening Anda', {
            inputProps: { keyboardType: 'number-pad' }
          })}
          {renderField('Tujuan Donasi', 'diperuntukan', 'Masukkan tujuan donasi', {
            multiline: true, inputProps: { numberOfLines: 3 }
          })}
        </View>

        {profile?.anak?.length > 0 && (
          <View style={styles.sponsoredChildrenContainer}>
            <Text style={styles.sectionTitle}>Anak Asuh</Text>
            <View style={styles.childrenList}>
              {profile.anak.map((child, index) => (
                <View key={index} style={styles.childItem}>
                  {child.foto ? (
                    <Image
                      source={{ uri: `http://192.168.8.105:8000/storage/Children/${child.id_anak}/${child.foto}` }}
                      style={styles.childImage}
                    />
                  ) : (
                    <View style={styles.childImagePlaceholder}>
                      <Ionicons name="person" size={20} color="#ffffff" />
                    </View>
                  )}
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.nama_lengkap}</Text>
                    <Text style={styles.childDetails}>
                      {child.umur ? `${child.umur} tahun` : 'Umur tidak diketahui'}
                    </Text>
                  </View>
                </View>
              ))}
              <Button
                title="Lihat Semua Anak"
                type="outline"
                onPress={() => navigation.navigate('MySponsoredChildren')}
                style={styles.viewAllButton}
              />
            </View>
          </View>
        )}

        <View style={styles.settingsContainer}>
          {[
            { icon: 'settings-outline', text: 'Pengaturan', route: 'Settings', color: '#9b59b6' },
            { icon: 'cash-outline', text: 'Riwayat Donasi', route: 'DonationHistory', color: '#9b59b6' },
            { icon: 'log-out-outline', text: 'Keluar', onPress: handleLogout, color: '#e74c3c' }
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingsItem}
              onPress={item.onPress || (() => navigation.navigate(item.route))}
            >
              <Ionicons name={item.icon} size={24} color={item.color} />
              <Text style={[styles.settingsText, { color: item.color === '#e74c3c' ? '#e74c3c' : '#333' }]}>
                {item.text}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
  profileHeader: { backgroundColor: '#9b59b6', padding: 20, alignItems: 'center', paddingBottom: 80 },
  profileImageContainer: { width: 120, height: 120, borderRadius: 60, marginBottom: 16, position: 'relative', borderWidth: 4, borderColor: '#fff', overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  profileImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#8e44ad', justifyContent: 'center', alignItems: 'center' },
  editImageButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#8e44ad', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileRole: { fontSize: 16, color: '#fff', opacity: 0.8 },
  profileContent: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -50, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40 },
  editButtonContainer: { alignItems: 'flex-end', marginBottom: 20 },
  editButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelButton: { marginRight: 10 },
  saveButton: { minWidth: 100 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  profileFields: { marginBottom: 20 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#333', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sponsoredChildrenContainer: { marginBottom: 20 },
  childrenList: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16 },
  childItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  childImage: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  childImagePlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#9b59b6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '500', color: '#333' },
  childDetails: { fontSize: 14, color: '#666' },
  viewAllButton: { marginTop: 8 },
  settingsContainer: { marginTop: 20 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  settingsText: { flex: 1, marginLeft: 15, fontSize: 16 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
});

export default DonaturProfileScreen;