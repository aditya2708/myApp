import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { formatRupiah } from '../../utils/currencyFormatter';

const CurrencyDisplay = ({
  amount,
  style,
  size = 'medium',
  color = '#333',
  weight = 'normal',
  showZero = true,
  prefix = '',
  suffix = '',
  ...props
}) => {
  // Handle null/undefined amounts
  if (!showZero && (!amount || amount === 0)) {
    return null;
  }

  const formattedAmount = formatRupiah(amount || 0);

  const textStyle = [
    styles.base,
    styles[size],
    {
      color,
      fontWeight: weight
    },
    style
  ];

  return (
    <Text style={textStyle} {...props}>
      {prefix}{formattedAmount}{suffix}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontFamily: 'System'
  },
  small: {
    fontSize: 12
  },
  medium: {
    fontSize: 14
  },
  large: {
    fontSize: 16
  },
  xlarge: {
    fontSize: 18
  },
  xxlarge: {
    fontSize: 20
  }
});

export default CurrencyDisplay;