/**
 * Format date string to Indonesian format
 * @param {string} dateString - Date string in format YYYY-MM-DD or DD-MM-YYYY
 * @returns {string} Formatted date string in Indonesian format, e.g. "5 Mei 2023"
 */
export const formatDateToIndonesian = (dateString) => {
  if (!dateString) return '-';

  try {
    // Check if date is in DD-MM-YYYY format
    let parts;
    let day, month, year;

    if (dateString.includes('-')) {
      parts = dateString.split('-');
      // Check if date is in YYYY-MM-DD format
      if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      } else {
        // Date is in DD-MM-YYYY format
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      }
    } else if (dateString.includes('/')) {
      parts = dateString.split('/');
      // Check if date is in YYYY/MM/DD format
      if (parts[0].length === 4) {
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      } else {
        // Date is in DD/MM/YYYY format
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
        year = parseInt(parts[2]);
      }
    } else {
      // Try to parse as a JavaScript Date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }
      day = date.getDate();
      month = date.getMonth() + 1; // JavaScript months are 0-based
      year = date.getFullYear();
    }

    // Indonesian month names
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    // Return formatted date
    return `${day} ${monthNames[month - 1]} ${year}`;

  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original if formatting fails
  }
};

/**
 * Format date for API submission
 * @param {string} dateString - Date string in any format
 * @returns {string} Formatted date string in DD-MM-YYYY format
 */
export const formatDateForApi = (dateString) => {
  if (!dateString) return '';

  try {
    // Parse the date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If direct parsing fails, try to handle common formats
      let parts;
      let day, month, year;

      if (dateString.includes('-')) {
        parts = dateString.split('-');
        // Check if date is in YYYY-MM-DD format
        if (parts[0].length === 4) {
          year = parts[0];
          month = parts[1];
          day = parts[2];
        } else {
          // Date is in DD-MM-YYYY format
          day = parts[0];
          month = parts[1];
          year = parts[2];
        }
      } else if (dateString.includes('/')) {
        parts = dateString.split('/');
        // Check if date is in YYYY/MM/DD format
        if (parts[0].length === 4) {
          year = parts[0];
          month = parts[1];
          day = parts[2];
        } else {
          // Date is in DD/MM/YYYY format
          day = parts[0];
          month = parts[1];
          year = parts[2];
        }
      } else {
        return dateString; // Return original if can't parse
      }

      // Ensure leading zeros
      day = day.padStart(2, '0');
      month = month.padStart(2, '0');

      return `${day}-${month}-${year}`;
    }

    // Format the date as DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return dateString; // Return original if formatting fails
  }
};