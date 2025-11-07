import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from 'react-redux';

// Import components
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
const toDateKey = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Import API
import { penilaianApi } from '../../api/penilaianApi';
import { semesterApi } from '../../api/semesterApi';

const collectPenilaianDates = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return [];
  }

  const dates = new Set();
  Object.values(data).forEach(group => {
    if (!Array.isArray(group)) return;
    group.forEach(item => {
      const key = toDateKey(item?.tanggal_penilaian);
      if (key) {
        dates.add(key);
      }
    });
  });

  return Array.from(dates).sort((a, b) => new Date(b) - new Date(a));
};

const PenilaianListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { anakId, anakData } = route.params || {};
  
  const [penilaianList, setPenilaianList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeSemester, setActiveSemester] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesterId, setSemesterId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

  const filteredPenilaianEntries = useMemo(() => {
    if (!penilaianList || Array.isArray(penilaianList)) {
      return [];
    }

    const groups = Object.entries(penilaianList);

    if (!selectedDateKey) {
      return groups;
    }

    return groups
      .map(([mapel, penilaianGroup]) => {
        if (!Array.isArray(penilaianGroup)) {
          return null;
        }

        const filteredGroup = penilaianGroup.filter(item => toDateKey(item?.tanggal_penilaian) === selectedDateKey);
        if (filteredGroup.length === 0) {
          return null;
        }

        return [mapel, filteredGroup];
      })
      .filter(Boolean);
  }, [penilaianList, selectedDateKey]);

  useEffect(() => {
    if (!anakId) {
      setError('Data anak tidak tersedia');
      setLoading(false);
      return;
    }
    
    fetchActiveSemester();
  }, [anakId]);

  useEffect(() => {
    if (selectedSemester) {
      const id = selectedSemester.id_semester || selectedSemester.id;
      setSemesterId(id);
    }
  }, [selectedSemester]);

  useEffect(() => {
    if (semesterId) {
      fetchPenilaian();
    }
  }, [semesterId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (semesterId) {
        fetchPenilaian();
      }
    });
    return unsubscribe;
  }, [navigation, semesterId]);

  const fetchActiveSemester = async () => {
    try {
      console.log('🔍 [PenilaianList] Fetching active semester...');
      const response = await semesterApi.getActive();
      console.log('📅 [PenilaianList] Semester API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        console.log('✅ [PenilaianList] Active semester found:', response.data.data);
        setActiveSemester(response.data.data);
        setSelectedSemester(response.data.data);
        setSemesterId(response.data.data.id_semester);
      } else {
        console.warn('⚠️ [PenilaianList] Semester API failed:', response.data.message);
        setError('Gagal memuat semester aktif');
      }
    } catch (err) {
      console.error('❌ [PenilaianList] Error fetching active semester:', err);
      console.error('❌ [PenilaianList] Error details:', err?.response?.data);
      setError('Gagal memuat semester aktif');
    }
  };

  const fetchPenilaian = async () => {
    try {
      setError(null);

      console.log('📋 [PenilaianList] Selected semester:', selectedSemester);
      console.log('👤 [PenilaianList] Anak ID:', anakId);

      if (!semesterId) {
        console.warn('⚠️ [PenilaianList] No semester ID available');
        console.log('🔍 [PenilaianList] Selected semester object:', JSON.stringify(selectedSemester, null, 2));
        setError('Semester tidak tersedia');
        return;
      }

      console.log('🔄 [PenilaianList] Fetching penilaian for anak:', anakId, 'semester:', semesterId);
      const response = await penilaianApi.getByAnakSemester(anakId, semesterId);
      console.log('📊 [PenilaianList] Penilaian API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        console.log('✅ [PenilaianList] Penilaian data loaded:', response.data.data);
        const payload = response.data.data;
        setPenilaianList(payload);

        const availableDates = collectPenilaianDates(payload);
        if (availableDates.length > 0) {
          const firstDate = availableDates[0];
          if (!selectedDateKey || !availableDates.includes(selectedDateKey)) {
            setSelectedDate(new Date(firstDate));
          }
        }
      } else {
        console.warn('⚠️ [PenilaianList] Penilaian API failed:', response.data.message);
        setError(response.data.message || 'Gagal memuat data penilaian');
      }
    } catch (err) {
      console.error('❌ [PenilaianList] Error fetching penilaian:', err);
      console.error('❌ [PenilaianList] Error details:', err?.response?.data);
      setError('Gagal memuat data penilaian. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPenilaian();
  };

  const navigateToForm = (penilaian = null) => {
    navigation.navigate('PenilaianForm', {
      anakId,
      anakData,
      penilaian,
      semesterId,
      initialActivityDate: penilaian?.tanggal_penilaian || selectedDateKey
    });
  };

  const handleFilterDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Hapus Penilaian',
      'Anda yakin ingin menghapus penilaian ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await penilaianApi.deletePenilaian(id);
              fetchPenilaian();
              Alert.alert('Sukses', 'Penilaian berhasil dihapus');
            } catch (err) {
              Alert.alert('Error', 'Gagal menghapus penilaian');
            }
          }
        }
      ]
    );
  };

  const renderPenilaianCard = ({ item }) => {
    const mataPelajaranData = item.materi?.mataPelajaran || item.materi?.mata_pelajaran;
    const subjectLabel = item.mata_pelajaran_manual
      || (typeof mataPelajaranData === 'string'
        ? mataPelajaranData
        : mataPelajaranData?.nama_mata_pelajaran || mataPelajaranData?.nama)
      || '';

    const materiLabel = item.materi_manual
      || item.materi?.nama_materi
      || item.materi_text
      || 'Tanpa Materi';

    const kelasLabel = item.materi?.kelas?.nama_kelas;
    const jenisPenilaianLabel =
      item.jenis_penilaian_manual ||
      item.jenis_penilaian?.nama_jenis ||
      item.jenis_penilaian?.nama ||
      item.jenisPenilaian?.nama_jenis ||
      item.jenisPenilaian?.nama ||
      item.jenis_penilaian ||
      item.jenisPenilaian ||
      'Jenis tidak diketahui';
    const mataPelajaranDisplay = subjectLabel || 'Tanpa Mata Pelajaran';
    const materiDisplay = materiLabel || 'Tanpa Materi';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigateToForm(item)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            {jenisPenilaianLabel}
          </Text>
          <Text style={[styles.nilaiHuruf, { color: getNilaiColor(item.nilai) }]}>
            {item.nilai_huruf || 'N/A'}
          </Text>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mata Pelajaran :</Text>
            <Text style={styles.detailValue}>
              {kelasLabel ? `${mataPelajaranDisplay} • ${kelasLabel}` : mataPelajaranDisplay}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Materi :</Text>
            <Text style={styles.detailValue}>{materiDisplay}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>Nilai: {item.nilai || '0'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>{formatDate(item.tanggal_penilaian)}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigateToForm(item)}
          >
            <Ionicons name="pencil" size={20} color="#3498db" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDelete(item.id_penilaian)}
          >
            <Ionicons name="trash" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const getNilaiColor = (nilai) => {
    if (nilai >= 90) return '#2ecc71';
    if (nilai >= 80) return '#3498db';
    if (nilai >= 70) return '#f39c12';
    if (nilai >= 60) return '#e67e22';
    return '#e74c3c';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat data penilaian..." />;
  }

  return (
    <View style={styles.container}>
      {/* Semester Info */}
      {selectedSemester && (
        <View style={styles.semesterInfo}>
          <Ionicons name="school-outline" size={20} color="#3498db" />
          <Text style={styles.semesterText}>
            {selectedSemester.nama || selectedSemester.nama_semester} - {selectedSemester.tahun_ajaran}
          </Text>
        </View>
      )}

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Tanggal Aktivitas</Text>
        <TouchableOpacity
          style={styles.filterDateInput}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={20} color="#2c3e50" />
          <Text style={styles.filterDateText}>
            {selectedDate.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleFilterDateChange}
          />
        )}
      </View>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={fetchPenilaian}
        />
      )}

      <FlatList
        data={filteredPenilaianEntries}
        renderItem={({ item: [mapel, penilaianGroup] }) => (
          <View key={mapel}>
            <Text style={styles.sectionHeader}>
              {mapel === 'Tanpa Mata Pelajaran' ? 'Tanpa Mata Pelajaran' : mapel}
            </Text>
            {Array.isArray(penilaianGroup) && penilaianGroup.map(penilaian => (
              <View key={penilaian.id_penilaian}>
                {renderPenilaianCard({ item: penilaian })}
              </View>
            ))}
          </View>
        )}
        keyExtractor={(item) => `${item[0]}-${selectedDateKey}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyText}>Belum ada penilaian</Text>
            <Text style={styles.emptySubText}>
              {selectedDateKey
                ? `Tidak ada penilaian pada ${new Date(selectedDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}. Tap tombol + untuk menambah penilaian.`
                : 'Tap tombol + untuk menambah penilaian'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigateToForm()}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  semesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bbdefb',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#f5f5f5',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  filterDateInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterDateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  semesterText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
  },
  nilaiHuruf: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 6,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#34495e',
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7f8c8d',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 12,
  },
  actionButton: {
    padding: 8,
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default PenilaianListScreen;
