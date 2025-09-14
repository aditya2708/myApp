import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Button from '../../../common/components/Button';
import ErrorMessage from '../../../common/components/ErrorMessage';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import KelasGabunganSelector from '../components/kelola/KelasGabunganSelector';

// Import API
import { adminShelterKelompokApi } from '../api/adminShelterKelompokApi';
import { useAuth } from '../../../common/hooks/useAuth';

const KelompokFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { profile } = useAuth();
  
  // Get kelompok from route params if editing
  const existingKelompok = route.params?.kelompok;
  const isEditMode = !!existingKelompok;
  
  // Form state - UPDATED structure for kelas gabungan (Array of kelas IDs)
  const [formData, setFormData] = useState({
    nama_kelompok: existingKelompok?.nama_kelompok || '',
    kelas_gabungan: existingKelompok?.kelas_gabungan || [], // Array of kelas IDs
    jumlah_anggota: existingKelompok?.jumlah_anggota?.toString() || '0',
    anak_ids: []
  });

  // Anak selection state
  const [availableAnak, setAvailableAnak] = useState([]);
  const [selectedAnak, setSelectedAnak] = useState([]);
  const [showAnakSelector, setShowAnakSelector] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data for kelas gabungan selector
  const [availableKelas, setAvailableKelas] = useState([]);
  
  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setError(null);
        
        // Fetch available kelas data from API
        const kelasResponse = await adminShelterKelompokApi.getAvailableKelas();
        if (kelasResponse.data.success) {
          setAvailableKelas(kelasResponse.data.data.kelas_list || []);
        }

        // Fetch available anak if not in edit mode
        if (!isEditMode && profile?.adminShelter?.shelter?.id_shelter) {
          await fetchAvailableAnak();
        }
        
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Gagal memuat data. Silakan coba lagi.');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Fetch available anak
  const fetchAvailableAnak = async () => {
    try {
      const shelterId = profile?.adminShelter?.shelter?.id_shelter;
      if (!shelterId) return;

      const response = await adminShelterKelompokApi.getAvailableChildren(shelterId);
      if (response.data.success) {
        setAvailableAnak(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching available anak:', err);
    }
  };
  
  // Handle text input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle kelas gabungan selection (selectedKelas is array of kelas IDs)
  const handleKelasGabunganChange = (selectedKelasIds) => {
    setFormData(prev => ({
      ...prev,
      kelas_gabungan: selectedKelasIds
    }));
  };

  // Handle anak selection
  const handleAnakSelection = (anak) => {
    const isSelected = selectedAnak.find(selected => selected.id_anak === anak.id_anak);
    
    if (isSelected) {
      // Remove from selection
      setSelectedAnak(prev => prev.filter(selected => selected.id_anak !== anak.id_anak));
    } else {
      // Add to selection
      setSelectedAnak(prev => [...prev, anak]);
    }
  };

  // Update anak_ids in formData when selectedAnak changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      anak_ids: selectedAnak.map(anak => anak.id_anak)
    }));
  }, [selectedAnak]);
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nama_kelompok.trim()) {
      errors.nama_kelompok = 'Nama kelompok wajib diisi';
    }
    
    if (!formData.kelas_gabungan || formData.kelas_gabungan.length === 0) {
      errors.kelas_gabungan = 'Pilih minimal satu kelas untuk kelompok';
    }
    
    // Validate kelas combination (simplified business rules)
    if (formData.kelas_gabungan.length > 0) {
      // Get kelas details for validation
      const selectedKelasDetails = formData.kelas_gabungan.map(kelasId => 
        availableKelas.find(k => k.id_kelas === kelasId)
      ).filter(Boolean);

      if (selectedKelasDetails.length === 0) {
        errors.kelas_gabungan = 'Kelas yang dipilih tidak valid';
        return { isValid: false, errors };
      }

      // Check if combination makes pedagogical sense (max 2 different jenjang)
      const jenjangSet = new Set(selectedKelasDetails.map(k => k.jenjang?.nama_jenjang));
      if (jenjangSet.size > 2) {
        errors.kelas_gabungan = 'Maksimal 2 jenjang berbeda dalam satu kelompok';
      }
      
      // Check for too wide level gap within same jenjang
      const tingkatLevels = selectedKelasDetails.map(k => k.tingkat).filter(Boolean);
      if (tingkatLevels.length > 1) {
        const maxTingkat = Math.max(...tingkatLevels);
        const minTingkat = Math.min(...tingkatLevels);
        
        if (maxTingkat - minTingkat > 3) {
          errors.kelas_gabungan = 'Rentang tingkat terlalu jauh (maksimal 3 tingkat)';
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const { isValid, errors } = validateForm();
    
    if (!isValid) {
      // Show first error message
      Alert.alert('Kesalahan Validasi', Object.values(errors)[0]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare submit data with kelas gabungan (array of kelas IDs)
      const submitData = {
        nama_kelompok: formData.nama_kelompok.trim(),
        kelas_gabungan: formData.kelas_gabungan, // Array of kelas IDs
        jumlah_anggota: parseInt(formData.jumlah_anggota || '0', 10),
        // Add selected anak for new kelompok
        anak_ids: !isEditMode ? formData.anak_ids : undefined
      };
      
      let response;
      
      if (isEditMode) {
        response = await adminShelterKelompokApi.updateKelompok(
          existingKelompok.id_kelompok,
          submitData
        );
      } else {
        response = await adminShelterKelompokApi.createKelompok(submitData);
      }
      
      if (response.data.success) {
        // Show success message
        Alert.alert(
          'Berhasil',
          isEditMode ? 'Kelompok berhasil diperbarui' : 'Kelompok berhasil dibuat',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        setError(response.data.message || 'Gagal menyimpan kelompok');
      }
    } catch (err) {
      console.error('Error saving kelompok:', err);
      setError(
        err.response?.data?.message || 
        'Gagal menyimpan kelompok. Silakan coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Show loading for initial data fetch
  if (initialLoading) {
    return (
      <LoadingSpinner 
        fullScreen 
        message={isEditMode ? "Memuat data kelompok..." : "Memuat data form..."} 
      />
    );
  }
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Error Message */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => setError(null)}
          />
        )}
        
        {/* Header Info */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="people-circle" size={32} color="#9b59b6" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Edit Kelompok' : 'Buat Kelompok Baru'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode 
                ? 'Perbarui informasi kelompok dengan kelas gabungan'
                : 'Buat kelompok belajar dengan kombinasi kelas yang fleksibel'
              }
            </Text>
          </View>
        </View>
        
        {/* Group Name Input */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Nama Kelompok <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.nama_kelompok}
            onChangeText={(value) => handleInputChange('nama_kelompok', value)}
            placeholder="Contoh: Kelompok Belajar A"
            maxLength={50}
          />
          <Text style={styles.helperText}>
            Berikan nama yang mudah diingat untuk kelompok ini
          </Text>
        </View>
        
        {/* Kelas Gabungan Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Kombinasi Kelas <Text style={styles.required}>*</Text>
          </Text>
          <KelasGabunganSelector
            selectedKelasGabungan={formData.kelas_gabungan}
            onKelasGabunganChange={handleKelasGabunganChange}
            availableKelas={availableKelas}
            disabled={loading}
          />
          <Text style={styles.helperText}>
            Pilih kombinasi kelas yang akan digabungkan dalam kelompok ini. 
            Maksimal 2 jenjang berbeda dan rentang tingkat tidak lebih dari 3 level.
          </Text>
        </View>
        
        
        {/* Anak Selection (only for new kelompok) */}
        {!isEditMode && availableAnak.length > 0 && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Pilih Anak Binaan (Opsional)
            </Text>
            <Text style={styles.helperText}>
              Pilih anak binaan yang akan menjadi anggota kelompok ini. 
              Hanya anak dengan status aktif dan belum tergabung dalam kelompok lain yang dapat dipilih.
            </Text>
            
            <View style={styles.anakGrid}>
              {availableAnak.map((anak) => {
                const isSelected = selectedAnak.find(selected => selected.id_anak === anak.id_anak);
                
                return (
                  <TouchableOpacity
                    key={anak.id_anak}
                    style={[
                      styles.anakCard,
                      isSelected && styles.anakCardSelected
                    ]}
                    onPress={() => handleAnakSelection(anak)}
                  >
                    <View style={styles.anakInfo}>
                      <Text style={[
                        styles.anakName,
                        isSelected && styles.anakNameSelected
                      ]}>
                        {anak.nama_lengkap || anak.nama || 'Tidak ada nama'}
                      </Text>
                      {anak.anakPendidikan?.jenjang && (
                        <Text style={[
                          styles.anakJenjang,
                          isSelected && styles.anakJenjangSelected
                        ]}>
                          {anak.anakPendidikan.jenjang} {anak.anakPendidikan.kelas || ''}
                        </Text>
                      )}
                      <Text style={[
                        styles.anakStatus,
                        isSelected && styles.anakStatusSelected
                      ]}>
                        Status: {anak.status_validasi || 'Tidak diketahui'}
                      </Text>
                    </View>
                    
                    {isSelected && (
                      <View style={styles.selectedIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#9b59b6" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            
            {selectedAnak.length > 0 && (
              <View style={styles.selectedSummary}>
                <Text style={styles.selectedSummaryText}>
                  {selectedAnak.length} anak binaan dipilih
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Member Count (Read-only in edit mode) */}
        {isEditMode && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Jumlah Anggota Saat Ini</Text>
            <View style={styles.readOnlyField}>
              <Ionicons name="people" size={20} color="#666" />
              <Text style={styles.readOnlyText}>
                {formData.jumlah_anggota} anak binaan
              </Text>
            </View>
            <Text style={styles.helperText}>
              Jumlah anggota akan diperbarui otomatis saat menambah/mengurangi anak binaan
            </Text>
          </View>
        )}
        
        {/* Form Summary */}
        {formData.kelas_gabungan.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Ringkasan Kelompok</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Nama:</Text>
                <Text style={styles.summaryValue}>
                  {formData.nama_kelompok || 'Belum diisi'}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Jenjang:</Text>
                <Text style={styles.summaryValue}>
                  {(() => {
                    const selectedKelasDetails = formData.kelas_gabungan.map(kelasId => 
                      availableKelas.find(k => k.id_kelas === kelasId)
                    ).filter(Boolean);
                    const jenjangSet = [...new Set(selectedKelasDetails.map(k => k.jenjang?.nama_jenjang))];
                    return jenjangSet.join(', ') || 'Tidak ada';
                  })()}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Kelas:</Text>
                <Text style={styles.summaryValue}>
                  {formData.kelas_gabungan.length} kelas
                </Text>
              </View>
              {!isEditMode && selectedAnak.length > 0 && (
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Anak Terpilih:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedAnak.length} anak
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="Batal"
            onPress={() => navigation.goBack()}
            type="outline"
            style={styles.cancelButton}
            disabled={loading}
          />
          
          <Button
            title={isEditMode ? "Simpan Perubahan" : "Buat Kelompok"}
            onPress={handleSubmit}
            type="primary"
            style={styles.submitButton}
            loading={loading}
            disabled={loading || formData.kelas_gabungan.length === 0}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // Header
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerIcon: {
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },

  // Form Groups
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  helperText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginTop: 6,
    lineHeight: 18,
  },

  // Read-only field
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
  },
  readOnlyText: {
    fontSize: 16,
    color: '#495057',
    marginLeft: 8,
    fontWeight: '500',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#9b59b6',
  },

  // Anak Selection Styles
  anakGrid: {
    marginTop: 8,
    gap: 8,
  },
  anakCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  anakCardSelected: {
    borderColor: '#9b59b6',
    backgroundColor: '#f8f5ff',
  },
  anakInfo: {
    flex: 1,
  },
  anakName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  anakNameSelected: {
    color: '#9b59b6',
  },
  anakJenjang: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  anakJenjangSelected: {
    color: '#8e44ad',
  },
  anakStatus: {
    fontSize: 11,
    color: '#95a5a6',
  },
  anakStatusSelected: {
    color: '#8e44ad',
  },
  selectedIcon: {
    marginLeft: 8,
  },
  selectedSummary: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f5ff',
    borderRadius: 6,
    alignItems: 'center',
  },
  selectedSummaryText: {
    fontSize: 12,
    color: '#9b59b6',
    fontWeight: '500',
  },
});

export default KelompokFormScreen;