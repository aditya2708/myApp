import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import PickerInput from '../../../common/components/PickerInput';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminShelterKeuanganApi } from '../api/adminShelterKeuanganApi';
import { adminShelterAnakApi } from '../api/adminShelterAnakApi';

const KeuanganFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { keuangan, isEdit } = route.params || {};

  const [formData, setFormData] = useState({
    id_anak: '',
    tingkat_sekolah: '',
    semester: '',
    bimbel: 0,
    eskul_dan_keagamaan: 0,
    laporan: 0,
    uang_tunai: 0,
    donasi: 0,
    subsidi_infak: 0,
  });

  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Options for dropdowns
  const tingkatSekolahOptions = [
    { label: 'SD', value: 'SD' },
    { label: 'SMP', value: 'SMP' },
    { label: 'SMA', value: 'SMA' },
    { label: 'SMK', value: 'SMK' },
  ];

  const semesterOptions = [
    { label: 'Semester 1', value: 'Semester 1' },
    { label: 'Semester 2', value: 'Semester 2' },
    { label: 'Semester Genap', value: 'Semester Genap' },
    { label: 'Semester Ganjil', value: 'Semester Ganjil' },
  ];

  useEffect(() => {
    fetchChildren();
    if (isEdit && keuangan) {
      setFormData({
        id_anak: keuangan.id_anak?.toString() || '',
        tingkat_sekolah: keuangan.tingkat_sekolah || '',
        semester: keuangan.semester || '',
        bimbel: parseNumber(keuangan.bimbel),
        eskul_dan_keagamaan: parseNumber(keuangan.eskul_dan_keagamaan),
        laporan: parseNumber(keuangan.laporan),
        uang_tunai: parseNumber(keuangan.uang_tunai),
        donasi: parseNumber(keuangan.donasi),
        subsidi_infak: parseNumber(keuangan.subsidi_infak),
      });
    }
  }, [isEdit, keuangan]);

  // Parse number from various formats
  const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? 0 : numValue;
  };

  // Format number to Indonesian currency display
  const formatCurrency = (value) => {
    const numValue = parseNumber(value);
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  // Parse currency input
  const parseCurrencyInput = (value) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    return cleaned === '' ? 0 : parseInt(cleaned, 10);
  };

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const response = await adminShelterAnakApi.getAllAnak();
      const childrenData = response.data.data || [];
      
      const childrenOptions = childrenData.map(child => ({
        label: `${child.full_name} (${child.nick_name || 'No nickname'})`,
        value: child.id_anak.toString(),
      }));
      
      setChildren(childrenOptions);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Gagal memuat data anak');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCurrencyInputChange = (field, value) => {
    const numericValue = parseCurrencyInput(value);
    setFormData(prev => ({
      ...prev,
      [field]: numericValue,
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.id_anak) errors.push('Pilih anak');
    if (!formData.tingkat_sekolah) errors.push('Pilih tingkat sekolah');
    if (!formData.semester) errors.push('Pilih semester');

    // Validate numeric fields
    const numericFields = ['bimbel', 'eskul_dan_keagamaan', 'laporan', 'uang_tunai', 'donasi', 'subsidi_infak'];
    numericFields.forEach(field => {
      const value = formData[field];
      if (value < 0) {
        errors.push(`${field.replace('_', ' ')} tidak boleh negatif`);
      }
      if (value > 999999999) {
        errors.push(`${field.replace('_', ' ')} terlalu besar`);
      }
    });

    if (errors.length > 0) {
      Alert.alert('Validasi Error', errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);

      // Prepare submit data - ensure all numeric fields are numbers
      const submitData = {
        ...formData,
        id_anak: parseInt(formData.id_anak),
        bimbel: parseNumber(formData.bimbel),
        eskul_dan_keagamaan: parseNumber(formData.eskul_dan_keagamaan),
        laporan: parseNumber(formData.laporan),
        uang_tunai: parseNumber(formData.uang_tunai),
        donasi: parseNumber(formData.donasi),
        subsidi_infak: parseNumber(formData.subsidi_infak),
      };

      if (isEdit) {
        await adminShelterKeuanganApi.updateKeuangan(keuangan.id_keuangan, submitData);
        Alert.alert('Berhasil', 'Data keuangan berhasil diperbarui');
      } else {
        await adminShelterKeuanganApi.createKeuangan(submitData);
        Alert.alert('Berhasil', 'Data keuangan berhasil ditambahkan');
      }

      navigation.goBack();
    } catch (err) {
      console.error('Error submitting keuangan:', err);
      
      let errorMessage = 'Gagal menyimpan data keuangan';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const errors = Object.values(err.response.data.errors).flat();
        errorMessage = errors.join('\n');
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCurrencyInput = (label, field, placeholder) => (
    <TextInput
      label={label}
      value={formatCurrency(formData[field])}
      onChangeText={(value) => handleCurrencyInputChange(field, value)}
      placeholder={placeholder}
      keyboardType="numeric"
    />
  );

  // Calculate totals for preview
  const calculateTotals = () => {
    const totalKebutuhan = parseNumber(formData.bimbel) + 
                          parseNumber(formData.eskul_dan_keagamaan) + 
                          parseNumber(formData.laporan) + 
                          parseNumber(formData.uang_tunai);
    
    const totalBantuan = parseNumber(formData.donasi) + parseNumber(formData.subsidi_infak);
    const sisaTagihan = Math.max(0, totalKebutuhan - totalBantuan);
    
    return { totalKebutuhan, totalBantuan, sisaTagihan };
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data..." />;
  }

  const { totalKebutuhan, totalBantuan, sisaTagihan } = calculateTotals();

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => setError(null)}
          />
        )}

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Informasi Dasar</Text>
          
          <PickerInput
            label="Anak *"
            value={formData.id_anak}
            onValueChange={(value) => handleInputChange('id_anak', value)}
            items={children}
            placeholder="Pilih Anak"
            disabled={isEdit}
          />

          <PickerInput
            label="Tingkat Sekolah *"
            value={formData.tingkat_sekolah}
            onValueChange={(value) => handleInputChange('tingkat_sekolah', value)}
            items={tingkatSekolahOptions}
            placeholder="Pilih Tingkat Sekolah"
          />

          <PickerInput
            label="Semester *"
            value={formData.semester}
            onValueChange={(value) => handleInputChange('semester', value)}
            items={semesterOptions}
            placeholder="Pilih Semester"
          />

          <Text style={styles.sectionTitle}>Kebutuhan Biaya</Text>
          
          {renderCurrencyInput('Bimbel', 'bimbel', 'Masukkan biaya bimbel')}
          {renderCurrencyInput('Eskul & Keagamaan', 'eskul_dan_keagamaan', 'Masukkan biaya eskul & keagamaan')}
          {renderCurrencyInput('Laporan', 'laporan', 'Masukkan biaya laporan')}
          {renderCurrencyInput('Uang Tunai', 'uang_tunai', 'Masukkan uang tunai')}

          <Text style={styles.sectionTitle}>Bantuan</Text>
          
          {renderCurrencyInput('Donasi', 'donasi', 'Masukkan jumlah donasi')}
          {renderCurrencyInput('Subsidi Infak', 'subsidi_infak', 'Masukkan subsidi infak')}

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Ringkasan</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Kebutuhan:</Text>
              <Text style={styles.summaryValue}>
                Rp {formatCurrency(totalKebutuhan)}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Bantuan:</Text>
              <Text style={styles.summaryValue}>
                Rp {formatCurrency(totalBantuan)}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sisa Tagihan:</Text>
              <Text style={[styles.summaryValue, { color: sisaTagihan > 0 ? '#e74c3c' : '#27ae60' }]}>
                Rp {formatCurrency(sisaTagihan)}
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Batal"
              onPress={() => navigation.goBack()}
              type="outline"
              style={styles.cancelButton}
            />
            <Button
              title={isEdit ? 'Perbarui' : 'Simpan'}
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting}
              style={styles.submitButton}
            />
          </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 20,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default KeuanganFormScreen;