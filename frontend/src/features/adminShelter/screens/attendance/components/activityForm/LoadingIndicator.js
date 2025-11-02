import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import styles from '../../styles/activityFormStyles';

const LoadingIndicator = ({ loading, text = 'Memuat...' }) => {
  if (!loading) return null;

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="#3498db" />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
};

export default LoadingIndicator;
