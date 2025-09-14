import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { selectCpbFilterOptionsLoading, selectCpbFilterOptionsError } from '../redux/cpbLaporanSlice';

const { height: screenHeight } = Dimensions.get('window');

const CPBFilters = ({
  visible,
  filters,
  filterOptions,
  onClose,
  onApply,
  onClear
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const filterOptionsLoading = useSelector(selectCpbFilterOptionsLoading);
  const filterOptionsError = useSelector(selectCpbFilterOptionsError);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key] === value ? null : value
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      jenisKelamin: null,
      kelas: null,
      statusOrangTua: null,
      search: ''
    };
    setLocalFilters(clearedFilters);
    onClear();
    onClose();
  };

  const hasActiveFilters = localFilters.jenisKelamin || 
    localFilters.kelas || 
    localFilters.statusOrangTua;

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#9b59b6" />
      <Text style={styles.loadingText}>Memuat opsi filter...</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" />
      <Text style={styles.errorTitle}>Gagal Memuat Filter</Text>
      <Text style={styles.errorMessage}>{filterOptionsError}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="options-outline" size={48} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>Tidak Ada Filter Tersedia</Text>
      <Text style={styles.emptyMessage}>
        Belum ada data anak untuk shelter ini. Tambahkan data anak terlebih dahulu.
      </Text>
    </View>
  );

  const renderFilterSection = (title, options, selectedValue, filterKey) => {
    // Ensure options is an array and has data
    const safeOptions = Array.isArray(options) ? options : [];
    
    if (safeOptions.length === 0) {
      return (
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>{title}</Text>
          <View style={styles.noOptionsContainer}>
            <Text style={styles.noOptionsText}>Tidak ada {title.toLowerCase()} tersedia</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>{title}</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.option,
              !selectedValue && styles.optionSelected
            ]}
            onPress={() => handleFilterChange(filterKey, null)}
          >
            <Text style={[
              styles.optionText,
              !selectedValue && styles.optionTextSelected
            ]}>
              Semua {title}
            </Text>
            {!selectedValue && (
              <Ionicons name="checkmark" size={16} color="#9b59b6" />
            )}
          </TouchableOpacity>
          
          {safeOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.option,
                selectedValue === option && styles.optionSelected
              ]}
              onPress={() => handleFilterChange(filterKey, option)}
            >
              <Text style={[
                styles.optionText,
                selectedValue === option && styles.optionTextSelected
              ]}>
                {option}
              </Text>
              {selectedValue === option && (
                <Ionicons name="checkmark" size={16} color="#9b59b6" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (filterOptionsLoading) {
      return renderLoadingState();
    }

    if (filterOptionsError) {
      return renderErrorState();
    }

    // Check if all filter options are empty
    const hasAnyOptions = (
      (filterOptions.jenisKelamin && filterOptions.jenisKelamin.length > 0) ||
      (filterOptions.kelas && filterOptions.kelas.length > 0) ||
      (filterOptions.statusOrangTua && filterOptions.statusOrangTua.length > 0)
    );

    if (!hasAnyOptions) {
      return renderEmptyState();
    }

    return (
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Debug Info - Remove in production */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Debug: JK:{filterOptions.jenisKelamin?.length || 0}, 
              K:{filterOptions.kelas?.length || 0}, 
              SO:{filterOptions.statusOrangTua?.length || 0}
            </Text>
          </View>
        )}

        {/* Jenis Kelamin Filter */}
        {renderFilterSection(
          'Jenis Kelamin',
          filterOptions.jenisKelamin,
          localFilters.jenisKelamin,
          'jenisKelamin'
        )}

        {/* Kelas Filter */}
        {renderFilterSection(
          'Kelas',
          filterOptions.kelas,
          localFilters.kelas,
          'kelas'
        )}

        {/* Status Orang Tua Filter */}
        {renderFilterSection(
          'Status Orang Tua',
          filterOptions.statusOrangTua,
          localFilters.statusOrangTua,
          'statusOrangTua'
        )}
      </ScrollView>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Filter CPB</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
              {renderContent()}
            </View>

            {/* Footer - Only show if not loading/error */}
            {!filterOptionsLoading && !filterOptionsError && (
              <View style={styles.footer}>
                {hasActiveFilters && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClear}
                  >
                    <Text style={styles.clearButtonText}>Hapus</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    !hasActiveFilters && styles.applyButtonFull
                  ]}
                  onPress={handleApply}
                >
                  <Text style={styles.applyButtonText}>Terapkan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    height: screenHeight * 0.75,
    backgroundColor: 'transparent'
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  closeButton: {
    padding: 4
  },
  contentContainer: {
    flex: 1
  },
  content: {
    flex: 1,
    paddingHorizontal: 16
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16
  },
  
  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 8
  },
  errorMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
    marginBottom: 8
  },
  emptyMessage: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    lineHeight: 20
  },
  
  // Debug Info
  debugContainer: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7'
  },
  debugText: {
    fontSize: 12,
    color: '#856404'
  },
  
  // Filter Sections
  filterSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  optionsContainer: {
    gap: 8
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  optionSelected: {
    backgroundColor: '#f8f4ff',
    borderColor: '#9b59b6'
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  optionTextSelected: {
    color: '#9b59b6',
    fontWeight: '500'
  },
  
  // No Options
  noOptionsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  noOptionsText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic'
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    gap: 12
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9b59b6',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  clearButtonText: {
    fontSize: 16,
    color: '#9b59b6',
    fontWeight: '500'
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#9b59b6',
    alignItems: 'center'
  },
  applyButtonFull: {
    flex: 1
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600'
  }
});

export default CPBFilters;