import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AttendanceSummarySection = ({ title, description, children }) => {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {children ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
};

AttendanceSummarySection.defaultProps = {
  title: 'Ringkasan Kehadiran',
  description: null,
  children: null,
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ecf0f1',
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: '#2d3436',
  },
  description: {
    fontSize: 14,
    color: '#636e72',
  },
  content: {
    marginTop: 12,
  },
});

export default AttendanceSummarySection;
