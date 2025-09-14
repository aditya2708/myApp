import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getInputFieldConfig, getPaymentSystemName, isFlatMonthly } from '../../adminShelter/utils/paymentSystemUtils';

const HonorCalculatorInput = ({ 
  paymentSystem, 
  values, 
  onValueChange, 
  errors = {},
  disabled = false 
}) => {
  if (!paymentSystem) {
    return (
      <View style={styles.container}>
        <Text style={styles.noSystemText}>Setting honor belum tersedia</Text>
      </View>
    );
  }

  if (isFlatMonthly(paymentSystem)) {
    return (
      <View style={styles.container}>
        <View style={styles.flatMonthlyCard}>
          <Ionicons name="calendar" size={24} color="#3498db" />
          <Text style={styles.flatMonthlyTitle}>Honor Bulanan Tetap</Text>
          <Text style={styles.flatMonthlySubtitle}>
            Honor dihitung secara tetap per bulan tanpa input tambahan
          </Text>
        </View>
      </View>
    );
  }

  const inputFields = getInputFieldConfig(paymentSystem);

  if (inputFields.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noInputText}>
          Sistem {getPaymentSystemName(paymentSystem)} tidak memerlukan input
        </Text>
      </View>
    );
  }

  const handleInputChange = (field, value) => {
    let numericValue = value.replace(/[^0-9.]/g, '');
    
    // Handle decimal point for hour_count
    if (field === 'hour_count') {
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        numericValue = parts[0] + '.' + parts[1];
      }
      if (parts[1] && parts[1].length > 1) {
        numericValue = parts[0] + '.' + parts[1].substring(0, 1);
      }
    } else {
      // Remove decimal for integer fields
      numericValue = numericValue.split('.')[0];
    }

    const finalValue = numericValue === '' ? 0 : 
      field === 'hour_count' ? parseFloat(numericValue) || 0 : 
      parseInt(numericValue) || 0;

    onValueChange(field, finalValue);
  };

  const renderInputField = (config) => {
    const value = values[config.key] || 0;
    const hasError = errors[config.key];

    return (
      <View key={config.key} style={styles.inputGroup}>
        <View style={styles.inputLabelRow}>
          <Ionicons 
            name={config.icon} 
            size={16} 
            color={hasError ? "#e74c3c" : "#666"} 
          />
          <Text style={[
            styles.inputLabel,
            hasError && styles.inputLabelError
          ]}>
            {config.label}
          </Text>
        </View>
        
        <TextInput
          style={[
            styles.input,
            hasError && styles.inputError,
            disabled && styles.inputDisabled
          ]}
          value={value.toString()}
          onChangeText={(text) => handleInputChange(config.key, text)}
          keyboardType="numeric"
          placeholder={config.placeholder}
          placeholderTextColor="#999"
          editable={!disabled}
        />
        
        {hasError && (
          <Text style={styles.errorText}>{errors[config.key]}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Input Parameter</Text>
        <Text style={styles.subtitle}>
          {getPaymentSystemName(paymentSystem)}
        </Text>
      </View>

      <View style={styles.inputsContainer}>
        {inputFields.map(renderInputField)}
      </View>

      {inputFields.some(field => field.key.includes('count')) && (
        <View style={styles.helpContainer}>
          <Ionicons name="information-circle" size={16} color="#3498db" />
          <Text style={styles.helpText}>
            Masukkan jumlah sesuai dengan data aktivitas yang akan dihitung
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  header: {
    marginBottom: 16
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500'
  },
  inputsContainer: {
    gap: 16
  },
  inputGroup: {
    flex: 1
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6
  },
  inputLabelError: {
    color: '#e74c3c'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#f8f9fa',
    textAlign: 'center'
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fdf2f2'
  },
  inputDisabled: {
    backgroundColor: '#f0f0f0',
    color: '#999'
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
    textAlign: 'center'
  },
  flatMonthlyCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  flatMonthlyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4
  },
  flatMonthlySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  },
  noSystemText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  noInputText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ebf3fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 16
  },
  helpText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16
  }
});

export default HonorCalculatorInput;