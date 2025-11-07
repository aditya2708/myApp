import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

// Import components
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import Button from '../../../common/components/Button';

// Import API
import { adminShelterKelompokApi } from '../api/adminShelterKelompokApi';

const ITEMS_PER_PAGE = 10;

const KelompokManagementScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['adminShelterKelompokList', { search: appliedSearch, jenjang: selectedJenjang }],
    queryFn: async ({ pageParam = 1 }) => {
      const params = {
        page: pageParam,
        per_page: ITEMS_PER_PAGE,
        ...(appliedSearch ? { search: appliedSearch } : {}),
        ...(selectedJenjang ? { jenjang: selectedJenjang } : {}),
      };

      const response = await adminShelterKelompokApi.getAllKelompok(params);
      const payload = response?.data || {};

      if (!payload.success) {
        throw new Error(payload.message || 'Gagal memuat data kelompok');
      }

      return {
        data: payload.data || [],
        pagination: payload.pagination || {},
      };
    },
    getNextPageParam: (lastPage) => {
      const current =
        lastPage?.pagination?.current_page ??
        lastPage?.pagination?.currentPage ??
        1;
      const last =
        lastPage?.pagination?.last_page ??
        lastPage?.pagination?.lastPage ??
        1;

      return current < last ? current + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const {
    data: availableKelasData,
    isFetching: isFetchingAvailableKelas,
    refetch: refetchAvailableKelas,
  } = useQuery({
    queryKey: ['adminShelterAvailableKelas'],
    queryFn: async () => {
      const response = await adminShelterKelompokApi.getAvailableKelas();
      const payload = response?.data || {};

      if (!payload.success) {
        throw new Error(payload.message || 'Gagal memuat daftar kelas');
      }

      return payload.data?.kelas_list || [];
    },
  });

  const availableKelas = React.useMemo(
    () => availableKelasData || [],
    [availableKelasData]
  );

  const kelompokList = React.useMemo(
    () => (data?.pages || []).flatMap((page) => page?.data || []),
    [data]
  );

  const errorMessage = React.useMemo(() => {
    if (!error) {
      return null;
    }

    const apiMessage = error.response?.data?.message;
    return apiMessage || error.message || 'Gagal memuat kelompok. Silakan coba lagi.';
  }, [error]);

  const loading = isLoading && !data;
  const refreshing = (isRefetching || isFetchingAvailableKelas) && !!data;
  const loadingMore = isFetchingNextPage;

  const hasFocusedOnceRef = React.useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      if (hasFocusedOnceRef.current) {
        refetch();
        refetchAvailableKelas();
      } else {
        hasFocusedOnceRef.current = true;
      }
    }, [refetch, refetchAvailableKelas])
  );

  const handleRefresh = () => {
    refetch();
    refetchAvailableKelas();
  };

  const handleLoadMore = () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage();
  };

  const handleSearch = () => {
    setAppliedSearch(searchQuery.trim());
  };

  const clearSearch = () => {
    setSearchQuery('');
    setAppliedSearch('');
  };

  const handleJenjangFilter = (jenjangName) => {
    if (!jenjangName) {
      setSelectedJenjang('');
      return;
    }
    setSelectedJenjang((prev) => (prev === jenjangName ? '' : jenjangName));
  };

  const handleViewKelompok = (kelompokId) => {
    navigation.navigate('KelompokDetail', { id: kelompokId });
  };

  const handleAddKelompok = () => {
    navigation.navigate('KelompokForm');
  };

  const handleDeleteKelompok = (kelompok) => {
    Alert.alert(
      'Hapus Kelompok',
      `Apakah Anda yakin ingin menghapus ${kelompok.nama_kelompok}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminShelterKelompokApi.deleteKelompok(kelompok.id_kelompok);
              await Promise.all([
                refetch(),
                refetchAvailableKelas(),
              ]);
              Alert.alert('Berhasil', 'Kelompok berhasil dihapus');
            } catch (err) {
              console.error('Error deleting kelompok:', err);
              Alert.alert('Error', 'Gagal menghapus kelompok');
            }
          },
        },
      ]
    );
  };

  // Get jenjang color based on name
  const getJenjangColor = (jenjangName) => {
    const jenjangColors = {
      'PAUD': '#9b59b6',
      'TK': '#8e44ad', 
      'SD': '#3498db',
      'SMP': '#f39c12',
      'SMA': '#e74c3c'
    };
    return jenjangColors[jenjangName] || '#95a5a6';
  };

  // Get kelas details by ID
  const getKelasById = (kelasId) => {
    const result = availableKelas.find(k => k.id_kelas === kelasId);
    
    // DEBUG: Log pencarian kelas
    if (!result) {
      console.log('DEBUG getKelasById - Kelas tidak ditemukan:', {
        searchingFor: kelasId,
        searchingType: typeof kelasId,
        availableKelas_sample: availableKelas.slice(0, 3).map(k => ({
          id: k.id_kelas,
          id_type: typeof k.id_kelas,
          nama: k.nama_kelas
        }))
      });
    }
    
    return result;
  };

  // Get available jenjang from kelas data
  const getAvailableJenjang = () => {
    const jenjangSet = new Set();
    availableKelas.forEach(kelas => {
      if (kelas.jenjang?.nama_jenjang) {
        jenjangSet.add(kelas.jenjang.nama_jenjang);
      }
    });
    return Array.from(jenjangSet).sort();
  };

  // Render kelas gabungan chips (updated for array of kelas IDs)
  const renderKelasGabunganChips = (kelasGabunganIds) => {
    if (!kelasGabunganIds || kelasGabunganIds.length === 0) {
      return (
        <View style={styles.noKelasChip}>
          <Text style={styles.noKelasText}>Tidak ada kelas</Text>
        </View>
      );
    }

    // Convert kelas IDs to kelas objects
    const kelasDetails = kelasGabunganIds.map(kelasId => getKelasById(kelasId)).filter(Boolean);
    
    return (
      <View style={styles.kelasChipsContainer}>
        {kelasDetails.slice(0, 3).map((kelas, index) => (
          <View
            key={kelas.id_kelas}
            style={[
              styles.kelasChip,
              { backgroundColor: getJenjangColor(kelas.jenjang?.nama_jenjang) }
            ]}
          >
            <Text style={styles.kelasChipText}>
              {kelas.jenjang?.nama_jenjang} {kelas.nama_kelas}
            </Text>
          </View>
        ))}
        {kelasDetails.length > 3 && (
          <View style={styles.moreKelasChip}>
            <Text style={styles.moreKelasText}>
              +{kelasDetails.length - 3}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#9b59b6" />
        <Text style={styles.footerText}>Memuat data...</Text>
      </View>
    );
  };

  // Enhanced kelompok item with kelas gabungan display
  const renderKelompokItem = ({ item }) => {
    const kelompok = item;
    
    // DEBUG: Log data untuk melihat struktur actual
    console.log('DEBUG Kelompok Item:', {
      id: kelompok.id_kelompok,
      nama: kelompok.nama_kelompok,
      kelas_gabungan: kelompok.kelas_gabungan,
      kelas_gabungan_type: typeof kelompok.kelas_gabungan,
      availableKelas_count: availableKelas.length
    });
    
    const kelasGabunganIds = kelompok.kelas_gabungan || []; // Array of kelas IDs
    const kelasDetails = kelasGabunganIds.map(kelasId => getKelasById(kelasId)).filter(Boolean);
    
    // DEBUG: Log hasil mapping
    console.log('DEBUG Mapping Result:', {
      kelasGabunganIds,
      kelasDetails,
      availableKelas: availableKelas.slice(0, 2) // Sample data
    });
    
    // Generate jenjang summary from kelas details
    const jenjangSet = new Set(kelasDetails.map(k => k.jenjang?.nama_jenjang));
    const jenjangSummary = Array.from(jenjangSet);
    
    return (
      <TouchableOpacity 
        style={styles.kelompokItem}
        onPress={() => handleViewKelompok(kelompok.id_kelompok)}
      >
        <View style={styles.kelompokContent}>
          <View style={styles.kelompokHeader}>
            <Text style={styles.kelompokName}>{kelompok.nama_kelompok}</Text>
            <View style={styles.kelompokActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('KelompokForm', { kelompok })}
              >
                <Ionicons name="create-outline" size={18} color="#3498db" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteKelompok(kelompok)}
              >
                <Ionicons name="trash-outline" size={18} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Kelas Gabungan Display */}
          <View style={styles.kelasSection}>
            <Text style={styles.kelasSectionTitle}>Kelas Gabungan:</Text>
            {renderKelasGabunganChips(kelasGabunganIds)}
          </View>

          {/* Enhanced Meta Information */}
          <View style={styles.kelompokMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.metaText}>
                {kelompok.jumlah_anggota || 0} anak
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="school" size={16} color="#666" />
              <Text style={styles.metaText}>
                {kelasGabunganIds.length} kelas
              </Text>
            </View>
            
            {jenjangSummary.length > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="layers" size={16} color="#666" />
                <Text style={styles.metaText}>
                  {jenjangSummary.join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render jenjang filter tabs
  const renderJenjangFilters = () => {
    const availableJenjang = getAvailableJenjang();
    
    return (
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedJenjang === '' && styles.filterButtonActive
            ]}
            onPress={() => handleJenjangFilter('')}
          >
            <Text style={[
              styles.filterButtonText,
              selectedJenjang === '' && styles.filterButtonTextActive
            ]}>
              Semua
            </Text>
          </TouchableOpacity>
          
          {availableJenjang.map((jenjangName) => (
            <TouchableOpacity
              key={jenjangName}
              style={[
                styles.filterButton,
                selectedJenjang === jenjangName && styles.filterButtonActive,
                { borderColor: getJenjangColor(jenjangName) }
              ]}
              onPress={() => handleJenjangFilter(jenjangName)}
            >
              <Text style={[
                styles.filterButtonText,
                selectedJenjang === jenjangName && styles.filterButtonTextActive
              ]}>
                {jenjangName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render view mode toggle
  const renderViewModeToggle = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'grid' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('grid')}
      >
        <Ionicons 
          name="grid" 
          size={18} 
          color={viewMode === 'grid' ? '#fff' : '#666'} 
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'list' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('list')}
      >
        <Ionicons 
          name="list" 
          size={18} 
          color={viewMode === 'list' ? '#fff' : '#666'} 
        />
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat kelompok..." />;
  }

  return (
    <View style={styles.container}>
      {/* Error Message */}
      {errorMessage && (
        <ErrorMessage
          message={errorMessage}
          onRetry={handleRefresh}
          retryText="Coba Lagi"
        />
      )}
      
      {/* Search Bar with View Mode Toggle */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kelompok..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999999" />
            </TouchableOpacity>
          )}
        </View>
        
        {renderViewModeToggle()}
        
        <Button
          leftIcon={<Ionicons name="add" size={20} color="#ffffff" />}
          type="primary"
          onPress={handleAddKelompok}
          style={styles.addButton}
        />
      </View>
      
      {/* Jenjang Filters */}
      {renderJenjangFilters()}
      
      {/* Kelompok List */}
      {kelompokList.length > 0 ? (
        <FlatList
          data={kelompokList}
          renderItem={renderKelompokItem}
          keyExtractor={(item) => item.id_kelompok?.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          numColumns={viewMode === 'grid' ? 1 : 1} // Keep single column for now
        />
      ) : (
        <View style={styles.emptyContainer}>
          {searchQuery.trim() !== '' || selectedJenjang !== '' ? (
            <>
              <Ionicons name="search" size={60} color="#cccccc" />
              <Text style={styles.emptyText}>
                Tidak ada kelompok ditemukan dengan kriteria pencarian
              </Text>
              <Button 
                title="Bersihkan Filter" 
                onPress={() => {
                  setSearchQuery('');
                  setAppliedSearch('');
                  setSelectedJenjang('');
                }} 
                type="outline"
                style={styles.emptyButton}
              />
            </>
          ) : (
            <>
              <Ionicons name="people-circle" size={60} color="#cccccc" />
              <Text style={styles.emptyText}>Belum ada kelompok dibuat</Text>
              <Button 
                title="Buat Kelompok Pertama" 
                onPress={handleAddKelompok} 
                type="primary"
                style={styles.emptyButton}
              />
            </>
          )}
        </View>
      )}
      
      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={handleAddKelompok}
      >
        <Ionicons name="add" size={30} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333333',
  },
  clearButton: {
    padding: 4,
  },
  viewModeContainer: {
    flexDirection: 'row',
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#f2f2f2',
    padding: 2,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 4,
  },
  viewModeButtonActive: {
    backgroundColor: '#9b59b6',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#9b59b6',
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#9b59b6',
  },
  filterButtonActive: {
    backgroundColor: '#9b59b6',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#9b59b6',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  kelompokItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kelompokContent: {
    padding: 16,
  },
  kelompokHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kelompokName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  kelompokActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  },

  // Kelas Gabungan Section
  kelasSection: {
    marginBottom: 12,
  },
  kelasSectionTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  kelasChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  kelasChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  kelasChipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  moreKelasChip: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  moreKelasText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  noKelasChip: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  noKelasText: {
    fontSize: 11,
    color: '#7f8c8d',
  },

  // Enhanced Meta
  kelompokMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },


  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    minWidth: 180,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9b59b6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default KelompokManagementScreen;
