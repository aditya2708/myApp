import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

/**
 * Error Message Component
 * Displays an error message with optional retry button
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Error message to display
 * @param {Function} [props.onRetry] - Callback function when retry is pressed
 * @param {boolean} [props.visible=true] - Whether the error is visible
 * @param {Object} [props.style] - Additional styles for the container
 * @param {Object} [props.textStyle] - Additional styles for the error text
 * @param {Object} [props.buttonStyle] - Additional styles for the retry button
 * @param {string} [props.retryText='Retry'] - Text for the retry button
 */
const ErrorMessage = ({ 
  message, 
  onRetry, 
  visible = true, 
  style, 
  textStyle, 
  buttonStyle,
  retryText = 'Retry'
}) => {
  if (!visible || !message) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.errorText, textStyle]}>
        {message}
      </Text>
      
      {onRetry && (
        <TouchableOpacity 
          style={[styles.retryButton, buttonStyle]} 
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Text style={styles.retryButtonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#d32f2f',
    padding: 10,
    borderRadius: 4,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ErrorMessage;