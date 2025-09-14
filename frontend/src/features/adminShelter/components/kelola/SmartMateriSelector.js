import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SmartMateriSelector = ({
  allMateri = [], // All materi from getAllMateri API (cached)
  selectedKelompok = null, // Selected kelompok object with kelas_gabungan
  selectedMateri = null, // Currently selected materi object
  onMateriSelect, // Callback when materi selected
  loading = false,
  disabled = false,
  placeholder = "Pilih materi dari daftar",
  showPreview = true,
  style
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMateriDetail, setSelectedMateriDetail] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Smart filtering logic based on kelas_gabungan
  const filteredMateri = useMemo(() => {
    if (!selectedKelompok || !selectedKelompok.kelas_gabungan || !Array.isArray(selectedKelompok.kelas_gabungan)) {
      return [];
    }

    if (!allMateri || allMateri.length === 0) {
      return [];
    }

    // Get kelas IDs from kelompok's kelas_gabungan
    const kelasIds = selectedKelompok.kelas_gabungan;

    // Filter materi that match any of the kelas in kelas_gabungan
    const compatibleMateri = allMateri.filter(materi => {
      // Handle both relationship object and direct id_kelas field
      const materiKelasId = materi.kelas?.id_kelas || materi.id_kelas;
      if (!materiKelasId) return false;
      return kelasIds.includes(materiKelasId);
    });

    // Apply search filter if query exists
    if (!searchQuery.trim()) {
      return compatibleMateri;
    }

    const query = searchQuery.toLowerCase().trim();
    return compatibleMateri.filter(materi => {
      const namaMateri = (materi.nama_materi || '').toString().toLowerCase();
      const mataPelajaran = (materi.mataPelajaran?.nama_mata_pelajaran || materi.mata_pelajaran?.nama_mata_pelajaran || '').toString().toLowerCase();
      const kelasName = (materi.kelas?.nama_kelas || '').toString().toLowerCase();
      const jenjangName = (materi.kelas?.jenjang?.nama_jenjang || '').toString().toLowerCase();
      const kategori = (materi.kategori || '').toString().toLowerCase();

      return namaMateri.includes(query) ||
             mataPelajaran.includes(query) ||
             kelasName.includes(query) ||
             jenjangName.includes(query) ||
             kategori.includes(query);
    });
  }, [allMateri, selectedKelompok, searchQuery]);

  // Group filtered materi by mata pelajaran for better organization
  const groupedMateri = useMemo(() => {
    return filteredMateri.reduce((acc, materi) => {
      const mataPelajaranName = (materi.mataPelajaran?.nama_mata_pelajaran || materi.mata_pelajaran?.nama_mata_pelajaran || 'Lainnya').toString();
      if (!acc[mataPelajaranName]) {
        acc[mataPelajaranName] = [];
      }
      acc[mataPelajaranName].push(materi);
      return acc;
    }, {});
  }, [filteredMateri]);

  const openModal = () => {
    if (disabled || loading) return;
    
    if (!selectedKelompok) {
      Alert.alert('Info', 'Silakan pilih kelompok terlebih dahulu untuk melihat materi yang tersedia.');
      return;
    }

    if (filteredMateri.length === 0) {
      Alert.alert('Info', 'Tidak ada materi yang tersedia untuk kombinasi kelas dalam kelompok ini.');
      return;
    }

    setSearchQuery('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSearchQuery('');
    setSelectedMateriDetail(null);
  };

  const handleMateriSelect = (materi) => {
    onMateriSelect(materi);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleMateriPreview = async (materi) => {
    if (!showPreview) return;
    
    setPreviewLoading(true);
    setSelectedMateriDetail(materi);
    // Here you could fetch additional detail from getMateriDetail API if needed
    setPreviewLoading(false);
  };

  const getMateriDisplayText = () => {
    if (!selectedMateri) {
      return placeholder;
    }
    
    const mataPelajaran = (selectedMateri.mataPelajaran?.nama_mata_pelajaran || selectedMateri.mata_pelajaran?.nama_mata_pelajaran || '').toString();
    const namaMateri = (selectedMateri.nama_materi || '').toString();
    const kelas = (selectedMateri.kelas?.nama_kelas || '').toString();
    
    return `${mataPelajaran} - ${namaMateri} ${kelas ? `(${kelas})` : ''}`;
  };

  const renderMateriItem = (materi) => {
    const isSelected = selectedMateri?.id_materi === materi.id_materi;
    const kelasInfo = `${(materi.kelas?.jenjang?.nama_jenjang || '').toString()} ${(materi.kelas?.nama_kelas || '').toString()}`.trim();
    
    return (
      <TouchableOpacity
        key={materi.id_materi}
        style={[styles.materiItem, isSelected && styles.materiItemSelected]}
        onPress={() => handleMateriSelect(materi)}
        onLongPress={() => handleMateriPreview(materi)}
      >
        <View style={styles.materiContent}>
          <Text style={[styles.materiName, isSelected && styles.materiNameSelected]}>
            {(materi.nama_materi || '').toString()}
          </Text>
          
          <View style={styles.materiMeta}>
            <View style={styles.materiMetaItem}>
              <Ionicons name="book-outline" size={14} color="#666" />
              <Text style={styles.materiMetaText}>{kelasInfo || '-'}</Text>
            </View>
            
            {materi.kategori && (
              <View style={styles.materiMetaItem}>
                <Ionicons name="pricetag-outline" size={14} color="#666" />
                <Text style={styles.materiMetaText}>{(materi.kategori || '').toString()}</Text>
              </View>
            )}
            
            {materi.urutan && (
              <View style={styles.materiMetaItem}>
                <Ionicons name="list-outline" size={14} color="#666" />
                <Text style={styles.materiMetaText}>Urutan {(materi.urutan || '').toString()}</Text>
              </View>
            )}
          </View>

          {materi.deskripsi && (
            <Text style={styles.materiDescription} numberOfLines={2}>
              {(materi.deskripsi || '').toString()}
            </Text>
          )}
        </View>

        <View style={styles.materiActions}>
          {showPreview && (
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => handleMateriPreview(materi)}
            >
              <Ionicons name="eye-outline" size={16} color="#3498db" />
            </TouchableOpacity>
          )}
          
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMataPelajaranSection = (mataPelajaranName, materiList) => (
    <View key={mataPelajaranName} style={styles.mataPelajaranSection}>
      <View style={styles.mataPelajaranHeader}>
        <Text style={styles.mataPelajaranName}>{mataPelajaranName}</Text>
        <Text style={styles.materiCount}>({materiList.length} materi)</Text>
      </View>
      {materiList.map(renderMateriItem)}
    </View>
  );

  const renderPreviewModal = () => {
    if (!selectedMateriDetail) return null;

    return (
      <Modal
        visible={!!selectedMateriDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedMateriDetail(null)}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Preview Materi</Text>
              <TouchableOpacity onPress={() => setSelectedMateriDetail(null)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.previewBody}>
              <Text style={styles.previewMateriName}>
                {(selectedMateriDetail.nama_materi || '').toString()}
              </Text>
              
              <View style={styles.previewMetaContainer}>
                <View style={styles.previewMetaItem}>
                  <Text style={styles.previewMetaLabel}>Mata Pelajaran:</Text>
                  <Text style={styles.previewMetaValue}>
                    {(selectedMateriDetail.mataPelajaran?.nama_mata_pelajaran || selectedMateriDetail.mata_pelajaran?.nama_mata_pelajaran || '-').toString()}
                  </Text>
                </View>
                
                <View style={styles.previewMetaItem}>
                  <Text style={styles.previewMetaLabel}>Kelas:</Text>
                  <Text style={styles.previewMetaValue}>
                    {`${(selectedMateriDetail.kelas?.jenjang?.nama_jenjang || '').toString()} ${(selectedMateriDetail.kelas?.nama_kelas || '').toString()}`.trim() || '-'}
                  </Text>
                </View>
                
                {selectedMateriDetail.kategori && (
                  <View style={styles.previewMetaItem}>
                    <Text style={styles.previewMetaLabel}>Kategori:</Text>
                    <Text style={styles.previewMetaValue}>{(selectedMateriDetail.kategori || '').toString()}</Text>
                  </View>
                )}
                
                {selectedMateriDetail.urutan && (
                  <View style={styles.previewMetaItem}>
                    <Text style={styles.previewMetaLabel}>Urutan:</Text>
                    <Text style={styles.previewMetaValue}>{(selectedMateriDetail.urutan || '').toString()}</Text>
                  </View>
                )}
              </View>

              {selectedMateriDetail.deskripsi && (
                <View style={styles.previewDescriptionContainer}>
                  <Text style={styles.previewDescriptionLabel}>Deskripsi:</Text>
                  <Text style={styles.previewDescriptionText}>
                    {(selectedMateriDetail.deskripsi || '').toString()}
                  </Text>
                </View>
              )}

              {selectedMateriDetail.file_name && (
                <View style={styles.previewFileContainer}>
                  <Text style={styles.previewFileLabel}>File:</Text>
                  <View style={styles.previewFileInfo}>
                    <Ionicons name="document-outline" size={16} color="#3498db" />
                    <Text style={styles.previewFileName}>
                      {(selectedMateriDetail.file_name || '').toString()}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.previewFooter}>
              <TouchableOpacity
                style={styles.selectMateriButton}
                onPress={() => {
                  handleMateriSelect(selectedMateriDetail);
                  setSelectedMateriDetail(null);
                }}
              >
                <Text style={styles.selectMateriButtonText}>Pilih Materi Ini</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.selectorButton,
          disabled && styles.selectorButtonDisabled,
          loading && styles.selectorButtonLoading
        ]}
        onPress={openModal}
        disabled={disabled || loading}
      >
        <Text
          style={[
            styles.selectorText,
            !selectedMateri && styles.placeholderText
          ]}
          numberOfLines={2}
        >
          {getMateriDisplayText()}
        </Text>
        
        {loading ? (
          <ActivityIndicator size="small" color="#3498db" />
        ) : (
          <Ionicons name="chevron-down" size={20} color="#666" />
        )}
      </TouchableOpacity>

      {!selectedKelompok && (
        <Text style={styles.helperText}>
          Pilih kelompok terlebih dahulu untuk melihat materi yang tersedia
        </Text>
      )}

      {selectedKelompok && filteredMateri.length === 0 && !loading && (
        <Text style={styles.noMateriText}>
          Tidak ada materi tersedia untuk kombinasi kelas dalam kelompok ini
        </Text>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Materi</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Cari materi, mata pelajaran, atau kelas..."
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {filteredMateri.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-outline" size={48} color="#bdc3c7" />
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'Tidak ada materi yang sesuai dengan pencarian' : 'Tidak ada materi tersedia'}
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.resultCount}>
                    Ditemukan {filteredMateri.length} materi yang sesuai
                  </Text>
                  {Object.entries(groupedMateri).map(([mataPelajaranName, materiList]) =>
                    renderMataPelajaranSection(mataPelajaranName, materiList)
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {renderPreviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  selectorButtonDisabled: {
    backgroundColor: '#f9f9f9',
    opacity: 0.6,
  },
  selectorButtonLoading: {
    opacity: 0.7,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  placeholderText: {
    color: '#999',
  },
  helperText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noMateriText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
    fontStyle: 'italic',
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
    maxHeight: height * 0.85,
    minHeight: height * 0.6,
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
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  clearSearchButton: {
    marginRight: 12,
  },
  
  modalBody: {
    flex: 1,
    padding: 16,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },

  // Mata Pelajaran Section
  mataPelajaranSection: {
    marginBottom: 20,
  },
  mataPelajaranHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  mataPelajaranName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  materiCount: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
  },

  // Materi Item
  materiItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  materiItemSelected: {
    borderColor: '#27ae60',
    backgroundColor: '#f8fff8',
  },
  materiContent: {
    flex: 1,
  },
  materiName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  materiNameSelected: {
    color: '#27ae60',
  },
  materiMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  materiMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 2,
  },
  materiMetaText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  materiDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  materiActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  previewButton: {
    padding: 4,
    marginRight: 8,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },

  // Preview Modal
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  previewBody: {
    flex: 1,
    padding: 16,
  },
  previewMateriName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  previewMetaContainer: {
    marginBottom: 16,
  },
  previewMetaItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  previewMetaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    width: 120,
  },
  previewMetaValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  previewDescriptionContainer: {
    marginBottom: 16,
  },
  previewDescriptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  previewDescriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  previewFileContainer: {
    marginBottom: 16,
  },
  previewFileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  previewFileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewFileName: {
    fontSize: 14,
    color: '#3498db',
    marginLeft: 8,
  },
  previewFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  selectMateriButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectMateriButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default SmartMateriSelector;