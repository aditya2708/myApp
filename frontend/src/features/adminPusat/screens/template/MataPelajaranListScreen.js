import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import { 
  fetchMataPelajaran,
  navigateToMataPelajaran,
  selectMataPelajaranList,
  selectHierarchyLoading,
  selectHierarchyError,
  selectCurrentPath
} from '../../redux/templateHierarchySlice';

const MataPelajaranListScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  
  // Route params
  const { 
    jenjang, jenjangId, jenjangName,
    kelas, kelasId, kelasName 
  } = route.params;
  
  // Redux state
  const mataPelajaranList = useSelector(state => selectMataPelajaranList(state, kelasId));
  const loading = useSelector(selectHierarchyLoading);
  const error = useSelector(selectHierarchyError);
  const currentPath = useSelector(selectCurrentPath);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name, template_count, adoption_rate
  const [filterKategori, setFilterKategori] = useState('all'); // all, wajib, pilihan

  // Load data saat component mount
  useEffect(() => {
    if (!mataPelajaranList.length) {
      dispatch(fetchMataPelajaran({ kelasId, jenjangId }));
    }
  }, [dispatch, kelasId, jenjangId, mataPelajaranList.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMataPelajaran({ kelasId, jenjangId }));
    setRefreshing(false);
  };

  const handleMataPelajaranSelect = (mataPelajaran) => {
    // Update current path di Redux
    dispatch(navigateToMataPelajaran({ 
      jenjangId: jenjangId, 
      kelasId: kelasId,
      mataPelajaranId: mataPelajaran.id_mata_pelajaran 
    }));
    
    // Navigate ke TemplateMateriManagement
    navigation.navigate('TemplateMateriManagement', {
      jenjang,
      jenjangId,
      jenjangName,
      kelas,
      kelasId,
      kelasName,
      mataPelajaran,
      mataPelajaranId: mataPelajaran.id_mata_pelajaran,
      mataPelajaranName: mataPelajaran.nama_mata_pelajaran
    });
  };

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  // Filter dan sort mata pelajaran
  const processedMataPelajaran = mataPelajaranList
    .filter(mapel => {
      // Filter by search query
      const matchesSearch = mapel.nama_mata_pelajaran
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      // Filter by kategori
      const matchesKategori = filterKategori === 'all' || 
        mapel.kategori === filterKategori;
      
      return matchesSearch && matchesKategori;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'template_count':
          return (b.template_count || 0) - (a.template_count || 0);
        case 'adoption_rate':
          return (b.adoption_rate || 0) - (a.adoption_rate || 0);
        case 'name':
        default:
          return a.nama_mata_pelajaran.localeCompare(b.nama_mata_pelajaran);
      }
    });

  // Stats untuk overview
  const statsData = {
    total: mataPelajaranList.length,
    wajib: mataPelajaranList.filter(m => m.kategori === 'wajib').length,
    pilihan: mataPelajaranList.filter(m => m.kategori === 'pilihan').length,
    totalTemplates: mataPelajaranList.reduce((sum, m) => sum + (m.template_count || 0), 0),
    avgAdoptionRate: mataPelajaranList.length > 0 
      ? Math.round(mataPelajaranList.reduce((sum, m) => sum + (m.adoption_rate || 0), 0) / mataPelajaranList.length)
      : 0
  };

  if (loading.mataPelajaran && !mataPelajaranList.length) {
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
          <Text style={styles.headerTitle}>Mata Pelajaran</Text>
          <Text style={styles.headerSubtitle}>
            {jenjangName} - {kelasName}
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
          onPress={() => navigation.navigate('JenjangSelection')}
        >
          <Text style={styles.breadcrumbText}>{jenjangName}</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#6c757d" />
        <TouchableOpacity 
          style={styles.breadcrumbItem}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.breadcrumbText}>{kelasName}</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#6c757d" />
        <Text style={styles.breadcrumbTextActive}>Mata Pelajaran</Text>
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
              <Text style={styles.statsLabel}>Total Mapel</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={[styles.statsValue, { color: '#3498db' }]}>
                {statsData.totalTemplates}
              </Text>
              <Text style={styles.statsLabel}>Template</Text>
            </View>
            <View style={styles.statsCard}>
              <Text style={[styles.statsValue, { color: '#27ae60' }]}>
                {statsData.avgAdoptionRate}%
              </Text>
              <Text style={styles.statsLabel}>Rata-rata Adopsi</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6c757d" />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari mata pelajaran..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6c757d" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter dan Sort */}
        <View style={styles.filterSortContainer}>
          {/* Filter Kategori */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterKategori === 'all' && styles.filterChipActive
              ]}
              onPress={() => setFilterKategori('all')}
            >
              <Text style={[
                styles.filterChipText,
                filterKategori === 'all' && styles.filterChipTextActive
              ]}>
                Semua ({statsData.total})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterKategori === 'wajib' && styles.filterChipActive
              ]}
              onPress={() => setFilterKategori('wajib')}
            >
              <Text style={[
                styles.filterChipText,
                filterKategori === 'wajib' && styles.filterChipTextActive
              ]}>
                Wajib ({statsData.wajib})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterKategori === 'pilihan' && styles.filterChipActive
              ]}
              onPress={() => setFilterKategori('pilihan')}
            >
              <Text style={[
                styles.filterChipText,
                filterKategori === 'pilihan' && styles.filterChipTextActive
              ]}>
                Pilihan ({statsData.pilihan})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Urutkan:</Text>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                Nama
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'template_count' && styles.sortButtonActive]}
              onPress={() => setSortBy('template_count')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'template_count' && styles.sortButtonTextActive]}>
                Template
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'adoption_rate' && styles.sortButtonActive]}
              onPress={() => setSortBy('adoption_rate')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'adoption_rate' && styles.sortButtonTextActive]}>
                Adopsi
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mata Pelajaran List */}
        <View style={styles.mataPelajaranContainer}>
          {processedMataPelajaran.map((mataPelajaran, index) => (
            <MataPelajaranCard
              key={mataPelajaran.id_mata_pelajaran}
              mataPelajaran={mataPelajaran}
              index={index}
              onPress={() => handleMataPelajaranSelect(mataPelajaran)}
              isSelected={currentPath.mataPelajaran === mataPelajaran.id_mata_pelajaran}
            />
          ))}
        </View>

        {/* Empty State */}
        {processedMataPelajaran.length === 0 && !loading.mataPelajaran && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery || filterKategori !== 'all' 
                ? 'Tidak Ada Hasil'
                : 'Belum Ada Mata Pelajaran'
              }
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery 
                ? `Tidak ditemukan mata pelajaran dengan kata kunci "${searchQuery}"`
                : filterKategori !== 'all'
                ? `Tidak ada mata pelajaran ${filterKategori} yang tersedia`
                : 'Belum ada data mata pelajaran untuk kelas ini'
              }
            </Text>
          </View>
        )}

        {/* Error handling */}
        {error.mataPelajaran && (
          <ErrorMessage 
            message={error.mataPelajaran}
            onRetry={() => dispatch(fetchMataPelajaran({ kelasId, jenjangId }))}
          />
        )}
      </ScrollView>
    </View>
  );
};

// Mata Pelajaran Card Component
const MataPelajaranCard = ({ mataPelajaran, index, onPress, isSelected }) => {
  // Colors untuk different kategori
  const getColorForKategori = (kategori) => {
    switch (kategori) {
      case 'wajib': return '#e74c3c';
      case 'pilihan': return '#3498db';
      default: return '#6c757d';
    }
  };
  
  const cardColor = getColorForKategori(mataPelajaran.kategori);
  
  // Calculate stats
  const templateCount = mataPelajaran.template_count || 0;
  const activeTemplateCount = mataPelajaran.active_template_count || 0;
  const adoptionRate = mataPelajaran.adoption_rate || 0;
  const distributionCount = mataPelajaran.distribution_count || 0;

  return (
    <TouchableOpacity 
      style={[
        styles.mataPelajaranCard,
        isSelected && styles.mataPelajaranCardSelected
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.mataPelajaranCardContent}>
        {/* Header */}
        <View style={styles.mataPelajaranCardHeader}>
          <View style={[styles.mataPelajaranIcon, { backgroundColor: cardColor }]}>
            <Ionicons name="book" size={24} color="white" />
          </View>
          
          <View style={styles.mataPelajaranInfo}>
            <View style={styles.mataPelajaranNameRow}>
              <Text style={styles.mataPelajaranName}>
                {mataPelajaran.nama_mata_pelajaran}
              </Text>
              <View style={[styles.kategoriBadge, { backgroundColor: cardColor }]}>
                <Text style={styles.kategoriBadgeText}>
                  {mataPelajaran.kategori || 'Umum'}
                </Text>
              </View>
            </View>
            {mataPelajaran.kode_mata_pelajaran && (
              <Text style={styles.mataPelajaranKode}>
                Kode: {mataPelajaran.kode_mata_pelajaran}
              </Text>
            )}
            {mataPelajaran.deskripsi && (
              <Text style={styles.mataPelajaranDescription}>
                {mataPelajaran.deskripsi}
              </Text>
            )}
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#bdc3c7" />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statGridItem}>
            <Text style={styles.statGridValue}>{templateCount}</Text>
            <Text style={styles.statGridLabel}>Template</Text>
          </View>
          <View style={styles.statGridItem}>
            <Text style={[styles.statGridValue, { color: cardColor }]}>
              {activeTemplateCount}
            </Text>
            <Text style={styles.statGridLabel}>Aktif</Text>
          </View>
          <View style={styles.statGridItem}>
            <Text style={styles.statGridValue}>{distributionCount}</Text>
            <Text style={styles.statGridLabel}>Distribusi</Text>
          </View>
          <View style={styles.statGridItem}>
            <Text style={[styles.statGridValue, { color: '#27ae60' }]}>
              {adoptionRate}%
            </Text>
            <Text style={styles.statGridLabel}>Adopsi</Text>
          </View>
        </View>

        {/* Adoption Progress */}
        {distributionCount > 0 && (
          <View style={styles.adoptionProgress}>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${adoptionRate}%`,
                      backgroundColor: '#27ae60'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                Tingkat adopsi {adoptionRate}%
              </Text>
            </View>
          </View>
        )}

        {/* Global badge jika mata pelajaran global */}
        {mataPelajaran.is_global && (
          <View style={styles.globalBadge}>
            <Text style={styles.globalBadgeText}>Global</Text>
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
    flex: 0.31,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#2c3e50',
  },
  filterSortContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  filterChipActive: {
    backgroundColor: '#3498db',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sortButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
  },
  mataPelajaranContainer: {
    padding: 16,
    paddingTop: 8,
  },
  mataPelajaranCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mataPelajaranCardSelected: {
    borderWidth: 2,
    borderColor: '#3498db',
  },
  mataPelajaranCardContent: {
    padding: 16,
  },
  mataPelajaranCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  mataPelajaranIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mataPelajaranInfo: {
    flex: 1,
  },
  mataPelajaranNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mataPelajaranName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  kategoriBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  kategoriBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  mataPelajaranKode: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  mataPelajaranDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statGridItem: {
    alignItems: 'center',
    flex: 1,
  },
  statGridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  statGridLabel: {
    fontSize: 11,
    color: '#6c757d',
  },
  adoptionProgress: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8f9fa',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    minWidth: 100,
  },
  globalBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#27ae60',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  globalBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
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

export default MataPelajaranListScreen;