import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminCabangSurveyApi } from '../api/adminCabangSurveyApi';

const SurveyStatusFilterScreen = () => {
  const navigation = useNavigation();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({});

  const tabs = [
    { key: 'pending', label: 'Menunggu', icon: 'time-outline', color: '#f39c12' },
    { key: 'approved', label: 'Disetujui', icon: 'checkmark-circle-outline', color: '#27ae60' },
    { key: 'rejected', label: 'Ditolak', icon: 'close-circle-outline', color: '#e74c3c' }
  ];

  const statusConfig = {
    pending: { label: 'MENUNGGU', color: '#f39c12', bgColor: '#fef5e7' },
    layak: { label: 'DISETUJUI', color: '#27ae60', bgColor: '#d5f4e6', icon: 'checkmark-circle' },
    'tidak layak': { label: 'DITOLAK', color: '#e74c3c', bgColor: '#fdeaea', icon: 'close-circle' }
  };

  const fetchSurveys = async (params = {}) => {
    try {
      setError(null);
      const response = await adminCabangSurveyApi.getAllSurveys({
        status: activeTab, search: searchText, ...params
      });
      setSurveys(response.data.data.data);
      setPagination({ currentPage: response.data.data.current_page, lastPage: response.data.data.last_page, total: response.data.data.total });
    } catch (err) {
      setError('Gagal memuat survei');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminCabangSurveyApi.getStats();
      setStats(response.data.data);
    } catch (err) {
      console.error('Gagal memuat statistik:', err);
    }
  };

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { setLoading(true); fetchSurveys(); }, [activeTab]);

  const handleRefresh = () => { setRefreshing(true); fetchSurveys(); fetchStats(); };
  const handleSearch = () => { setLoading(true); fetchSurveys(); };
  const handleTabChange = (tabKey) => { setActiveTab(tabKey); setSearchText(''); };
  const navigateToDetail = (survey) => navigation.navigate('SurveyApprovalDetail', { surveyId: survey.id_survey });

  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
        {config.icon && <Ionicons name={config.icon} size={16} color={config.color} style={{ marginRight: 4 }} />}
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  const InfoRow = ({ icon, text, style }) => (
    <View style={[styles.infoRow, style]}>
      <Ionicons name={icon} size={16} color="#666" />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );

  const renderSurveyItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigateToDetail(item)}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.familyName}>{item.keluarga?.kepala_keluarga}</Text>
          <Text style={styles.shelterName}>{item.keluarga?.shelter?.nama_shelter}</Text>
        </View>
        <StatusBadge status={item.hasil_survey} />
      </View>
      
      <View style={styles.info}>
        <InfoRow icon="people-outline" text={`${item.keluarga?.anak?.length || 0} Anak`} />
        <InfoRow icon="calendar-outline" text={`Dibuat: ${new Date(item.created_at).toLocaleDateString()}`} />
        {item.approved_at && (
          <InfoRow icon="checkmark-outline" text={`Diproses: ${new Date(item.approved_at).toLocaleDateString()}`} />
        )}
        {item.approvedBy && (
          <InfoRow icon="person-outline" text={`Oleh: ${item.approvedBy.nama_lengkap}`} />
        )}
      </View>

      {item.approval_notes && (
        <View style={[styles.notesContainer, { backgroundColor: '#f8f8f8' }]}>
          <Text style={styles.notesLabel}>Catatan:</Text>
          <Text style={styles.notesText}>{item.approval_notes}</Text>
        </View>
      )}

      {item.rejection_reason && (
        <View style={[styles.notesContainer, { backgroundColor: '#fdeaea', borderLeftWidth: 4, borderLeftColor: '#e74c3c' }]}>
          <Text style={[styles.notesLabel, { color: '#e74c3c' }]}>Alasan Penolakan:</Text>
          <Text style={[styles.notesText, { color: '#c0392b' }]}>{item.rejection_reason}</Text>
        </View>
      )}

      {item.keluarga?.anak?.length > 0 && (
        <View style={styles.children}>
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

  if (loading && !refreshing) return <LoadingSpinner fullScreen message="Memuat survei..." />;

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && [styles.activeTab, { borderBottomColor: tab.color }]]}
            onPress={() => handleTabChange(tab.key)}
          >
            <Ionicons name={tab.icon} size={20} color={activeTab === tab.key ? tab.color : '#999'} />
            <Text style={[styles.tabText, activeTab === tab.key && { color: tab.color }]}>{tab.label}</Text>
            {stats[tab.key] !== undefined && (
              <View style={[styles.tabBadge, { backgroundColor: tab.color }]}>
                <Text style={styles.tabBadgeText}>{stats[tab.key]}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput style={styles.searchInput} placeholder="Cari keluarga, nama anak, atau nomor KK..." value={searchText} onChangeText={setSearchText} onSubmitEditing={handleSearch} />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {error && <ErrorMessage message={error} onRetry={fetchSurveys} />}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>{pagination.total || 0} {tabs.find(t => t.key === activeTab)?.label} Survei</Text>
      </View>

      <FlatList
        data={surveys}
        renderItem={renderSurveyItem}
        keyExtractor={(item) => item.id_survey.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada survei {activeTab} ditemukan</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 8, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  activeTab: { borderBottomWidth: 3 },
  tabText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#999' },
  tabBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 8, paddingHorizontal: 12, marginRight: 8 },
  searchInput: { flex: 1, padding: 12, fontSize: 16 },
  searchButton: { backgroundColor: '#2ecc71', padding: 12, borderRadius: 8 },
  statsContainer: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  statsText: { fontSize: 16, fontWeight: '600', color: '#333' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  headerLeft: { flex: 1, marginRight: 12 },
  familyName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  shelterName: { fontSize: 14, color: '#666' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  info: { marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  infoText: { marginLeft: 8, fontSize: 14, color: '#666' },
  notesContainer: { padding: 12, borderRadius: 8, marginBottom: 12 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#333', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#666', lineHeight: 20 },
  children: { borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  childrenLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  childrenList: { flexDirection: 'row', flexWrap: 'wrap' },
  childItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 },
  childName: { fontSize: 14, color: '#333', marginRight: 4 },
  childStatus: { fontSize: 12, color: '#666' },
  moreChildren: { fontSize: 12, color: '#999', fontStyle: 'italic' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 64 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16 }
});

export default SurveyStatusFilterScreen;