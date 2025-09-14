import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import Button from '../../../../common/components/Button';

import { adminShelterRiwayatApi } from '../../api/adminShelterRiwayatApi';

const { width } = Dimensions.get('window');

const RiwayatDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { anakId, riwayatId, anakData } = route.params;

  const [riwayatData, setRiwayatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRiwayatDetail();
  }, [riwayatId]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={24} color="#3498db" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      )
    });
  }, [riwayatData]);

  const fetchRiwayatDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminShelterRiwayatApi.getRiwayatDetail(anakId, riwayatId);

      if (response.data.success) {
        setRiwayatData(response.data.data);
      } else {
        setError(response.data.message || 'Gagal memuat detail riwayat');
      }
    } catch (err) {
      console.error('Error fetching riwayat detail:', err);
      setError('Gagal memuat detail riwayat. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('RiwayatForm', {
      anakId,
      riwayatData,
      isEdit: true,
      anakData
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Hapus Riwayat',
      'Anda yakin ingin menghapus riwayat ini? Tindakan ini tidak dapat dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await adminShelterRiwayatApi.deleteRiwayat(anakId, riwayatId);
              
              if (response.data.success) {
                Alert.alert(
                  'Sukses',
                  'Riwayat berhasil dihapus',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                setError(response.data.message || 'Gagal menghapus riwayat');
                setLoading(false);
              }
            } catch (err) {
              console.error('Error deleting riwayat:', err);
              setError('Gagal menghapus riwayat. Silakan coba lagi.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat detail riwayat..." />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={fetchRiwayatDetail}
          retryText="Coba Lagi"
        />
      </View>
    );
  }

  if (!riwayatData) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message="Data riwayat tidak ditemukan"
          onRetry={() => navigation.goBack()}
          retryText="Kembali"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.childName}>
          {anakData?.full_name || anakData?.nick_name || 'Anak'}
        </Text>
      </View>

      <View style={styles.content}>
        {riwayatData.foto_url && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: riwayatData.foto_url }}
              style={styles.photo}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Informasi Riwayat</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Jenis Histori:</Text>
            <Text style={styles.value}>{riwayatData.jenis_histori}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Nama Histori:</Text>
            <Text style={styles.value}>{riwayatData.nama_histori}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Tanggal:</Text>
            <Text style={styles.value}>
              {format(new Date(riwayatData.tanggal), 'EEEE, dd MMMM yyyy', { locale: id })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Status Rawat:</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: riwayatData.di_opname === 'YA' ? '#e74c3c' : '#2ecc71' }
            ]}>
              <Text style={styles.statusText}>
                {riwayatData.di_opname === 'YA' ? 'Dirawat' : 'Tidak Dirawat'}
              </Text>
            </View>
          </View>

          {riwayatData.di_opname === 'YA' && riwayatData.dirawat_id && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>ID Rawat:</Text>
              <Text style={styles.value}>{riwayatData.dirawat_id}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionSection}>
          <Button
            title="Edit Riwayat"
            onPress={handleEdit}
            type="primary"
            style={styles.actionButton}
            icon="create-outline"
          />
          
          <Button
            title="Hapus Riwayat"
            onPress={handleDelete}
            type="danger"
            style={styles.actionButton}
            icon="trash-outline"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerButtons: {
    flexDirection: 'row',
    marginRight: 16,
  },
  headerButton: {
    marginLeft: 16,
  },
  header: {
    backgroundColor: '#e74c3c',
    padding: 20,
    alignItems: 'center',
  },
  childName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingTop: 30,
    paddingHorizontal: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photo: {
    width: width - 80,
    height: 200,
    borderRadius: 12,
  },
  infoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  actionSection: {
    paddingBottom: 20,
  },
  actionButton: {
    marginBottom: 12,
  },
});

export default RiwayatDetailScreen;