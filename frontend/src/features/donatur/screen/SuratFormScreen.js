import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';
import TextInput from '../../../common/components/TextInput';
import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import { donaturSuratApi } from '../api/donaturSuratApi';

const SuratFormScreen = () => {
  const nav = useNavigation();
  const { params } = useRoute();
  const { childId, childName, replyTo, onSuccess } = params;

  const [msg, setMsg] = useState('');
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    nav.setOptions({
      title: replyTo ? `Balas - ${childName}` : `Pesan Baru - ${childName}`,
    });
  }, [nav, childName, replyTo]);

  useEffect(() => {
    if (replyTo) {
      const prefix = `Membalas: "${replyTo.pesan.substring(0, 50)}${replyTo.pesan.length > 50 ? '...' : ''}"\n\n`;
      setMsg(prefix);
    }
  }, [replyTo]);

  const selectImg = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Izin Diperlukan', 'Izin galeri diperlukan untuk melampirkan foto', [{ text: 'OK' }]);
        return;
      }

      Alert.alert('Pilih Foto', 'Pilih foto untuk dilampirkan ke pesan Anda', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Galeri', onPress: () => openPicker() },
        { text: 'Kamera', onPress: () => openCam() },
      ]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Gagal', 'Gagal meminta izin');
    }
  };

  const openPicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions?.Images ?? MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImg(result.assets[0]);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Gagal', 'Gagal memilih gambar');
    }
  };

  const openCam = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Izin Diperlukan', 'Izin kamera diperlukan');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImg(result.assets[0]);
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Gagal', 'Gagal mengambil foto');
    }
  };

  const removeImg = () => {
    Alert.alert('Hapus Foto', 'Yakin ingin menghapus foto yang dilampirkan?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => setImg(null) },
    ]);
  };

  const send = async () => {
    if (!msg.trim()) {
      Alert.alert('Pesan Diperlukan', 'Silakan masukkan pesan');
      return;
    }

    if (msg.trim().length < 10) {
      Alert.alert('Pesan Terlalu Pendek', 'Masukkan minimal 10 karakter');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('pesan', msg.trim());

      if (img) {
        const filename = img.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('foto', {
          uri: img.uri,
          name: filename,
          type,
        });
      }

      await donaturSuratApi.createSurat(childId, formData);

      Alert.alert('Berhasil', 'Pesan Anda telah terkirim', [{
        text: 'OK',
        onPress: () => {
          if (onSuccess) onSuccess();
          nav.goBack();
        }
      }]);
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Gagal', 'Gagal mengirim pesan. Silakan coba lagi.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const cancel = () => {
    if (msg.trim() || img) {
      Alert.alert('Buang Pesan', 'Yakin ingin membuang pesan ini?', [
        { text: 'Lanjut Edit', style: 'cancel' },
        { text: 'Buang', style: 'destructive', onPress: () => nav.goBack() },
      ]);
    } else {
      nav.goBack();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={s.scroll}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.headerInfo}>
          <Text style={s.label}>Kepada:</Text>
          <Text style={s.value}>Admin Panti</Text>
          <Text style={s.label}>Tentang:</Text>
          <Text style={s.value}>{childName}</Text>
        </View>

        {replyTo && (
          <View style={s.reply}>
            <Text style={s.replyLabel}>Membalas:</Text>
            <Text style={s.replyText} numberOfLines={3}>
              {replyTo.pesan}
            </Text>
          </View>
        )}

        <View style={s.msgContainer}>
          <Text style={s.inputLabel}>Pesan *</Text>
          <TextInput
            value={msg}
            onChangeText={setMsg}
            placeholder="Tulis pesan Anda di sini..."
            multiline
            inputProps={{
              numberOfLines: 8,
              textAlignVertical: 'top',
              style: s.msgInput,
            }}
            style={s.msgInputContainer}
          />
          <Text style={s.charCount}>{msg.length}/1000 karakter</Text>
        </View>

        <View style={s.attachContainer}>
          <Text style={s.attachLabel}>Lampiran Foto (Opsional)</Text>
          
          {img ? (
            <View style={s.selectedContainer}>
              <Image source={{ uri: img.uri }} style={s.selectedImg} resizeMode="cover" />
              <TouchableOpacity style={s.removeBtn} onPress={removeImg}>
                <Ionicons name="close-circle" size={24} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.selectBtn} onPress={selectImg}>
              <Ionicons name="camera" size={24} color="#9b59b6" />
              <Text style={s.selectText}>Tambah Foto</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={s.guidelines}>
          <Text style={s.guideTitle}>Panduan Pesan:</Text>
          <Text style={s.guideItem}>• Bersikap sopan dan santun</Text>
          <Text style={s.guideItem}>• Jaga relevansi pesan dengan anak asuh Anda</Text>
          <Text style={s.guideItem}>• Hindari berbagi informasi kontak pribadi</Text>
          <Text style={s.guideItem}>• Waktu respon bervariasi (1-3 hari kerja)</Text>
        </View>
      </ScrollView>

      <View style={s.actions}>
        <Button
          title="Batal"
          onPress={cancel}
          type="outline"
          style={s.cancelBtn}
          disabled={loading}
        />
        <Button
          title="Kirim Pesan"
          onPress={send}
          type="primary"
          style={s.sendBtn}
          loading={loading}
          disabled={loading || !msg.trim()}
          leftIcon={<Ionicons name="send" size={20} color="white" />}
        />
      </View>

      {loading && (
        <View style={s.loadingOverlay}>
          <LoadingSpinner message="Mengirim pesan..." />
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  headerInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#666' },
  value: { fontSize: 16, color: '#333', marginBottom: 8 },
  reply: {
    backgroundColor: '#f0e6f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  replyLabel: { fontSize: 14, fontWeight: '600', color: '#9b59b6', marginBottom: 8 },
  replyText: { fontSize: 14, color: '#333', fontStyle: 'italic' },
  msgContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  msgInputContainer: { marginBottom: 8 },
  msgInput: { minHeight: 120 },
  charCount: { fontSize: 12, color: '#666', textAlign: 'right' },
  attachContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attachLabel: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#9b59b6',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  selectText: { fontSize: 16, color: '#9b59b6', marginLeft: 8, fontWeight: '500' },
  selectedContainer: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  selectedImg: { width: '100%', height: 200, borderRadius: 12 },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
  },
  guidelines: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  guideTitle: { fontSize: 16, fontWeight: '600', color: '#f39c12', marginBottom: 8 },
  guideItem: { fontSize: 14, color: '#333', marginBottom: 4 },
  actions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelBtn: { flex: 1, marginRight: 8 },
  sendBtn: { flex: 2, marginLeft: 8 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default SuratFormScreen;