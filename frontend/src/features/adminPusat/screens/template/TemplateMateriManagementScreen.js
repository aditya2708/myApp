import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import FloatingActionButton from '../../../../common/components/FloatingActionButton';
import TemplateCard from '../../components/template/TemplateCard';

import {
  fetchTemplatesByMapel,
  setFilters,
  setSearch,
  setSortBy,
  toggleSelectionMode,
  selectAllTemplates,
  deselectAllTemplates,
  bulkActivateTemplates,
  bulkDeactivateTemplates,
  bulkDeleteTemplates,
  selectTemplates,
  selectTemplateFilters,
  selectTemplatePagination,
  selectTemplateSorting,
  selectTemplateLoading,
  selectTemplateError,
  selectSelectedTemplates,
  selectSelectionMode,
  selectOperationStatus,
  clearError
} from '../../redux/templateSlice';

const TemplateMateriManagementScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();

  // Route params
  const {
    jenjang, jenjangId, jenjangName,
    kelas, kelasId, kelasName,
    mataPelajaran, mataPelajaranId, mataPelajaranName
  } = route.params;

  // Redux state
  const templates = useSelector(selectTemplates);
  const filters = useSelector(selectTemplateFilters);
  const pagination = useSelector(selectTemplatePagination);
  const sorting = useSelector(selectTemplateSorting);
  const loading = useSelector(selectTemplateLoading);
  const error = useSelector(selectTemplateError);
  const selectedTemplates = useSelector(selectSelectedTemplates);
  const selectionMode = useSelector(selectSelectionMode);
  const operationStatus = useSelector(selectOperationStatus);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');

  // Load data saat component mount
  useFocusEffect(
    React.useCallback(() => {
      loadTemplates();
    }, [mataPelajaranId, kelasId])
  );

  const loadTemplates = async () => {
    try {
      await dispatch(fetchTemplatesByMapel({
        mataPelajaranId,
        kelasId,
        params: {
          ...filters,
          search: searchQuery,
          sort_by: sorting.sortBy,
          sort_order: sorting.sortOrder
        }
      })).unwrap();
    } catch (err) {
      console.error('Error loading templates:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTemplates();
    setRefreshing(false);
  };

  // Event handlers
  const handleSearch = (text) => {
    setSearchQuery(text);
    dispatch(setSearch(text));
  };

  const handleSearchSubmit = () => {
    loadTemplates();
  };


  const handleCreateTemplate = () => {
    navigation.navigate('TemplateMateriForm', {
      mode: 'create',
      jenjang,
      jenjangId,
      jenjangName,
      kelas,
      kelasId,
      kelasName,
      mataPelajaran,
      mataPelajaranId,
      mataPelajaranName
    });
  };

  const handleEditTemplate = (template) => {
    navigation.navigate('TemplateMateriForm', {
      mode: 'edit',
      template,
      jenjang,
      jenjangId,
      jenjangName,
      kelas,
      kelasId,
      kelasName,
      mataPelajaran,
      mataPelajaranId,
      mataPelajaranName
    });
  };

  const handleDistributeTemplate = (template) => {
    navigation.navigate('Distribution', {
      template,
      jenjang,
      jenjangId,
      jenjangName,
      kelas,
      kelasId,
      kelasName,
      mataPelajaran,
      mataPelajaranId,
      mataPelajaranName
    });
  };

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  // Bulk operations
  const handleToggleSelectionMode = () => {
    dispatch(toggleSelectionMode());
  };

  const handleSelectAll = () => {
    dispatch(selectAllTemplates());
  };

  const handleDeselectAll = () => {
    dispatch(deselectAllTemplates());
  };

  const handleBulkActivate = async () => {
    if (selectedTemplates.length === 0) return;

    Alert.alert(
      'Konfirmasi Aktivasi',
      `Aktifkan ${selectedTemplates.length} template yang dipilih?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Aktifkan',
          onPress: async () => {
            try {
              await dispatch(bulkActivateTemplates(selectedTemplates)).unwrap();
              Alert.alert('Sukses', 'Template berhasil diaktifkan');
            } catch (error) {
              Alert.alert('Error', error || 'Gagal mengaktifkan template');
            }
          }
        }
      ]
    );
  };

  const handleBulkDeactivate = async () => {
    if (selectedTemplates.length === 0) return;

    Alert.alert(
      'Konfirmasi Nonaktifkan',
      `Nonaktifkan ${selectedTemplates.length} template yang dipilih?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Nonaktifkan',
          onPress: async () => {
            try {
              await dispatch(bulkDeactivateTemplates(selectedTemplates)).unwrap();
              Alert.alert('Sukses', 'Template berhasil dinonaktifkan');
            } catch (error) {
              Alert.alert('Error', error || 'Gagal menonaktifkan template');
            }
          }
        }
      ]
    );
  };


  const handleBulkDelete = async () => {
    if (selectedTemplates.length === 0) return;

    Alert.alert(
      'Konfirmasi Hapus',
      `Hapus ${selectedTemplates.length} template yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(bulkDeleteTemplates(selectedTemplates)).unwrap();
              Alert.alert('Sukses', 'Template berhasil dihapus');
            } catch (error) {
              Alert.alert('Error', error || 'Gagal menghapus template');
            }
          }
        }
      ]
    );
  };

  // Filter templates untuk display
  const filteredTemplates = templates.filter(template => {
    // Filter berdasarkan status
    if (filters.status === 'active' && !template.is_active) return false;
    if (filters.status === 'inactive' && template.is_active) return false;
    
    // Filter berdasarkan kategori
    if (filters.kategori && template.kategori !== filters.kategori) return false;
    
    return true;
  });

  // Stats untuk display
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    inactive: templates.filter(t => !t.is_active).length,
    selected: selectedTemplates.length
  };

  if (loading.fetch && !templates.length) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleNavigateBack}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Template Materi</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {mataPelajaranName} - {kelasName}
          </Text>
        </View>
        {!selectionMode && (
          <TouchableOpacity
            style={styles.selectionButton}
            onPress={handleToggleSelectionMode}
          >
            <Ionicons name="checkmark-circle-outline" size={24} color="#3498db" />
          </TouchableOpacity>
        )}
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
          onPress={() => navigation.navigate('KelasSelection', { jenjang, jenjangId, jenjangName })}
        >
          <Text style={styles.breadcrumbText}>{kelasName}</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#6c757d" />
        <TouchableOpacity 
          style={styles.breadcrumbItem}
          onPress={() => navigation.navigate('MataPelajaranList', { 
            jenjang, jenjangId, jenjangName, kelas, kelasId, kelasName 
          })}
        >
          <Text style={styles.breadcrumbText}>{mataPelajaranName}</Text>
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color="#6c757d" />
        <Text style={styles.breadcrumbTextActive}>Template</Text>
      </View>

      {/* Selection Mode Header */}
      {selectionMode && (
        <View style={styles.selectionHeader}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionText}>
              {selectedTemplates.length} dari {templates.length} dipilih
            </Text>
          </View>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={selectedTemplates.length === templates.length ? handleDeselectAll : handleSelectAll}
            >
              <Text style={styles.selectionActionText}>
                {selectedTemplates.length === templates.length ? 'Batal Semua' : 'Pilih Semua'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selectionAction}
              onPress={handleToggleSelectionMode}
            >
              <Text style={styles.selectionActionText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Bar */}
      {!selectionMode && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari template..."
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#6c757d" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsValue}>{stats.total}</Text>
            <Text style={styles.statsLabel}>Total</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: '#27ae60' }]}>{stats.active}</Text>
            <Text style={styles.statsLabel}>Aktif</Text>
          </View>
          <View style={styles.statsCard}>
            <Text style={[styles.statsValue, { color: '#6c757d' }]}>{stats.inactive}</Text>
            <Text style={styles.statsLabel}>Nonaktif</Text>
          </View>
          {selectionMode && (
            <View style={styles.statsCard}>
              <Text style={[styles.statsValue, { color: '#3498db' }]}>{stats.selected}</Text>
              <Text style={styles.statsLabel}>Dipilih</Text>
            </View>
          )}
        </View>
      </View>

      {/* Template List */}
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
        <View style={styles.templateContainer}>
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id_template_materi}
              template={template}
              onEdit={handleEditTemplate}
              onDistribute={handleDistributeTemplate}
              selectionMode={selectionMode}
              isSelected={selectedTemplates.includes(template.id_template_materi)}
              showActions={!selectionMode}
            />
          ))}
        </View>

        {/* Empty State */}
        {filteredTemplates.length === 0 && !loading.fetch && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#bdc3c7" />
            <Text style={styles.emptyStateTitle}>
              {templates.length === 0 ? 'Belum Ada Template' : 'Tidak Ada Hasil'}
            </Text>
            <Text style={styles.emptyStateText}>
              {templates.length === 0
                ? 'Belum ada template untuk mata pelajaran ini. Tap tombol + untuk membuat template baru.'
                : 'Tidak ditemukan template yang sesuai dengan filter Anda.'
              }
            </Text>
            {templates.length === 0 && (
              <TouchableOpacity style={styles.createButton} onPress={handleCreateTemplate}>
                <Text style={styles.createButtonText}>Buat Template</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Error handling */}
        {error.fetch && (
          <ErrorMessage 
            message={error.fetch}
            onRetry={loadTemplates}
          />
        )}
      </ScrollView>

      {/* Bulk Action Bar */}
      {selectionMode && selectedTemplates.length > 0 && (
        <View style={styles.bulkActionBar}>
          <TouchableOpacity
            style={[styles.bulkAction, { backgroundColor: '#27ae60' }]}
            onPress={handleBulkActivate}
            disabled={loading.bulkActivate}
          >
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.bulkActionText}>Aktifkan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.bulkAction, { backgroundColor: '#f39c12' }]}
            onPress={handleBulkDeactivate}
            disabled={loading.bulkDeactivate}
          >
            <Ionicons name="pause" size={20} color="white" />
            <Text style={styles.bulkActionText}>Nonaktifkan</Text>
          </TouchableOpacity>
          
          
          <TouchableOpacity
            style={[styles.bulkAction, { backgroundColor: '#e74c3c' }]}
            onPress={handleBulkDelete}
            disabled={loading.bulkDelete}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.bulkActionText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB */}
      {!selectionMode && (
        <FloatingActionButton
          onPress={handleCreateTemplate}
          icon="add"
          color="#e74c3c"
        />
      )}

    </View>
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
  selectionButton: {
    padding: 4,
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
  selectionHeader: {
    backgroundColor: '#3498db',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectionInfo: {
    flex: 1,
  },
  selectionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  selectionActions: {
    flexDirection: 'row',
  },
  selectionAction: {
    marginLeft: 16,
  },
  selectionActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 16,
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
  statsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsCard: {
    alignItems: 'center',
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  content: {
    flex: 1,
  },
  templateContainer: {
    padding: 16,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  bulkActionBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  bulkAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  bulkActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#3498db',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#6c757d',
  },
  filterOptionTextActive: {
    color: 'white',
  },
  modalActions: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#3498db',
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

export default TemplateMateriManagementScreen;