import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

// Import components
import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import API
import { raportApi } from '../api/raportApi';
import { semesterApi } from '../api/semesterApi';

const RaportGenerateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { anakId, anakData } = route.params || {};

  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [catatanWaliKelas, setCatatanWaliKelas] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [existingRaport, setExistingRaport] = useState(null);

  const refreshPreviewData = useCallback(async () => {
    if (!selectedSemester) {
      return;
    }

    try {
      setLoading(true);
      const response = await raportApi.getPreviewData(anakId, selectedSemester);

      if (response.data.success) {
        setPreviewData(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || 'Gagal memuat preview raport');
      }
    } catch (err) {
      console.error('Error refreshing preview data:', err);
    } finally {
      setLoading(false);
    }
  }, [anakId, selectedSemester]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setLoadingData(true);
      const response = await semesterApi.getAllSemesters();

      if (response.data.success) {
        const list = response.data.data || [];
        setSemesters(list);
        const activeSemester = list.find(s => s.aktif);
        if (activeSemester) setSelectedSemester(activeSemester.id);
      }
  } catch (err) {
    console.error('Error fetching semesters:', err);
    if (err.response) console.log('API response:', err.response.data);
    setError('Gagal memuat data semester');
  } finally {
    setLoadingData(false);
  }
};

  const checkExistingRaport = async () => {
    try {
      const response = await raportApi.checkExistingRaport(anakId, selectedSemester);
      
      if (response.data.exists) {
        setExistingRaport(response.data.raport);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error checking existing raport:', err);
      return false;
    }
  };

  const handlePreview = async () => {
    if (!selectedSemester) {
      Alert.alert('Error', 'Silakan pilih semester terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const exists = await checkExistingRaport();
      if (exists) {
        Alert.alert(
          'Raport Sudah Ada',
          'Raport untuk anak dan semester ini sudah ada. Ingin melihat raport yang sudah ada?',
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Lihat Raport',
              onPress: () => navigation.navigate('RaportView', { 
                raportId: existingRaport.id_raport 
              })
            }
          ]
        );
        setLoading(false);
        return;
      }

      const response = await raportApi.getPreviewData(anakId, selectedSemester);

      if (response.data.success) {
        setPreviewData(response.data.data);
      } else {
        setError(
          response.data.message ||
            'Kurikulum untuk semester ini belum tersedia.'
        );
      }
    } catch (err) {
      console.error('Error getting preview:', err);
      const apiMessage = err.response?.data?.message;
      setError(
        apiMessage ||
          'Kurikulum untuk semester ini belum tersedia. Silakan hubungi admin.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleManageNilaiSikap = () => {
    if (!selectedSemester) {
      return;
    }

    const selectedOption = semesters.find(
      semester => String(semester.id ?? semester.id_semester) === String(selectedSemester)
    );

    navigation.navigate('NilaiSikap', {
      anakId,
      anakData,
      semesterId: selectedSemester,
      semesterName: selectedOption?.nama || selectedOption?.nama_semester,
      onNilaiSikapUpdated: refreshPreviewData
    });
  };

  const handleGenerate = async () => {
    Alert.alert(
      'Generate Raport',
      'Anda yakin ingin membuat raport untuk anak ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Buat Raport',
          onPress: async () => {
            try {
              setLoading(true);
              setError(null);

              const response = await raportApi.generateRaport({
                id_anak: anakId,
                id_semester: selectedSemester,
                catatan_wali_kelas: catatanWaliKelas
              });

              if (response.data.success) {
                Alert.alert(
                  'Sukses',
                  'Raport berhasil dibuat',
                  [{
                    text: 'Lihat Raport',
                    onPress: () => navigation.replace('RaportView', {
                      raportId: response.data.data.id_raport
                    })
                  }]
                );
              } else {
                setError(response.data.message || 'Gagal membuat raport');
              }
            } catch (err) {
              console.error('Error generating raport:', err);
              setError('Gagal membuat raport. Silakan coba lagi.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const renderAcademicPreview = () => {
    if (!previewData?.grades?.academic_details) return null;
    
    return (
      <View style={styles.academicSection}>
        <Text style={styles.previewSectionTitle}>Detail Nilai Akademik</Text>
        
        {previewData.grades.academic_details.map((subject, index) => (
          <View key={index} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <Text style={styles.subjectName}>{subject.mata_pelajaran}</Text>
              <Text style={styles.subjectAverage}>{subject.rata_rata}</Text>
            </View>
            
            <View style={styles.subjectStats}>
              <Text style={styles.statText}>
                {subject.total_penilaian} penilaian • {subject.completeness.toFixed(0)}% lengkap
              </Text>
            </View>
            
          </View>
        ))}
      </View>
    );
  };

  if (loadingData) {
    return <LoadingSpinner fullScreen message="Memuat data..." />;
  }

  return (
    <ScrollView style={styles.container}>
      {error && <ErrorMessage message={error} />}

      <View style={styles.formContainer}>
        {/* Student Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Data Anak</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#3498db" />
            <Text style={styles.infoText}>{anakData?.full_name || 'Unknown'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="barcode-outline" size={20} color="#3498db" />
            <Text style={styles.infoText}>NIK: {anakData?.nik_anak || '-'}</Text>
          </View>
        </View>

        {/* Semester Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pilih Semester *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedSemester}
              onValueChange={setSelectedSemester}
              style={styles.picker}
            >
              <Picker.Item label="Pilih Semester" value="" />
              {semesters.map(semester => (
                <Picker.Item
                  key={semester.id}
                  label={`${semester.nama || semester.nama_semester} - ${semester.tahun_ajaran} ${semester.aktif ? '(Aktif)' : ''}`}
                  value={semester.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Teacher Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catatan Wali Kelas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={catatanWaliKelas}
            onChangeText={setCatatanWaliKelas}
            placeholder="Catatan dari wali kelas (opsional)"
            multiline
            numberOfLines={4}
            maxLength={2000}
          />
          <Text style={styles.charCount}>{catatanWaliKelas.length}/2000</Text>
        </View>

        {/* Preview Button */}
        {!previewData && (
          <Button
            title="Preview Raport"
            onPress={handlePreview}
            loading={loading}
            disabled={loading || !selectedSemester}
            style={styles.previewButton}
          />
        )}

        {/* Preview Data */}
        {previewData && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview Raport</Text>
            
            {/* Attendance Preview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewSectionTitle}>Kehadiran</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Total Kehadiran:</Text>
                <Text style={styles.previewValue}>{previewData.attendance.total} hari</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Persentase:</Text>
                <Text style={styles.previewValue}>{previewData.attendance.percentage}%</Text>
              </View>
            </View>

            {/* Academic Overview */}
            <View style={styles.previewCard}>
              <Text style={styles.previewSectionTitle}>
                Ringkasan Akademik
              </Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Total Mata Pelajaran:</Text>
                <Text style={styles.previewValue}>{previewData.grades.total_subjects}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Rata-rata Keseluruhan:</Text>
                <Text style={styles.previewValue}>{previewData.grades.overall_average}</Text>
              </View>
            </View>

            {/* Detailed Academic Preview */}
            {renderAcademicPreview()}

            {/* Behavior Grades Preview */}
            {previewData.nilaiSikap && (
              <View style={styles.previewCard}>
                <Text style={styles.previewSectionTitle}>Nilai Sikap</Text>
                <View style={styles.previewRow}>
                  <Text style={styles.previewLabel}>Status:</Text>
                  <Text style={[
                    styles.previewValue,
                    { color: previewData.nilaiSikap.exists ? '#2ecc71' : '#e74c3c' }
                  ]}>
                    {previewData.nilaiSikap.exists ? 'Sudah diinput' : 'Belum diinput'}
                  </Text>
                </View>
                {previewData.nilaiSikap.exists && previewData.nilaiSikap.data && (
                  <View style={styles.nilaiSikapDetail}>
                    <Text style={styles.nilaiSikapText}>
                      Rata-rata: {previewData.nilaiSikap.data.rata_rata.toFixed(1)}
                    </Text>
                  </View>
                )}
                {!previewData.nilaiSikap.exists && (
                  <Button
                    title="Kelola Nilai Sikap"
                    onPress={handleManageNilaiSikap}
                    type="outline"
                    style={styles.manageNilaiSikapButton}
                  />
                )}
              </View>
            )}

            {/* Warnings */}
            {previewData.warnings && previewData.warnings.length > 0 && (
              <View style={styles.warningCard}>
                <Ionicons name="warning-outline" size={24} color="#e74c3c" />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Perhatian:</Text>
                  {previewData.warnings.map((warning, index) => (
                    <Text key={index} style={styles.warningText}>• {warning}</Text>
                  ))}
                </View>
              </View>
            )}

            {/* Generate Button */}
            <View style={styles.actionButtons}>
              <Button
                title="Generate Raport"
                onPress={handleGenerate}
                loading={loading}
                disabled={loading}
                style={styles.generateButton}
              />
              
              <Button
                title="Batal"
                onPress={() => {
                  setPreviewData(null);
                  setSelectedSemester('');
                }}
                type="outline"
                disabled={loading}
                style={styles.cancelButton}
              />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'right',
    marginTop: 4,
  },
  previewButton: {
    marginTop: 20,
  },
  previewContainer: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  previewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  academicSection: {
    marginBottom: 12,
  },
  subjectCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  subjectAverage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  subjectStats: {
    marginBottom: 8,
  },
  statText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  nilaiSikapDetail: {
    marginTop: 8,
  },
  nilaiSikapText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  warningCard: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#ffcccc',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 20,
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#c0392b',
    marginBottom: 4,
  },
  actionButtons: {
    marginTop: 20,
  },
  generateButton: {
    backgroundColor: '#2ecc71',
  },
  cancelButton: {
    marginTop: 12,
  },
  manageNilaiSikapButton: {
    marginTop: 12,
  },
});

export default RaportGenerateScreen;
