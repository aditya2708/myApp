/**
 * Calculate age from birth date
 * @param {string} birthDate - Birth date in any format (YYYY-MM-DD, DD-MM-YYYY, etc.)
 * @returns {string} Age in years with "tahun" suffix
 */
export const calculateAge = (birthDate) => {
  if (!birthDate) return 'Tidak diketahui';
  
  // Normalize date format - handle both YYYY-MM-DD and DD-MM-YYYY formats
  let dob;
  
  try {
    // Check for DD-MM-YYYY format
    if (birthDate.match(/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/)) {
      const parts = birthDate.split(/[-/]/);
      dob = new Date(parts[2], parts[1] - 1, parts[0]);
    } 
    // Handle YYYY-MM-DD format
    else if (birthDate.match(/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/)) {
      dob = new Date(birthDate);
    } 
    // Try direct parsing as fallback
    else {
      dob = new Date(birthDate);
    }
    
    // Check if date is valid
    if (isNaN(dob.getTime())) {
      return 'Format tanggal salah';
    }
    
    // Check if year is reasonable (not in future, not too far in past)
    const year = dob.getFullYear();
    const currentYear = new Date().getFullYear();
    
    if (year > currentYear) {
      return 'Tahun lahir di masa depan';
    }
    
    if (year < 1900) {
      return 'Tahun lahir terlalu lampau';
    }
    
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return `${age} tahun`;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 'Error perhitungan';
  }
};

/**
 * Get formatted status based on status_cpb
 * @param {string} statusCode - Status code (BCPB, NPB, CPB, PB)
 * @returns {string} Formatted status in Indonesian
 */
export const getStatusLabel = (statusCode) => {
  if (!statusCode) return 'Tidak ada';
  
  const statusMap = {
    'BCPB': 'BCPB',
    'NPB': 'NPB',
    'CPB': 'CPB',
    'PB': 'PB'
  };
  
  return statusMap[statusCode] || statusCode;
};