import React from 'react';
import { Text, View } from 'react-native';

import styles from '../../styles/activityFormStyles';
import PickerSection from './PickerSection';

const KegiatanPickerSection = ({
  options,
  loading,
  error,
  onRetry,
  selectedValue,
  onChange,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>
      Jenis Kegiatan
      <Text style={styles.required}>*</Text>
    </Text>
    <PickerSection
      data={options}
      loading={loading}
      error={error}
      onRetry={onRetry}
      placeholder="Pilih jenis kegiatan"
      selectedValue={selectedValue}
      onValueChange={value => onChange(value || null)}
      labelKey="nama_kegiatan"
      valueKey="id_kegiatan"
    />
  </View>
);

export default KegiatanPickerSection;
