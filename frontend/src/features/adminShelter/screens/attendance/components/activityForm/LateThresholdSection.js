import React from 'react';
import {
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import styles from '../../styles/activityFormStyles';
import TimePickerButton from './TimePickerButton';

const LateThresholdSection = ({
  formData,
  uiState,
  setUIState,
  onToggleCustomLateThreshold,
  onTimeChange,
  onFieldChange,
}) => (
  <>
    <View style={styles.sectionHeader}>
      <Ionicons name="alert-circle-outline" size={20} color="#e74c3c" style={styles.sectionIcon} />
      <Text style={styles.sectionTitle}>Pengaturan Keterlambatan</Text>
    </View>

    <View style={styles.inputGroup}>
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Gunakan waktu terlambat khusus</Text>
        <Switch
          value={uiState.useCustomLateThreshold}
          onValueChange={onToggleCustomLateThreshold}
          trackColor={{ false: '#bdc3c7', true: '#2ecc71' }}
          thumbColor={uiState.useCustomLateThreshold ? '#27ae60' : '#ecf0f1'}
        />
      </View>

      {uiState.useCustomLateThreshold ? (
        <View style={styles.nestedInput}>
          <Text style={styles.nestedLabel}>Waktu Terlambat</Text>
          <TimePickerButton
            time={formData.late_threshold}
            placeholder="Ketuk untuk mengatur batas terlambat"
            onPress={() => setUIState(prev => ({ ...prev, showLateThresholdPicker: true }))}
            icon="alert-circle"
          />

          {uiState.showLateThresholdPicker && (
            <DateTimePicker
              value={formData.late_threshold || new Date()}
              mode="time"
              is24Hour
              display="default"
              onChange={(event, time) => onTimeChange(event, time, 'late_threshold', 'showLateThresholdPicker')}
            />
          )}
          <Text style={styles.helperText}>
            Siswa dianggap terlambat jika datang setelah waktu ini
          </Text>
        </View>
      ) : (
        <View style={styles.nestedInput}>
          <Text style={styles.nestedLabel}>Batas Waktu Terlambat (menit)</Text>
          <TextInput
            style={styles.minutesInput}
            value={formData.late_minutes_threshold.toString()}
            onChangeText={value => onFieldChange('late_minutes_threshold', Number.parseInt(value, 10) || 0)}
            keyboardType="number-pad"
            placeholder="15"
          />
          <Text style={styles.helperText}>
            Siswa dianggap terlambat jika datang {formData.late_minutes_threshold} menit setelah waktu mulai
          </Text>
        </View>
      )}
    </View>
  </>
);

export default LateThresholdSection;
