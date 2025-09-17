import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Button from '../../../../common/components/Button';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

// Import utils
import { formatDateToIndonesian } from '../../../../common/utils/dateFormatter';

// Import API
import { raportApi } from '../../api/raportApi';

const RaportScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { anakData, anakId } = route.params || {};
  
  const [raportList, setRaportList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total_raport: 0,
    semester_count: 0
  });

  // Fetch raport data
  const fetchRaportData = useCallback(async () => {
    if (!anakId) return;

    try {
      setError(null);
      const response = await raportApi.getRaportByAnak(anakId);

      if (response.data.success) {
        setRaportList(response.data.data || []);

        // Set summary data if available
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
      } else {
        setError(response.data.message || 'Gagal memuat data raport');
      }
    } catch (err) {
      console.error('Error fetching raport data:', err);
      setError('Gagal memuat data raport. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [anakId]);

  useFocusEffect(
    useCallback(() => {
      fetchRaportData();
    }, [fetchRaportData])
  );

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchRaportData();
  };

  const getStatusInfo = (statusValue, rawStatus) => {
    switch (statusValue) {
      case 'draft':
        return { label: 'Draft', color: '#f39c12' };
      case 'published':
        return { label: 'Published', color: '#2ecc71' };
      default:
        if (!statusValue) return null;
        return {
          label:
            rawStatus && typeof rawStatus === 'string'
              ? rawStatus
              : statusValue.charAt(0).toUpperCase() + statusValue.slice(1),
          color: '#3498db'
        };
    }
  };

  // Handle view raport detail
  const handleViewRaport = (item) => {
    navigation.navigate('RaportView', { raportId: item.id_raport });
  };

  // Handle create new raport
  const handleCreateRaport = () => {
    navigation.navigate('RaportGenerate', { anakId, anakData });
  };

  const handleDeleteRaport = (item) => {
    Alert.alert(
      'Hapus Raport',
      'Apakah Anda yakin ingin menghapus raport ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await raportApi.deleteRaport(item.id_raport);
              fetchRaportData();
            } catch (err) {
              console.error('Error deleting raport:', err);
              Alert.alert('Gagal', 'Gagal menghapus raport. Silakan coba lagi.');
            }
          }
        }
      ]
    );
  };

  const handleRegenerateRaport = (item) => {
    navigation.navigate('RaportGenerate', {
      anakId,
      anakData,
      raportId: item.id_raport,
      onGenerateComplete: fetchRaportData
    });
  };

  // Render raport item
  const renderRaportItem = ({ item }) => {
    const semesterLabel =
      item.semester?.nama_semester ??
      item.semester?.nama ??
      (typeof item.semester === 'string' ? item.semester : '-');
    const tahunAjaranLabel = item.semester?.tahun_ajaran ?? item.tahun_ajaran ?? '';
    const tingkatLabel =
      typeof item.tingkat === 'string'
        ? item.tingkat
        : item.tingkat?.nama ??
          (typeof item.tingkat?.level === 'string' ? item.tingkat.level : '-');
    const kelasLabel =
      typeof item.kelas === 'string'
        ? item.kelas
        : item.kelas?.nama ??
          (typeof item.kelas?.label === 'string' ? item.kelas.label : '-');
    const kelompokLabel =
      typeof item.kelompok === 'string'
        ? item.kelompok
        : item.kelompok?.nama_kelompok ?? '-';
    const kurikulumLabel =
      typeof item.kurikulum === 'string'
        ? item.kurikulum
        : item.kurikulum?.nama_kurikulum ?? '-';
    const safeDisplay = (value) => {
      if (value === null || value === undefined) {
        return '-';
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : '-';
      }

      return value;
    };
    const metadataItems = [
      { label: 'Kelas', value: safeDisplay(kelasLabel) },
      { label: 'Kelompok', value: safeDisplay(kelompokLabel) },
      { label: 'Semester', value: safeDisplay(semesterLabel) },
      { label: 'Kurikulum', value: safeDisplay(kurikulumLabel) },
    ];
    const rawStatus = (item.status ?? item.keterangan ?? '').toString();
    const normalizedStatus = rawStatus.toLowerCase();
    const statusInfo = getStatusInfo(normalizedStatus, rawStatus);
    const isDraft = normalizedStatus === 'draft';

    return (
      <TouchableOpacity
        style={styles.raportCard}
        onPress={() => handleViewRaport(item)}
      >
        <View style={styles.raportHeader}>
          <View style={styles.raportHeaderContent}>
            <Text style={styles.raportTitle}>
              {semesterLabel}
              {tahunAjaranLabel ? ` - Tahun Ajaran ${tahunAjaranLabel}` : ''}
            </Text>
            <Text style={styles.raportSchoolLevel}>
              {tingkatLabel} - Kelas {kelasLabel}
            </Text>
          </View>
          {statusInfo && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.color }
              ]}
            >
              <Text style={styles.statusBadgeText}>{statusInfo.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.raportDetails}>
          <View style={styles.metadataRow}>
            {metadataItems.map((meta) => (
              <View key={meta.label} style={styles.metadataItem}>
                <Text style={styles.metadataLabel}>{meta.label}</Text>
                <Text style={styles.metadataValue}>{meta.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.scoreAndMetaRow}>
            <View style={styles.raportScores}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Min:</Text>
                <Text style={styles.scoreValue}>{item.nilai_min || '-'}</Text>
              </View>

              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Rata-rata:</Text>
                <Text style={styles.scoreValue}>{item.nilai_rata_rata || '-'}</Text>
              </View>

              <View style={styles.scoreItem}>
                <Text style={styles.scoreLabel}>Max:</Text>
                <Text style={styles.scoreValue}>{item.nilai_max || '-'}</Text>
              </View>
            </View>

            <View style={styles.raportMeta}>
              <Text style={styles.raportDate}>
                {item.tanggal ? formatDateToIndonesian(item.tanggal) : ''}
              </Text>

              {item.foto_raport && item.foto_raport.length > 0 && (
                <View style={styles.photoIndicator}>
                  <Ionicons name="image" size={16} color="#666" />
                  <Text style={styles.photoCount}>{item.foto_raport.length} foto</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {isDraft && (
          <View style={styles.raportActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.regenerateButton]}
              onPress={(event) => {
                event.stopPropagation();
                handleRegenerateRaport(item);
              }}
            >
              <Ionicons name="refresh" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Regenerate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(event) => {
                event.stopPropagation();
                handleDeleteRaport(item);
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#ffffff" />
              <Text style={styles.actionButtonText}>Hapus</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerImageContainer}>
            {anakData?.foto_url ? (
              <Image
                source={{ uri: anakData.foto_url }}
                style={styles.headerImage}
              />
            ) : (
              <View style={styles.headerImagePlaceholder}>
                <Ionicons name="person" size={40} color="#ffffff" />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{anakData?.full_name || 'Nama Anak'}</Text>
            {anakData?.nick_name && (
              <Text style={styles.headerNickname}>{anakData.nick_name}</Text>
            )}
          </View>
        </View>
        <LoadingSpinner message="Memuat data raport..." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerImageContainer}>
          {anakData?.foto_url ? (
            <Image
              source={{ uri: anakData.foto_url }}
              style={styles.headerImage}
            />
          ) : (
            <View style={styles.headerImagePlaceholder}>
              <Ionicons name="person" size={40} color="#ffffff" />
            </View>
          )}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{anakData?.full_name || 'Nama Anak'}</Text>
          {anakData?.nick_name && (
            <Text style={styles.headerNickname}>{anakData.nick_name}</Text>
          )}
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Error Message */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={fetchRaportData}
          />
        )}
        
        {/* Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Raport Anak</Text>
          <Button
            title="Tambah Raport"
            onPress={handleCreateRaport}
            leftIcon={<Ionicons name="add" size={16} color="#fff" />}
            size="small"
          />
        </View>
        
        {/* Raport List */}
        {raportList.length > 0 ? (
          <FlatList
            data={raportList}
            renderItem={renderRaportItem}
            keyExtractor={(item) => item.id_raport.toString()}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={80} color="#cccccc" />
            <Text style={styles.emptyTitle}>Belum Ada Raport</Text>
            <Text style={styles.emptyText}>
              Belum ada data raport untuk anak ini. Tambahkan raport baru untuk memulai.
            </Text>
            <Button
              title="Tambah Raport Pertama"
              onPress={handleCreateRaport}
              style={styles.emptyButton}
              leftIcon={<Ionicons name="add" size={16} color="#fff" />}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerImageContainer: {
    marginRight: 16,
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerNickname: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  raportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  raportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  raportHeaderContent: {
    flex: 1,
    paddingRight: 12,
  },
  raportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  raportSchoolLevel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  raportDetails: {
    flexDirection: 'column',
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metadataItem: {
    width: '48%',
    marginBottom: 8,
    paddingRight: 12,
  },
  metadataLabel: {
    fontSize: 12,
    color: '#999999',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
  },
  scoreAndMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  raportScores: {
    flex: 1,
    paddingRight: 12,
  },
  scoreItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  scoreLabel: {
    width: 80,
    fontSize: 14,
    color: '#666666',
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  raportMeta: {
    alignItems: 'flex-end',
    minWidth: 110,
  },
  raportDate: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCount: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  raportActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  regenerateButton: {
    backgroundColor: '#2980b9',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default RaportScreen;