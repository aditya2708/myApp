import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HonorBreakdownDisplay from './HonorBreakdownDisplay';
import { getPaymentSystemName, isFlatMonthly } from '../../adminShelter/utils/paymentSystemUtils';

const HonorPreviewResult = ({ 
  preview, 
  loading = false, 
  error = null,
  inputParameters = {},
  showInputSummary = true 
}) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Menghitung preview...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#e74c3c" />
          <Text style={styles.errorTitle}>Gagal Menghitung</Text>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!preview) {
    return null;
  }

  const paymentSystem = preview.payment_system || preview.setting?.payment_system;
  const calculation = preview.calculation;
  const setting = preview.setting;

  if (!calculation || !paymentSystem) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <Ionicons name="calculator" size={48} color="#bbb" />
          <Text style={styles.noDataText}>Data kalkulasi tidak tersedia</Text>
        </View>
      </View>
    );
  }

  const renderInputSummary = () => {
    if (!showInputSummary || isFlatMonthly(paymentSystem)) {
      return null;
    }

    const inputs = preview.input_parameters || inputParameters;
    const relevantInputs = Object.entries(inputs).filter(([key, value]) => 
      value > 0 && ['cpb_count', 'pb_count', 'npb_count', 'session_count', 'hour_count'].includes(key)
    );

    if (relevantInputs.length === 0) {
      return null;
    }

    const getInputLabel = (key) => {
      const labels = {
        cpb_count: 'CPB',
        pb_count: 'PB', 
        npb_count: 'NPB',
        session_count: 'Sesi',
        hour_count: 'Jam'
      };
      return labels[key] || key;
    };

    return (
      <View style={styles.inputSummaryContainer}>
        <Text style={styles.inputSummaryTitle}>Parameter Input</Text>
        <View style={styles.inputSummaryRow}>
          {relevantInputs.map(([key, value]) => (
            <View key={key} style={styles.inputSummaryItem}>
              <Text style={styles.inputSummaryValue}>{value}</Text>
              <Text style={styles.inputSummaryLabel}>{getInputLabel(key)}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderSettingInfo = () => {
    if (!setting) return null;

    return (
      <View style={styles.settingContainer}>
        <View style={styles.settingHeader}>
          <Ionicons name="settings" size={16} color="#3498db" />
          <Text style={styles.settingTitle}>Setting Aktif</Text>
        </View>
        <Text style={styles.settingSystem}>
          {getPaymentSystemName(paymentSystem)}
        </Text>
      </View>
    );
  };

  const renderTotalHighlight = () => (
    <View style={styles.totalHighlight}>
      <View style={styles.totalIconContainer}>
        <Ionicons name="wallet" size={24} color="#fff" />
      </View>
      <View style={styles.totalContent}>
        <Text style={styles.totalLabel}>Total Honor</Text>
        <Text style={styles.totalAmount}>
          {preview.formatted_total || `Rp ${Number(calculation.total_amount || 0).toLocaleString('id-ID')}`}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderSettingInfo()}
      {renderInputSummary()}
      {renderTotalHighlight()}
      
      <HonorBreakdownDisplay 
        breakdown={calculation}
        paymentSystem={paymentSystem}
        showTitle={false}
      />

      {isFlatMonthly(paymentSystem) && (
        <View style={styles.flatMonthlyNote}>
          <Ionicons name="information-circle" size={16} color="#3498db" />
          <Text style={styles.flatMonthlyNoteText}>
            Honor bulanan tetap tidak dipengaruhi oleh jumlah aktivitas atau kehadiran siswa
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#e9ecef',
    borderTopColor: '#3498db',
    marginBottom: 16
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 12,
    marginBottom: 8
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  },
  noDataContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center'
  },
  settingContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 6
  },
  settingSystem: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db'
  },
  inputSummaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  inputSummaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12
  },
  inputSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap'
  },
  inputSummaryItem: {
    alignItems: 'center',
    minWidth: 60
  },
  inputSummaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 4
  },
  inputSummaryLabel: {
    fontSize: 12,
    color: '#666'
  },
  totalHighlight: {
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3
  },
  totalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  totalContent: {
    flex: 1
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  flatMonthlyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ebf3fd',
    padding: 16,
    borderRadius: 12,
    marginTop: 16
  },
  flatMonthlyNoteText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16
  }
});

export default HonorPreviewResult;