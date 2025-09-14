import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import TextInput from '../../../../common/components/TextInput';
import { useFieldValidation } from '../../utils/keluargaFormHooks';
import { RELIGION_OPTIONS, INCOME_OPTIONS, RELATION_OPTIONS } from '../../utils/keluargaFormUtils';

const KeluargaFormStepGuardian = ({
  formData,
  onChange,
  setStepValid,
  validateStep
}) => {
  const { fieldErrors, validateField, clearFieldError } = useFieldValidation();
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const isValid = validateStep();
    setStepValid(isValid);
  }, [
    formData.nik_wali,
    formData.nama_wali,
    formData.agama_wali,
    formData.tempat_lahir_wali,
    formData.tanggal_lahir_wali,
    formData.alamat_wali,
    formData.penghasilan_wali,
    formData.hub_kerabat_wali
  ]);

  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    clearFieldError(fieldName);
  };

  const handleNIKChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    handleFieldChange('nik_wali', numericValue);
    
    if (numericValue.length > 0 && numericValue.length !== 16) {
      validateField('nik_wali', numericValue, { 
        nik: true,
        label: 'NIK Wali'
      });
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    
    if (selectedDate && event.type !== 'dismissed') {
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      
      handleFieldChange('tanggal_lahir_wali', formattedDate);
    }
  };

  const renderPicker = (label, value, options, field, required = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && '*'}</Text>
      <View style={[
        styles.pickerContainer,
        fieldErrors[field] && styles.pickerContainerError
      ]}>
        <Picker
          selectedValue={value}
          onValueChange={(val) => handleFieldChange(field, val)}
          style={styles.picker}
        >
          {options.map((option, index) => (
            <Picker.Item 
              key={index}
              label={option.label} 
              value={option.value} 
            />
          ))}
        </Picker>
      </View>
      {fieldErrors[field] && (
        <Text style={styles.errorText}>{fieldErrors[field]}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Data Wali</Text>
      
      <TextInput
        label="NIK Wali*"
        value={formData.nik_wali}
        onChangeText={handleNIKChange}
        placeholder="Masukkan 16 digit NIK wali"
        leftIcon={<Ionicons name="card-outline" size={20} color="#777" />}
        inputProps={{ maxLength: 16, keyboardType: 'numeric' }}
        error={fieldErrors.nik_wali}
      />
      
      <TextInput
        label="Nama Lengkap*"
        value={formData.nama_wali}
        onChangeText={(value) => handleFieldChange('nama_wali', value)}
        placeholder="Masukkan nama lengkap wali"
        leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
        error={fieldErrors.nama_wali}
      />
      
      {renderPicker('Hubungan Kerabat*', formData.hub_kerabat_wali, RELATION_OPTIONS, 'hub_kerabat_wali', true)}
      {renderPicker('Agama Wali*', formData.agama_wali, RELIGION_OPTIONS, 'agama_wali', true)}
      
      <TextInput
        label="Tempat Lahir Wali*"
        value={formData.tempat_lahir_wali}
        onChangeText={(value) => handleFieldChange('tempat_lahir_wali', value)}
        placeholder="Masukkan tempat lahir wali"
        leftIcon={<Ionicons name="location-outline" size={20} color="#777" />}
        error={fieldErrors.tempat_lahir_wali}
      />
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tanggal Lahir Wali*</Text>
        <TouchableOpacity
          style={[
            styles.dateInput,
            fieldErrors.tanggal_lahir_wali && styles.dateInputError
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#777" style={styles.dateIcon} />
          <Text style={styles.dateText}>
            {formData.tanggal_lahir_wali || 'Pilih Tanggal'}
          </Text>
        </TouchableOpacity>
        {fieldErrors.tanggal_lahir_wali && (
          <Text style={styles.errorText}>{fieldErrors.tanggal_lahir_wali}</Text>
        )}
        
        {showDatePicker && (
          <DateTimePicker
            value={formData.tanggal_lahir_wali ? new Date(formData.tanggal_lahir_wali.split('-').reverse().join('-')) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
      
      <TextInput
        label="Alamat Wali*"
        value={formData.alamat_wali}
        onChangeText={(value) => handleFieldChange('alamat_wali', value)}
        placeholder="Masukkan alamat lengkap wali"
        multiline
        inputProps={{ numberOfLines: 3 }}
        error={fieldErrors.alamat_wali}
      />
      
      {renderPicker('Penghasilan Bulanan*', formData.penghasilan_wali, INCOME_OPTIONS, 'penghasilan_wali', true)}
    </View>
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
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  dateInputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
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

export default KeluargaFormStepGuardian;