import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const KelasGabunganSelector = ({
  selectedKelasGabungan = [], // Array of kelas IDs (NOT objects)
  onKelasGabunganChange,
  availableKelas = [], // Array of kelas objects from API
  showMateriCount = false, // Simplified - no need for complex materi counting
  disabled = false,
  style
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedKelas, setTempSelectedKelas] = useState([]);
  const [expandedJenjang, setExpandedJenjang] = useState({});

  // Process available kelas data from API
  const processKelasData = () => {
    if (!availableKelas || availableKelas.length === 0) {
      return { jenjangList: [], groupedKelas: {} };
    }

    // Group kelas by jenjang
    const groupedKelas = availableKelas.reduce((acc, kelas) => {
      if (!kelas.jenjang) return acc;
      
      const jenjangName = kelas.jenjang.nama_jenjang;
      if (!acc[jenjangName]) {
        acc[jenjangName] = {
          jenjang: kelas.jenjang,
          kelasList: []
        };
      }
      acc[jenjangName].kelasList.push(kelas);
      return acc;
    }, {});

    // Create jenjang list with colors
    const jenjangColors = {
      'PAUD': '#9b59b6',
      'TK': '#8e44ad', 
      'SD': '#3498db',
      'SMP': '#f39c12',
      'SMA': '#e74c3c'
    };

    const jenjangList = Object.values(groupedKelas).map(group => ({
      ...group.jenjang,
      color: jenjangColors[group.jenjang.nama_jenjang] || '#95a5a6'
    }));

    return { jenjangList, groupedKelas };
  };

  const { jenjangList, groupedKelas } = processKelasData();

  useEffect(() => {
    setTempSelectedKelas([...selectedKelasGabungan]);
  }, [selectedKelasGabungan, modalVisible]);

  const openModal = () => {
    if (disabled) return;
    setTempSelectedKelas([...selectedKelasGabungan]);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTempSelectedKelas([]);
  };

  const saveSelection = () => {
    if (tempSelectedKelas.length === 0) {
      Alert.alert('Peringatan', 'Pilih minimal satu kelas untuk kelompok ini.');
      return;
    }
    
    onKelasGabunganChange(tempSelectedKelas);
    setModalVisible(false);
  };

  const toggleKelasSelection = (kelasId) => {
    const existingIndex = tempSelectedKelas.findIndex(id => id === kelasId);

    if (existingIndex > -1) {
      // Remove existing selection
      setTempSelectedKelas(prev => prev.filter((_, index) => index !== existingIndex));
    } else {
      // Add new selection
      setTempSelectedKelas(prev => [...prev, kelasId]);
    }
  };

  const toggleJenjangExpanded = (jenjangId) => {
    setExpandedJenjang(prev => ({
      ...prev,
      [jenjangId]: !prev[jenjangId]
    }));
  };

  const isKelasSelected = (kelasId) => {
    return tempSelectedKelas.includes(kelasId);
  };

  const getKelasById = (kelasId) => {
    return availableKelas.find(k => k.id_kelas === kelasId);
  };

  const getJenjangColor = (jenjangName) => {
    const jenjang = jenjangList.find(j => j.nama_jenjang === jenjangName);
    return jenjang?.color || '#95a5a6';
  };

  const renderSelectedKelasChips = () => {
    if (selectedKelasGabungan.length === 0) {
      return (
        <Text style={styles.placeholderText}>
          Pilih kombinasi kelas untuk kelompok
        </Text>
      );
    }

    return (
      <View style={styles.selectedChipsContainer}>
        {selectedKelasGabungan.map((kelasId) => {
          const kelas = getKelasById(kelasId);
          if (!kelas) return null;

          return (
            <View
              key={kelasId}
              style={[
                styles.selectedChip,
                { backgroundColor: getJenjangColor(kelas.jenjang?.nama_jenjang) }
              ]}
            >
              <Text style={styles.selectedChipText}>
                {kelas.jenjang?.nama_jenjang} {kelas.nama_kelas}
              </Text>
            </View>
          );
        })}
        
        <View style={styles.totalKelaschip}>
          <Text style={styles.totalKelasText}>
            Total: {selectedKelasGabungan.length} kelas
          </Text>
        </View>
      </View>
    );
  };

  const renderJenjangSection = (jenjang) => {
    const isExpanded = expandedJenjang[jenjang.id_jenjang];
    const kelasOptions = groupedKelas[jenjang.nama_jenjang]?.kelasList || [];

    return (
      <View key={jenjang.id_jenjang} style={styles.jenjangSection}>
        <TouchableOpacity
          style={styles.jenjangHeader}
          onPress={() => toggleJenjangExpanded(jenjang.id_jenjang)}
        >
          <View style={styles.jenjangTitle}>
            <View style={[styles.jenjangColorIndicator, { backgroundColor: jenjang.color }]} />
            <Text style={styles.jenjangName}>{jenjang.nama_jenjang}</Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.kelasGrid}>
            {kelasOptions.map((kelas) => {
              const isSelected = isKelasSelected(kelas.id_kelas);

              return (
                <TouchableOpacity
                  key={kelas.id_kelas}
                  style={[
                    styles.kelasOption,
                    isSelected && styles.kelasOptionSelected,
                    { borderColor: jenjang.color }
                  ]}
                  onPress={() => toggleKelasSelection(kelas.id_kelas)}
                >
                  <Text style={[
                    styles.kelasOptionText,
                    isSelected && styles.kelasOptionTextSelected
                  ]}>
                    {kelas.nama_kelas}
                  </Text>
                  <Text style={[
                    styles.kelasSubText,
                    isSelected && styles.kelasSubTextSelected
                  ]}>
                    Tingkat {kelas.tingkat}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={jenjang.color}
                      style={styles.selectedIcon}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.selectorButton, disabled && styles.selectorButtonDisabled]}
        onPress={openModal}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          {renderSelectedKelasChips()}
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Kelas Gabungan</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.instructionText}>
                Pilih kombinasi kelas yang akan digabungkan dalam kelompok ini:
              </Text>

              {jenjangList.map(renderJenjangSection)}

              {tempSelectedKelas.length > 0 && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewTitle}>Preview Kombinasi:</Text>
                  <View style={styles.previewChips}>
                    {tempSelectedKelas.map((kelasId) => {
                      const kelas = getKelasById(kelasId);
                      if (!kelas) return null;

                      return (
                        <View
                          key={kelasId}
                          style={[
                            styles.previewChip,
                            { backgroundColor: getJenjangColor(kelas.jenjang?.nama_jenjang) }
                          ]}
                        >
                          <Text style={styles.previewChipText}>
                            {kelas.jenjang?.nama_jenjang} {kelas.nama_kelas}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  tempSelectedKelas.length === 0 && styles.saveButtonDisabled
                ]}
                onPress={saveSelection}
                disabled={tempSelectedKelas.length === 0}
              >
                <Text style={styles.saveButtonText}>
                  Simpan ({tempSelectedKelas.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    minHeight: 50,
  },
  selectorButtonDisabled: {
    backgroundColor: '#f9f9f9',
    opacity: 0.6,
  },
  selectorContent: {
    flex: 1,
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  selectedChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectedChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    margin: 2,
  },
  selectedChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  materiCountText: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.9,
  },
  totalKelaschip: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    margin: 2,
  },
  totalKelasText: {
    color: '#495057',
    fontSize: 12,
    fontWeight: '500',
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
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },

  // Jenjang Section
  jenjangSection: {
    marginBottom: 16,
  },
  jenjangHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  jenjangTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jenjangColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  jenjangName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },

  // Kelas Grid
  kelasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 12,
    gap: 8,
  },
  kelasOption: {
    width: (width - 80) / 3,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  kelasOptionSelected: {
    backgroundColor: '#f0f8ff',
  },
  kelasOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  kelasOptionTextSelected: {
    color: '#3498db',
    fontWeight: '600',
  },
  kelasSubText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  kelasSubTextSelected: {
    color: '#3498db',
  },
  selectedIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  // Preview Section
  previewSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  previewChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  previewChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#9b59b6',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default KelasGabunganSelector;