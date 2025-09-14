import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const MonthYearPicker = ({ 
  visible, 
  onClose, 
  onConfirm, 
  initialMonth = new Date().getMonth() + 1,
  initialYear = new Date().getFullYear(),
  minYear = 2020,
  maxYear = new Date().getFullYear() + 1
}) => {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [currentView, setCurrentView] = useState('month');

  useEffect(() => {
    if (visible) {
      setSelectedMonth(initialMonth);
      setSelectedYear(initialYear);
      setCurrentView('month');
    }
  }, [visible, initialMonth, initialYear]);

  const months = [
    { value: 1, name: 'Januari' },
    { value: 2, name: 'Februari' },
    { value: 3, name: 'Maret' },
    { value: 4, name: 'April' },
    { value: 5, name: 'Mei' },
    { value: 6, name: 'Juni' },
    { value: 7, name: 'Juli' },
    { value: 8, name: 'Agustus' },
    { value: 9, name: 'September' },
    { value: 10, name: 'Oktober' },
    { value: 11, name: 'November' },
    { value: 12, name: 'Desember' }
  ];

  const years = Array.from(
    { length: maxYear - minYear + 1 }, 
    (_, i) => maxYear - i
  );

  const handleConfirm = () => {
    onConfirm(selectedMonth, selectedYear);
    onClose();
  };

  const handleCancel = () => {
    setSelectedMonth(initialMonth);
    setSelectedYear(initialYear);
    setCurrentView('month');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.title}>Pilih Periode</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Ionicons name="checkmark" size={24} color="#3498db" />
            </TouchableOpacity>
          </View>

          <View style={styles.selectedDisplay}>
            <Text style={styles.selectedText}>
              {months.find(m => m.value === selectedMonth)?.name} {selectedYear}
            </Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                currentView === 'month' && styles.tabActive
              ]}
              onPress={() => setCurrentView('month')}
            >
              <Text style={[
                styles.tabText,
                currentView === 'month' && styles.tabTextActive
              ]}>
                Bulan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                currentView === 'year' && styles.tabActive
              ]}
              onPress={() => setCurrentView('year')}
            >
              <Text style={[
                styles.tabText,
                currentView === 'year' && styles.tabTextActive
              ]}>
                Tahun
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.gridContainer}>
              {currentView === 'month' ? (
                months.map((month) => (
                  <TouchableOpacity
                    key={month.value}
                    style={[
                      styles.monthItem,
                      selectedMonth === month.value && styles.pickItemSelected
                    ]}
                    onPress={() => setSelectedMonth(month.value)}
                  >
                    <Text style={[
                      styles.pickItemText,
                      selectedMonth === month.value && styles.pickItemTextSelected
                    ]}>
                      {month.name}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.yearItem,
                      selectedYear === year && styles.pickItemSelected
                    ]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[
                      styles.pickItemText,
                      selectedYear === year && styles.pickItemTextSelected
                    ]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>Pilih</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedDisplay: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  selectedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#3498db',
    fontWeight: '500',
  },
  listContainer: {
    maxHeight: 300,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  monthItem: {
    width: '30%',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  yearItem: {
    width: '22%',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  pickItemSelected: {
    backgroundColor: '#3498db',
  },
  pickItemText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  pickItemTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#3498db',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});

export default MonthYearPicker;