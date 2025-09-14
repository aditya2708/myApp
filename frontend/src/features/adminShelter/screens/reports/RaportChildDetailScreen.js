import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';

import {
  selectChildDetail,
  selectChildDetailLoading,
  selectChildDetailError,
  clearChildDetail,
  clearChildDetailError
} from '../../redux/raportLaporanSlice';

import {
  fetchChildDetailRaport
} from '../../redux/raportLaporanThunks';

const RaportChildDetailScreen = ({ route, navigation }) => {
  const { childId, filters = {} } = route.params;
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRaport, setExpandedRaport] = useState([]);

  // Redux state
  const childDetail = useSelector(selectChildDetail);
  const loading = useSelector(selectChildDetailLoading);
  const error = useSelector(selectChildDetailError);

  useEffect(() => {
    loadChildDetail();
    
    return () => {
      dispatch(clearChildDetail());
    };
  }, [childId, filters]);

  const loadChildDetail = async () => {
    try {
      await dispatch(fetchChildDetailRaport({
        childId,
        ...filters
      })).unwrap();
    } catch (error) {
      console.error('Failed to load child detail:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadChildDetail();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleRaportExpanded = (raportId) => {
    setExpandedRaport(prev => 
      prev.includes(raportId)
        ? prev.filter(id => id !== raportId)
        : [...prev, raportId]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#4caf50';
      case 'draft': return '#ff9800';
      case 'archived': return '#9e9e9e';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published': return 'Terbit';
      case 'draft': return 'Draft';
      case 'archived': return 'Arsip';
      default: return status;
    }
  };

  const getGradeColor = (grade) => {
    if (grade >= 85) return '#4caf50';
    if (grade >= 75) return '#ff9800';
    if (grade >= 65) return '#ff5722';
    return '#f44336';
  };

  const renderChildInfo = () => {
    if (!childDetail.child) return null;

    const { child } = childDetail;
    
    return (
      <View style={styles.childInfoCard}>
        <View style={styles.childHeader}>
          <Image
            source={{ uri: child.foto_url || 'https://via.placeholder.com/80' }}
            style={styles.childPhoto}
          />
          <View style={styles.childDetails}>
            <Text style={styles.childName}>{child.full_name}</Text>
            {child.nick_name && (
              <Text style={styles.childNickname}>({child.nick_name})</Text>
            )}
            <View style={styles.childStats}>
              <View style={styles.statItem}>
                <Ionicons name="document-text" size={16} color="#666" />
                <Text style={styles.statText}>
                  {childDetail.raport_records?.length || 0} Raport
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSubjectGrades = (subjects) => {
    return (
      <View style={styles.subjectsContainer}>
        <Text style={styles.subjectsTitle}>Nilai Mata Pelajaran:</Text>
        {subjects.map((subject, index) => (
          <View key={index} style={styles.subjectItem}>
            <View style={styles.subjectInfo}>
              <Text style={styles.subjectName}>{subject.mata_pelajaran}</Text>
              <Text style={styles.subjectKkm}>KKM: {subject.kkm}</Text>
            </View>
            <View style={styles.subjectGrades}>
              <Text style={[
                styles.subjectScore,
                { color: getGradeColor(subject.nilai_akhir) }
              ]}>
                {subject.nilai_akhir}
              </Text>
              <Text style={styles.subjectLetter}>({subject.nilai_huruf})</Text>
              <View style={[
                styles.statusIndicator,
                { 
                  backgroundColor: subject.is_passed ? '#4caf50' : '#f44336'
                }
              ]}>
                <Text style={styles.statusText}>
                  {subject.keterangan}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRaportItem = (raport) => {
    const isExpanded = expandedRaport.includes(raport.id_raport);
    
    return (
      <View key={raport.id_raport} style={styles.raportCard}>
        <TouchableOpacity
          style={styles.raportHeader}
          onPress={() => toggleRaportExpanded(raport.id_raport)}
        >
          <View style={styles.raportInfo}>
            <View style={styles.raportTitleRow}>
              <Text style={styles.raportSemester}>
                {raport.semester.nama_semester} {raport.semester.tahun_ajaran}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(raport.status) }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {getStatusText(raport.status)}
                </Text>
              </View>
            </View>
            
            <View style={styles.raportStats}>
              <View style={styles.statGroup}>
                <Text style={styles.statLabel}>Mata Pelajaran:</Text>
                <Text style={styles.statValue}>{raport.subjects.length}</Text>
              </View>
              <View style={styles.statGroup}>
                <Text style={styles.statLabel}>Rata-rata:</Text>
                <Text style={[
                  styles.statValue,
                  { color: getGradeColor(raport.average_grade) }
                ]}>
                  {raport.average_grade?.toFixed(1) || '-'}
                </Text>
              </View>
              {raport.ranking && (
                <View style={styles.statGroup}>
                  <Text style={styles.statLabel}>Ranking:</Text>
                  <Text style={styles.statValue}>#{raport.ranking}</Text>
                </View>
              )}
            </View>

            {raport.persentase_kehadiran !== null && (
              <View style={styles.attendanceInfo}>
                <Ionicons name="calendar" size={14} color="#666" />
                <Text style={styles.attendanceText}>
                  Kehadiran: {raport.persentase_kehadiran}% 
                  ({raport.total_kehadiran} hari)
                </Text>
              </View>
            )}
          </View>

          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.raportDetails}>
            <View style={styles.divider} />
            
            {raport.tanggal_terbit && (
              <View style={styles.publishInfo}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.publishText}>
                  Tanggal Terbit: {raport.tanggal_terbit}
                </Text>
              </View>
            )}

            {raport.catatan_wali_kelas && (
              <View style={styles.notesSection}>
                <Text style={styles.notesTitle}>Catatan Wali Kelas:</Text>
                <Text style={styles.notesText}>{raport.catatan_wali_kelas}</Text>
              </View>
            )}

            {raport.subjects && raport.subjects.length > 0 && 
              renderSubjectGrades(raport.subjects)
            }
          </View>
        )}
      </View>
    );
  };

  if (loading && !childDetail.child) {
    return (
      <LoadingSpinner 
        fullScreen 
        message="Memuat detail raport..." 
      />
    );
  }

  if (error && !childDetail.child) {
    return (
      <View style={styles.container}>
        <ErrorMessage
          message={error}
          onRetry={loadChildDetail}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#9b59b6']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderChildInfo()}

        <View style={styles.raportSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Riwayat Raport ({childDetail.raport_records?.length || 0})
            </Text>
            
            {filters && Object.keys(filters).length > 0 && (
              <TouchableOpacity
                style={styles.filterIndicator}
                onPress={() => {
                  Alert.alert(
                    'Filter Aktif',
                    `Filter: ${Object.entries(filters)
                      .filter(([_, value]) => value)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(', ')}`
                  );
                }}
              >
                <Ionicons name="filter" size={16} color="#9b59b6" />
                <Text style={styles.filterText}>Filter Aktif</Text>
              </TouchableOpacity>
            )}
          </View>

          {childDetail.raport_records && childDetail.raport_records.length > 0 ? (
            childDetail.raport_records.map(renderRaportItem)
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="Tidak Ada Raport"
              message="Belum ada data raport untuk anak ini dengan filter yang dipilih"
              onRetry={handleRefresh}
            />
          )}
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner message="Memuat data..." />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollView: {
    flex: 1
  },
  childInfoCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  childPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: '#f0f0f0'
  },
  childDetails: {
    flex: 1
  },
  childName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  childNickname: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8
  },
  childStats: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4
  },
  raportSection: {
    flex: 1,
    paddingHorizontal: 16
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  filterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9b59b6'
  },
  filterText: {
    fontSize: 12,
    color: '#9b59b6',
    fontWeight: '500',
    marginLeft: 4
  },
  raportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  raportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  raportInfo: {
    flex: 1
  },
  raportTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  raportSemester: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  statusBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600'
  },
  raportStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333'
  },
  attendanceInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  attendanceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  raportDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 12
  },
  publishInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  publishText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8
  },
  notesSection: {
    marginBottom: 16
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8
  },
  subjectsContainer: {
    marginTop: 8
  },
  subjectsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8
  },
  subjectInfo: {
    flex: 1
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2
  },
  subjectKkm: {
    fontSize: 11,
    color: '#666'
  },
  subjectGrades: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  subjectScore: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4
  },
  subjectLetter: {
    fontSize: 12,
    color: '#666',
    marginRight: 8
  },
  statusIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default RaportChildDetailScreen;