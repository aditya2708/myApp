import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import TextInput from '../../../../common/components/TextInput';
import { useFieldValidation } from '../../utils/keluargaFormHooks';
import { 
  EDUCATION_LEVEL_OPTIONS,
  SMA_MAJOR_OPTIONS,
  SEMESTER_OPTIONS,
  getGradeOptions
} from '../../utils/keluargaFormUtils';

const KeluargaFormStepEducation = ({
  formData,
  onChange,
  setStepValid,
  validateStep
}) => {
  const { fieldErrors, clearFieldError } = useFieldValidation();

  useEffect(() => {
    const isValid = validateStep();
    setStepValid(isValid);
  }, [
    formData.jenjang,
    formData.kelas,
    formData.nama_sekolah,
    formData.alamat_sekolah,
    formData.jurusan,
    formData.semester,
    formData.nama_pt,
    formData.alamat_pt
  ]);

  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
    clearFieldError(fieldName);
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

  const renderSchoolFields = () => (
    <>
      {renderPicker('Kelas*', formData.kelas, getGradeOptions(formData.jenjang), 'kelas', true)}
      
      {formData.jenjang === 'sma' && 
        renderPicker('Jurusan*', formData.jurusan, SMA_MAJOR_OPTIONS, 'jurusan', true)
      }
      
      <TextInput
        label="Nama Sekolah*"
        value={formData.nama_sekolah}
        onChangeText={(value) => handleFieldChange('nama_sekolah', value)}
        placeholder=""
        leftIcon={<Ionicons name="school-outline" size={20} color="#777" />}
        error={fieldErrors.nama_sekolah}
      />
      
      <TextInput
        label="Alamat Sekolah*"
        value={formData.alamat_sekolah}
        onChangeText={(value) => handleFieldChange('alamat_sekolah', value)}
        placeholder=""
        multiline
        inputProps={{ numberOfLines: 3 }}
        error={fieldErrors.alamat_sekolah}
      />
    </>
  );

  const renderCollegeFields = () => (
    <>
      {renderPicker('Semester*', formData.semester, SEMESTER_OPTIONS, 'semester', true)}
      
      <TextInput
        label="Jurusan*"
        value={formData.jurusan}
        onChangeText={(value) => handleFieldChange('jurusan', value)}
        placeholder=""
        leftIcon={<Ionicons name="book-outline" size={20} color="#777" />}
        error={fieldErrors.jurusan}
      />
      
      <TextInput
        label="Nama Perguruan Tinggi*"
        value={formData.nama_pt}
        onChangeText={(value) => handleFieldChange('nama_pt', value)}
        placeholder=""
        leftIcon={<Ionicons name="school-outline" size={20} color="#777" />}
        error={fieldErrors.nama_pt}
      />
      
      <TextInput
        label="Alamat Perguruan Tinggi*"
        value={formData.alamat_pt}
        onChangeText={(value) => handleFieldChange('alamat_pt', value)}
        placeholder=""
        leftIcon={<Ionicons name="location-outline" size={20} color="#777" />}
        multiline
        inputProps={{ numberOfLines: 3 }}
        error={fieldErrors.alamat_pt}
      />
    </>
  );

  const renderConditionalFields = () => {
    const { jenjang } = formData;
    
    if (jenjang === 'belum_sd') {
      return (
        <View style={styles.helperTextContainer}>
          <Text style={styles.helperText}>
            Anak belum memulai pendidikan formal.
          </Text>
        </View>
      );
    }
    
    if (['sd', 'smp', 'sma'].includes(jenjang)) {
      return renderSchoolFields();
    }
    
    if (jenjang === 'perguruan_tinggi') {
      return renderCollegeFields();
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Data Pendidikan</Text>
      
      {renderPicker('Tingkat Pendidikan*', formData.jenjang, EDUCATION_LEVEL_OPTIONS, 'jenjang', true)}
      
      {renderConditionalFields()}
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
  helperTextContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
  },
});

export default KeluargaFormStepEducation;