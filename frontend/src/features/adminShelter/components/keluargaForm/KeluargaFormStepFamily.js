import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import TextInput from '../../../../common/components/TextInput';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import { useFieldValidation } from '../../utils/keluargaFormHooks';
import { STATUS_OPTIONS } from '../../utils/keluargaFormUtils';

const KeluargaFormStepFamily = ({
  formData,
  onChange,
  dropdownData,
  setStepValid,
  validateStep,
  isLoadingDropdowns
}) => {
  const { fieldErrors, validateField, clearFieldError } = useFieldValidation();

  useEffect(() => {
    const isValid = validateStep();
    setStepValid(isValid);
  }, [
    formData.no_kk,
    formData.kepala_keluarga,
    formData.status_ortu,
    formData.id_bank,
    formData.no_rek,
    formData.an_rek,
    formData.no_tlp,
    formData.an_tlp
  ]);

  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    clearFieldError(fieldName);
  };

  const handleKKChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    handleFieldChange('no_kk', numericValue);
    
    if (numericValue.length > 0 && numericValue.length !== 16) {
      validateField('no_kk', numericValue, { 
        required: true, 
        custom: (val) => val.length !== 16 ? 'Nomor KK harus 16 digit' : null,
        label: 'Nomor KK'
      });
    }
  };

  const handleRekChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    handleFieldChange('no_rek', numericValue);
  };

  if (isLoadingDropdowns) {
    return <LoadingSpinner message="Memuat data form..." />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Data Keluarga</Text>
      
      <TextInput
        label="Nomor Kartu Keluarga*"
        value={formData.no_kk}
        onChangeText={handleKKChange}
        placeholder="Masukkan 16 digit nomor KK"
        leftIcon={<Ionicons name="card-outline" size={20} color="#777" />}
        inputProps={{ keyboardType: 'numeric', maxLength: 16 }}
        error={fieldErrors.no_kk}
      />
      
      <TextInput
        label="Nama Kepala Keluarga*"
        value={formData.kepala_keluarga}
        onChangeText={(value) => handleFieldChange('kepala_keluarga', value)}
        placeholder="Masukkan nama lengkap kepala keluarga"
        leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
        error={fieldErrors.kepala_keluarga}
      />
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Status Orang Tua*</Text>
        <View style={[
          styles.pickerContainer,
          fieldErrors.status_ortu && styles.pickerContainerError
        ]}>
          <Picker
            selectedValue={formData.status_ortu}
            onValueChange={(value) => handleFieldChange('status_ortu', value)}
            style={styles.picker}
          >
            {STATUS_OPTIONS.map((option, index) => (
              <Picker.Item 
                key={index}
                label={option.label} 
                value={option.value} 
              />
            ))}
          </Picker>
        </View>
        {fieldErrors.status_ortu && (
          <Text style={styles.errorText}>{fieldErrors.status_ortu}</Text>
        )}
      </View>
      
      <Text style={styles.sectionTitle}>Data Akun Bank</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bank*</Text>
        <View style={[
          styles.pickerContainer,
          fieldErrors.id_bank && styles.pickerContainerError
        ]}>
          <Picker
            selectedValue={formData.id_bank}
            onValueChange={(value) => handleFieldChange('id_bank', value)}
            style={styles.picker}
          >
            <Picker.Item label="-- Pilih Bank --" value="" />
            {dropdownData.bank.map((bank) => (
              <Picker.Item 
                key={bank.id_bank}
                label={bank.nama_bank} 
                value={bank.id_bank.toString()} 
              />
            ))}
          </Picker>
        </View>
        {fieldErrors.id_bank && (
          <Text style={styles.errorText}>{fieldErrors.id_bank}</Text>
        )}
      </View>
      
      <TextInput
        label="Nomor Rekening Bank*"
        value={formData.no_rek}
        onChangeText={handleRekChange}
        placeholder="Masukkan nomor rekening"
        leftIcon={<Ionicons name="card-outline" size={20} color="#777" />}
        inputProps={{ keyboardType: 'numeric' }}
        error={fieldErrors.no_rek}
      />
      
      <TextInput
        label="Atas Nama Rekening*"
        value={formData.an_rek}
        onChangeText={(value) => handleFieldChange('an_rek', value)}
        placeholder="Masukkan nama pemilik rekening"
        leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
        error={fieldErrors.an_rek}
      />
      
      <Text style={styles.sectionTitle}>Data Kontak</Text>
      
      <TextInput
        label="No Telepon*"
        value={formData.no_tlp}
        onChangeText={(value) => handleFieldChange('no_tlp', value)}
        placeholder="Masukkan nomor telepon"
        leftIcon={<Ionicons name="call-outline" size={20} color="#777" />}
        inputProps={{ keyboardType: 'phone-pad' }}
        error={fieldErrors.no_tlp}
      />
      
      <TextInput
        label="Nama Pemilik No Telepon*"
        value={formData.an_tlp}
        onChangeText={(value) => handleFieldChange('an_tlp', value)}
        placeholder="Masukkan nama pemilik telepon"
        leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
        error={fieldErrors.an_tlp}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  pickerContainerError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
});

export default KeluargaFormStepFamily;