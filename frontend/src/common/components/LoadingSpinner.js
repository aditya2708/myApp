import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

/**
 * Loading Spinner Component
 * Displays a loading indicator with optional message
 * 
 * @param {Object} props - Component props
 * @param {string} [props.size='large'] - Size of the spinner (small, large)
 * @param {string} [props.color='#3498db'] - Color of the spinner
 * @param {string} [props.message='Loading...'] - Message to display
 * @param {boolean} [props.fullScreen=false] - Whether to display in fullscreen
 * @param {Object} [props.style] - Additional styles for the container
 */
const LoadingSpinner = ({ 
  size = 'large', 
  color = '#3498db', 
  message = 'Memuat...', 
  fullScreen = false,
  style
}) => {
  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, style]}>
        <ActivityIndicator size={size} color={color} />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});

export default LoadingSpinner;