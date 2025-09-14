import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import TextInput from '../../../../common/components/TextInput';
import { 
  FREQUENCY_OPTIONS,
  ACTIVITY_OPTIONS,
  YES_NO_OPTIONS,
  BENEFICIARY_CONDITION_OPTIONS
} from '../../utils/keluargaFormUtils';

const KeluargaFormStepSurveyReligious = ({
  formData,
  onChange,
  setStepValid,
  validateStep
}) => {
  useEffect(() => {
    const isValid = validateStep();
    setStepValid(isValid);
  }, [
    formData.solat_lima_waktu,
    formData.membaca_alquran,
    formData.majelis_taklim,
    formData.membaca_koran,
    formData.pengurus_organisasi,
    formData.kondisi_penerima_manfaat
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
      <Text style={styles.sectionTitle}>Data Keagamaan & Sosial</Text>

      {renderPicker('Sholat Lima Waktu', formData.solat_lima_waktu, FREQUENCY_OPTIONS, 'solat_lima_waktu')}
      {renderPicker('Membaca Al-Quran', formData.membaca_alquran, FREQUENCY_OPTIONS, 'membaca_alquran')}
      {renderPicker('Majelis Taklim', formData.majelis_taklim, ACTIVITY_OPTIONS, 'majelis_taklim')}
      {renderPicker('Membaca Koran/Berita', formData.membaca_koran, FREQUENCY_OPTIONS, 'membaca_koran')}
      {renderPicker('Pengurus Organisasi', formData.pengurus_organisasi, YES_NO_OPTIONS, 'pengurus_organisasi')}

      {formData.pengurus_organisasi === 'Ya' && (
        <TextInput
          label="Pengurus Organisasi Sebagai"
          value={formData.pengurus_organisasi_sebagai}
          onChangeText={(value) => onChange('pengurus_organisasi_sebagai', value)}
          placeholder="Contoh: Ketua RT, Sekretaris Masjid"
          leftIcon={<Ionicons name="people-outline" size={20} color="#777" />}
        />
      )}

      {renderPicker('Kondisi Penerima Manfaat', formData.kondisi_penerima_manfaat, BENEFICIARY_CONDITION_OPTIONS, 'kondisi_penerima_manfaat')}
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

export default KeluargaFormStepSurveyReligious;