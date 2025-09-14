import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const AnakBinaanFilterSection = ({
  visible,
  filters,
  filterOptions,
  onClose,
  onApply,
  onClear
}) => {
  const [tempFilters, setTempFilters] = useState({
    start_date: null,
    end_date: null,
    jenisKegiatan: null
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempFilters({
        start_date: filters.start_date ? new Date(filters.start_date) : null,
        end_date: filters.end_date ? new Date(filters.end_date) : null,
        jenisKegiatan: filters.jenisKegiatan
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

  const handleActivityChange = (jenisKegiatan) => {
    setShowActivityModal(false);
    setTempFilters(prev => ({
      ...prev,
      jenisKegiatan: prev.jenisKegiatan === jenisKegiatan ? null : jenisKegiatan
    }));
  };

  const handleApply = () => {
    const formattedFilters = {
      start_date: tempFilters.start_date ? 
        tempFilters.start_date.toISOString().split('T')[0] : null,
      end_date: tempFilters.end_date ? 
        tempFilters.end_date.toISOString().split('T')[0] : null,
      jenisKegiatan: tempFilters.jenisKegiatan
    };
    onApply(formattedFilters);
  };

  const handleClear = () => {
    setTempFilters({
      start_date: null,
      end_date: null,
      jenisKegiatan: null
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

  const hasActiveFilters = tempFilters.start_date || tempFilters.end_date || tempFilters.jenisKegiatan;

  const renderActivityModal = () => (
    <Modal
      visible={showActivityModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowActivityModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilih Jenis Kegiatan</Text>
            <TouchableOpacity onPress={() => setShowActivityModal(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[
              styles.modalItem,
              !tempFilters.jenisKegiatan && styles.modalItemSelected
            ]}
            onPress={() => handleActivityChange(null)}
          >
            <Text style={[
              styles.modalItemText,
              !tempFilters.jenisKegiatan && styles.modalItemTextSelected
            ]}>
              Semua Kegiatan
            </Text>
            {!tempFilters.jenisKegiatan && (
              <Ionicons name="checkmark" size={20} color="#9b59b6" />
            )}
          </TouchableOpacity>
          
          <FlatList
            data={filterOptions.availableActivityTypes}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  tempFilters.jenisKegiatan === item && styles.modalItemSelected
                ]}
                onPress={() => handleActivityChange(item)}
              >
                <Text style={[
                  styles.modalItemText,
                  tempFilters.jenisKegiatan === item && styles.modalItemTextSelected
                ]}>
                  {item}
                </Text>
                {tempFilters.jenisKegiatan === item && (
                  <Ionicons name="checkmark" size={20} color="#9b59b6" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );

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
            <Text style={styles.title}>Filter Laporan Anak Binaan</Text>
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

            {/* Activity Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Jenis Kegiatan</Text>
              
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowActivityModal(true)}
              >
                <View style={styles.filterButtonContent}>
                  <Text style={styles.filterLabel}>Jenis Kegiatan</Text>
                  <Text style={[
                    styles.filterValue,
                    !tempFilters.jenisKegiatan && styles.filterValuePlaceholder
                  ]}>
                    {tempFilters.jenisKegiatan || 'Semua Kegiatan'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#9b59b6" />
              </TouchableOpacity>
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

          {renderActivityModal()}
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
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  filterButtonContent: {
    flex: 1
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  filterValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  filterValuePlaceholder: {
    color: '#999'
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalItemSelected: {
    backgroundColor: '#f8f4ff'
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    flex: 1
  },
  modalItemTextSelected: {
    color: '#9b59b6',
    fontWeight: '600'
  }
});

export default AnakBinaanFilterSection;