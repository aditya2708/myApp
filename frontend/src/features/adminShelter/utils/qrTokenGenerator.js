/**
 * QR Token Generator
 * Utility for generating semi-dynamic QR tokens for attendance verification
 */
class QrTokenGenerator {
  /**
   * Generate a secure token string
   * 
   * @param {number|string} id_anak - Student ID
   * @param {Object} options - Generation options
   * @returns {string} - Generated token
   */
  static generateTokenString(id_anak, options = {}) {
    // Pad student ID to fixed length
    const paddedId = String(id_anak).padStart(5, '0');
    
    // Generate timestamp component
    const timestamp = new Date().toISOString();
    const timestampHash = this.hashString(timestamp);
    
    // Generate random component
    const randomString = this.generateRandomString(8);
    
    // Combine components
    const tokenBase = `${paddedId}-${timestampHash.substring(0, 12)}-${randomString}`;
    
    // Create final token
    return this.hashString(tokenBase).substring(0, 32);
  }
  
  /**
   * Generate QR code data
   * 
   * @param {string} token - Generated token
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - QR code data
   */
  static generateQrData(token, metadata = {}) {
    return {
      token,
      type: 'attendance',
      timestamp: new Date().toISOString(),
      ...metadata
    };
  }
  
  /**
   * Generate a random string
   * 
   * @param {number} length - Length of string to generate
   * @returns {string} - Random string
   */
  static generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }
  
  /**
   * Simple string hashing function
   * 
   * @param {string} str - String to hash
   * @returns {string} - Hashed string
   */
  static hashString(str) {
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    
    // Convert to hex string and ensure positive
    return Math.abs(hash).toString(16);
  }
  
  /**
   * Validate a token format
   * 
   * @param {string} token - Token to validate
   * @returns {boolean} - Whether token is valid format
   */
  static isValidTokenFormat(token) {
    // Check if token is a string
    if (typeof token !== 'string') {
      return false;
    }
    
    // Check token length
    if (token.length !== 32) {
      return false;
    }
    
    // Check if token contains only hex characters
    return /^[0-9a-f]+$/i.test(token);
  }
}

export default QrTokenGenerator;