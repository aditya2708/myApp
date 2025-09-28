import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ReportQuickLinkTile = ({
  title,
  description,
  icon = 'document-text',
  color = '#3498db',
  onPress,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.card, disabled && styles.cardDisabled]}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={disabled}
  >
    <View style={[styles.iconContainer, { backgroundColor: color }]}> 
      <Ionicons name={icon} size={22} color="#fff" />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.titleText} numberOfLines={2}>
        {title}
      </Text>
      {description && (
        <Text style={styles.descriptionText} numberOfLines={3}>
          {description}
        </Text>
      )}
    </View>
    <Ionicons name="chevron-forward" size={18} color="#b2bec3" />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
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
  cardDisabled: {
    opacity: 0.6,
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
    marginRight: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  descriptionText: {
    fontSize: 13,
    color: '#636e72',
    marginTop: 4,
  },
});

export default ReportQuickLinkTile;
