import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { 
  fetchKelas,
  navigateToKelas,
  selectKelasList,
  selectHierarchyLoading,
  selectHierarchyError,
  selectCurrentPath
} from '../../redux/templateHierarchySlice';

const KelasSelectionScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  
  // Route params
  const { jenjang, jenjangId, jenjangName } = route.params;
  
  // Redux state
  const kelasList = useSelector(state => selectKelasList(state, jenjangId));
  const loading = useSelector(selectHierarchyLoading);
  const error = useSelector(selectHierarchyError);
  const currentPath = useSelector(selectCurrentPath);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, standard, custom

  // Load data saat component mount
  useEffect(() => {
    if (!kelasList.length) {
      dispatch(fetchKelas(jenjangId));
    }
  }, [dispatch, jenjangId, kelasList.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchKelas(jenjangId));
    setRefreshing(false);
  };

  const handleKelasSelect = (kelas) => {
    // Update current path di Redux
    dispatch(navigateToKelas({ 
      jenjangId: jenjangId, 
      kelasId: kelas.id_kelas 
    }));
    
    // Navigate ke MataPelajaranList dengan kelas data
    navigation.navigate('MataPelajaranList', {
      jenjang: jenjang,
      jenjangId: jenjangId,
      jenjangName: jenjangName,
      kelas: kelas,
      kelasId: kelas.id_kelas,
      kelasName: kelas.nama_kelas
    });
  };

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  // Filter kelas berdasarkan type
  const filteredKelas = kelasList.filter(kelas => {
    if (filterType === 'standard') return kelas.jenis_kelas === 'standard';
    if (filterType === 'custom') return kelas.jenis_kelas === 'custom';
    return true; // all
  });

  // Stats untuk filter
  const statsData = {
    total: kelasList.length,
    standard: kelasList.filter(k => k.jenis_kelas === 'standard').length,
    custom: kelasList.filter(k => k.jenis_kelas === 'custom').length,
    totalTemplates: kelasList.reduce((sum, k) => sum + (k.template_count || 0), 0)
  };

  if (loading.kelas && !kelasList.length) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header dengan breadcrumb */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleNavigateBack}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pilih Kelas</Text>
          <Text style={styles.headerSubtitle}>
            {jenjangName} - Pilih kelas untuk melihat mata pelajaran
          </Text>
        </View>
      </View>

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity 
          style={styles.breadcrumbItem}
          onPress={() => navigation.navigate('TemplateHome')}
        >
          <Ionicons name="home" size={16} color="#3498db" />
          <Text style={styles.breadcrumbText}>Template</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#6c757d" />
        <TouchableOpacity 
          style={styles.breadcrumbItem}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.breadcrumbText}>{jenjangName}</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#6c757d" />
        <Text style={styles.breadcrumbTextActive}>Kelas</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#e74c3c']}
          />
        }
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <Text style={styles.statsValue}>{statsData.total}</Text>
              <Text style={styles.statsLabel}>Total Kelas</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={[styles.statsValue, { color: '#3498db' }]}>
                {statsData.totalTemplates}
              </Text>
              <Text style={styles.statsLabel}>Template</Text>
            </View>
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'all' && styles.filterButtonTextActive
            ]}>
              Semua ({statsData.total})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'standard' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('standard')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'standard' && styles.filterButtonTextActive
            ]}>
              Standard ({statsData.standard})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === 'custom' && styles.filterButtonActive
            ]}
            onPress={() => setFilterType('custom')}
          >
            <Text style={[
              styles.filterButtonText,
              filterType === 'custom' && styles.filterButtonTextActive
            ]}>
              Kustom ({statsData.custom})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Kelas List */}
        <View style={styles.kelasContainer}>
          {filteredKelas.map((kelas, index) => (
            <KelasCard
              key={kelas.id_kelas}
              kelas={kelas}
              index={index}
              onPress={() => handleKelasSelect(kelas)}
              isSelected={currentPath.kelas === kelas.id_kelas}
              jenjangName={jenjangName}
            />
          ))}
        </View>

        {/* Empty State */}
        {filteredKelas.length === 0 && !loading.kelas && (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyStateTitle}>
              {filterType === 'all' ? 'Belum Ada Kelas' : `Belum Ada Kelas ${filterType}`}
            </Text>
            <Text style={styles.emptyStateText}>
              {filterType === 'all' 
                ? 'Belum ada data kelas yang tersedia untuk jenjang ini'
                : `Belum ada kelas ${filterType} yang tersedia`
              }
            </Text>
          </View>
        )}

        {/* Error handling */}
        {error.kelas && (
          <ErrorMessage 
            message={error.kelas}
            onRetry={() => dispatch(fetchKelas(jenjangId))}
          />
        )}
      </ScrollView>
    </View>
  );
};

// Kelas Card Component
const KelasCard = ({ kelas, index, onPress, isSelected, jenjangName }) => {
  // Colors untuk different tingkat
  const getColorForTingkat = (tingkat) => {
    const colors = ['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c'];
    return colors[tingkat % colors.length];
  };
  
  const cardColor = kelas.tingkat ? getColorForTingkat(kelas.tingkat) : '#6c757d';
  
  // Calculate stats
  const templateCount = kelas.template_count || 0;
  const activeTemplateCount = kelas.active_template_count || 0;
  const mataPelajaranCount = kelas.mata_pelajaran_count || 0;

  // Determine kelas type
  const isCustom = kelas.jenis_kelas === 'custom';
  const isGlobal = kelas.is_global;

  return (
    <TouchableOpacity 
      style={[
        styles.kelasCard,
        isSelected && styles.kelasCardSelected
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.kelasCardContent}>
        {/* Header */}
        <View style={styles.kelasCardHeader}>
          <View style={[styles.kelasIcon, { backgroundColor: cardColor }]}>
            <Text style={styles.kelasIconText}>
              {kelas.tingkat || kelas.nama_kelas.charAt(0)}
            </Text>
          </View>
          
          <View style={styles.kelasInfo}>
            <View style={styles.kelasNameRow}>
              <Text style={styles.kelasName}>{kelas.nama_kelas}</Text>
              {isCustom && (
                <View style={styles.customBadge}>
                  <Text style={styles.customBadgeText}>Kustom</Text>
                </View>
              )}
              {isGlobal && (
                <View style={styles.globalBadge}>
                  <Text style={styles.globalBadgeText}>Global</Text>
                </View>
              )}
            </View>
            <Text style={styles.kelasDescription}>
              {kelas.deskripsi || `${jenjangName} - ${kelas.nama_kelas}`}
            </Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </View>

        {/* Stats */}
        <View style={styles.kelasStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{templateCount}</Text>
            <Text style={styles.statLabel}>Template</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: cardColor }]}>
              {activeTemplateCount}
            </Text>
            <Text style={styles.statLabel}>Aktif</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{mataPelajaranCount}</Text>
            <Text style={styles.statLabel}>Mapel</Text>
          </View>
        </View>

        {/* Progress untuk template aktif */}
        {templateCount > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(activeTemplateCount / templateCount) * 100}%`,
                    backgroundColor: cardColor 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((activeTemplateCount / templateCount) * 100)}% template aktif
            </Text>
          </View>
        )}

        {/* Additional Info */}
        {kelas.urutan && (
          <View style={styles.additionalInfo}>
            <Text style={styles.additionalInfoText}>
              Urutan: {kelas.urutan}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    numberOfLines: 1,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 4,
  },
  breadcrumbTextActive: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsCard: {
    flex: 0.48,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  kelasContainer: {
    padding: 16,
    paddingTop: 8,
  },
  kelasCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  kelasCardSelected: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  kelasCardContent: {
    padding: 16,
  },
  kelasCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  kelasIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  kelasIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  kelasInfo: {
    flex: 1,
  },
  kelasNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  kelasName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginRight: 8,
  },
  customBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  customBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  globalBadge: {
    backgroundColor: '#27ae60',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  globalBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  kelasDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  kelasStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e9ecef',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    minWidth: 80,
  },
  additionalInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  additionalInfoText: {
    fontSize: 12,
    color: '#6c757d',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default KelasSelectionScreen;