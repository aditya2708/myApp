import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View 
} from 'react-native';

/**
 * Custom Button Component
 * A reusable button component with various styles and states
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Button press handler
 * @param {string} [props.type='primary'] - Button type (primary, secondary, danger, success, outline)
 * @param {boolean} [props.loading=false] - Whether to show loading indicator
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {Object} [props.style] - Additional styles for the button
 * @param {Object} [props.textStyle] - Additional styles for the button text
 * @param {string} [props.size='medium'] - Button size (small, medium, large)
 * @param {boolean} [props.fullWidth=false] - Whether button takes full width
 * @param {ReactNode} [props.leftIcon] - Icon to display on the left side
 * @param {ReactNode} [props.rightIcon] - Icon to display on the right side
 */
const Button = ({ 
  title, 
  onPress, 
  type = 'primary', 
  loading = false, 
  disabled = false, 
  style, 
  textStyle,
  size = 'medium',
  fullWidth = false,
  leftIcon,
  rightIcon
}) => {
  // Determine button styles based on type and size
  const buttonStyle = [
    styles.button,
    styles[type],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style
  ];

  // Determine text styles based on type and size
  const buttonTextStyle = [
    styles.text,
    styles[`${type}Text`],
    styles[`${size}Text`],
    textStyle
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress} 
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={type === 'outline' ? '#3498db' : 'white'} 
          size="small" 
        />
      ) : (
        <View style={styles.contentContainer}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={buttonTextStyle}>{title}</Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  // Button types
  primary: {
    backgroundColor: '#3498db',
  },
  secondary: {
    backgroundColor: '#7f8c8d',
  },
  danger: {
    backgroundColor: '#e74c3c',
  },
  success: {
    backgroundColor: '#2ecc71',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  // Button sizes
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  large: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  // Width options
  fullWidth: {
    width: '100%',
  },
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  // Text colors based on button type
  primaryText: {
    color: 'white',
  },
  secondaryText: {
    color: 'white',
  },
  dangerText: {
    color: 'white',
  },
  successText: {
    color: 'white',
  },
  outlineText: {
    color: '#3498db',
  },
  // Text sizes based on button size
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  // Disabled style
  disabled: {
    opacity: 0.6,
  },
});

export default Button;