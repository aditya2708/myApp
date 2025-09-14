import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

import TextInput from '../../../../common/components/TextInput';
import { FINANCIAL_INCOME_OPTIONS, SAVINGS_OPTIONS, ASSISTANCE_OPTIONS } from '../../utils/keluargaFormUtils';

const KeluargaFormStepSurveyFinancial = ({
  formData,
  onChange,
  setStepValid,
  validateStep
}) => {
  useEffect(() => {
    const isValid = validateStep();
    setStepValid(isValid);
  }, [
    formData.penghasilan,
    formData.kepemilikan_tabungan,
    formData.biaya_pendidikan_perbulan,
    formData.bantuan_lembaga_formal_lain
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
      <Text style={styles.sectionTitle}>Data Keuangan</Text>

      {renderPicker('Penghasilan Bulanan', formData.penghasilan, FINANCIAL_INCOME_OPTIONS, 'penghasilan')}
      {renderPicker('Kepemilikan Tabungan', formData.kepemilikan_tabungan, SAVINGS_OPTIONS, 'kepemilikan_tabungan')}

      <TextInput
        label="Biaya Pendidikan per Bulan*"
        value={formData.biaya_pendidikan_perbulan}
        onChangeText={(value) => onChange('biaya_pendidikan_perbulan', value)}
        placeholder="Contoh: 500000"
        leftIcon={<Ionicons name="school-outline" size={20} color="#777" />}
        inputProps={{ keyboardType: 'numeric' }}
      />

      {renderPicker('Bantuan Lembaga Formal Lain', formData.bantuan_lembaga_formal_lain, ASSISTANCE_OPTIONS, 'bantuan_lembaga_formal_lain')}

      {formData.bantuan_lembaga_formal_lain === 'Ya' && (
        <TextInput
          label="Jumlah Bantuan per Bulan"
          value={formData.bantuan_lembaga_formal_lain_sebesar}
          onChangeText={(value) => onChange('bantuan_lembaga_formal_lain_sebesar', value)}
          placeholder="Contoh: 200000"
          leftIcon={<Ionicons name="cash-outline" size={20} color="#777" />}
          inputProps={{ keyboardType: 'numeric' }}
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

export default KeluargaFormStepSurveyFinancial;