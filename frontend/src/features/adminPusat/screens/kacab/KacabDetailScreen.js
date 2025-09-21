import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminPusatApi } from '../../api/adminPusatApi';

const statusStyles = {
  aktif: {
    container: { backgroundColor: '#eafaf1' },
    text: { color: '#27ae60' },
  },
  nonaktif: {
    container: { backgroundColor: '#fdecea' },
    text: { color: '#e74c3c' },
  },
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString();
  } catch (error) {
    return String(value);
  }
};

const DetailRow = ({ icon, label, value }) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLabelWrapper}>
      <Ionicons name={icon} size={18} color="#7f8c8d" style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value ?? '-'}</Text>
  </View>
);

const KacabDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const idKacab = route.params?.idKacab;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = useCallback(
    async (options = {}) => {
      const { silent = false } = options;

      if (!idKacab) {
        setError('ID kantor cabang tidak ditemukan.');
        setLoading(false);
        return;
      }

      try {
        setError('');
        if (!silent) {
          setLoading(true);
        }

        const response = await adminPusatApi.getKacabDetail(idKacab);
        const payload = response?.data ?? null;
        const data = payload?.data ?? payload ?? null;
        setDetail(data);
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || 'Gagal memuat detail kantor cabang';
        setError(String(message));
      } finally {
        if (!silent) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [idKacab]
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail({ silent: true });
  };

  const goToEdit = () => {
    if (!idKacab) {
      Alert.alert('Tidak bisa mengedit', 'ID kantor cabang tidak ditemukan.');
      return;
    }
    navigation.navigate('KacabForm', { mode: 'edit', idKacab });
  };

  const statusKey = String(detail?.status || '').toLowerCase();
  const statusStyle = statusStyles[statusKey] || {
    container: { backgroundColor: '#ecf0f1' },
    text: { color: '#7f8c8d' },
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="business" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{detail?.nama_kacab || 'Kantor Cabang'}</Text>
            <Text style={styles.headerSubtitle}>{detail?.alamat || 'Alamat belum tersedia'}</Text>
          </View>
          <View style={[styles.statusBadge, statusStyle.container]}>
            <Text style={[styles.statusText, statusStyle.text]}>
              {(detail?.status || 'UNKNOWN').toString().toUpperCase()}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={goToEdit}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color="#e74c3c" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDetail()}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Informasi Kontak</Text>
          <DetailRow icon="call-outline" label="Nomor Telepon" value={detail?.no_telp || detail?.no_telpon || '-'} />
          <DetailRow icon="call" label="No. Telpon (Legacy)" value={detail?.no_telpon || detail?.no_telp || '-'} />
          <DetailRow icon="mail-outline" label="Email" value={detail?.email || '-'} />

          <Text style={styles.sectionTitle}>Informasi Wilayah</Text>
          <DetailRow icon="flag-outline" label="Kode Provinsi" value={detail?.id_prov || '-'} />
          <DetailRow icon="business-outline" label="Kode Kabupaten" value={detail?.id_kab || '-'} />
          <DetailRow icon="map-outline" label="Kode Kecamatan" value={detail?.id_kec || '-'} />
          <DetailRow icon="location-outline" label="Kode Kelurahan" value={detail?.id_kel || '-'} />

          <Text style={styles.sectionTitle}>Status & Audit</Text>
          <DetailRow icon="time-outline" label="Dibuat" value={formatDateTime(detail?.created_at)} />
          <DetailRow icon="refresh" label="Terakhir Diperbarui" value={formatDateTime(detail?.updated_at)} />
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2980b9',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: '#fdecea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  errorText: {
    color: '#c0392b',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 8,
  },
  detailRow: {
    marginTop: 8,
  },
  detailLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  detailIcon: {
    width: 20,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34495e',
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20,
  },
});

export default KacabDetailScreen;
