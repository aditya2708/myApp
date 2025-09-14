import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
/**
 * Attendance Filter Component
 * Provides filtering options for attendance records
 * 
 * @param {Object} props - Component props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onApplyFilters - Callback when filters are applied
 * @param {Function} props.onResetFilters - Callback to reset filters
 */
const AttendanceFilter = ({ 
  filters = {},
  onApplyFilters,
  onResetFilters
}) => {
  // Default filter values
  const defaultFilters = {
    dateFrom: null,
    dateTo: null,
    status: 'all',      // 'all', 'present', 'absent'
    verification: 'all', // 'all', 'verified', 'pending', 'rejected'
    verificationMethod: 'all' // 'all', 'qr_code', 'manual', 'face_recognition', 'dual'
  };
  
  // Local state
  const [isVisible, setIsVisible] = useState(false);
  const [localFilters, setLocalFilters] = useState({...defaultFilters, ...filters});
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  
  // Update local state when props change
  useEffect(() => {
    setLocalFilters({...defaultFilters, ...filters});
  }, [filters]);
  
  // Show the filter modal
  const openFilter = () => {
    setIsVisible(true);
  };
  
  // Hide the filter modal
  const closeFilter = () => {
    setIsVisible(false);
  };
  
  // Apply filters and close modal
  const applyFilters = () => {
    onApplyFilters(localFilters);
    closeFilter();
  };
  
  // Reset filters to defaults
  const resetFilters = () => {
    setLocalFilters(defaultFilters);
    onResetFilters();
    closeFilter();
  };
  
  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date changes
  const handleDateChange = (event, selectedDate, field) => {
    setShowFromDatePicker(false);
    setShowToDatePicker(false);
    
    if (selectedDate) {
      setLocalFilters(prev => ({
        ...prev,
        [field]: selectedDate
      }));
    }
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return format(new Date(activity.tanggal), 'EEEE, dd MMMM yyyy', { locale: id });
  };
  
  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.verification && filters.verification !== 'all') count++;
    if (filters.verificationMethod && filters.verificationMethod !== 'all') count++;
    
    return count;
  };
  
  return (
    <>
      {/* Filter Button */}
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={openFilter}
      >
        <Ionicons name="filter" size={20} color="#fff" />
        <Text style={styles.filterButtonText}>Filter</Text>
        
        {getActiveFiltersCount() > 0 && (
          <View style={styles.filterCountBadge}>
            <Text style={styles.filterCountText}>{getActiveFiltersCount()}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {/* Filter Modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeFilter}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Attendance</Text>
              <TouchableOpacity onPress={closeFilter}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Filter Form */}
            <ScrollView style={styles.modalBody}>
              {/* Date Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Date Range</Text>
                
                {/* From Date */}
                <View style={styles.datePickerRow}>
                  <Text style={styles.dateLabel}>From:</Text>
                  <TouchableOpacity 
                    style={styles.datePicker}
                    onPress={() => setShowFromDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {localFilters.dateFrom ? formatDate(localFilters.dateFrom) : 'Not set'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#3498db" />
                  </TouchableOpacity>
                  
                  {showFromDatePicker && (
                    <DateTimePicker
                      value={localFilters.dateFrom || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, date) => handleDateChange(event, date, 'dateFrom')}
                    />
                  )}
                </View>
                
                {/* To Date */}
                <View style={styles.datePickerRow}>
                  <Text style={styles.dateLabel}>To:</Text>
                  <TouchableOpacity 
                    style={styles.datePicker}
                    onPress={() => setShowToDatePicker(true)}
                  >
                    <Text style={styles.dateText}>
                      {localFilters.dateTo ? formatDate(localFilters.dateTo) : 'Not set'}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#3498db" />
                  </TouchableOpacity>
                  
                  {showToDatePicker && (
                    <DateTimePicker
                      value={localFilters.dateTo || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, date) => handleDateChange(event, date, 'dateTo')}
                    />
                  )}
                </View>
              </View>
              
              {/* Attendance Status */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Attendance Status</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.status === 'all' && styles.filterOptionActive
                    ]}
                    onPress={() => handleFilterChange('status', 'all')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.status === 'all' && styles.filterOptionActiveText
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.status === 'present' && styles.filterOptionActive,
                      localFilters.status === 'present' && { backgroundColor: '#2ecc71' }
                    ]}
                    onPress={() => handleFilterChange('status', 'present')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.status === 'present' && styles.filterOptionActiveText
                    ]}>
                      Present
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.status === 'absent' && styles.filterOptionActive,
                      localFilters.status === 'absent' && { backgroundColor: '#e74c3c' }
                    ]}
                    onPress={() => handleFilterChange('status', 'absent')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.status === 'absent' && styles.filterOptionActiveText
                    ]}>
                      Absent
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Verification Status */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Verification Status</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.verification === 'all' && styles.filterOptionActive
                    ]}
                    onPress={() => handleFilterChange('verification', 'all')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.verification === 'all' && styles.filterOptionActiveText
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.verification === 'verified' && styles.filterOptionActive,
                      localFilters.verification === 'verified' && { backgroundColor: '#2ecc71' }
                    ]}
                    onPress={() => handleFilterChange('verification', 'verified')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.verification === 'verified' && styles.filterOptionActiveText
                    ]}>
                      Verified
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.verification === 'pending' && styles.filterOptionActive,
                      localFilters.verification === 'pending' && { backgroundColor: '#f39c12' }
                    ]}
                    onPress={() => handleFilterChange('verification', 'pending')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.verification === 'pending' && styles.filterOptionActiveText
                    ]}>
                      Pending
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.verification === 'rejected' && styles.filterOptionActive,
                      localFilters.verification === 'rejected' && { backgroundColor: '#e74c3c' }
                    ]}
                    onPress={() => handleFilterChange('verification', 'rejected')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.verification === 'rejected' && styles.filterOptionActiveText
                    ]}>
                      Rejected
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Verification Method */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Verification Method</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.verificationMethod === 'all' && styles.filterOptionActive
                    ]}
                    onPress={() => handleFilterChange('verificationMethod', 'all')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.verificationMethod === 'all' && styles.filterOptionActiveText
                    ]}>
                      All
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.verificationMethod === 'qr_code' && styles.filterOptionActive
                    ]}
                    onPress={() => handleFilterChange('verificationMethod', 'qr_code')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.verificationMethod === 'qr_code' && styles.filterOptionActiveText
                    ]}>
                      QR Code
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      localFilters.verificationMethod === 'manual' && styles.filterOptionActive
                    ]}
                    onPress={() => handleFilterChange('verificationMethod', 'manual')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      localFilters.verificationMethod === 'manual' && styles.filterOptionActiveText
                    ]}>
                      Manual
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            {/* Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
  },
  filterCountBadge: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    maxHeight: '70%',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateLabel: {
    width: 50,
    color: '#7f8c8d',
  },
  datePicker: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  filterOption: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterOptionActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterOptionText: {
    color: '#333',
    fontSize: 14,
  },
  filterOptionActiveText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  resetButton: {
    flex: 1,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  resetButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#3498db',
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AttendanceFilter;