import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { 
  LAND_OWNERSHIP_OPTIONS, 
  HOUSE_OWNERSHIP_OPTIONS,
  WALL_CONDITION_OPTIONS,
  FLOOR_CONDITION_OPTIONS,
  VEHICLE_OPTIONS,
  ELECTRONIC_OPTIONS 
} from '../../utils/keluargaFormUtils';

const KeluargaFormStepSurveyAssets = ({
  formData,
  onChange,
  setStepValid,
  validateStep
}) => {
  useEffect(() => {
    const isValid = validateStep();
    setStepValid(isValid);
  }, [
    formData.kepemilikan_tanah,
    formData.kepemilikan_rumah,
    formData.kondisi_rumah_dinding,
    formData.kondisi_rumah_lantai,
    formData.kepemilikan_kendaraan,
    formData.kepemilikan_elektronik
  ]);

  const renderPicker = (label, value, options, field) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}*</Text>
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
      <Text style={styles.sectionTitle}>Data Aset</Text>

      {renderPicker('Kepemilikan Tanah', formData.kepemilikan_tanah, LAND_OWNERSHIP_OPTIONS, 'kepemilikan_tanah')}
      {renderPicker('Kepemilikan Rumah', formData.kepemilikan_rumah, HOUSE_OWNERSHIP_OPTIONS, 'kepemilikan_rumah')}
      {renderPicker('Kondisi Dinding Rumah', formData.kondisi_rumah_dinding, WALL_CONDITION_OPTIONS, 'kondisi_rumah_dinding')}
      {renderPicker('Kondisi Lantai Rumah', formData.kondisi_rumah_lantai, FLOOR_CONDITION_OPTIONS, 'kondisi_rumah_lantai')}
      {renderPicker('Kepemilikan Kendaraan', formData.kepemilikan_kendaraan, VEHICLE_OPTIONS, 'kepemilikan_kendaraan')}
      {renderPicker('Kepemilikan Elektronik', formData.kepemilikan_elektronik, ELECTRONIC_OPTIONS, 'kepemilikan_elektronik')}
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

export default KeluargaFormStepSurveyAssets;