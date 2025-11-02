import React from 'react';
import { Text, View } from 'react-native';

import styles from '../../styles/activityFormStyles';
import PickerSection from './PickerSection';

const TutorPickerSection = ({
  tutors,
  loading,
  error,
  onRetry,
  selectedValue,
  onChange,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>
      Tutor yang Ditugaskan
      <Text style={styles.required}>*</Text>
    </Text>
    <PickerSection
      data={tutors}
      loading={loading}
      error={error}
      onRetry={onRetry}
      placeholder="Pilih tutor"
      selectedValue={selectedValue}
      onValueChange={(value) => onChange(value || null)}
      labelKey="nama"
      valueKey="id_tutor"
    />
  </View>
);

export default TutorPickerSection;
