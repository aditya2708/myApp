import React, { useCallback, useState } from 'react';
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminPusatApi } from '../../api/adminPusatApi';

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

const ShelterDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const idShelter = route.params?.idShelter;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = useCallback(
    async (options = {}) => {
      const { silent = false } = options;

      if (!idShelter && idShelter !== 0) {
        setError('ID shelter tidak ditemukan.');
        setLoading(false);
        return;
      }

      try {
        setError('');
        if (!silent) {
          setLoading(true);
        }

        const response = await adminPusatApi.getShelterDetail(idShelter);
        const payload = response?.data ?? null;
        const data = payload?.data ?? payload ?? null;
        setDetail(data);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Gagal memuat detail shelter';
        setError(String(message));
      } finally {
        if (!silent) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [idShelter]
  );

  useFocusEffect(
    useCallback(() => {
      fetchDetail();

      return () => {};
    }, [fetchDetail])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail({ silent: true });
  };

  const goToEdit = () => {
    if (!idShelter && idShelter !== 0) {
      Alert.alert('Tidak bisa mengedit', 'ID shelter tidak ditemukan.');
      return;
    }
    navigation.navigate('ShelterForm', { mode: 'edit', idShelter });
  };

  const wilbinName =
    detail?.wilbin?.nama_wilbin ||
    detail?.wilbin_name ||
    detail?.nama_wilbin ||
    'Wilayah binaan belum ditentukan';
  const kacabName =
    detail?.wilbin?.kacab?.nama_kacab ||
    detail?.kacab?.nama_kacab ||
    detail?.nama_kacab ||
    'Kantor cabang belum ditentukan';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="home" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{detail?.nama_shelter || 'Shelter'}</Text>
            <Text style={styles.headerSubtitle}>{wilbinName}</Text>
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
          <Text style={styles.sectionTitle}>Informasi Shelter</Text>
          <DetailRow icon="home-outline" label="Nama Shelter" value={detail?.nama_shelter || '-'} />
          <DetailRow icon="map-outline" label="Wilayah Binaan" value={wilbinName} />
          <DetailRow icon="id-card-outline" label="ID Shelter" value={detail?.id_shelter ?? detail?.id ?? '-'} />
          <DetailRow icon="location-outline" label="ID Wilbin" value={detail?.id_wilbin ?? '-'} />
          <DetailRow icon="business-outline" label="Kantor Cabang" value={kacabName} />

          <Text style={styles.sectionTitle}>Audit</Text>
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
    backgroundColor: '#e67e22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2980b9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    marginLeft: 6,
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
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
    color: '#e74c3c',
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  detailIcon: {
    width: 24,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    flexShrink: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 1,
    textAlign: 'right',
  },
});

export default ShelterDetailScreen;
