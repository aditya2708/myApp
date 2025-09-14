/**
 * Currency Formatter Utility for Indonesian Rupiah (IDR)
 * Format: Rp25.000 or Rp25.000,50
 * - No space between Rp and number
 * - Dot (.) as thousand separator
 * - Comma (,) as decimal separator
 */

/**
 * Format number to Indonesian Rupiah format
 * @param {number|string} amount - The amount to format
 * @param {object} options - Formatting options
 * @param {boolean} options.showDecimals - Whether to show decimal places (default: false for whole numbers)
 * @param {number} options.decimalPlaces - Number of decimal places (default: 2)
 * @param {boolean} options.forceDecimals - Force showing decimals even for whole numbers
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showDecimals = false,
    decimalPlaces = 2,
    forceDecimals = false
  } = options;

  // Handle null, undefined, or empty values
  if (amount === null || amount === undefined || amount === '') {
    return 'Rp0';
  }

  // Convert to number
  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : Number(amount);
  
  // Handle NaN
  if (isNaN(numAmount)) {
    return 'Rp0';
  }

  // Handle negative numbers
  const isNegative = numAmount < 0;
  const absAmount = Math.abs(numAmount);

  // Check if number has decimals
  const hasDecimals = absAmount % 1 !== 0;
  
  // Determine if we should show decimals
  const shouldShowDecimals = forceDecimals || (showDecimals && hasDecimals);

  let formattedNumber;
  
  if (shouldShowDecimals) {
    // Format with decimals
    const fixedAmount = absAmount.toFixed(decimalPlaces);
    const [wholePart, decimalPart] = fixedAmount.split('.');
    
    // Format whole part with thousand separators
    const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    // Remove trailing zeros from decimal part if not forcing decimals
    const cleanDecimalPart = forceDecimals ? decimalPart : decimalPart.replace(/0+$/, '');
    
    formattedNumber = cleanDecimalPart ? `${formattedWhole},${cleanDecimalPart}` : formattedWhole;
  } else {
    // Format without decimals
    const roundedAmount = Math.round(absAmount);
    formattedNumber = roundedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Add currency symbol and handle negative
  const result = `Rp${formattedNumber}`;
  return isNegative ? `-${result}` : result;
};

/**
 * Format currency with default settings (no decimals for whole numbers)
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatRupiah = (amount) => {
  return formatCurrency(amount);
};

/**
 * Format currency always showing 2 decimal places
 * @param {number|string} amount - The amount to format
 * @returns {string} Formatted currency string with decimals
 */
export const formatRupiahWithDecimals = (amount) => {
  return formatCurrency(amount, { forceDecimals: true });
};

/**
 * Parse formatted currency string back to number
 * @param {string} formattedAmount - The formatted currency string
 * @returns {number} Parsed number value
 */
export const parseCurrency = (formattedAmount) => {
  if (!formattedAmount || typeof formattedAmount !== 'string') {
    return 0;
  }

  // Remove Rp symbol and handle negative
  let cleanAmount = formattedAmount.replace(/^-?Rp/, '');
  const isNegative = formattedAmount.startsWith('-');
  
  // Replace thousand separators (dots) with empty string
  // Replace decimal separator (comma) with dot
  cleanAmount = cleanAmount.replace(/\./g, '').replace(/,/g, '.');
  
  const parsed = parseFloat(cleanAmount) || 0;
  return isNegative ? -parsed : parsed;
};

/**
 * Format number for input fields (without Rp symbol)
 * @param {number|string} amount - The amount to format
 * @param {boolean} allowDecimals - Whether to allow decimal input
 * @returns {string} Formatted number string for input
 */
export const formatNumberInput = (amount, allowDecimals = false) => {
  if (amount === null || amount === undefined || amount === '') {
    return '';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : Number(amount);
  
  if (isNaN(numAmount)) {
    return '';
  }

  if (allowDecimals) {
    const hasDecimals = numAmount % 1 !== 0;
    if (hasDecimals) {
      const [wholePart, decimalPart] = numAmount.toString().split('.');
      const formattedWhole = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${formattedWhole},${decimalPart}`;
    }
  }

  return Math.round(numAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Validate if string is a valid currency format
 * @param {string} value - The value to validate
 * @returns {boolean} True if valid currency format
 */
export const isValidCurrencyFormat = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Pattern for Indonesian Rupiah format: Rp25.000 or Rp25.000,50
  const pattern = /^-?Rp\d{1,3}(\.\d{3})*(?:,\d{1,2})?$/;
  return pattern.test(value);
};

/**
 * Helper function for React Native TextInput formatting
 * @param {string} text - Input text
 * @param {boolean} allowDecimals - Whether to allow decimals
 * @returns {string} Formatted text for input
 */
export const formatCurrencyInput = (text, allowDecimals = false) => {
  // Remove non-numeric characters except comma and dot
  let cleaned = text.replace(/[^\d.,]/g, '');
  
  if (!allowDecimals) {
    // Remove any decimals
    cleaned = cleaned.replace(/[.,]/g, '');
  } else {
    // Handle decimal input
    const parts = cleaned.split(/[.,]/);
    if (parts.length > 2) {
      // Multiple separators, keep only first as decimal
      cleaned = parts[0] + ',' + parts.slice(1).join('');
    } else if (parts.length === 2) {
      // Has decimal part
      cleaned = parts[0] + ',' + parts[1].substring(0, 2); // Limit to 2 decimal places
    }
  }

  return formatNumberInput(cleaned, allowDecimals);
};

// Default export
export default {
  formatCurrency,
  formatRupiah,
  formatRupiahWithDecimals,
  parseCurrency,
  formatNumberInput,
  formatCurrencyInput,
  isValidCurrencyFormat
};