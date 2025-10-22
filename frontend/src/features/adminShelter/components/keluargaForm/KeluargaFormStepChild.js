import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { MediaTypeOptions } from 'expo-image-picker';

import TextInput from '../../../../common/components/TextInput';
import Button from '../../../../common/components/Button';
import { useFieldValidation } from '../../utils/keluargaFormHooks';
import { 
  RELIGION_OPTIONS, 
  GENDER_OPTIONS, 
  LIVING_WITH_OPTIONS, 
  HAFALAN_OPTIONS, 
  TRANSPORTATION_OPTIONS 
} from '../../utils/keluargaFormUtils';

const KeluargaFormStepChild = ({
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
    formData.nik_anak,
    formData.anak_ke,
    formData.dari_bersaudara,
    formData.nick_name,
    formData.full_name,
    formData.agama,
    formData.tempat_lahir,
    formData.tanggal_lahir,
    formData.jenis_kelamin,
    formData.tinggal_bersama,
    formData.hafalan,
    formData.pelajaran_favorit,
    formData.hobi,
    formData.prestasi,
    formData.jarak_rumah,
    formData.transportasi
  ]);

  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    clearFieldError(fieldName);
  };

  const handleNIKChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    handleFieldChange('nik_anak', numericValue);
    
    if (numericValue.length > 0 && numericValue.length !== 16) {
      validateField('nik_anak', numericValue, { 
        nik: true,
        label: 'NIK Anak'
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
      
      handleFieldChange('tanggal_lahir', formattedDate);
    }
  };

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Permission to access camera roll is required!');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets?.[0]) {
        handleFieldChange('foto', result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to select image');
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
      <Text style={styles.sectionTitle}>Data Anak</Text>
      
      <View style={styles.photoContainer}>
        <Text style={styles.label}>Foto Anak</Text>
        <View style={styles.photoContent}>
          {formData.foto ? (
            <Image 
              source={{ uri: formData.foto.uri }} 
              style={styles.photoPreview} 
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={40} color="#ddd" />
            </View>
          )}
          
          <Button
            title={formData.foto ? "Ganti Foto" : "Pilih Foto"}
            onPress={handleSelectImage}
            type="outline"
            size="small"
            style={styles.photoButton}
            leftIcon={<Ionicons name="camera-outline" size={18} color="#3498db" />}
          />
        </View>
      </View>
      
      <TextInput
        label="NIK Anak*"
        value={formData.nik_anak}
        onChangeText={handleNIKChange}
        placeholder="Masukkan 16 digit NIK anak"
        leftIcon={<Ionicons name="card-outline" size={20} color="#777" />}
        inputProps={{ maxLength: 16, keyboardType: 'numeric' }}
        error={fieldErrors.nik_anak}
      />
      
      <TextInput
        label="Anak ke*"
        value={formData.anak_ke}
        onChangeText={(value) => handleFieldChange('anak_ke', value)}
        placeholder="contoh: 2"
        leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
        inputProps={{ keyboardType: 'numeric' }}
        error={fieldErrors.anak_ke}
      />
      
      <TextInput
        label="Dari Berapa Bersaudara*"
        value={formData.dari_bersaudara}
        onChangeText={(value) => handleFieldChange('dari_bersaudara', value)}
        placeholder="Contoh: 2"
        leftIcon={<Ionicons name="people-outline" size={20} color="#777" />}
        inputProps={{ keyboardType: 'numeric' }}
        error={fieldErrors.dari_bersaudara}
      />
      
      <TextInput
        label="Nama Panggilan Anak*"
        value={formData.nick_name}
        onChangeText={(value) => handleFieldChange('nick_name', value)}
        placeholder="Masukkan nama panggilan"
        leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
        error={fieldErrors.nick_name}
      />
      
      <TextInput
        label="Nama Lengkap Anak*"
        value={formData.full_name}
        onChangeText={(value) => handleFieldChange('full_name', value)}
        placeholder="Masukkan nama lengkap anak"
        leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
        error={fieldErrors.full_name}
      />
      
      {renderPicker('Jenis Kelamin*', formData.jenis_kelamin, GENDER_OPTIONS, 'jenis_kelamin', true)}
      {renderPicker('Agama Anak*', formData.agama, RELIGION_OPTIONS, 'agama', true)}
      
      <TextInput
        label="Tempat Lahir*"
        value={formData.tempat_lahir}
        onChangeText={(value) => handleFieldChange('tempat_lahir', value)}
        placeholder="Masukkan tempat lahir anak"
        leftIcon={<Ionicons name="location-outline" size={20} color="#777" />}
        error={fieldErrors.tempat_lahir}
      />
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tanggal Lahir*</Text>
        <TouchableOpacity
          style={[
            styles.dateInput,
            fieldErrors.tanggal_lahir && styles.dateInputError
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#777" style={styles.dateIcon} />
          <Text style={styles.dateText}>
            {formData.tanggal_lahir || 'Pilih Tanggal'}
          </Text>
        </TouchableOpacity>
        {fieldErrors.tanggal_lahir && (
          <Text style={styles.errorText}>{fieldErrors.tanggal_lahir}</Text>
        )}
        
        {showDatePicker && (
          <DateTimePicker
            value={formData.tanggal_lahir ? new Date(formData.tanggal_lahir.split('-').reverse().join('-')) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
      
      {renderPicker('Tinggal Bersama*', formData.tinggal_bersama, LIVING_WITH_OPTIONS, 'tinggal_bersama', true)}
      {renderPicker('Jenis Pembinaan*', formData.hafalan, HAFALAN_OPTIONS, 'hafalan', true)}
      
      <TextInput
        label="Pelajaran Favorit"
        value={formData.pelajaran_favorit}
        onChangeText={(value) => handleFieldChange('pelajaran_favorit', value)}
        placeholder="Masukkan pelajaran favorit"
        leftIcon={<Ionicons name="book-outline" size={20} color="#777" />}
        error={fieldErrors.pelajaran_favorit}
      />

      <TextInput
        label="Hobi"
        value={formData.hobi}
        onChangeText={(value) => handleFieldChange('hobi', value)}
        placeholder="Masukkan hobi anak"
        leftIcon={<Ionicons name="happy-outline" size={20} color="#777" />}
        error={fieldErrors.hobi}
      />

      <TextInput
        label="Prestasi"
        value={formData.prestasi}
        onChangeText={(value) => handleFieldChange('prestasi', value)}
        placeholder="Masukkan prestasi anak"
        multiline
        inputProps={{ numberOfLines: 3 }}
        error={fieldErrors.prestasi}
      />
      
      <TextInput
        label="Jarak dari rumah ke shelter (dalam KM)*"
        value={formData.jarak_rumah}
        onChangeText={(value) => handleFieldChange('jarak_rumah', value)}
        placeholder="Masukkan jarak dalam kilometer"
        leftIcon={<Ionicons name="navigate-outline" size={20} color="#777" />}
        inputProps={{ keyboardType: 'numeric' }}
        error={fieldErrors.jarak_rumah}
      />
      
      {renderPicker('Transportasi*', formData.transportasi, TRANSPORTATION_OPTIONS, 'transportasi', true)}
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
  photoContainer: {
    marginBottom: 16,
  },
  photoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 16,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 16,
  },
  photoButton: {
    flex: 1,
  },
});

export default KeluargaFormStepChild;