import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TutorAttendanceEmptyState = ({ title = 'Belum ada data', subtitle }) => (
  <View style={styles.container}>
    <Ionicons name="school-outline" size={48} color="#bdc3c7" />
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
    gap: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center'
  }
});

export default TutorAttendanceEmptyState;
