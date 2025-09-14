import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import Button from '../../../common/components/Button';
import { donaturSuratApi } from '../api/donaturSuratApi';

const { width } = Dimensions.get('window');

const SuratDetailScreen = () => {
  const nav = useNavigation();
  const { params } = useRoute();
  const { childId, suratId, childName, onGoBack } = params;

  const [surat, setSurat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    nav.setOptions({ title: `Pesan - ${childName}` });
  }, [nav, childName]);

  const fetchDetail = async () => {
    try {
      setError(null);
      const res = await donaturSuratApi.getSuratDetail(childId, suratId);
      setSurat(res.data.data);
    } catch (err) {
      console.error('Error:', err);
      setError('Gagal memuat pesan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [childId, suratId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReply = () => {
    nav.navigate('SuratForm', {
      childId,
      childName,
      replyTo: surat,
      onSuccess: () => {
        if (onGoBack) onGoBack();
        nav.goBack();
      }
    });
  };

  const viewImg = () => {
    if (surat.foto_url) {
      Alert.alert('Lihat Foto', 'Foto akan ditampilkan dalam layar penuh', [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Lihat', 
          onPress: () => {
            Alert.alert('Penampil Gambar', 'Penampil gambar belum tersedia');
          }
        }
      ]);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat pesan..." />;
  }

  if (error || !surat) {
    return (
      <View style={s.container}>
        <ErrorMessage
          message={error || "Pesan tidak ditemukan"}
          onRetry={fetchDetail}
        />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView 
        style={s.scroll}
        contentContainerStyle={s.content}
      >
        <View style={s.header}>
          <View style={s.headerInfo}>
            <Text style={s.sender}>Pesan dari Admin Panti</Text>
            <Text style={s.date}>{formatDate(surat.tanggal)}</Text>
          </View>
          
          {surat.foto_url && (
            <TouchableOpacity style={s.attachBtn} onPress={viewImg}>
              <Ionicons name="image" size={24} color="#f39c12" />
            </TouchableOpacity>
          )}
        </View>

        <View style={s.msgContent}>
          <Text style={s.msgText}>{surat.pesan}</Text>
        </View>

        {surat.foto_url && (
          <View style={s.photoContainer}>
            <Text style={s.photoLabel}>Foto Terlampir:</Text>
            <TouchableOpacity style={s.photoWrapper} onPress={viewImg}>
              <Image
                source={{ uri: surat.foto_url }}
                style={s.photo}
                resizeMode="cover"
              />
              <View style={s.photoOverlay}>
                <Ionicons name="expand" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.childInfo}>
          <Text style={s.childLabel}>Tentang:</Text>
          <Text style={s.childText}>
            Pesan ini tentang {surat.anak?.full_name || childName}
          </Text>
        </View>
      </ScrollView>

      <View style={s.replyContainer}>
        <Button
          title="Balas"
          onPress={handleReply}
          leftIcon={<Ionicons name="arrow-undo" size={20} color="white" />}
          type="primary"
          style={s.replyBtn}
        />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  headerInfo: { flex: 1 },
  sender: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  date: { fontSize: 14, color: '#666' },
  attachBtn: { padding: 8, backgroundColor: '#fff3e0', borderRadius: 20 },
  msgContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  msgText: { fontSize: 16, color: '#333', lineHeight: 24 },
  photoContainer: {
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
  photoLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 12 },
  photoWrapper: { position: 'relative', borderRadius: 8, overflow: 'hidden' },
  photo: { width: '100%', height: 200, borderRadius: 8 },
  photoOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
  },
  childInfo: {
    backgroundColor: '#f0e6f5',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  childLabel: { fontSize: 14, fontWeight: '600', color: '#9b59b6', marginBottom: 4 },
  childText: { fontSize: 14, color: '#333' },
  replyContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  replyBtn: { borderRadius: 25 },
});

export default SuratDetailScreen;