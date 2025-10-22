import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import TextInput from '../../../../common/components/TextInput';
import { JOB_OPTIONS, EDUCATION_OPTIONS, PHYSICAL_CONDITION_OPTIONS } from '../../utils/keluargaFormUtils';

const KeluargaFormStepSurveyBasic = ({
  formData,
  onChange,
  setStepValid,
  validateStep
}) => {
  useEffect(() => {
    const validationResult = validateStep();
    setStepValid(validationResult === undefined ? true : !!validationResult);
  }, [
    formData.pekerjaan_kepala_keluarga,
    formData.pendidikan_kepala_keluarga,
    formData.jumlah_tanggungan,
    formData.kondisi_fisik_anak,
    formData.kepribadian_anak,
    formData.keterangan_disabilitas
  ]);

  const renderPicker = (label, value, options, field) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={value}
          onValueChange={(val) => onChange(field, val)}
          style={styles.picker}
        >
          {options.map((option, index) => (
            <Picker.Item key={index} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Data Dasar Survei</Text>

      {renderPicker('Pekerjaan Kepala Keluarga', formData.pekerjaan_kepala_keluarga, JOB_OPTIONS, 'pekerjaan_kepala_keluarga')}
      {renderPicker('Pendidikan Kepala Keluarga', formData.pendidikan_kepala_keluarga, EDUCATION_OPTIONS, 'pendidikan_kepala_keluarga')}

      <TextInput
        label="Jumlah Tanggungan"
        value={formData.jumlah_tanggungan}
        onChangeText={(value) => onChange('jumlah_tanggungan', value)}
        placeholder="Contoh: 4"
        leftIcon={<Ionicons name="people-outline" size={20} color="#777" />}
        inputProps={{ keyboardType: 'numeric' }}
      />

      <TextInput
        label="Kepribadian Anak"
        value={formData.kepribadian_anak}
        onChangeText={(value) => onChange('kepribadian_anak', value)}
        placeholder="Masukkan kepribadian anak"
        leftIcon={<Ionicons name="person-outline" size={20} color="#777" />}
      />

      {renderPicker('Kondisi Fisik Anak', formData.kondisi_fisik_anak, PHYSICAL_CONDITION_OPTIONS, 'kondisi_fisik_anak')}

      {formData.kondisi_fisik_anak === 'Disabilitas' && (
        <TextInput
          label="Keterangan Jenis Disabilitas"
          value={formData.keterangan_disabilitas}
          onChangeText={(value) => onChange('keterangan_disabilitas', value)}
          placeholder="Jelaskan jenis disabilitas"
          leftIcon={<Ionicons name="medical-outline" size={20} color="#777" />}
          inputProps={{ multiline: true, numberOfLines: 3 }}
        />
      )}
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
});

export default KeluargaFormStepSurveyBasic;