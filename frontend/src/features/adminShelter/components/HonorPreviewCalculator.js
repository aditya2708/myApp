import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import LoadingSpinner from '../../../common/components/LoadingSpinner';
import Button from '../../../common/components/Button';

import {
  calculatePreview,
  resetPreview,
  selectPreview,
  selectHonorActionStatus
} from '../redux/tutorHonorSlice';

const HonorPreviewCalculator = ({ 
  settings,
  initialData = {},
  onCalculate,
  style,
  showTitle = true,
  showResetButton = true
}) => {
  const dispatch = useDispatch();
  
  const preview = useSelector(selectPreview);
  const previewLoading = useSelector(state => selectHonorActionStatus(state, 'preview'));

  const [inputData, setInputData] = useState({
    cpb_count: initialData.cpb_count || 0,
    pb_count: initialData.pb_count || 0,
    npb_count: initialData.npb_count || 0,
    session_count: initialData.session_count || 0,
    hour_count: initialData.hour_count || 0,
    ...initialData
  });

  useEffect(() => {
    if (settings && shouldCalculatePreview()) {
      const delayedCalculation = setTimeout(() => {
        dispatch(calculatePreview(inputData));
        onCalculate?.(inputData, preview);
      }, 500);
      
      return () => clearTimeout(delayedCalculation);
    }
  }, [inputData, settings]);

  const shouldCalculatePreview = () => {
    if (!settings) return false;
    
    const { payment_system } = settings;
    const totalStudents = inputData.cpb_count + inputData.pb_count + inputData.npb_count;
    
    switch (payment_system) {
      case 'flat_monthly':
        return true;
      case 'per_session':
        return inputData.session_count > 0;
      case 'per_student_category':
        return totalStudents > 0;
      case 'per_hour':
        return inputData.hour_count > 0;
      case 'base_per_session':
        return inputData.session_count > 0;
      case 'base_per_student':
        return totalStudents > 0;
      case 'base_per_hour':
        return inputData.hour_count > 0;
      case 'session_per_student':
        return inputData.session_count > 0 && totalStudents > 0;
      default:
        return false;
    }
  };

  const handleInputChange = (field, value) => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
    setInputData(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };

  const handleReset = () => {
    setInputData({
      cpb_count: 0,
      pb_count: 0,
      npb_count: 0,
      session_count: 0,
      hour_count: 0
    });
    dispatch(resetPreview());
  };

  const renderInputFields = () => {
    if (!settings) return null;

    const { payment_system } = settings;

    return (
      <View style={styles.inputSection}>
        {showTitle && (
          <Text style={styles.sectionTitle}>Input Data Kalkulasi</Text>
        )}
        
        {/* Student category inputs - shown for most systems */}
        {['per_student_category', 'base_per_student', 'session_per_student'].includes(payment_system) && (
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CPB</Text>
              <TextInput
                style={styles.input}
                value={inputData.cpb_count.toString()}
                onChangeText={(value) => handleInputChange('cpb_count', value)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PB</Text>
              <TextInput
                style={styles.input}
                value={inputData.pb_count.toString()}
                onChangeText={(value) => handleInputChange('pb_count', value)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NPB</Text>
              <TextInput
                style={styles.input}
                value={inputData.npb_count.toString()}
                onChangeText={(value) => handleInputChange('npb_count', value)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        )}

        {/* Session input */}
        {['per_session', 'base_per_session', 'session_per_student'].includes(payment_system) && (
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jumlah Sesi</Text>
              <TextInput
                style={[styles.input, styles.fullWidthInput]}
                value={inputData.session_count.toString()}
                onChangeText={(value) => handleInputChange('session_count', value)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        )}

        {/* Hour input */}
        {['per_hour', 'base_per_hour'].includes(payment_system) && (
          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jumlah Jam</Text>
              <TextInput
                style={[styles.input, styles.fullWidthInput]}
                value={inputData.hour_count.toString()}
                onChangeText={(value) => handleInputChange('hour_count', value)}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>
        )}

        {/* Flat monthly - no inputs needed */}
        {payment_system === 'flat_monthly' && (
          <View style={styles.flatMonthlyNotice}>
            <Ionicons name="information-circle" size={16} color="#3498db" />
            <Text style={styles.flatMonthlyText}>
              Sistem honor bulanan tetap - tidak memerlukan input tambahan
            </Text>
          </View>
        )}

        {showResetButton && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={16} color="#666" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPreviewResult = () => {
    if (previewLoading) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="small" />
          <Text style={styles.loadingText}>Menghitung...</Text>
        </View>
      );
    }

    if (!preview) return null;

    return (
      <View style={styles.resultSection}>
        <Text style={styles.sectionTitle}>Hasil Kalkulasi</Text>
        
        <View style={styles.previewBreakdown}>
          {Object.entries(preview.calculation.breakdown).map(([key, data]) => (
            <View key={key} style={styles.breakdownItem}>
              <View style={styles.breakdownHeader}>
                <Text style={styles.breakdownLabel}>{key.toUpperCase()}</Text>
                <Text style={styles.breakdownAmount}>
                  Rp {data.amount?.toLocaleString('id-ID')}
                </Text>
              </View>
              {data.count > 0 && (
                <Text style={styles.breakdownDetail}>
                  {data.count} × Rp {data.rate?.toLocaleString('id-ID')}
                </Text>
              )}
            </View>
          ))}
          
          <View style={[styles.breakdownItem, styles.totalBreakdown]}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.totalLabel}>Total Honor</Text>
              <Text style={styles.totalAmount}>
                {preview.formatted_total}
              </Text>
            </View>
          </View>
        </View>

        {preview.setting && (
          <View style={styles.settingInfo}>
            <Text style={styles.settingInfoTitle}>Setting Digunakan:</Text>
            <Text style={styles.settingInfoText}>
              {getPaymentSystemName(preview.setting.payment_system)} (#{preview.setting.id_setting})
            </Text>
          </View>
        )}
      </View>
    );
  };

  const getPaymentSystemName = (paymentSystem) => {
    const systems = {
      'flat_monthly': 'Honor Bulanan Tetap',
      'per_session': 'Per Sesi/Pertemuan',
      'per_student_category': 'Per Kategori Siswa',
      'per_hour': 'Per Jam',
      'base_per_session': 'Dasar + Per Sesi',
      'base_per_student': 'Dasar + Per Siswa',
      'base_per_hour': 'Dasar + Per Jam',
      'session_per_student': 'Per Sesi + Per Siswa'
    };
    return systems[paymentSystem] || paymentSystem;
  };

  if (!settings) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.noSettingsContainer}>
          <Ionicons name="warning" size={32} color="#f39c12" />
          <Text style={styles.noSettingsTitle}>Setting Honor Tidak Tersedia</Text>
          <Text style={styles.noSettingsText}>
            Tidak dapat melakukan kalkulasi tanpa setting honor aktif
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {renderInputFields()}
      {renderPreviewResult()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  inputSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center'
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f8f9fa',
    width: '100%'
  },
  fullWidthInput: {
    maxWidth: 150,
    alignSelf: 'center'
  },
  flatMonthlyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ebf3fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  flatMonthlyText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#3498db',
    flex: 1
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  resetButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666'
  },
  resultSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666'
  },
  previewBreakdown: {
    gap: 12
  },
  breakdownItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  breakdownDetail: {
    fontSize: 12,
    color: '#666'
  },
  totalBreakdown: {
    borderBottomWidth: 0,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2ecc71'
  },
  settingInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  settingInfoTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  settingInfoText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500'
  },
  noSettingsContainer: {
    alignItems: 'center',
    padding: 40
  },
  noSettingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    textAlign: 'center'
  },
  noSettingsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center'
  }
});

export default HonorPreviewCalculator;