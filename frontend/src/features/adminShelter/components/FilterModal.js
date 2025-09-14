import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Button from '../../../common/components/Button';

const FilterModal = ({ visible, onClose, filters, onFiltersChange, onApply, onClear }) => {
  const [showDatePicker, setShowDatePicker] = useState(null);

  const statusOptions = [
    { key: null, label: 'Semua' },
    { key: 'present', label: 'Hadir' },
    { key: 'late', label: 'Terlambat' },
    { key: 'absent', label: 'Tidak Hadir' }
  ];

  const onDateChange = (event, selectedDate, type) => {
    setShowDatePicker(null);
    if (selectedDate) {
      onFiltersChange({
        ...filters,
        [type]: selectedDate.toISOString().split('T')[0]
      });
    }
  };

  const updateStatus = (status) => {
    onFiltersChange({
      ...filters,
      status
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Riwayat</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tanggal Mulai</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker('date_from')}
            >
              <Text style={styles.dateButtonText}>
                {filters.date_from || 'Pilih tanggal mulai'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tanggal Selesai</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowDatePicker('date_to')}
            >
              <Text style={styles.dateButtonText}>
                {filters.date_to || 'Pilih tanggal selesai'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Status Kehadiran</Text>
            <View style={styles.statusButtons}>
              {statusOptions.map(status => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.statusButton,
                    filters.status === status.key && styles.statusButtonActive
                  ]}
                  onPress={() => updateStatus(status.key)}
                >
                  <Text style={[
                    styles.statusButtonText,
                    filters.status === status.key && styles.statusButtonTextActive
                  ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Hapus Filter"
              onPress={onClear}
              type="outline"
              style={styles.clearButton}
            />
            <Button
              title="Terapkan"
              onPress={onApply}
              style={styles.applyButton}
            />
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => onDateChange(event, date, showDatePicker)}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  section: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff'
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333'
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff'
  },
  statusButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db'
  },
  statusButtonText: {
    fontSize: 14,
    color: '#333'
  },
  statusButtonTextActive: {
    color: '#fff'
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
  },
  clearButton: {
    flex: 1
  },
  applyButton: {
    flex: 1
  }
});

export default FilterModal;