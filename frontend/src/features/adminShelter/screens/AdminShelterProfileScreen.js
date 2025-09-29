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
import { adminShelterApi } from '../api/adminShelterApi';

const AdminShelterProfileScreen = () => {
  const navigation = useNavigation();
  const { user, profile, refreshUser, logout } = useAuth();
  
  const [profileData, setProfileData] = useState({
    nama_lengkap: '', alamat_adm: '', no_hp: '', email: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile) {
      setProfileData({
        nama_lengkap: profile.nama_lengkap || '',
        alamat_adm: profile.alamat_adm || '',
        no_hp: profile.no_hp || '',
        email: user?.email || '',
      });

      if (profile.foto) {
        setProfileImage(`http://192.168.8.105:8000/storage/AdminShelter/${profile.id_admin_shelter}/${profile.foto}`);
      }
    }
  }, [profile, user]);

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access camera roll is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
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

      await adminShelterApi.updateProfile(formData);
      await refreshUser();
      setIsEditing(false);
      Alert.alert('Success', 'Sukses');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Gagal. Coba Lagi!');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    Alert.alert('Keluar', 'Apakah Anda Yakin Ingin Keluar?', [
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
        
        <Text style={styles.profileName}>{profileData.nama_lengkap || 'Admin Shelter'}</Text>
        <Text style={styles.profileRole}>Admin Shelter</Text>
        {profile?.shelter && (
          <Text style={styles.shelterName}>{profile.shelter.nama_shelter}</Text>
        )}
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
              <Button title="Cancel" onPress={() => setIsEditing(false)} type="outline" style={styles.cancelButton} />
              <Button title="Simpan" onPress={handleUpdateProfile} loading={loading} disabled={loading} type="primary" style={styles.saveButton} />
            </View>
          )}
        </View>

        <View style={styles.profileFields}>
          {renderField('Nama Lengkap', 'nama_lengkap', 'Masukkan Nama Lengkap')}
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            <Text style={styles.fieldValue}>{profileData.email || '-'}</Text>
          </View>

          {renderField('Nomor Telepon', 'no_hp', 'Masukkan Nomor Telepon', {
            inputProps: { keyboardType: 'phone-pad' }
          })}
          {renderField('Alamat', 'alamat_adm', 'Masukkan Alamat', {
            multiline: true, inputProps: { numberOfLines: 3 }
          })}
        </View>

        {profile?.shelter && (
          <View style={styles.shelterInfoContainer}>
            <Text style={styles.sectionTitle}>Shelter Information</Text>
            <View style={styles.shelterInfoCard}>
              {profile.shelter.foto && (
                <Image 
                  source={{ uri: `http://192.168.8.105:8000/storage/AdminShelter/Shelter/${profile.shelter.foto}` }}
                  style={styles.shelterImage}
                />
              )}
              
              <View style={styles.shelterDetails}>
                {[
                  ['Name:', profile.shelter.nama_shelter],
                  ['Address:', profile.shelter.alamat],
                  ['Phone:', profile.shelter.no_telp],
                  ['Wilbin:', profile.wilbin?.nama_wilbin],
                  ['Cabang:', profile.kacab?.nama_cabang]
                ].map(([label, value], index) => value && (
                  <View key={index} style={styles.shelterInfoRow}>
                    <Text style={styles.shelterInfoLabel}>{label}</Text>
                    <Text style={styles.shelterInfoValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={styles.settingsContainer}>
          {[ 
            { icon: 'location-outline', text: 'GPS Setting Shelter', route: 'ShelterGpsSetting', color: '#3498db' },
            { icon: 'settings-outline', text: 'Pengaturan', route: 'AdminShelterSettings', color: '#8e44ad' },
            { icon: 'log-out-outline', text: 'Keluar', onPress: handleLogout, color: '#e74c3c' }
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingsItem}
              onPress={item.onPress || (() => navigation.navigate(item.route))}
            >
              <Ionicons name={item.icon} size={24} color={item.color} />
              <Text style={[styles.settingsText, { color: item.color }]}>{item.text}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message="Updating profile..." />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileHeader: { backgroundColor: '#e74c3c', padding: 20, alignItems: 'center', paddingBottom: 80 },
  profileImageContainer: { width: 120, height: 120, borderRadius: 60, marginBottom: 16, position: 'relative', borderWidth: 4, borderColor: '#fff', overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%' },
  profileImagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#c0392b', justifyContent: 'center', alignItems: 'center' },
  editImageButton: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#c0392b', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileRole: { fontSize: 16, color: '#fff', opacity: 0.8 },
  shelterName: { fontSize: 16, color: '#fff', marginTop: 4, opacity: 0.9, fontWeight: '500' },
  profileContent: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -50, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 40 },
  editButtonContainer: { alignItems: 'flex-end', marginBottom: 20 },
  editButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  cancelButton: { marginRight: 10 },
  saveButton: { minWidth: 100 },
  profileFields: { marginBottom: 20 },
  fieldContainer: { marginBottom: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#666', marginBottom: 4 },
  fieldValue: { fontSize: 16, color: '#333', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  shelterInfoContainer: { marginTop: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  shelterInfoCard: { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  shelterImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 16 },
  shelterDetails: { flex: 1 },
  shelterInfoRow: { flexDirection: 'row', marginBottom: 8 },
  shelterInfoLabel: { width: 80, fontSize: 14, fontWeight: '500', color: '#666' },
  shelterInfoValue: { flex: 1, fontSize: 14, color: '#333' },
  settingsContainer: { marginTop: 20 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  settingsText: { flex: 1, marginLeft: 15, fontSize: 16 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
});

export default AdminShelterProfileScreen;