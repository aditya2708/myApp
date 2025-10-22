import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { 
  MEAL_OPTIONS,
  WATER_SOURCE_OPTIONS,
  TOILET_OPTIONS,
  TRASH_OPTIONS,
  YES_NO_OPTIONS,
  AVAILABILITY_OPTIONS,
  FREQUENCY_OPTIONS
} from '../../utils/keluargaFormUtils';

const KeluargaFormStepSurveyHealth = ({
  formData,
  onChange,
  setStepValid
}) => {
  useEffect(() => {
    setStepValid(true);
  }, [setStepValid]);

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
      <Text style={styles.sectionTitle}>Data Kesehatan</Text>

      {renderPicker('Jumlah Makan per Hari', formData.jumlah_makan, MEAL_OPTIONS, 'jumlah_makan')}
      {renderPicker('Sumber Air Bersih', formData.sumber_air_bersih, WATER_SOURCE_OPTIONS, 'sumber_air_bersih')}
      {renderPicker('Jamban/Limbah', formData.jamban_limbah, TOILET_OPTIONS, 'jamban_limbah')}
      {renderPicker('Tempat Sampah', formData.tempat_sampah, TRASH_OPTIONS, 'tempat_sampah')}
      {renderPicker('Ada yang Merokok', formData.perokok, YES_NO_OPTIONS, 'perokok')}
      {renderPicker('Konsumen Minuman Keras', formData.konsumen_miras, YES_NO_OPTIONS, 'konsumen_miras')}
      {renderPicker('Persediaan P3K', formData.persediaan_p3k, AVAILABILITY_OPTIONS, 'persediaan_p3k')}
      {renderPicker('Makan Buah dan Sayur', formData.makan_buah_sayur, FREQUENCY_OPTIONS, 'makan_buah_sayur')}
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

export default KeluargaFormStepSurveyHealth;