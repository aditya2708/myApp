import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const SuratFilterSection = ({
  visible,
  filters,
  onClose,
  onApply,
  onClear
}) => {
  const [tempFilters, setTempFilters] = useState({
    start_date: null,
    end_date: null,
    is_read: null
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempFilters({
        start_date: filters.start_date ? new Date(filters.start_date) : null,
        end_date: filters.end_date ? new Date(filters.end_date) : null,
        is_read: filters.is_read
      });
    }
  }, [visible, filters]);

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setTempFilters(prev => ({
        ...prev,
        start_date: selectedDate
      }));
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setTempFilters(prev => ({
        ...prev,
        end_date: selectedDate
      }));
    }
  };

  const handleIsReadChange = (value) => {
    setTempFilters(prev => ({
      ...prev,
      is_read: prev.is_read === value ? null : value
    }));
  };

  const handleApply = () => {
    const formattedFilters = {
      start_date: tempFilters.start_date ? 
        tempFilters.start_date.toISOString().split('T')[0] : null,
      end_date: tempFilters.end_date ? 
        tempFilters.end_date.toISOString().split('T')[0] : null,
      is_read: tempFilters.is_read
    };
    onApply(formattedFilters);
  };

  const handleClear = () => {
    setTempFilters({
      start_date: null,
      end_date: null,
      is_read: null
    });
    onClear();
  };

  const formatDate = (date) => {
    if (!date) return 'Pilih tanggal';
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const hasActiveFilters = tempFilters.start_date || tempFilters.end_date || tempFilters.is_read !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Laporan Surat</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Date Range Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rentang Tanggal</Text>
              
              {/* Start Date */}
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <View style={styles.dateButtonContent}>
                  <Text style={styles.dateLabel}>Tanggal Mulai</Text>
                  <Text style={[
                    styles.dateValue,
                    !tempFilters.start_date && styles.dateValuePlaceholder
                  ]}>
                    {formatDate(tempFilters.start_date)}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={20} color="#9b59b6" />
              </TouchableOpacity>

              {/* End Date */}
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <View style={styles.dateButtonContent}>
                  <Text style={styles.dateLabel}>Tanggal Akhir</Text>
                  <Text style={[
                    styles.dateValue,
                    !tempFilters.end_date && styles.dateValuePlaceholder
                  ]}>
                    {formatDate(tempFilters.end_date)}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={20} color="#9b59b6" />
              </TouchableOpacity>
            </View>

            {/* Read Status Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status Baca</Text>
              
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    tempFilters.is_read === true && styles.statusButtonActive
                  ]}
                  onPress={() => handleIsReadChange(true)}
                >
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color={tempFilters.is_read === true ? "#fff" : "#4caf50"} 
                  />
                  <Text style={[
                    styles.statusButtonText,
                    tempFilters.is_read === true && styles.statusButtonTextActive
                  ]}>
                    Sudah Dibaca
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    tempFilters.is_read === false && styles.statusButtonActive
                  ]}
                  onPress={() => handleIsReadChange(false)}
                >
                  <Ionicons 
                    name="mail-unread" 
                    size={20} 
                    color={tempFilters.is_read === false ? "#fff" : "#f44336"} 
                  />
                  <Text style={[
                    styles.statusButtonText,
                    tempFilters.is_read === false && styles.statusButtonTextActive
                  ]}>
                    Belum Dibaca
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>Hapus Filter</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Terapkan Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={tempFilters.start_date || new Date()}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={tempFilters.end_date || new Date()}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  content: {
    paddingHorizontal: 20
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  dateButtonContent: {
    flex: 1
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  dateValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  dateValuePlaceholder: {
    color: '#999'
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  statusButtonActive: {
    backgroundColor: '#9b59b6',
    borderColor: '#9b59b6'
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8
  },
  statusButtonTextActive: {
    color: '#fff'
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9b59b6'
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9b59b6'
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#9b59b6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center'
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
});

export default SuratFilterSection;