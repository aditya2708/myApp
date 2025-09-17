import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Slider
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import API
import { raportApi } from '../api/raportApi';
import { semesterApi } from '../api/semesterApi';

const NilaiSikapFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { anakId, anakData, nilaiSikap, semesterId, onSuccess } = route.params || {};
  
  const isEdit = !!nilaiSikap;

  const [formData, setFormData] = useState({
    id_anak: anakId,
    id_semester: semesterId || nilaiSikap?.id_semester || '',
    kedisiplinan: nilaiSikap?.kedisiplinan || 80,
    kerjasama: nilaiSikap?.kerjasama || 80,
    tanggung_jawab: nilaiSikap?.tanggung_jawab || 80,
    sopan_santun: nilaiSikap?.sopan_santun || 80,
    catatan_sikap: nilaiSikap?.catatan_sikap || ''
  });

  const [activeSemester, setActiveSemester] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Nilai Sikap' : 'Input Nilai Sikap'
    });
    
    if (!isEdit && !semesterId) {
      fetchActiveSemester();
    }
  }, []);

  const fetchActiveSemester = async () => {
    try {
      const response = await semesterApi.getActive();
      if (response.data.success) {
        setActiveSemester(response.data.data);
        setFormData(prev => ({
          ...prev,
          id_semester: response.data.data.id_semester
        }));
      }
    } catch (err) {
      console.error('Error fetching active semester:', err);
      Alert.alert('Error', 'Gagal memuat data semester aktif');
    }
  };

  const handleSubmit = async () => {
    if (!formData.id_semester) {
      Alert.alert('Error', 'Semester tidak ditemukan');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      if (isEdit) {
        response = await raportApi.updateNilaiSikap(nilaiSikap.id_nilai_sikap, formData);
      } else {
        response = await raportApi.createNilaiSikap(formData);
      }

      if (response.data.success) {
        if (typeof onSuccess === 'function') {
          try {
            onSuccess();
          } catch (callbackError) {
            console.error('Error executing onSuccess callback:', callbackError);
          }
        }
        Alert.alert(
          'Sukses',
          isEdit ? 'Nilai sikap berhasil diperbarui' : 'Nilai sikap berhasil disimpan',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        setError(response.data.message || 'Gagal menyimpan nilai sikap');
      }
    } catch (err) {
      console.error('Error submitting nilai sikap:', err);
      setError('Gagal menyimpan nilai sikap. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPredikat = (nilai) => {
    if (nilai >= 90) return 'Sangat Baik';
    if (nilai >= 80) return 'Baik';
    if (nilai >= 70) return 'Cukup';
    return 'Perlu Pembinaan';
  };

  const getPredikatColor = (nilai) => {
    if (nilai >= 90) return '#2ecc71';
    if (nilai >= 80) return '#3498db';
    if (nilai >= 70) return '#f39c12';
    return '#e74c3c';
  };

  const renderNilaiSlider = (label, field, icon) => (
    <View style={styles.sliderGroup}>
      <View style={styles.sliderHeader}>
        <View style={styles.labelContainer}>
          <Ionicons name={icon} size={20} color="#3498db" />
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.nilaiContainer}>
          <Text style={styles.nilaiText}>{Math.round(formData[field])}</Text>
          <Text style={[styles.predikatText, { color: getPredikatColor(formData[field]) }]}>
            {getPredikat(formData[field])}
          </Text>
        </View>
      </View>
      
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        value={formData[field]}
        onValueChange={(value) => updateFormData(field, value)}
        minimumTrackTintColor="#3498db"
        maximumTrackTintColor="#ecf0f1"
        thumbTintColor="#2980b9"
      />
      
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabelText}>0</Text>
        <Text style={styles.sliderLabelText}>100</Text>
      </View>
    </View>
  );

  const getRataRata = () => {
    const total = formData.kedisiplinan + formData.kerjasama + 
                  formData.tanggung_jawab + formData.sopan_santun;
    return (total / 4).toFixed(1);
  };

  return (
    <ScrollView style={styles.container}>
      {error && <ErrorMessage message={error} />}

      <View style={styles.formContainer}>
        {/* Student & Semester Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color="#3498db" />
            <Text style={styles.infoLabel}>Nama Anak:</Text>
            <Text style={styles.infoText}>{anakData?.full_name || 'Unknown'}</Text>
          </View>
          
          {(activeSemester || nilaiSikap) && (
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={20} color="#3498db" />
              <Text style={styles.infoLabel}>Semester:</Text>
              <Text style={styles.infoText}>
                {activeSemester?.nama_semester || nilaiSikap?.semester?.nama_semester}
              </Text>
            </View>
          )}
        </View>

        {/* Nilai Sikap Sliders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Penilaian Sikap</Text>
          
          {renderNilaiSlider('Kedisiplinan', 'kedisiplinan', 'time-outline')}
          {renderNilaiSlider('Kerjasama', 'kerjasama', 'people-outline')}
          {renderNilaiSlider('Tanggung Jawab', 'tanggung_jawab', 'shield-checkmark-outline')}
          {renderNilaiSlider('Sopan Santun', 'sopan_santun', 'happy-outline')}
        </View>

        {/* Rata-rata */}
        <View style={styles.averageCard}>
          <Text style={styles.averageLabel}>Nilai Rata-rata</Text>
          <Text style={styles.averageValue}>{getRataRata()}</Text>
          <Text style={[styles.averagePredikat, { color: getPredikatColor(getRataRata()) }]}>
            {getPredikat(getRataRata())}
          </Text>
        </View>

        {/* Catatan Sikap */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catatan Sikap</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.catatan_sikap}
            onChangeText={(value) => updateFormData('catatan_sikap', value)}
            placeholder="Catatan tambahan mengenai sikap anak (opsional)"
            multiline
            numberOfLines={4}
            maxLength={1000}
          />
          <Text style={styles.charCount}>
            {formData.catatan_sikap.length}/1000
          </Text>
        </View>

        {/* Submit Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={isEdit ? 'Perbarui' : 'Simpan'}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />
          
          <Button
            title="Batal"
            onPress={() => navigation.goBack()}
            type="outline"
            style={styles.cancelButton}
            disabled={loading}
          />
        </View>
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 8,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  sliderGroup: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 8,
  },
  nilaiContainer: {
    alignItems: 'flex-end',
  },
  nilaiText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  predikatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  averageCard: {
    backgroundColor: '#3498db',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  averageLabel: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  averageValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  averagePredikat: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 20,
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
  buttonContainer: {
    marginTop: 30,
    marginBottom: 20,
  },
  cancelButton: {
    marginTop: 12,
  },
});