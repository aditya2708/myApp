import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import TextInput from '../../../../common/components/TextInput';
import { useFieldValidation } from '../../utils/keluargaFormHooks';
import { RELIGION_OPTIONS, INCOME_OPTIONS } from '../../utils/keluargaFormUtils';

const KeluargaFormStepParents = ({
  formData,
  onChange,
  setStepValid,
  validateStep
}) => {
  const { fieldErrors, validateField, clearFieldError } = useFieldValidation();
  const [showDatePicker, setShowDatePicker] = useState({
    fatherBirth: false,
    fatherDeath: false,
    motherBirth: false,
    motherDeath: false,
  });

  const isFatherDeceased = formData.status_ortu === 'yatim' || formData.status_ortu === 'yatim piatu';
  const isMotherDeceased = formData.status_ortu === 'piatu' || formData.status_ortu === 'yatim piatu';

  useEffect(() => {
    const isValid = validateStep();
    setStepValid(isValid);
  }, [
    formData.status_ortu,
    formData.nik_ayah,
    formData.nama_ayah,
    formData.tanggal_kematian_ayah,
    formData.penyebab_kematian_ayah,
    formData.nik_ibu,
    formData.nama_ibu,
    formData.tanggal_kematian_ibu,
    formData.penyebab_kematian_ibu,
  ]);

  useEffect(() => {
    if (!isFatherDeceased && (formData.tanggal_kematian_ayah || formData.penyebab_kematian_ayah)) {
      onChange('tanggal_kematian_ayah', '');
      onChange('penyebab_kematian_ayah', '');
    }
    
    if (!isMotherDeceased && (formData.tanggal_kematian_ibu || formData.penyebab_kematian_ibu)) {
      onChange('tanggal_kematian_ibu', '');
      onChange('penyebab_kematian_ibu', '');
    }
  }, [formData.status_ortu, isFatherDeceased, isMotherDeceased]);

  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    clearFieldError(fieldName);
  };

  const handleNIKChange = (fieldName, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    handleFieldChange(fieldName, numericValue);
    
    if (numericValue.length > 0 && numericValue.length !== 16) {
      validateField(fieldName, numericValue, { 
        nik: true,
        label: fieldName === 'nik_ayah' ? 'NIK Ayah' : 'NIK Ibu'
      });
    }
  };

  const toggleDatePicker = (field) => {
    setShowDatePicker(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleDateChange = (event, selectedDate, field) => {
    toggleDatePicker(field);
    
    if (selectedDate && event.type !== 'dismissed') {
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const formattedDate = `${day}-${month}-${year}`;
      
      const fieldMap = {
        fatherBirth: 'tanggal_lahir_ayah',
        fatherDeath: 'tanggal_kematian_ayah',
        motherBirth: 'tanggal_lahir_ibu',
        motherDeath: 'tanggal_kematian_ibu',
      };
      
      handleFieldChange(fieldMap[field], formattedDate);
    }
  };

  const clearDeathDate = (parent) => {
    if (parent === 'father') {
      onChange('tanggal_kematian_ayah', '');
      onChange('penyebab_kematian_ayah', '');
    } else {
      onChange('tanggal_kematian_ibu', '');
      onChange('penyebab_kematian_ibu', '');
    }
  };

  const renderDatePicker = (field, value, label, required = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{required && '*'}</Text>
      <View style={styles.dateInputContainer}>
        <TouchableOpacity
          style={[
            styles.dateInput,
            fieldErrors[value] && styles.dateInputError
          ]}
          onPress={() => toggleDatePicker(field)}
        >
          <Ionicons name="calendar-outline" size={20} color="#777" style={styles.dateIcon} />
          <Text style={styles.dateText}>
            {formData[value] || 'Pilih Tanggal'}
          </Text>
        </TouchableOpacity>
        {formData[value] && field.includes('Death') && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => clearDeathDate(field.includes('father') ? 'father' : 'mother')}
          >
            <Ionicons name="close-circle" size={24} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>
      {fieldErrors[value] && (
        <Text style={styles.errorText}>{fieldErrors[value]}</Text>
      )}
      
      {showDatePicker[field] && (
        <DateTimePicker
          value={formData[value] ? new Date(formData[value].split('-').reverse().join('-')) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, field)}
          maximumDate={new Date()}
        />
      )}
    </View>
  );

  const renderParentSection = (parent, isDeceased) => {
    const prefix = parent === 'ayah' ? 'ayah' : 'ibu';
    const label = parent === 'ayah' ? 'Ayah' : 'Ibu';
    const isDhuafa = formData.status_ortu === 'dhuafa';
    
    return (
      <View>
        <Text style={styles.sectionTitle}>Data {label}</Text>
        
        <TextInput
          label={`Nama Lengkap ${label}*`}
          value={formData[`nama_${prefix}`]}
          onChangeText={(value) => handleFieldChange(`nama_${prefix}`, value)}
          placeholder={`Masukkan nama lengkap ${parent}`}
          leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
          error={fieldErrors[`nama_${prefix}`]}
        />

        {isDeceased ? (
          <>
            {renderDatePicker(
              parent === 'ayah' ? 'fatherDeath' : 'motherDeath',
              `tanggal_kematian_${prefix}`,
              `Tanggal Kematian ${label}`,
              true
            )}
            
            <TextInput
              label={`Penyebab Kematian ${label}*`}
              value={formData[`penyebab_kematian_${prefix}`]}
              onChangeText={(value) => handleFieldChange(`penyebab_kematian_${prefix}`, value)}
              placeholder=""
              leftIcon={<Ionicons name="information-circle-outline" size={20} color="#777" />}
              error={fieldErrors[`penyebab_kematian_${prefix}`]}
            />
          </>
        ) : (
          <>
            <TextInput
              label={`NIK ${label}*`}
              value={formData[`nik_${prefix}`]}
              onChangeText={(value) => handleNIKChange(`nik_${prefix}`, value)}
              placeholder={`Masukkan 16 digit NIK ${parent}`}
              leftIcon={<Ionicons name="card-outline" size={20} color="#777" />}
              inputProps={{ maxLength: 16, keyboardType: 'numeric' }}
              error={fieldErrors[`nik_${prefix}`]}
            />
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Agama {label}{isDhuafa ? '*' : ''}</Text>
              <View style={[
                styles.pickerContainer,
                fieldErrors[`agama_${prefix}`] && styles.pickerContainerError
              ]}>
                <Picker
                  selectedValue={formData[`agama_${prefix}`]}
                  onValueChange={(value) => handleFieldChange(`agama_${prefix}`, value)}
                  style={styles.picker}
                >
                  {RELIGION_OPTIONS.map((option, index) => (
                    <Picker.Item 
                      key={index}
                      label={option.label} 
                      value={option.value} 
                    />
                  ))}
                </Picker>
              </View>
              {fieldErrors[`agama_${prefix}`] && (
                <Text style={styles.errorText}>{fieldErrors[`agama_${prefix}`]}</Text>
              )}
            </View>
            
            <TextInput
              label={`Tempat lahir${isDhuafa ? '*' : ''}`}
              value={formData[`tempat_lahir_${prefix}`]}
              onChangeText={(value) => handleFieldChange(`tempat_lahir_${prefix}`, value)}
              placeholder={`Masukkan tempat lahir ${parent}`}
              leftIcon={<Ionicons name="location-outline" size={20} color="#777" />}
              error={fieldErrors[`tempat_lahir_${prefix}`]}
            />
            
            {renderDatePicker(
              parent === 'ayah' ? 'fatherBirth' : 'motherBirth',
              `tanggal_lahir_${prefix}`,
              `Tanggal Lahir ${label}${isDhuafa ? '*' : ''}`,
              isDhuafa
            )}
            
            <TextInput
              label={`Alamat ${label}${isDhuafa ? '*' : ''}`}
              value={formData[`alamat_${prefix}`]}
              onChangeText={(value) => handleFieldChange(`alamat_${prefix}`, value)}
              placeholder={`Masukkan alamat lengkap ${parent}`}
              multiline
              inputProps={{ numberOfLines: 3 }}
              error={fieldErrors[`alamat_${prefix}`]}
            />
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Penghasilan Bulanan {label}{isDhuafa ? '*' : ''}</Text>
              <View style={[
                styles.pickerContainer,
                fieldErrors[`penghasilan_${prefix}`] && styles.pickerContainerError
              ]}>
                <Picker
                  selectedValue={formData[`penghasilan_${prefix}`]}
                  onValueChange={(value) => handleFieldChange(`penghasilan_${prefix}`, value)}
                  style={styles.picker}
                >
                  {INCOME_OPTIONS.map((option, index) => (
                    <Picker.Item 
                      key={index}
                      label={option.label} 
                      value={option.value} 
                    />
                  ))}
                </Picker>
              </View>
              {fieldErrors[`penghasilan_${prefix}`] && (
                <Text style={styles.errorText}>{fieldErrors[`penghasilan_${prefix}`]}</Text>
              )}
            </View>
          </>
        )}
        
        {!isDeceased && !isDhuafa && (
          <>
            {renderDatePicker(
              parent === 'ayah' ? 'fatherDeath' : 'motherDeath',
              `tanggal_kematian_${prefix}`,
              'Isi jika sudah meninggal'
            )}
            
            {formData[`tanggal_kematian_${prefix}`] && (
              <TextInput
                label="Penyebab Kematian"
                value={formData[`penyebab_kematian_${prefix}`]}
                onChangeText={(value) => handleFieldChange(`penyebab_kematian_${prefix}`, value)}
                placeholder=""
                leftIcon={<Ionicons name="information-circle-outline" size={20} color="#777" />}
              />
            )}
          </>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderParentSection('ayah', isFatherDeceased)}
      
      <View style={styles.separator} />
      
      {renderParentSection('ibu', isMotherDeceased)}
      
      <View style={styles.helperTextContainer}>
        <Text style={styles.helperText}>
          * Field yang ditampilkan disesuaikan dengan status anak.
        </Text>
      </View>
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
  pickerContainerError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
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
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 20,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  dateInputError: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  helperTextContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
  },
});

export default KeluargaFormStepParents;