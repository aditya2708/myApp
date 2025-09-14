import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EmptyState = ({
  icon = 'folder-open-outline',
  iconSize = 80,
  iconColor = '#cccccc',
  title = 'No Data Found',
  message = '',
  actionButtonText,
  onActionPress,
  retryButtonText = 'Retry',
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={iconSize} color={iconColor} />
      
      <Text style={styles.title}>{title}</Text>
      
      {message ? <Text style={styles.message}>{message}</Text> : null}
      
      {onActionPress && actionButtonText && (
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onActionPress}
        >
          <Text style={styles.primaryButtonText}>{actionButtonText}</Text>
        </TouchableOpacity>
      )}
      
      {onRetry && (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onRetry}
        >
          <Text style={styles.secondaryButtonText}>{retryButtonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#9b59b6',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#9b59b6',
  },
  secondaryButtonText: {
    color: '#9b59b6',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default EmptyState;