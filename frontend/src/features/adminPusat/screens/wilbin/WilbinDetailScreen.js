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

const WilbinDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const idWilbin = route.params?.idWilbin;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDetail = useCallback(
    async (options = {}) => {
      const { silent = false } = options;

      if (!idWilbin && idWilbin !== 0) {
        setError('ID wilayah binaan tidak ditemukan.');
        setLoading(false);
        return;
      }

      try {
        setError('');
        if (!silent) {
          setLoading(true);
        }

        const response = await adminPusatApi.getWilbinDetail(idWilbin);
        const payload = response?.data ?? null;
        const data = payload?.data ?? payload ?? null;
        setDetail(data);
      } catch (err) {
        const message = err?.response?.data?.message || err?.message || 'Gagal memuat detail wilayah binaan';
        setError(String(message));
      } finally {
        if (!silent) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [idWilbin]
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetail({ silent: true });
  };

  const goToEdit = () => {
    if (!idWilbin && idWilbin !== 0) {
      Alert.alert('Tidak bisa mengedit', 'ID wilayah binaan tidak ditemukan.');
      return;
    }
    navigation.navigate('WilbinForm', { mode: 'edit', idWilbin });
  };

  const kacabName = detail?.kacab?.nama_kacab || detail?.nama_kacab || 'Kantor cabang belum ditentukan';
  const shelterCount =
    detail?.jumlah_shelter ?? detail?.total_shelter ?? detail?.shelter_count ?? detail?.totalShelter ?? null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Ionicons name="map" size={26} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>{detail?.nama_wilbin || 'Wilayah Binaan'}</Text>
            <Text style={styles.headerSubtitle}>{kacabName}</Text>
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
          <Text style={styles.sectionTitle}>Informasi Wilayah</Text>
          <DetailRow icon="map-outline" label="Nama Wilayah Binaan" value={detail?.nama_wilbin || '-'} />
          <DetailRow icon="business-outline" label="Kantor Cabang" value={kacabName} />

          {typeof shelterCount === 'number' ? (
            <DetailRow
              icon="home-outline"
              label="Jumlah Shelter"
              value={`${shelterCount} shelter`}
            />
          ) : null}

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
    backgroundColor: '#27ae60',
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
  editButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2980b9',
    paddingVertical: 10,
    borderRadius: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorBox: {
    backgroundColor: '#fdecea',
    padding: 16,
    borderRadius: 10,
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
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailIcon: {
    marginRight: 2,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#2c3e50',
    textAlign: 'right',
  },
});

export default WilbinDetailScreen;
