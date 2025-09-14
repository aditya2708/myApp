import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import attendanceConfig from '../../../constants/attendanceConfig';

/**
 * Utility for handling QR code export operations
 */
const qrExportHelper = {
  /**
   * Check if sharing is available on the device
   * @returns {Promise<boolean>} Whether sharing is available
   */
  isSharingAvailable: async () => {
    if (Platform.OS === 'web') {
      return false; // Sharing is not available on web
    }
    return await Sharing.isAvailableAsync();
  },

  /**
   * Create QR export directory if it doesn't exist
   * @returns {Promise<string>} The directory path
   */
  ensureExportDirectory: async () => {
    const directory = `${FileSystem.documentDirectory}QRCodes/`;
    
    // Check if directory exists
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }
    
    return directory;
  },

  /**
   * Generate a clean filename from student data
   * @param {Object} student - Student data object
   * @returns {string} Sanitized filename
   */
  generateFilename: (student) => {
    const studentName = student.full_name || student.nick_name || `student_${student.id_anak}`;
    const sanitizedName = studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().getTime();
    
    return `qr_${sanitizedName}_${timestamp}.png`;
  },

  /**
   * Save a QR code image to file
   * @param {string} base64Data - Base64 encoded image data
   * @param {Object} student - Student data object
   * @returns {Promise<string>} Path to saved file
   */
  saveQrCodeToFile: async (base64Data, student) => {
    try {
      if (!base64Data) {
        throw new Error('No QR code data provided');
      }
      
      // Remove data URL prefix if present
      let imageData = base64Data;
      if (base64Data.startsWith('data:image')) {
        imageData = base64Data.split(',')[1];
      }
      
      // Ensure directory exists
      const directory = await qrExportHelper.ensureExportDirectory();
      
      // Generate filename
      const filename = qrExportHelper.generateFilename(student);
      const fileUri = `${directory}${filename}`;
      
      // Write file with proper encoding
      await FileSystem.writeAsStringAsync(fileUri, imageData, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
      return fileUri;
    } catch (error) {
      console.error('Error saving QR code:', error);
      throw error;
    }
  },


  /**
   * Share a QR code
   * @param {string} fileUri - Path to the file
   * @param {Object} options - Share options
   * @returns {Promise<Object>} Share result
   */
  shareQrCode: async (fileUri, options = {}) => {
    try {
      const isSharingAvailable = await qrExportHelper.isSharingAvailable();
      
      if (!isSharingAvailable) {
        throw new Error('Sharing is not available on this device');
      }
      
      // Verify file exists before sharing
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }
      
      return await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: options.title || 'Share QR Code',
        UTI: 'public.png'
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
      throw error;
    }
  },

  /**
   * Process a batch of QR codes
   * @param {Array} qrDataArray - Array of {base64Data, student} objects
   * @param {Object} options - Batch process options
   * @returns {Promise<Array>} Array of file URIs
   */
  processBatch: async (qrDataArray, options = {}) => {
    try {
      if (!Array.isArray(qrDataArray) || qrDataArray.length === 0) {
        throw new Error('No QR codes to process');
      }
      
      // Ensure export directory exists
      await qrExportHelper.ensureExportDirectory();
      
      // Array to store results
      const results = [];
      
      // Process each QR code
      for (const { base64Data, student } of qrDataArray) {
        if (!base64Data || !student) {
          results.push({
            success: false,
            error: 'Missing QR data or student info',
            student
          });
          continue;
        }
        
        try {
          const fileUri = await qrExportHelper.saveQrCodeToFile(base64Data, student);
          
          
          results.push({
            success: true,
            fileUri,
            student
          });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            student
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    }
  },
  
  /**
   * Handle sharing multiple QR codes - simplified to always share first
   * @param {Array<string>} fileUris - Array of file URIs
   * @returns {Promise<void>}
   */
  handleMultipleQrCodes: async (fileUris) => {
    if (fileUris.length === 0) {
      throw new Error('No QR codes to share');
    }
    
    // Always share the first QR code for simplicity
    return await qrExportHelper.shareQrCode(fileUris[0], {
      title: fileUris.length > 1 
        ? `Share QR Code (1 of ${fileUris.length})` 
        : 'Share QR Code'
    });
  }
};

export default qrExportHelper;