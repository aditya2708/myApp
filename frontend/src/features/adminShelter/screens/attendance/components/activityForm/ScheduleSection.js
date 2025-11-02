import React from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import styles from '../../styles/activityFormStyles';
import TimePickerButton from './TimePickerButton';

const ScheduleSection = ({
  formData,
  uiState,
  setUIState,
  onFieldChange,
  onTimeChange,
  durationMinutes,
  minDuration,
}) => (
  <>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        Tanggal
        <Text style={styles.required}>*</Text>
      </Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setUIState(prev => ({ ...prev, showDatePicker: true }))}
      >
        <Text style={styles.dateText}>{format(formData.tanggal, 'dd MMMM yyyy')}</Text>
        <Ionicons name="calendar" size={24} color="#3498db" />
      </TouchableOpacity>

      {uiState.showDatePicker && (
        <DateTimePicker
          value={formData.tanggal}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setUIState(prev => ({ ...prev, showDatePicker: false }));
            if (date) onFieldChange('tanggal', date);
          }}
        />
      )}
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Waktu Mulai</Text>
      <TimePickerButton
        time={formData.start_time}
        placeholder="Ketuk untuk mengatur waktu mulai"
        onPress={() => setUIState(prev => ({ ...prev, showStartTimePicker: true }))}
      />

      {uiState.showStartTimePicker && (
        <DateTimePicker
          value={formData.start_time || new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, time) => onTimeChange(event, time, 'start_time', 'showStartTimePicker')}
        />
      )}
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Waktu Selesai</Text>
      <TimePickerButton
        time={formData.end_time}
        placeholder="Ketuk untuk mengatur waktu selesai"
        onPress={() => setUIState(prev => ({ ...prev, showEndTimePicker: true }))}
      />

      {uiState.showEndTimePicker && (
        <DateTimePicker
          value={formData.end_time || new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={(event, time) => onTimeChange(event, time, 'end_time', 'showEndTimePicker')}
        />
      )}
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Durasi Kegiatan</Text>
      <TextInput
        style={[styles.input, styles.disabledInput]}
        value={durationMinutes !== null ? `${durationMinutes} menit` : 'Durasi belum tersedia'}
        editable={false}
      />
      {durationMinutes !== null && durationMinutes < minDuration && (
        <Text style={[styles.helperText, styles.durationWarning]}>
          Durasi minimal kegiatan adalah {minDuration} menit.
        </Text>
      )}
    </View>
  </>
);

export default ScheduleSection;
