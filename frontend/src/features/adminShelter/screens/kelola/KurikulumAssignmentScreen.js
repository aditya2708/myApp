import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';

// Import components
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import Button from '../../../../common/components/Button';
import MateriCompatibilityIndicator from '../../components/kelola/MateriCompatibilityIndicator';

// Import Redux
import {
  browseKurikulum,
  applyKurikulumToKelompok,
  getKurikulumSuggestions,
  selectKurikulumList,
  selectBrowseLoading,
  selectApplyLoading,
  selectApplyError,
  selectApplySuccess,
  selectSuggestions,
  selectSuggestionsLoading,
  resetApplyState
} from '../../redux/kurikulumConsumerSlice';

import { useAuth } from '../../../../common/hooks/useAuth';

const { width } = Dimensions.get('window');

const KurikulumAssignmentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { profile } = useAuth();
  
  // Get kelompok from route params
  const { kelompok } = route.params || {};
  
  // Redux selectors
  const kurikulumList = useSelector(selectKurikulumList);
  const browseLoading = useSelector(selectBrowseLoading);
  const applyLoading = useSelector(selectApplyLoading);
  const applyError = useSelector(selectApplyError);
  const applySuccess = useSelector(selectApplySuccess);
  const suggestions = useSelector(selectSuggestions);
  const suggestionsLoading = useSelector(selectSuggestionsLoading);
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [selectedKurikulum, setSelectedKurikulum] = useState(null);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('suggestions'); // suggestions, browse, assigned
  const [assignmentSettings, setAssignmentSettings] = useState({
    startDate: new Date().toISOString().split('T')[0],
    semesterId: null,
    customizations: {},
    notes: ''
  });
  
  // Assignment steps
  const [currentStep, setCurrentStep] = useState(1); // 1: Review, 2: Settings, 3: Confirm
  
  // Mock data for assigned kurikulum
  const [assignedKurikulum, setAssignedKurikulum] = useState([
    {
      id: 1,
      kurikulum: {
        id_kurikulum: 1,
        nama_kurikulum: 'Matematika Dasar SD-SMP',
        total_materi: 45,
        compatibility_score: 85
      },
      assigned_date: '2024-01-15',
      progress: 65,
      status: 'active'
    }
  ]);

  // Static data
  const availableJenjang = [
    { id: 'PAUD', nama: 'PAUD', color: '#9b59b6' },
    { id: 'TK', nama: 'TK', color: '#8e44ad' },
    { id: 'SD', nama: 'SD', color: '#3498db' },
    { id: 'SMP', nama: 'SMP', color: '#f39c12' },
    { id: 'SMA', nama: 'SMA', color: '#e74c3c' }
  ];

  const materiCompatibility = {
    'PAUD': { 'A': 8, 'B': 7 },
    'TK': { 'A': 9, 'B': 8 },
    'SD': { '1': 12, '2': 15, '3': 14, '4': 16, '5': 18, '6': 17 },
    'SMP': { '7': 20, '8': 22, '9': 19 },
    'SMA': { '10': 25, '11': 28, '12': 24 }
  };

  // Initial data fetch
  useEffect(() => {
    if (kelompok) {
      fetchInitialData();
      navigation.setOptions({
        headerTitle: `Assign Kurikulum - ${kelompok.nama_kelompok}`
      });
    }
  }, [kelompok]);

  // Handle apply success
  useEffect(() => {
    if (applySuccess) {
      Alert.alert(
        'Berhasil!',
        'Kurikulum berhasil diterapkan ke kelompok.',
        [
          {
            text: 'OK',
            onPress: () => {
              dispatch(resetApplyState());
              setAssignmentModalVisible(false);
              setSelectedKurikulum(null);
              fetchInitialData(); // Refresh data
            }
          }
        ]
      );
    }
  }, [applySuccess]);

  const fetchInitialData = async () => {
    try {
      // Fetch kurikulum suggestions based on kelompok profile
      if (kelompok?.id_kelompok) {
        dispatch(getKurikulumSuggestions(kelompok.id_kelompok));
      }
      
      // Fetch available kurikulum for browsing
      dispatch(browseKurikulum({
        kelas_gabungan: kelompok?.kelas_gabungan || [],
        per_page: 20
      }));
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInitialData();
  };

  const handleSelectKurikulum = (kurikulum) => {
    setSelectedKurikulum(kurikulum);
    setCurrentStep(1);
    setAssignmentModalVisible(true);
  };

  const handleAssignKurikulum = async () => {
    if (!selectedKurikulum || !kelompok) return;
    
    try {
      await dispatch(applyKurikulumToKelompok({
        kurikulumId: selectedKurikulum.id_kurikulum,
        kelompokId: kelompok.id_kelompok,
        semesterId: assignmentSettings.semesterId,
        kelasGabungan: kelompok.kelas_gabungan,
        startDate: assignmentSettings.startDate,
        notes: assignmentSettings.notes,
        customizations: assignmentSettings.customizations
      })).unwrap();
      
    } catch (error) {
      console.error('Error assigning kurikulum:', error);
    }
  };

  const getJenjangColor = (jenjangId) => {
    const jenjang = availableJenjang.find(j => j.id === jenjangId);
    return jenjang?.color || '#95a5a6';
  };

  const renderKelasGabunganChips = (kelasGabungan) => {
    if (!kelasGabungan || kelasGabungan.length === 0) {
      return <Text style={styles.noKelasText}>Tidak ada kelas</Text>;
    }

    return (
      <View style={styles.kelasChipsContainer}>
        {kelasGabungan.slice(0, 4).map((item, index) => (
          <View
            key={`${item.jenjang}-${item.kelas}`}
            style={[
              styles.kelasChip,
              { backgroundColor: getJenjangColor(item.jenjang) }
            ]}
          >
            <Text style={styles.kelasChipText}>
              {item.jenjang} {item.kelas}
            </Text>
          </View>
        ))}
        {kelasGabungan.length > 4 && (
          <View style={styles.moreKelasChip}>
            <Text style={styles.moreKelasText}>
              +{kelasGabungan.length - 4}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderKurikulumItem = ({ item, showAssignButton = true, isAssigned = false }) => {
    const kurikulum = item.kurikulum || item;
    const compatibilityScore = item.compatibility_score || 
      Math.round((kurikulum.total_materi / (kelompok?.kelas_gabungan?.length || 1) / 10) * 100);

    return (
      <View style={[styles.kurikulumItem, isAssigned && styles.assignedKurikulumItem]}>
        <View style={styles.kurikulumHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.kurikulumName}>{kurikulum.nama_kurikulum}</Text>
            <Text style={styles.semesterText}>{kurikulum.semester || '2024/2025 Semester 1'}</Text>
          </View>
          
          <View style={styles.headerRight}>
            {isAssigned && (
              <View style={[styles.statusBadge, { backgroundColor: '#2ecc71' }]}>
                <Text style={styles.statusText}>ASSIGNED</Text>
              </View>
            )}
            <View style={[
              styles.compatibilityBadge,
              { backgroundColor: compatibilityScore > 70 ? '#2ecc71' : compatibilityScore > 40 ? '#f39c12' : '#e74c3c' }
            ]}>
              <Text style={styles.compatibilityText}>{compatibilityScore}%</Text>
            </View>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {kurikulum.description || 'Kurikulum dengan materi pembelajaran yang disesuaikan untuk kelompok ini.'}
        </Text>

        {/* Kelas Compatibility */}
        <View style={styles.compatibilitySection}>
          <Text style={styles.sectionTitle}>Kompatibilitas Kelas:</Text>
          {renderKelasGabunganChips(kurikulum.kelas_gabungan)}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="book" size={16} color="#3498db" />
            <Text style={styles.statText}>{kurikulum.total_materi || 0} materi</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
            <Text style={styles.statText}>{kurikulum.total_aktivitas || 0} aktivitas</Text>
          </View>
          {isAssigned && (
            <View style={styles.statItem}>
              <Ionicons name="trending-up" size={16} color="#9b59b6" />
              <Text style={styles.statText}>{item.progress || 0}% progress</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => {
              Alert.alert('Preview', `Detail kurikulum: ${kurikulum.nama_kurikulum}`);
            }}
          >
            <Ionicons name="eye" size={16} color="#3498db" />
            <Text style={styles.previewButtonText}>Preview</Text>
          </TouchableOpacity>
          
          {showAssignButton && !isAssigned && (
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => handleSelectKurikulum(kurikulum)}
            >
              <Ionicons name="add-circle" size={16} color="#ffffff" />
              <Text style={styles.assignButtonText}>Assign</Text>
            </TouchableOpacity>
          )}

          {isAssigned && (
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => {
                navigation.navigate('ProgressTracking', { 
                  kelompok, 
                  kurikulumId: kurikulum.id_kurikulum 
                });
              }}
            >
              <Ionicons name="analytics" size={16} color="#ffffff" />
              <Text style={styles.manageButtonText}>Progress</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderViewModeSelector = () => (
    <View style={styles.viewModeContainer}>
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'suggestions' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('suggestions')}
      >
        <Ionicons 
          name="bulb" 
          size={16} 
          color={viewMode === 'suggestions' ? '#fff' : '#666'} 
        />
        <Text style={[
          styles.viewModeButtonText,
          viewMode === 'suggestions' && styles.viewModeButtonTextActive
        ]}>
          Suggestions ({suggestions.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'browse' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('browse')}
      >
        <Ionicons 
          name="search" 
          size={16} 
          color={viewMode === 'browse' ? '#fff' : '#666'} 
        />
        <Text style={[
          styles.viewModeButtonText,
          viewMode === 'browse' && styles.viewModeButtonTextActive
        ]}>
          Browse ({kurikulumList.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.viewModeButton,
          viewMode === 'assigned' && styles.viewModeButtonActive
        ]}
        onPress={() => setViewMode('assigned')}
      >
        <Ionicons 
          name="checkmark-circle" 
          size={16} 
          color={viewMode === 'assigned' ? '#fff' : '#666'} 
        />
        <Text style={[
          styles.viewModeButtonText,
          viewMode === 'assigned' && styles.viewModeButtonTextActive
        ]}>
          Assigned ({assignedKurikulum.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAssignmentModal = () => (
    <Modal
      visible={assignmentModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setAssignmentModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Assign Kurikulum - Step {currentStep}/3
            </Text>
            <TouchableOpacity onPress={() => setAssignmentModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            {[1, 2, 3].map((step) => (
              <View key={step} style={styles.stepContainer}>
                <View style={[
                  styles.stepCircle,
                  currentStep >= step && styles.stepCircleActive
                ]}>
                  <Text style={[
                    styles.stepText,
                    currentStep >= step && styles.stepTextActive
                  ]}>
                    {step}
                  </Text>
                </View>
                <Text style={styles.stepLabel}>
                  {step === 1 ? 'Review' : step === 2 ? 'Settings' : 'Confirm'}
                </Text>
              </View>
            ))}
          </View>

          <ScrollView style={styles.modalBody}>
            {currentStep === 1 && (
              <View>
                <Text style={styles.stepTitle}>Review Kurikulum</Text>
                {selectedKurikulum && renderKurikulumItem({ 
                  item: selectedKurikulum, 
                  showAssignButton: false 
                })}
                
                <View style={styles.compatibilityAnalysis}>
                  <Text style={styles.analysisTitle}>Analisis Kompatibilitas</Text>
                  <MateriCompatibilityIndicator
                    kelasGabungan={kelompok?.kelas_gabungan || []}
                    materiCompatibility={materiCompatibility}
                    showDetails={true}
                    size="large"
                  />
                </View>
              </View>
            )}

            {currentStep === 2 && (
              <View>
                <Text style={styles.stepTitle}>Assignment Settings</Text>
                {/* Settings form would go here */}
                <Text style={styles.settingsNote}>
                  Settings untuk assignment akan diimplementasikan di sini
                </Text>
              </View>
            )}

            {currentStep === 3 && (
              <View>
                <Text style={styles.stepTitle}>Confirm Assignment</Text>
                <View style={styles.confirmationCard}>
                  <Text style={styles.confirmationText}>
                    Assign "{selectedKurikulum?.nama_kurikulum}" ke kelompok "{kelompok?.nama_kelompok}"?
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            {currentStep > 1 && (
              <Button
                title="Previous"
                onPress={() => setCurrentStep(currentStep - 1)}
                type="outline"
                style={styles.previousButton}
              />
            )}
            
            {currentStep < 3 ? (
              <Button
                title="Next"
                onPress={() => setCurrentStep(currentStep + 1)}
                type="primary"
                style={styles.nextButton}
              />
            ) : (
              <Button
                title="Assign Kurikulum"
                onPress={handleAssignKurikulum}
                type="primary"
                loading={applyLoading}
                style={styles.assignFinalButton}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!kelompok) {
    return (
      <View style={styles.errorContainer}>
        <ErrorMessage
          message="Kelompok tidak ditemukan"
          onRetry={() => navigation.goBack()}
          retryText="Kembali"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Kelompok Summary */}
      <View style={styles.kelompokSummary}>
        <View style={styles.summaryHeader}>
          <Ionicons name="people-circle" size={32} color="#9b59b6" />
          <View style={styles.summaryInfo}>
            <Text style={styles.kelompokName}>{kelompok.nama_kelompok}</Text>
            <Text style={styles.kelompokMeta}>
              {kelompok.jumlah_anggota || 0} anak • {kelompok.kelas_gabungan?.length || 0} kelas
            </Text>
          </View>
        </View>
        {renderKelasGabunganChips(kelompok.kelas_gabungan)}
      </View>

      {/* View Mode Selector */}
      {renderViewModeSelector()}

      {/* Error Display */}
      {applyError && (
        <ErrorMessage
          message={applyError}
          onRetry={() => dispatch(resetApplyState())}
          retryText="Dismiss"
        />
      )}

      {/* Content */}
      <FlatList
        data={
          viewMode === 'suggestions' ? suggestions :
          viewMode === 'browse' ? kurikulumList :
          assignedKurikulum
        }
        renderItem={({ item }) => renderKurikulumItem({ 
          item, 
          showAssignButton: viewMode !== 'assigned',
          isAssigned: viewMode === 'assigned'
        })}
        keyExtractor={(item) => 
          viewMode === 'assigned' ? 
          item.id?.toString() : 
          (item.kurikulum?.id_kurikulum || item.id_kurikulum)?.toString()
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={
                viewMode === 'suggestions' ? 'bulb-outline' :
                viewMode === 'browse' ? 'search-outline' :
                'checkmark-circle-outline'
              } 
              size={60} 
              color="#cccccc" 
            />
            <Text style={styles.emptyText}>
              {viewMode === 'suggestions' ? 'Belum ada suggestions kurikulum' :
               viewMode === 'browse' ? 'Tidak ada kurikulum tersedia' :
               'Belum ada kurikulum yang diassign'}
            </Text>
            {viewMode === 'browse' && (
              <Button
                title="Browse All Kurikulum"
                onPress={() => {
                  navigation.navigate('KurikulumBrowser');
                }}
                type="outline"
                style={styles.browseAllButton}
              />
            )}
          </View>
        }
        ListHeaderComponent={
          (browseLoading || suggestionsLoading) && viewMode !== 'assigned' ? (
            <LoadingSpinner message="Memuat kurikulum..." />
          ) : null
        }
      />

      {/* Assignment Modal */}
      {renderAssignmentModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Kelompok Summary
  kelompokSummary: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  kelompokName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  kelompokMeta: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },

  // Kelas Chips
  kelasChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kelasChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  kelasChipText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  moreKelasChip: {
    backgroundColor: '#95a5a6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  moreKelasText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  noKelasText: {
    fontSize: 12,
    color: '#bdc3c7',
    fontStyle: 'italic',
  },

  // View Mode Selector
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  viewModeButtonActive: {
    backgroundColor: '#9b59b6',
  },
  viewModeButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  viewModeButtonTextActive: {
    color: '#fff',
  },

  // List Container
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // Kurikulum Item
  kurikulumItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  assignedKurikulumItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  kurikulumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  kurikulumName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  semesterText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  compatibilityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  compatibilityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },

  // Compatibility Section
  compatibilitySection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 6,
    fontWeight: '500',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3498db',
    borderRadius: 6,
  },
  previewButtonText: {
    fontSize: 13,
    color: '#3498db',
    marginLeft: 4,
    fontWeight: '500',
  },
  assignButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#9b59b6',
    borderRadius: 6,
  },
  assignButtonText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  manageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#2ecc71',
    borderRadius: 6,
  },
  manageButtonText: {
    fontSize: 13,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Empty Container
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  browseAllButton: {
    minWidth: 180,
  },

  // Error Container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: width * 0.9,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#9b59b6',
  },
  stepText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  stepTextActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 12,
    color: '#666',
  },

  // Modal Body
  modalBody: {
    flex: 1,
    padding: 16,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },

  // Compatibility Analysis
  compatibilityAnalysis: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },

  // Settings
  settingsNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },

  // Confirmation
  confirmationCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9b59b6',
  },
  confirmationText: {
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 24,
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  previousButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#9b59b6',
  },
  assignFinalButton: {
    flex: 1,
    backgroundColor: '#2ecc71',
  },
});

export default KurikulumAssignmentScreen;