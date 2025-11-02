import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatTimeDisplay } from '../../utils/activityFormUtils';
import styles from '../../styles/activityFormStyles';

const TimePickerButton = ({ time, placeholder, onPress, icon = 'time' }) => {
  const formattedTime = formatTimeDisplay(time);

  return (
    <TouchableOpacity style={styles.timeButton} onPress={onPress}>
      <Text style={styles.timeText}>
        {formattedTime === 'Belum diatur' ? placeholder : formattedTime}
      </Text>
      <Ionicons name={icon} size={24} color="#3498db" />
    </TouchableOpacity>
  );
};

export default TimePickerButton;
