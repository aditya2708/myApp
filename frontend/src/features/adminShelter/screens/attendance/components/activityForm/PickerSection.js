import React from 'react';
import { View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import ErrorMessage from '../../../../../../common/components/ErrorMessage';
import styles from '../../styles/activityFormStyles';
import LoadingIndicator from './LoadingIndicator';

const PickerSection = ({
  data,
  loading,
  error,
  onRetry,
  placeholder,
  selectedValue,
  onValueChange,
  labelKey,
  valueKey,
}) => {
  if (loading) {
    return <LoadingIndicator loading={loading} text="Memuat..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={onRetry} style={styles.errorContainer} />;
  }

  return (
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={selectedValue ?? ''}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        <Picker.Item label={placeholder} value="" />
        {data.map(item => (
          <Picker.Item
            key={item[valueKey]}
            label={item[labelKey]}
            value={item[valueKey]}
          />
        ))}
      </Picker>
    </View>
  );
};

export default PickerSection;
