import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import TextInput from '../../../../common/components/TextInput';
import PickerInput from '../../../../common/components/PickerInput';
import CabangSelectionList from '../../components/distribution/CabangSelectionList';

import {
  fetchCabangList,
  distributeTemplate,
  setCabangSelection,
  setDistributionSettings,
  resetDistributionSettings,
  selectCabangList,
  selectSelectedCabang,
  selectDistributionSettings,
  selectDistributionLoading,
  selectDistributionError,
  selectDistributionSummary,
  clearError
} from '../../redux/distributionSlice';

const DistributionScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();

  // Route params - single template distribution only
  const {
    template = null,
    // Context information
    jenjang, jenjangId, jenjangName,
    kelas, kelasId, kelasName,
    mataPelajaran, mataPelajaranId, mataPelajaranName
  } = route.params;

  // Redux state
  const cabangList = useSelector(selectCabangList);
  const selectedCabang = useSelector(selectSelectedCabang);
  const distributionSettings = useSelector(selectDistributionSettings);
  const loading = useSelector(selectDistributionLoading);
  const error = useSelector(selectDistributionError);
  const distributionSummary = useSelector(selectDistributionSummary);

  // Local state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);

  // Load cabang list saat component mount
  useEffect(() => {
    if (!cabangList.length) {
      dispatch(fetchCabangList({ status: 'active' }));
    }
  }, [dispatch, cabangList.length]);

  // Event handlers
  const handleCabangSelectionChange = (newSelection) => {
    dispatch(setCabangSelection(newSelection));
  };

  const handleSettingsChange = (field, value) => {
    dispatch(setDistributionSettings({ [field]: value }));
  };

  const handleDistribute = async () => {
    if (selectedCabang.length === 0) {
      Alert.alert('Peringatan', 'Pilih minimal satu cabang untuk distribusi');
      return;
    }

    try {
      setIsDistributing(true);
      
      const distributionData = {
        cabang_ids: selectedCabang,
        ...distributionSettings
      };

      const result = await dispatch(distributeTemplate({
        templateId: template.id_template_materi,
        distributionData
      })).unwrap();
      
      Alert.alert(
        'Distribusi Berhasil',
        `Template "${template.nama_template}" berhasil didistribusikan ke ${selectedCabang.length} cabang`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (err) {
      console.error('Distribution error:', err);
      Alert.alert('Kesalahan', err || 'Gagal mendistribusikan template');
    } finally {
      setIsDistributing(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Batalkan Distribusi',
      'Yakin ingin membatalkan distribusi? Pilihan yang sudah dibuat akan hilang.',
      [
        { text: 'Tetap Lanjut', style: 'cancel' },
        { text: 'Batalkan', style: 'destructive', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  const handleSaveSettings = () => {
    setShowSettingsModal(false);
  };

  const handleResetSettings = () => {
    dispatch(resetDistributionSettings());
  };

  // Get title and subtitle
  const getTitle = () => 'Distribusi Template';
  const getSubtitle = () => template?.nama_template || 'Template';

  // Priority options
  const priorityOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Tinggi', value: 'high' },
    { label: 'Rendah', value: 'low' }
  ];

  if (loading.cabangList && !cabangList.length) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
          <Ionicons name="close" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{getTitle()}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {getSubtitle()}
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={handleOpenSettings}>
          <Ionicons name="settings-outline" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Context Information */}
      {mataPelajaranName && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextText}>
            {jenjangName} - {kelasName} - {mataPelajaranName}
          </Text>
        </View>
      )}

      {/* Distribution Summary */}
      {selectedCabang.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Ringkasan Distribusi</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{distributionSummary.total_selected}</Text>
              <Text style={styles.summaryLabel}>Cabang</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{distributionSummary.estimated_reach}</Text>
              <Text style={styles.summaryLabel}>Est. Users</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{distributionSummary.avg_adoption_rate}%</Text>
              <Text style={styles.summaryLabel}>Avg. Adopsi</Text>
            </View>
          </View>
        </View>
      )}

      {/* Cabang Selection */}
      <View style={styles.selectionContainer}>
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>Pilih Cabang Tujuan</Text>
          <Text style={styles.selectionSubtitle}>
            {selectedCabang.length} dari {cabangList.length} cabang dipilih
          </Text>
        </View>
        
        <CabangSelectionList
          cabangList={cabangList}
          selectedCabang={selectedCabang}
          onSelectionChange={handleCabangSelectionChange}
          showStats={true}
          selectionMode="multiple"
          loading={loading.cabangList}
        />
      </View>

      {/* Distribution Action */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[
            styles.distributeButton,
            (selectedCabang.length === 0 || isDistributing) && styles.distributeButtonDisabled
          ]}
          onPress={handleDistribute}
          disabled={selectedCabang.length === 0 || isDistributing}
        >
          {isDistributing ? (
            <View style={styles.distributeButtonContent}>
              <LoadingSpinner size="small" color="white" />
              <Text style={styles.distributeButtonText}>Mendistribusikan...</Text>
            </View>
          ) : (
            <Text style={styles.distributeButtonText}>
              Distribusikan ke {selectedCabang.length} Cabang
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Distribution Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pengaturan Distribusi</Text>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Notification Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Notifikasi</Text>
              
              <TouchableOpacity
                style={styles.settingsToggle}
                onPress={() => handleSettingsChange('auto_notify', !distributionSettings.auto_notify)}
              >
                <View style={styles.settingsToggleContent}>
                  <Text style={styles.settingsToggleLabel}>Kirim Notifikasi Otomatis</Text>
                  <Text style={styles.settingsToggleDescription}>
                    Cabang akan menerima notifikasi saat template didistribusikan
                  </Text>
                </View>
                <Ionicons 
                  name={distributionSettings.auto_notify ? "toggle" : "toggle-outline"} 
                  size={32} 
                  color={distributionSettings.auto_notify ? "#27ae60" : "#bdc3c7"} 
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsToggle}
                onPress={() => handleSettingsChange('require_feedback', !distributionSettings.require_feedback)}
              >
                <View style={styles.settingsToggleContent}>
                  <Text style={styles.settingsToggleLabel}>Minta Feedback</Text>
                  <Text style={styles.settingsToggleDescription}>
                    Cabang diminta memberikan feedback setelah menggunakan template
                  </Text>
                </View>
                <Ionicons 
                  name={distributionSettings.require_feedback ? "toggle" : "toggle-outline"} 
                  size={32} 
                  color={distributionSettings.require_feedback ? "#27ae60" : "#bdc3c7"} 
                />
              </TouchableOpacity>
            </View>

            {/* Priority & Expiry */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Prioritas & Masa Berlaku</Text>
              
              <PickerInput
                label="Prioritas"
                value={distributionSettings.priority}
                onValueChange={(value) => handleSettingsChange('priority', value)}
                items={priorityOptions}
              />

              <TextInput
                label="Masa Berlaku (hari)"
                value={distributionSettings.expiry_days?.toString()}
                onChangeText={(value) => handleSettingsChange('expiry_days', parseInt(value) || null)}
                placeholder="Kosongkan untuk tidak terbatas"
                keyboardType="numeric"
              />
            </View>

            {/* Notes */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Catatan</Text>
              
              <TextInput
                label="Catatan untuk Cabang"
                value={distributionSettings.notes}
                onChangeText={(value) => handleSettingsChange('notes', value)}
                placeholder="Tambahkan catatan atau instruksi khusus..."
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleResetSettings}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
              <Text style={styles.saveButtonText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Error Messages */}
      {error.cabangList && (
        <ErrorMessage 
          message={error.cabangList}
          onRetry={() => dispatch(fetchCabangList({ status: 'active' }))}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  settingsButton: {
    padding: 4,
  },
  contextContainer: {
    backgroundColor: '#3498db',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  contextText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  selectionContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  selectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  actionContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  distributeButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distributeButtonDisabled: {
    backgroundColor: '#bdc3c7',
  },
  distributeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  settingsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  settingsToggleContent: {
    flex: 1,
    marginRight: 16,
  },
  settingsToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  settingsToggleDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  modalActions: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#3498db',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

export default DistributionScreen;