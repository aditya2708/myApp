import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getBackgroundColor = (color, active) => {
  if (!active) {
    return '#ffffff';
  }

  if (!color) {
    return 'rgba(9, 132, 227, 0.12)';
  }

  return `${color}1f`;
};

const AttendanceStatusChip = ({
  label,
  status,
  icon,
  color,
  active,
  disabled,
  onPress,
  style,
}) => {
  const backgroundColor = getBackgroundColor(color, active);
  const borderColor = active ? color || '#0984e3' : '#dfe6e9';
  const textColor = disabled ? '#b2bec3' : active ? color || '#0984e3' : '#2d3436';

  const content = (
    <View
      style={[
        styles.chip,
        { backgroundColor, borderColor },
        disabled ? styles.disabledChip : null,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={textColor} style={styles.icon} /> : null}
      <Text style={[styles.label, { color: textColor }]}>{label || status || 'Status'}</Text>
    </View>
  );

  if (disabled) {
    return <View style={styles.wrapper}>{content}</View>;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      style={styles.wrapper}
    >
      {content}
    </TouchableOpacity>
  );
};

AttendanceStatusChip.defaultProps = {
  label: null,
  status: null,
  icon: null,
  color: null,
  active: false,
  disabled: false,
  onPress: undefined,
  style: null,
};

const styles = StyleSheet.create({
  wrapper: {
    marginRight: 10,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  disabledChip: {
    backgroundColor: '#f1f2f6',
    borderColor: '#dfe6e9',
  },
});

export default AttendanceStatusChip;
