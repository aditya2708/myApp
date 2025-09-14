import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DatePicker from '../../../common/components/DatePicker';
import Button from '../../../common/components/Button';

/**
 * Honor Period Filter Component
 * Modal for filtering honor history by date range, status, and year
 */
const HonorPeriodFilter = ({ 
  visible, 
  onClose, 
  filters, 
  onFiltersChange, 
  onApply, 
  onClear 
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'paid', label: 'Dibayar' }
  ];

  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      start_date: null,
      end_date: null,
      status: '',
      year: null
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClear();
    onClose();
  };

  const formatDate = (date) => {
    if (!date) return 'Pilih tanggal';
    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Riwayat Honor</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Date Range Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Periode Tanggal</Text>
              
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View style={styles.dateButtonContent}>
                  <Text style={styles.dateLabel}>Tanggal Mulai</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(localFilters.start_date)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <View style={styles.dateButtonContent}>
                  <Text style={styles.dateLabel}>Tanggal Akhir</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(localFilters.end_date)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Status Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status Honor</Text>
              <View style={styles.optionsGrid}>
                {statusOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      localFilters.status === option.value && styles.optionButtonSelected
                    ]}
                    onPress={() => handleFilterChange('status', option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      localFilters.status === option.value && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Year Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tahun</Text>
              <View style={styles.optionsGrid}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    !localFilters.year && styles.optionButtonSelected
                  ]}
                  onPress={() => handleFilterChange('year', null)}
                >
                  <Text style={[
                    styles.optionText,
                    !localFilters.year && styles.optionTextSelected
                  ]}>
                    Semua Tahun
                  </Text>
                </TouchableOpacity>
                {yearOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      localFilters.year === option.value && styles.optionButtonSelected
                    ]}
                    onPress={() => handleFilterChange('year', option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      localFilters.year === option.value && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Reset"
              onPress={handleClear}
              type="outline"
              style={styles.footerButton}
            />
            <Button
              title="Terapkan Filter"
              onPress={handleApply}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DatePicker
          value={localFilters.start_date ? new Date(localFilters.start_date) : new Date()}
          onChange={(date) => {
            handleFilterChange('start_date', date.toISOString().split('T')[0]);
            setShowStartDatePicker(false);
          }}
          onCancel={() => setShowStartDatePicker(false)}
          maximumDate={localFilters.end_date ? new Date(localFilters.end_date) : new Date()}
          title="Pilih Tanggal Mulai"
        />
      )}

      {showEndDatePicker && (
        <DatePicker
          value={localFilters.end_date ? new Date(localFilters.end_date) : new Date()}
          onChange={(date) => {
            handleFilterChange('end_date', date.toISOString().split('T')[0]);
            setShowEndDatePicker(false);
          }}
          onCancel={() => setShowEndDatePicker(false)}
          minimumDate={localFilters.start_date ? new Date(localFilters.start_date) : undefined}
          maximumDate={new Date()}
          title="Pilih Tanggal Akhir"
        />
      )}
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
    borderBottomColor: '#e1e8ed'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  content: {
    maxHeight: 400
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8
  },
  dateButtonContent: {
    marginLeft: 12,
    flex: 1
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  optionButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db'
  },
  optionText: {
    fontSize: 14,
    color: '#666'
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '500'
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12
  },
  footerButton: {
    flex: 1
  }
});

export default HonorPeriodFilter;