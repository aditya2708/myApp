import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { useNavigation } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import EmptyState from '../../../../common/components/EmptyState';
import TutorAttendanceCard from '../../components/TutorAttendanceCard';
import TutorFilterSection from '../../components/TutorFilterSection';
import { formatPercentage } from '../../utils/reportUtils';

import {
  selectTutors,
  selectTutorSummary,
  selectTutorPagination,
  selectTutorFilterOptions,
  selectTutorFilters,
  selectTutorExpandedCards,
  selectTutorLoading,
  selectTutorInitializingPage,
  selectTutorRefreshingAll,
  selectTutorError,
  selectTutorRefreshAllError,
  selectTutorHasActiveFilters,
  selectTutorPdfExportLoading,
  selectTutorPdfExportError,
  selectTutorPdfBlob,
  selectTutorPdfFilename,
  setSearch,
  resetFilters,
  toggleCardExpanded,
  clearAllErrors,
  clearPdfData
} from '../../redux/tutorLaporanSlice';

import {
  fetchLaporanTutor,
  initializeTutorLaporanPage,
  updateTutorFiltersAndRefreshAll,
  exportTutorPdf
} from '../../redux/tutorLaporanThunks';

const LaporanTutorScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Redux state
  const tutors = useSelector(selectTutors);
  const summary = useSelector(selectTutorSummary);
  const pagination = useSelector(selectTutorPagination);
  const filterOptions = useSelector(selectTutorFilterOptions);
  const filters = useSelector(selectTutorFilters);
  const expandedCards = useSelector(selectTutorExpandedCards);
  const loading = useSelector(selectTutorLoading);
  const initializingPage = useSelector(selectTutorInitializingPage);
  const refreshingAll = useSelector(selectTutorRefreshingAll);
  const error = useSelector(selectTutorError);
  const refreshAllError = useSelector(selectTutorRefreshAllError);
  const hasActiveFilters = useSelector(selectTutorHasActiveFilters);
  const pdfExportLoading = useSelector(selectTutorPdfExportLoading);
  const pdfExportError = useSelector(selectTutorPdfExportError);
  const pdfBlob = useSelector(selectTutorPdfBlob);
  const pdfFilename = useSelector(selectTutorPdfFilename);

  // Initialize page
  useEffect(() => {
    dispatch(clearAllErrors());
    initializePage();
  }, [dispatch]);

  // Handle PDF download when blob is available
  useEffect(() => {
    if (pdfBlob && pdfFilename) {
      handlePdfDownload();
    }
  }, [pdfBlob, pdfFilename]);

  const handlePdfDownload = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + pdfFilename;
      
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1];
        
        try {
          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });

          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Simpan atau Bagikan PDF'
            });
          } else {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status === 'granted') {
              await MediaLibrary.saveToLibraryAsync(fileUri);
              Alert.alert('Berhasil', 'PDF berhasil disimpan ke galeri');
            } else {
              Alert.alert('Info', `PDF tersimpan di: ${fileUri}`);
            }
          }
          
          dispatch(clearPdfData());
          
        } catch (error) {
          console.error('File operation error:', error);
          Alert.alert('Error', 'Gagal menyimpan file PDF');
        }
      };
      
      reader.readAsDataURL(pdfBlob);
      
    } catch (error) {
      console.error('Error unduh PDF:', error);
      Alert.alert('Error', 'Gagal mendownload PDF');
    }
  };

  const initializePage = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const defaultStartDate = `${currentYear}-01-01`;
      const defaultEndDate = `${currentYear}-12-31`;
      
      await dispatch(initializeTutorLaporanPage({
        start_date: defaultStartDate,
        end_date: defaultEndDate
      })).unwrap();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to initialize page:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(updateTutorFiltersAndRefreshAll({
        newFilters: { ...filters, search: searchText },
        page: 1
      })).unwrap();
      setCurrentPage(1);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFilterChange = async (newFilters) => {
    try {
      await dispatch(updateTutorFiltersAndRefreshAll({
        newFilters,
        page: 1
      })).unwrap();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to apply filters:', error);
    }
    setShowFilters(false);
  };

  const handleClearFilters = async () => {
    dispatch(resetFilters());
    setSearchText('');
    try {
      const currentYear = new Date().getFullYear();
      await dispatch(updateTutorFiltersAndRefreshAll({
        newFilters: { 
          start_date: `${currentYear}-01-01`,
          end_date: `${currentYear}-12-31`,
          jenisKegiatan: null,
          search: '' 
        },
        page: 1
      })).unwrap();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to clear filters:', error);
    }
    setShowFilters(false);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) return;
    
    try {
      await dispatch(updateTutorFiltersAndRefreshAll({
        newFilters: { ...filters, search: searchText.trim() },
        page: 1
      })).unwrap();
      setCurrentPage(1);
    } catch (error) {
      console.error('Failed to search:', error);
    }
  };

  const handleLoadMore = () => {
    if (pagination && 
        currentPage < pagination.last_page && 
        !loading && !refreshingAll) {
      loadMoreData();
    }
  };

  const loadMoreData = async () => {
    try {
      await dispatch(fetchLaporanTutor({
        start_date: filters.start_date,
        end_date: filters.end_date,
        jenisKegiatan: filters.jenisKegiatan,
        search: searchText,
        page: currentPage + 1,
        append: true
      })).unwrap();
      setCurrentPage(currentPage + 1);
    } catch (error) {
      console.error('Failed to load more data:', error);
    }
  };

  const handleTutorPress = (tutor) => {
    navigation.navigate('TutorDetail', {
      tutorId: tutor.id_tutor,
      filters: { ...filters, search: searchText },
    });
  };

  const handleCardToggle = (tutorId) => {
    dispatch(toggleCardExpanded(tutorId));
  };

  // Handle PDF export
  const handleExportPdf = async () => {
    if (!tutors.length) {
      Alert.alert('Peringatan', 'Tidak ada data untuk diexport');
      return;
    }

    try {
      await dispatch(exportTutorPdf({
        start_date: filters.start_date,
        end_date: filters.end_date,
        jenisKegiatan: filters.jenisKegiatan,
        search: searchText
      })).unwrap();
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Gagal export PDF: ' + error);
    }
  };

  const renderSummary = () => {
    if (!summary) return null;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Ringkasan</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.total_tutors}</Text>
              <Text style={styles.summaryLabel}>Total Tutor</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatPercentage(summary.average_attendance)}%</Text>
              <Text style={styles.summaryLabel}>Rata-rata</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{summary.total_activities}</Text>
              <Text style={styles.summaryLabel}>Aktivitas</Text>
            </View>
          </View>
        </View>
        {summary.date_range && (
          <View style={styles.dateRangeInfo}>
            <Text style={styles.dateRangeText}>
              Periode: {formatDate(summary.date_range.start_date)} - {formatDate(summary.date_range.end_date)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Laporan Tutor</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
            disabled={refreshingAll}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={hasActiveFilters ? '#9b59b6' : '#666'} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.exportButton, pdfExportLoading && styles.exportButtonDisabled]}
            onPress={handleExportPdf}
            disabled={pdfExportLoading || !tutors.length}
          >
            {pdfExportLoading ? (
              <LoadingSpinner size="small" color="#fff" />
            ) : (
              <Ionicons name="document-text" size={18} color="#fff" />
            )}
            <Text style={[
              styles.exportButtonText,
              pdfExportLoading && styles.exportButtonTextDisabled
            ]}>
              Export PDF
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama tutor..."
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          editable={!refreshingAll}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch} 
          disabled={refreshingAll || !searchText.trim()}
        >
          <Text style={[
            styles.searchButtonText,
            (!searchText.trim() || refreshingAll) && styles.searchButtonTextDisabled
          ]}>
            Cari
          </Text>
        </TouchableOpacity>
      </View>

      {(hasActiveFilters || searchText.trim()) && (
        <TouchableOpacity 
          style={styles.clearFiltersButton}
          onPress={() => {
            if (searchText.trim()) {
              setSearchText('');
            }
            handleClearFilters();
          }}
          disabled={refreshingAll}
        >
          <Ionicons name="close-circle" size={16} color="#9b59b6" />
          <Text style={styles.clearFiltersText}>
            {searchText.trim() ? 'Hapus Pencarian' : 'Hapus Filter'}
          </Text>
        </TouchableOpacity>
      )}

      {refreshingAll && (
        <View style={styles.refreshingIndicator}>
          <LoadingSpinner size="small" />
          <Text style={styles.refreshingText}>Memperbarui data...</Text>
        </View>
      )}

      {/* Export Error */}
      {pdfExportError && (
        <View style={styles.exportErrorContainer}>
          <Text style={styles.exportErrorText}>
            Export gagal: {pdfExportError}
          </Text>
        </View>
      )}

      {pagination && (
        <Text style={styles.resultCount}>
          {pagination.total} tutor ditemukan
        </Text>
      )}
    </View>
  );

  const renderTutorItem = ({ item }) => (
    <TutorAttendanceCard
      tutor={item}
      isExpanded={expandedCards.includes(item.id_tutor)}
      onToggle={() => handleCardToggle(item.id_tutor)}
      onTutorPress={handleTutorPress}
    />
  );

  const renderFooter = () => {
    if (!loading || currentPage === 1) return null;
    return <LoadingSpinner />;
  };

  if (initializingPage) {
    return <LoadingSpinner fullScreen message="Memuat laporan tutor..." />;
  }

  if ((error || refreshAllError) && !refreshing) {
    return (
      <View style={styles.container}>
        <ErrorMessage 
          message={error || refreshAllError} 
          onRetry={() => dispatch(fetchLaporanTutor(filters))}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tutors}
        renderItem={renderTutorItem}
        keyExtractor={(item) => item.id_tutor.toString()}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            {renderSummary()}
          </View>
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#9b59b6']}
            tintColor="#9b59b6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading && !refreshingAll ? (
            <EmptyState
              icon="school-outline"
              title="Tidak Ada Data"
              message="Tidak ada data tutor untuk filter yang dipilih"
              actionButtonText="Refresh"
              onActionPress={handleRefresh}
            />
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      <TutorFilterSection
        visible={showFilters}
        filters={filters}
        filterOptions={filterOptions}
        onClose={() => setShowFilters(false)}
        onApply={handleFilterChange}
        onClear={handleClearFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa'
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#9b59b6'
  },
  exportButtonDisabled: {
    opacity: 0.5
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4
  },
  exportButtonTextDisabled: {
    color: '#ccc'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333'
  },
  searchButton: {
    backgroundColor: '#9b59b6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  searchButtonTextDisabled: {
    opacity: 0.5
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#f8f4ff',
    marginBottom: 8
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '500',
    marginLeft: 4
  },
  refreshingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f4ff',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8
  },
  refreshingText: {
    fontSize: 14,
    color: '#9b59b6',
    fontWeight: '500',
    marginLeft: 8
  },
  exportErrorContainer: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8
  },
  exportErrorText: {
    fontSize: 12,
    color: '#c62828'
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  summaryContainer: {
    marginBottom: 8
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9b59b6'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  dateRangeInfo: {
    backgroundColor: '#f8f4ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8
  },
  dateRangeText: {
    fontSize: 12,
    color: '#9b59b6',
    fontWeight: '500',
    textAlign: 'center'
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20
  }
});

export default LaporanTutorScreen;