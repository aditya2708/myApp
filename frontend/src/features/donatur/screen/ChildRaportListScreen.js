import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { donaturRaportApi } from '../api/donaturRaportApi';

const ChildRaportListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName } = route.params;
  const [raportList, setRaportList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({ title: `Rapor - ${childName}` });
  }, [navigation, childName]);

  const fetchRaportList = async () => {
    try {
      setError(null);
      const response = await donaturRaportApi.getRaportList(childId);
      setRaportList(response.data.data);
    } catch (err) {
      console.error('Error fetching raport:', err);
      setError('Gagal memuat rapor. Silakan coba lagi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRaportList(); }, [childId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRaportList();
  };

  const handleViewRaport = (raportId) => {
    navigation.navigate('ChildRaportDetail', { childId, raportId, childName });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const getGradeColor = (average) => {
    if (average >= 90) return '#2ecc71';
    if (average >= 80) return '#3498db';
    if (average >= 70) return '#f39c12';
    if (average >= 60) return '#e67e22';
    return '#e74c3c';
  };

  const renderRaportItem = ({ item }) => {
    const averageGrade = item.nilai_rata_rata || 0;
    
    return (
      <TouchableOpacity style={styles.raportCard} onPress={() => handleViewRaport(item.id_raport)}>
        <View style={styles.cardHeader}>
          <View style={styles.semesterInfo}>
            <Text style={styles.semesterName}>
              {item.semester?.nama_semester || 'Semester'}
            </Text>
            <Text style={styles.tahunAjaran}>{item.semester?.tahun_ajaran || ''}</Text>
          </View>
          <View style={[styles.gradeContainer, { backgroundColor: getGradeColor(averageGrade) }]}>
            <Text style={styles.gradeText}>
              {averageGrade ? averageGrade.toFixed(1) : '0.0'}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="calendar" size={16} color="#666" />
              <Text style={styles.statLabel}>Kehadiran</Text>
              <Text style={styles.statValue}>
                {item.persentase_kehadiran ? `${item.persentase_kehadiran}%` : 'N/A'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="bar-chart" size={16} color="#666" />
              <Text style={styles.statLabel}>Peringkat</Text>
              <Text style={styles.statValue}>
                {item.ranking ? `#${item.ranking}` : 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.publishDate}>
              Diterbitkan: {formatDate(item.tanggal_terbit)}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#cccccc" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat rapor..." />;
  }

  return (
    <View style={styles.container}>
      {error && <ErrorMessage message={error} onRetry={fetchRaportList} />}
      {raportList.length > 0 ? (
        <FlatList
          data={raportList}
          renderItem={renderRaportItem}
          keyExtractor={(item) => item.id_raport.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={60} color="#cccccc" />
          <Text style={styles.emptyText}>Belum ada rapor</Text>
          <Text style={styles.emptySubText}>
            Laporan akademik {childName} akan muncul di sini jika tersedia
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContainer: { padding: 16 },
  raportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  semesterInfo: { flex: 1 },
  semesterName: { fontSize: 16, fontWeight: 'bold', color: '#333333', marginBottom: 2 },
  tahunAjaran: { fontSize: 14, color: '#666666' },
  gradeContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  gradeText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  cardContent: { padding: 16 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 12, color: '#666666', marginTop: 4, marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#333333' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  publishDate: { fontSize: 12, color: '#999999' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#999999', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  emptySubText: { fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 20 },
});

export default ChildRaportListScreen;