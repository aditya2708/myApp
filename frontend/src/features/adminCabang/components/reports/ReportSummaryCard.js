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
  variant = 'default',
}) => {
  const isCompact = variant === 'compact';
  const formattedValue = typeof value === 'number'
    ? value.toLocaleString('id-ID')
    : value;

  return (
    <View style={[styles.card, isCompact && styles.cardCompact]}>
      <View style={[styles.iconContainer, { backgroundColor: color }, isCompact && styles.iconContainerCompact]}>
        <Ionicons name={icon} size={isCompact ? 18 : 22} color="#fff" />
      </View>
      <View style={[styles.textContainer, isCompact && styles.textContainerCompact]}>
        <Text
          style={[styles.valueText, isCompact && styles.valueTextCompact]}
          numberOfLines={isCompact ? 2 : 1}
        >
          {formattedValue ?? '-'}
        </Text>
        {label && (
          <Text
            style={[styles.labelText, isCompact && styles.labelTextCompact]}
            numberOfLines={isCompact ? 3 : 2}
          >
            {label}
          </Text>
        )}
        {description && (
          <Text
            style={[styles.descriptionText, isCompact && styles.descriptionTextCompact]}
            numberOfLines={isCompact ? 3 : 2}
          >
            {description}
          </Text>
        )}
      </View>
      {accessory && <View style={[styles.accessoryContainer, isCompact && styles.accessoryCompact]}>{accessory}</View>}
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
  accessoryContainer: {
    marginLeft: 8,
  },
  cardCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    minHeight: 88,
  },
  iconContainerCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 0,
    marginBottom: 8,
  },
  textContainerCompact: {
    width: '100%',
    alignItems: 'center',
  },
  valueTextCompact: {
    fontSize: 18,
    textAlign: 'center',
  },
  labelTextCompact: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
  },
  descriptionTextCompact: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  accessoryCompact: {
    marginLeft: 0,
    marginTop: 8,
    alignSelf: 'center',
  },
});

export default ReportSummaryCard;
