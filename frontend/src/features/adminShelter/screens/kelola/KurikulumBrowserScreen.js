import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ScrollView,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import Button from '../../../../common/components/Button';

// Import Redux
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchAllMateri,
  selectMateriCache,
  selectMateriCacheLoading,
  selectMateriCacheError
} from '../../redux/aktivitasSlice';

import { useAuth } from '../../../../common/hooks/useAuth';

const { width } = Dimensions.get('window');

const KurikulumBrowserScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { profile } = useAuth();
  
  // Redux selectors  
  const materiList = useSelector(selectMateriCache);
  const loading = useSelector(selectMateriCacheLoading);
  const error = useSelector(selectMateriCacheError);
  
  // Local UI state
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Local search state (for immediate UI feedback)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedKelasGabungan, setSelectedKelasGabungan] = useState([]);
  
  // Static data for now - will be fetched from API later
  const [availableJenjang] = useState([
    { id: 'PAUD', nama: 'PAUD', color: '#9b59b6' },
    { id: 'TK', nama: 'TK', color: '#8e44ad' },
    { id: 'SD', nama: 'SD', color: '#3498db' },
    { id: 'SMP', nama: 'SMP', color: '#f39c12' },
    { id: 'SMA', nama: 'SMA', color: '#e74c3c' }
  ]);
  
  const [availableSemester] = useState([
    { id: '2024/2025-1', nama: '2024/2025 Semester 1' },
    { id: '2024/2025-2', nama: '2024/2025 Semester 2' },
    { id: '2023/2024-2', nama: '2023/2024 Semester 2' }
  ]);

  // Fetch materi data using simplified Redux actions
  const fetchMateriData = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      }
      
      // Simplified: just get all materi, frontend handles filtering
      await dispatch(fetchAllMateri()).unwrap();
      
    } catch (err) {
      console.error('Error fetching materi:', err);
      // Error is handled by Redux state automatically
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMateriData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    fetchMateriData(true);
  };

  // Handle search - simplified (no backend search)
  const handleSearch = () => {
    // Frontend filtering will be handled by search query state
    console.log('Search query:', searchQuery);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Get jenjang color
  const getJenjangColor = (jenjangId) => {
    const jenjang = availableJenjang.find(j => j.id === jenjangId);
    return jenjang?.color || '#95a5a6';
  };


  // Handle view materi detail (using proper backend fields)
  const handleViewMateri = (materi) => {
    const mataPelajaranName = (materi.mataPelajaran?.nama_mata_pelajaran || materi.mata_pelajaran?.nama_mata_pelajaran || 'Tidak diketahui').toString();
    const kelasName = (materi.kelas?.nama_kelas || 'Tidak diketahui').toString();
    const jenjangName = (materi.kelas?.jenjang?.nama_jenjang || 'Tidak diketahui').toString();
    const materiName = (materi.nama_materi || 'Tidak diketahui').toString();
    const deskripsi = (materi.deskripsi || 'Materi pembelajaran dari cabang').toString();
    const fileName = (materi.file_name || '').toString();
    
    Alert.alert(
      'Detail Materi',
      `${materiName}\n\n` +
      `Mata Pelajaran: ${mataPelajaranName}\n` +
      `Kelas: ${kelasName}\n` +
      `Jenjang: ${jenjangName}\n\n` +
      `${deskripsi}` +
      `${fileName ? `\n\nFile: ${fileName}` : ''}`,
      [
        { text: 'Tutup', style: 'cancel' },
        {
          text: 'Gunakan',
          onPress: () => {
            Alert.alert('Info', 'Fitur penggunaan materi untuk aktivitas tersedia di form Aktivitas');
          }
        }
      ]
    );
  };

  // Render jenjang filter tabs
  const renderJenjangFilters = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedJenjang === '' && styles.filterButtonActive
          ]}
          onPress={() => setSelectedJenjang('')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedJenjang === '' && styles.filterButtonTextActive
          ]}>
            Semua Jenjang
          </Text>
        </TouchableOpacity>
        
        {availableJenjang.map((jenjang) => (
          <TouchableOpacity
            key={jenjang.id}
            style={[
              styles.filterButton,
              selectedJenjang === jenjang.id && styles.filterButtonActive,
              { borderColor: jenjang.color }
            ]}
            onPress={() => setSelectedJenjang(selectedJenjang === jenjang.id ? '' : jenjang.id)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedJenjang === jenjang.id && styles.filterButtonTextActive
            ]}>
              {jenjang.nama}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Show loading for initial data fetch
  if (loading && !refreshing) {
    return <LoadingSpinner fullScreen message="Memuat kurikulum..." />;
  }

  return (
    <View style={styles.container}>
      {/* Error Message */}
      {error && (
        <ErrorMessage
          message={error}
          onRetry={handleRefresh}
          retryText="Coba Lagi"
        />
      )}
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kurikulum..."
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
        
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options" size={20} color="#9b59b6" />
          {(selectedKelasGabungan.length > 0 || selectedSemester) && (
            <View style={styles.filterActiveDot} />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Jenjang Filters */}
      {renderJenjangFilters()}
      
      {/* Results Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {materiList.length} materi ditemukan
        </Text>
      </View>
      
      {/* Materi List (Simplified) */}
      {materiList.length > 0 ? (
        <FlatList
          data={materiList}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.kurikulumItem}
              onPress={() => handleViewMateri(item)}
            >
              <Text style={styles.kurikulumName}>
                {(item.nama_materi || 'Materi Tidak Diketahui').toString()}
              </Text>
              <Text style={styles.description}>
                {(item.deskripsi || 'Materi dari cabang').toString()}
              </Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Ionicons name="book" size={16} color="#3498db" />
                  <Text style={styles.statText}>
                    {(item.mataPelajaran?.nama_mata_pelajaran || item.mata_pelajaran?.nama_mata_pelajaran || 'Tidak diketahui').toString()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="school" size={16} color="#9b59b6" />
                  <Text style={styles.statText}>
                    {`${(item.kelas?.jenjang?.nama_jenjang || '').toString()} ${(item.kelas?.nama_kelas || '').toString()}`.trim() || 'Tidak diketahui'}
                  </Text>
                </View>
                {item.file_name && (
                  <View style={styles.statItem}>
                    <Ionicons name="document" size={16} color="#e67e22" />
                    <Text style={styles.statText}>File</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id_materi?.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="library-outline" size={60} color="#cccccc" />
          <Text style={styles.emptyText}>
            {loading ? 'Memuat materi...' : 'Belum ada materi tersedia'}
          </Text>
        </View>
      )}

      {/* Advanced Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Kurikulum</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Semester Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Semester</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[
                      styles.semesterButton,
                      selectedSemester === '' && styles.semesterButtonActive
                    ]}
                    onPress={() => setSelectedSemester('')}
                  >
                    <Text style={[
                      styles.semesterButtonText,
                      selectedSemester === '' && styles.semesterButtonTextActive
                    ]}>
                      Semua Semester
                    </Text>
                  </TouchableOpacity>
                  
                  {availableSemester.map((semester) => (
                    <TouchableOpacity
                      key={semester.id}
                      style={[
                        styles.semesterButton,
                        selectedSemester === semester.id && styles.semesterButtonActive
                      ]}
                      onPress={() => setSelectedSemester(selectedSemester === semester.id ? '' : semester.id)}
                    >
                      <Text style={[
                        styles.semesterButtonText,
                        selectedSemester === semester.id && styles.semesterButtonTextActive
                      ]}>
                        {semester.nama}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Kelas Gabungan Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Filter berdasarkan Kelas Kelompok</Text>
                <Text style={styles.filterDescription}>
                  Tampilkan kurikulum yang kompatibel dengan kelas-kelas tertentu
                </Text>
                
                {/* Quick selection from existing kelompok would go here */}
                <View style={styles.kelasSelectionContainer}>
                  <Text style={styles.selectedKelasTitle}>
                    Kelas Terpilih ({selectedKelasGabungan.length})
                  </Text>
                  {selectedKelasGabungan.length > 0 ? (
                    <View style={styles.selectedKelasChips}>
                      {selectedKelasGabungan.map((item, index) => (
                        <View
                          key={`${item.jenjang}-${item.kelas}`}
                          style={[
                            styles.selectedKelasChip,
                            { backgroundColor: getJenjangColor(item.jenjang) }
                          ]}
                        >
                          <Text style={styles.selectedKelasChipText}>
                            {item.jenjang} {item.kelas}
                          </Text>
                          <TouchableOpacity
                            onPress={() => setSelectedKelasGabungan(prev => 
                              prev.filter(k => !(k.jenjang === item.jenjang && k.kelas === item.kelas))
                            )}
                          >
                            <Ionicons name="close" size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.noKelasSelected}>
                      Belum ada kelas yang dipilih
                    </Text>
                  )}
                  
                  <Button
                    title="Pilih Kelas"
                    onPress={() => {
                      Alert.alert('Info', 'Fitur pemilihan kelas akan segera tersedia');
                    }}
                    type="outline"
                    size="small"
                    style={styles.selectKelasButton}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Reset Filter"
                onPress={() => {
                  setSelectedSemester('');
                  setSelectedKelasGabungan([]);
                }}
                type="outline"
                style={styles.resetButton}
              />
              <Button
                title="Terapkan Filter"
                onPress={() => setFilterModalVisible(false)}
                type="primary"
                style={styles.applyFilterButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Search Container
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
    marginRight: 12,
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
  filterToggleButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
  },

  // Filter Container
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

  // Summary Container
  summaryContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  kelasFilterSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: '#f8f9fa',
    padding: 6,
    borderRadius: 6,
  },
  kelasFilterText: {
    fontSize: 12,
    color: '#495057',
    flex: 1,
  },

  // List Container
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // Kurikulum Item
  kurikulumItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kurikulumContent: {
    padding: 16,
  },
  kurikulumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  kurikulumName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  semesterText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },

  // Kelas Section
  kelasSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#7f8c8d',
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
  noKelasText: {
    fontSize: 12,
    color: '#bdc3c7',
    fontStyle: 'italic',
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },

  // Compatibility Indicator
  compatibilityIndicator: {
    marginBottom: 12,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 6,
  },
  previewButtonText: {
    fontSize: 13,
    color: '#3498db',
    marginLeft: 4,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#9b59b6',
    borderRadius: 6,
  },
  applyButtonText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Source Info
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 6,
  },
  sourceText: {
    fontSize: 12,
    color: '#95a5a6',
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#95a5a6',
  },

  // Empty Container
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

  // Footer Loader
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },

  // Filter Sections
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  filterDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 12,
    lineHeight: 20,
  },

  // Semester Buttons
  semesterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#9b59b6',
    minWidth: 120,
    alignItems: 'center',
  },
  semesterButtonActive: {
    backgroundColor: '#9b59b6',
  },
  semesterButtonText: {
    fontSize: 13,
    color: '#9b59b6',
  },
  semesterButtonTextActive: {
    color: '#ffffff',
  },

  // Kelas Selection
  kelasSelectionContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  selectedKelasTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  selectedKelasChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  selectedKelasChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  selectedKelasChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  noKelasSelected: {
    fontSize: 13,
    color: '#6c757d',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  selectKelasButton: {
    alignSelf: 'flex-start',
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
  },
  applyFilterButton: {
    flex: 2,
    backgroundColor: '#9b59b6',
  },
});

export default KurikulumBrowserScreen;