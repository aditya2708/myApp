import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReportSection = ({
  title,
  children,
  style,
  titleStyle,
  contentContainerStyle,
  testID,
}) => {
  const content = contentContainerStyle ? (
    <View style={contentContainerStyle}>{children}</View>
  ) : (
    children
  );

  return (
    <View style={[styles.section, style]} testID={testID}>
      {title ? <Text style={[styles.sectionTitle, titleStyle]}>{title}</Text> : null}
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: 12,
  },
});

export default ReportSection;
