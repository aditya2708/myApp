import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../../common/components/Button';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { adminCabangDonaturApi } from '../api/adminCabangDonaturApi';

const DonaturFilterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { currentFilters = {}, onApplyFilters } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    wilbins: [],
    shelters: [],
    diperuntukan_options: []
  });
  const [availableShelters, setAvailableShelters] = useState([]);
  const [filters, setFilters] = useState({
    id_wilbin: '',
    id_shelter: '',
    diperuntukan: '',
    ...currentFilters
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    if (filters.id_wilbin) {
      fetchSheltersByWilbin(filters.id_wilbin);
    } else {
      setAvailableShelters([]);
      setFilters(prev => ({ ...prev, id_shelter: '' }));
    }
  }, [filters.id_wilbin]);

  const fetchFilterOptions = async () => {
    try {
      setError(null);
      const response = await adminCabangDonaturApi.getFilterOptions();
      setFilterOptions(response.data.data);
      
      // Set available shelters if wilbin is already selected
      if (currentFilters.id_wilbin) {
        await fetchSheltersByWilbin(currentFilters.id_wilbin);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
      setError('Gagal memuat opsi filter. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSheltersByWilbin = async (wilbinId) => {
    try {
      const response = await adminCabangDonaturApi.getSheltersByWilbin(wilbinId);
      setAvailableShelters(response.data.data);
    } catch (err) {
      console.error('Error fetching shelters:', err);
      setAvailableShelters([]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    navigation.goBack();
  };

  const handleReset = () => {
    const resetFilters = {
      id_wilbin: '',
      id_shelter: '',
      diperuntukan: ''
    };
    setFilters(resetFilters);
    setAvailableShelters([]);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== '').length;
  };

  const renderDropdown = (title, value, options, onSelect, placeholder, keyField = 'value', labelField = 'label') => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => {
          if (options.length === 0) {
            Alert.alert('Info', 'Tidak ada opsi tersedia');
            return;
          }
          
          const alertOptions = [
            { text: `Semua ${title}`, onPress: () => onSelect('') },
            ...options.map(option => ({
              text: option[labelField] || option.nama_wilbin || option.nama_shelter || option.nama_bank,
              onPress: () => onSelect((option[keyField] || option.id_wilbin || option.id_shelter || option.id_bank)?.toString())
            })),
            { text: 'Batal', style: 'cancel' }
          ];

          Alert.alert(`Pilih ${title}`, '', alertOptions);
        }}
      >
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {value ? 
            options.find(opt => (opt[keyField] || opt.id_wilbin || opt.id_shelter || opt.id_bank)?.toString() === value?.toString())?.[labelField] ||
            options.find(opt => (opt[keyField] || opt.id_wilbin || opt.id_shelter || opt.id_bank)?.toString() === value?.toString())?.nama_wilbin ||
            options.find(opt => (opt[keyField] || opt.id_wilbin || opt.id_shelter || opt.id_bank)?.toString() === value?.toString())?.nama_shelter ||
            options.find(opt => (opt[keyField] || opt.id_wilbin || opt.id_shelter || opt.id_bank)?.toString() === value?.toString())?.nama_bank ||
            'Tidak ditemukan'
          : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat filter..." />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && <ErrorMessage message={error} onRetry={fetchFilterOptions} />}

        {renderDropdown(
          'Wilayah Binaan',
          filters.id_wilbin,
          filterOptions.wilbins,
          (value) => handleFilterChange('id_wilbin', value),
          'Pilih Wilayah Binaan'
        )}

        {renderDropdown(
          'Shelter',
          filters.id_shelter,
          availableShelters,
          (value) => handleFilterChange('id_shelter', value),
          filters.id_wilbin ? 'Pilih Shelter' : 'Pilih Wilayah Binaan terlebih dahulu'
        )}

        {!filters.id_wilbin && (
          <Text style={styles.helperText}>
            Pilih wilayah binaan terlebih dahulu untuk melihat shelter
          </Text>
        )}

        {filters.id_wilbin && availableShelters.length === 0 && (
          <Text style={styles.helperText}>
            Tidak ada shelter di wilayah binaan ini
          </Text>
        )}

        {renderDropdown(
          'Diperuntukan',
          filters.diperuntukan,
          filterOptions.diperuntukan_options,
          (value) => handleFilterChange('diperuntukan', value),
          'Pilih Diperuntukan'
        )}

        <View style={styles.filterInfo}>
          <View style={styles.filterInfoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#3498db" />
            <Text style={styles.filterInfoText}>
              {getActiveFiltersCount()} filter aktif
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Reset Filter"
          type="outline"
          onPress={handleReset}
          style={styles.resetButton}
          leftIcon={<Ionicons name="refresh" size={16} color="#3498db" />}
        />
        <Button
          title="Terapkan Filter"
          onPress={handleApply}
          style={styles.applyButton}
          leftIcon={<Ionicons name="checkmark" size={16} color="#fff" />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2ecc71',
    paddingBottom: 4,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#9e9e9e',
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: -16,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  filterInfo: {
    marginTop: 20,
    marginBottom: 20,
  },
  filterInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  filterInfoText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 8,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
});

export default DonaturFilterScreen;