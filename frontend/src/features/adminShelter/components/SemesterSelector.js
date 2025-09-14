import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import API
import { semesterApi } from '../api/semesterApi';

const SemesterSelector = ({ 
  selectedSemester,
  onSemesterChange,
  showActiveBadge = true,
  placeholder = 'Pilih Semester',
  disabled = false,
  style
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (modalVisible) {
      fetchSemesters();
    }
  }, [modalVisible]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const response = await semesterApi.getAllSemesters();
      
      if (response.data.success) {
        setSemesters(response.data.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching semesters:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (semester) => {
    onSemesterChange(semester);
    setModalVisible(false);
  };

  const getSelectedLabel = () => {
    if (!selectedSemester) return placeholder;
    
    const selected = semesters.find(s => s.id_semester === selectedSemester);
    if (selected) {
      return `${selected.nama_semester} - ${selected.tahun_ajaran}`;
    }
    
    if (selectedSemester.nama_semester) {
      return `${selectedSemester.nama_semester} - ${selectedSemester.tahun_ajaran}`;
    }
    
    return placeholder;
  };

  const renderSemesterItem = ({ item }) => {
    const isSelected = selectedSemester && 
      (selectedSemester.id_semester === item.id_semester || selectedSemester === item.id_semester);
    
    return (
      <TouchableOpacity
        style={[
          styles.semesterItem,
          isSelected && styles.selectedItem
        ]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.semesterInfo}>
          <Text style={[
            styles.semesterName,
            isSelected && styles.selectedText
          ]}>
            {item.nama_semester} - {item.tahun_ajaran}
          </Text>
          <Text style={[
            styles.semesterPeriode,
            isSelected && styles.selectedSubText
          ]}>
            {item.periode === 'ganjil' ? 'Semester Ganjil' : 'Semester Genap'}
          </Text>
          <Text style={[
            styles.semesterDate,
            isSelected && styles.selectedSubText
          ]}>
            {new Date(item.tanggal_mulai).toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })} - {new Date(item.tanggal_selesai).toLocaleDateString('id-ID', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}
          </Text>
        </View>
        
        <View style={styles.semesterStatus}>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color="#3498db" />
          )}
          
          {item.is_active && showActiveBadge && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>AKTIF</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.selector, style, disabled && styles.disabledSelector]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <Ionicons 
            name="school-outline" 
            size={20} 
            color={disabled ? '#bdc3c7' : '#3498db'} 
          />
          <Text style={[
            styles.selectorText,
            !selectedSemester && styles.placeholderText,
            disabled && styles.disabledText
          ]}>
            {getSelectedLabel()}
          </Text>
        </View>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? '#bdc3c7' : '#7f8c8d'} 
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Semester</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#2c3e50" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Memuat semester...</Text>
              </View>
            ) : (
              <FlatList
                data={semesters}
                renderItem={renderSemesterItem}
                keyExtractor={(item) => item.id_semester.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-outline" size={48} color="#bdc3c7" />
                    <Text style={styles.emptyText}>Tidak ada semester tersedia</Text>
                  </View>
                }
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledSelector: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 12,
    flex: 1,
  },
  placeholderText: {
    color: '#95a5a6',
  },
  disabledText: {
    color: '#bdc3c7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  semesterItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3498db',
  },
  semesterInfo: {
    flex: 1,
  },
  semesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  semesterPeriode: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  semesterDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  selectedText: {
    color: '#2980b9',
  },
  selectedSubText: {
    color: '#3498db',
  },
  semesterStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  activeBadge: {
    backgroundColor: '#2ecc71',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#95a5a6',
  },
});

export default SemesterSelector;