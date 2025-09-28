import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReportQuickActionTile = ({
  title,
  description,
  icon = 'flash',
  color = '#2980b9',
  badge = null,
  disabled = false,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.card, disabled && styles.cardDisabled]}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={disabled}
  >
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="#fff" />
    </View>
    <Text style={styles.titleText} numberOfLines={2}>
      {title}
    </Text>
    {description ? (
      <Text style={styles.descriptionText} numberOfLines={3}>
        {description}
      </Text>
    ) : null}
    {badge ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
  },
  descriptionText: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 6,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ReportQuickActionTile;
