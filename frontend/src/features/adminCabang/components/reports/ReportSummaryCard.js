import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReportSummaryCard = ({
  icon = 'stats-chart',
  label,
  value,
  description,
  color = '#2ecc71',
  accessory,
}) => {
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('id-ID')
    : value;

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.valueText} numberOfLines={1}>
          {formattedValue ?? '-'}
        </Text>
        {label && (
          <Text style={styles.labelText} numberOfLines={2}>
            {label}
          </Text>
        )}
        {description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>
      {accessory}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
  },
  labelText: {
    fontSize: 14,
    color: '#636e72',
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 2,
  },
});

export default ReportSummaryCard;
