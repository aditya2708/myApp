import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Import components
import Button from '../../../common/components/Button';
import ErrorMessage from '../../../common/components/ErrorMessage';

// Import API
import { adminShelterPengajuanAnakApi } from '../api/adminShelterPengajuanAnakApi';

const PengajuanAnakSearchScreen = () => {
  const navigation = useNavigation();
  
  // State
  const [kkNumber, setKkNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loadingPriority, setLoadingPriority] = useState(false);
  const [error, setError] = useState(null);
  const [priorityError, setPriorityError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [priorityFamilies, setPriorityFamilies] = useState([]);
  
  // Load priority families on component mount
  useEffect(() => {
    loadPriorityFamilies();
  }, []);
  
  // Load priority families
  const loadPriorityFamilies = async () => {
    try {
      setLoadingPriority(true);
      setPriorityError(null);
      
      const response = await adminShelterPengajuanAnakApi.getPriorityFamilies();
      
      if (response.data.success) {
        setPriorityFamilies(response.data.data || []);
      } else {
        setPriorityError(response.data.message || 'Gagal memuat keluarga prioritas');
      }
    } catch (err) {
      console.error('Error loading priority families:', err);
      setPriorityError('Gagal memuat keluarga prioritas. Silakan coba lagi.');
    } finally {
      setLoadingPriority(false);
    }
  };
  
  // Handle search for KK
  const handleSearch = async () => {
    if (!kkNumber.trim()) {
      Alert.alert('Input Diperlukan', 'Silakan masukkan nomor KK untuk mencari');
      return;
    }
    
    try {
      setSearching(true);
      setError(null);
      
      const response = await adminShelterPengajuanAnakApi.searchKeluarga(kkNumber.trim());
      
      if (response.data.success) {
        setSearchResults(response.data.data || []);
      } else {
        setError(response.data.message || 'Gagal mencari keluarga');
      }
    } catch (err) {
      console.error('Error searching families:', err);
      setError('Gagal mencari keluarga. Silakan coba lagi.');
    } finally {
      setSearching(false);
    }
  };
  
  // Handle selecting a family
  const handleSelectFamily = async (keluarga) => {
    try {
      setValidating(true);
      
      // Validate KK before proceeding
      const response = await adminShelterPengajuanAnakApi.validateKK(keluarga.no_kk);
      
      setValidating(false);
      
      if (response.data.success) {
        // Navigate to the form to add a child to this family
        navigation.navigate('PengajuanAnakForm', { 
          keluarga: response.data.keluarga,
          mode: 'existing'
        });
      } else {
        Alert.alert('Error', response.data.message || 'Gagal memvalidasi keluarga');
      }
    } catch (err) {
      setValidating(false);
      console.error('Error validating KK:', err);
      
      // If 404, family not found, ask to create new
      if (err.response && err.response.status === 404) {
        Alert.alert(
          'Keluarga Tidak Ditemukan',
          'Nomor KK ini belum terdaftar. Apakah Anda ingin mendaftarkan keluarga baru?',
          [
            {
              text: 'Batal',
              style: 'cancel'
            },
            {
              text: 'Buat Keluarga Baru',
              onPress: () => navigation.navigate('KeluargaForm', { isNew: true })
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Gagal memvalidasi keluarga. Silakan coba lagi.');
      }
    }
  };
  
  
  // Render family item
  const renderFamilyItem = ({ item, isPrioritySection = false }) => {
    return (
      <TouchableOpacity 
        style={[
          styles.familyItem,
          item.is_priority && styles.priorityFamilyItem
        ]}
        onPress={() => handleSelectFamily(item)}
        disabled={validating}
      >
        <View style={styles.familyItemContent}>
          <View style={styles.familyHeader}>
            <Text style={styles.familyName}>{item.kepala_keluarga}</Text>
            {item.is_priority && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityBadgeText}>PRIORITAS</Text>
              </View>
            )}
          </View>
          <Text style={styles.kkNumber}>KK: {item.no_kk}</Text>
        </View>
        {validating ? (
          <ActivityIndicator size="small" color="#3498db" />
        ) : (
          <Ionicons name="chevron-forward" size={24} color="#bbb" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color="#777" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Masukan No KK"
            value={kkNumber}
            onChangeText={setKkNumber}
            keyboardType="numeric"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {kkNumber.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setKkNumber('');
                setSearchResults([]);
                setError(null);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <Button
          title="Search"
          onPress={handleSearch}
          loading={searching}
          disabled={searching || !kkNumber.trim()}
          type="primary"
          style={styles.searchButton}
        />
      </View>

      {/* Priority Families Section */}
      {!kkNumber && (
        <View style={styles.section}>
     
          
          {priorityError && (
            <ErrorMessage
              message={priorityError}
              onRetry={loadPriorityFamilies}
            />
          )}
          
          {loadingPriority ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Memuat keluarga prioritas...</Text>
            </View>
          ) : priorityFamilies.length > 0 ? (
            <View>
              <Text style={styles.sectionSubtitle}>
                {priorityFamilies.length} keluarga belum punya anak
              </Text>
              {priorityFamilies.map((item) => (
                <View key={item.id_keluarga}>
                  {renderFamilyItem({ item, isPrioritySection: true })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="checkmark-circle" size={40} color="#27ae60" />
              <Text style={styles.emptySectionText}>
                Semua keluarga di shelter ini sudah memiliki anak
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Search Results Section */}
      {kkNumber && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="search" size={20} color="#3498db" />
            <Text style={styles.sectionTitle}>Hasil Pencarian</Text>
          </View>
          
          {error && (
            <ErrorMessage
              message={error}
              onRetry={handleSearch}
            />
          )}
          
          {searching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Mencari...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <View>
              <Text style={styles.sectionSubtitle}>
                Ditemukan {searchResults.length} hasil
              </Text>
              {searchResults.map((item) => (
                <View key={item.id_keluarga}>
                  {renderFamilyItem({ item })}
                </View>
              ))}
            </View>
          ) : !error && (
            <View style={styles.emptySection}>
              <Ionicons name="search" size={40} color="#ddd" />
              <Text style={styles.emptySectionText}>Nomor KK tidak ditemukan</Text>
            </View>
          )}
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    height: 48,
    paddingHorizontal: 16,
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  familyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  priorityFamilyItem: {
    borderColor: '#f39c12',
    borderWidth: 2,
  },
  familyItemContent: {
    flex: 1,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  familyName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  kkNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  childCount: {
    fontSize: 12,
    color: '#888',
  },
  emptySection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySectionText: {
    fontSize: 16,
    color: '#666',
    marginVertical: 12,
    textAlign: 'center',
  },
});

export default PengajuanAnakSearchScreen;