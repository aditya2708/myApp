import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import styles from '../../styles/activityFormStyles';

const ConflictWarning = ({ message }) => {
  if (!message) return null;

  return (
    <View style={styles.warningContainer}>
      <View style={styles.warningIcon}>
        <Ionicons name="warning" size={20} color="#f39c12" />
      </View>
      <Text style={styles.warningText}>{message}</Text>
    </View>
  );
};

export default ConflictWarning;
