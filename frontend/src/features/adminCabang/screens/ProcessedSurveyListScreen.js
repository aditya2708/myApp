import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminCabangSurveyApi } from '../api/adminCabangSurveyApi';

const ProcessedSurveyListScreen = () => {
  const navigation = useNavigation();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filter, setFilter] = useState('all');
  const [pagination, setPagination] = useState({});

  const filterOptions = [
    { key: 'all', label: 'Semua Diproses', icon: 'list-outline' },
    { key: 'approved', label: 'Disetujui', icon: 'checkmark-circle-outline' },
    { key: 'rejected', label: 'Ditolak', icon: 'close-circle-outline' }
  ];

  const statusConfig = {
    'layak': { label: 'DISETUJUI', color: '#27ae60', bgColor: '#d5f4e6', icon: 'checkmark-circle' },
    'tidak layak': { label: 'DITOLAK', color: '#e74c3c', bgColor: '#fdeaea', icon: 'close-circle' }
  };

  const fetchProcessedSurveys = async (params = {}) => {
    try {
      setError(null);
      const [approved, rejected] = await Promise.all([
        adminCabangSurveyApi.getAllSurveys({ status: 'approved', search: searchText, ...params }),
        adminCabangSurveyApi.getAllSurveys({ status: 'rejected', search: searchText, ...params })
      ]);

      let allSurveys = [...approved.data.data.data, ...rejected.data.data.data];
      if (filter === 'approved') allSurveys = approved.data.data.data;
      else if (filter === 'rejected') allSurveys = rejected.data.data.data;

      allSurveys.sort((a, b) => new Date(b.approved_at) - new Date(a.approved_at));
      setSurveys(allSurveys);
      setPagination({ total: allSurveys.length });
    } catch (err) {
      setError('Gagal memuat survey diproses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProcessedSurveys(); }, [filter]);

  const handleRefresh = () => { setRefreshing(true); fetchProcessedSurveys(); };
  const handleSearch = () => { setLoading(true); fetchProcessedSurveys(); };
  const navigateToDetail = (survey) => navigation.navigate('SurveyApprovalDetail', { surveyId: survey.id_survey });

  const InfoRow = ({ icon, text }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#666" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );

  const renderSurveyItem = ({ item }) => {
    const config = statusConfig[item.hasil_survey] || statusConfig['layak'];
    
    return (
      <TouchableOpacity style={styles.surveyCard} onPress={() => navigateToDetail(item)}>
        <View style={styles.surveyHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.familyName}>{item.keluarga?.kepala_keluarga}</Text>
            <Text style={styles.shelterName}>{item.keluarga?.shelter?.nama_shelter}</Text>
          </View>
          <View style={[styles.statusContainer, { backgroundColor: config.bgColor }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.processedInfo}>
          <InfoRow icon="calendar-outline" text={`Diproses: ${new Date(item.approved_at).toLocaleDateString()}`} />
          <InfoRow icon="person-outline" text={`Oleh: ${item.approvedBy?.nama_lengkap || 'Admin'}`} />
          <InfoRow icon="people-outline" text={`${item.keluarga?.anak?.length || 0} Anak`} />
        </View>

        {item.approval_notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Catatan:</Text>
            <Text style={styles.notesText}>{item.approval_notes}</Text>
          </View>
        )}

        {item.rejection_reason && (
          <View style={styles.rejectionContainer}>
            <Text style={styles.rejectionLabel}>Alasan Penolakan:</Text>
            <Text style={styles.rejectionText}>{item.rejection_reason}</Text>
          </View>
        )}

        {item.keluarga?.anak?.length > 0 && (
          <View style={styles.childrenContainer}>
            <Text style={styles.childrenLabel}>Anak:</Text>
            <View style={styles.childrenList}>
              {item.keluarga.anak.slice(0, 3).map((anak, index) => (
                <View key={index} style={styles.childItem}>
                  <Text style={styles.childName}>{anak.full_name}</Text>
                  <Text style={styles.childStatus}>({anak.status_cpb})</Text>
                </View>
              ))}
              {item.keluarga.anak.length > 3 && (
                <Text style={styles.moreChildren}>+{item.keluarga.anak.length - 3} lagi</Text>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) return <LoadingSpinner fullScreen message="Memuat survey diproses..." />;

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <TouchableOpacity 
            key={option.key} 
            style={[styles.filterButton, filter === option.key && styles.activeFilter]} 
            onPress={() => setFilter(option.key)}
          >
            <Ionicons name={option.icon} size={18} color={filter === option.key ? '#fff' : '#666'} />
            <Text style={[styles.filterText, filter === option.key && styles.activeFilterText]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Cari keluarga, nama anak, atau nomor KK..." 
            value={searchText} 
            onChangeText={setSearchText} 
            onSubmitEditing={handleSearch} 
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {error && <ErrorMessage message={error} onRetry={fetchProcessedSurveys} />}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>{pagination.total || 0} Survey Diproses</Text>
      </View>

      <FlatList
        data={surveys}
        renderItem={renderSurveyItem}
        keyExtractor={(item) => item.id_survey.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada survey diproses</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  filterContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  filterButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 20, backgroundColor: '#f8f8f8', borderWidth: 1, borderColor: '#ddd' },
  activeFilter: { backgroundColor: '#2ecc71', borderColor: '#2ecc71' },
  filterText: { marginLeft: 8, fontSize: 14, color: '#666' },
  activeFilterText: { color: '#fff' },
  searchContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 8, paddingHorizontal: 12, marginRight: 8 },
  searchInput: { flex: 1, padding: 12, fontSize: 16 },
  searchButton: { backgroundColor: '#2ecc71', padding: 12, borderRadius: 8 },
  statsContainer: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  statsText: { fontSize: 16, fontWeight: '600', color: '#333' },
  listContainer: { padding: 16 },
  surveyCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  surveyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerLeft: { flex: 1, marginRight: 12 },
  familyName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  shelterName: { fontSize: 14, color: '#666' },
  statusContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { marginLeft: 6, fontSize: 12, fontWeight: '600' },
  processedInfo: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoText: { marginLeft: 8, fontSize: 14, color: '#666' },
  notesContainer: { backgroundColor: '#f8f8f8', padding: 12, borderRadius: 8, marginBottom: 12 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#666', lineHeight: 20 },
  rejectionContainer: { backgroundColor: '#fdeaea', padding: 12, borderRadius: 8, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#e74c3c' },
  rejectionLabel: { fontSize: 12, fontWeight: '600', color: '#e74c3c', marginBottom: 4 },
  rejectionText: { fontSize: 14, color: '#c0392b', lineHeight: 20 },
  childrenContainer: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  childrenLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  childrenList: { flexDirection: 'row', flexWrap: 'wrap' },
  childItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 },
  childName: { fontSize: 14, color: '#333', marginRight: 4 },
  childStatus: { fontSize: 12, color: '#666' },
  moreChildren: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 }
});

export default ProcessedSurveyListScreen;