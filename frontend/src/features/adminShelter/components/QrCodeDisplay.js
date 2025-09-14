import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';

/**
 * QR Code Display Component
 * Displays QR code and provides export functionality
 * 
 * @param {Object} props - Component props
 * @param {string} props.token - Token to encode in QR
 * @param {string} props.studentName - Student name to display
 * @param {string|number} props.studentId - Student ID 
 * @param {number} props.size - QR code size (default: 180)
 * @param {string} props.backgroundColor - QR code background color (default: #FFFFFF)
 * @param {string} props.color - QR code color (default: #000000)
 * @param {boolean} props.showExportButtons - Whether to show export buttons (default: false)
 */
const QrCodeDisplay = forwardRef(({ 
  token, 
  studentName, 
  studentId,
  size = 180,
  backgroundColor = '#FFFFFF',
  color = '#000000',
  showExportButtons = false
}, ref) => {
  // Create refs to access the QR code
  const qrRef = useRef();
  
  // Function to get base64 representation of QR code
  const getDataURL = () => {
    return new Promise((resolve, reject) => {
      if (qrRef.current) {
        qrRef.current.toDataURL((data) => {
          resolve(data);
        });
      } else {
        reject(new Error('QR code reference not available'));
      }
    });
  };
  
  // Function to save QR code to file
  const saveQrToFile = async () => {
    try {
      // Get base64 data
      const data = await getDataURL();
      if (!data) {
        throw new Error('Could not generate QR code image');
      }
      
      // Create directory if it doesn't exist
      const directory = `${FileSystem.documentDirectory}QRCodes/`;
      const dirInfo = await FileSystem.getInfoAsync(directory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }
      
      // Sanitize student name for filename
      const sanitizedName = (studentName || `student_${studentId}`)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      
      // Create filename
      const filename = `qr_${sanitizedName}_${new Date().getTime()}.png`;
      const fileUri = `${directory}${filename}`;
      
      // Write file
      await FileSystem.writeAsStringAsync(fileUri, data, { encoding: FileSystem.EncodingType.Base64 });
      
      return fileUri;
    } catch (error) {
      console.error('Error saving QR code:', error);
      throw error;
    }
  };
  
  // Function to share QR code
  const shareQrCode = async () => {
    try {
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (!isSharingAvailable) {
        throw new Error('Sharing is not available on this device');
      }
      
      // Save QR code to file
      const fileUri = await saveQrToFile();
      
      // Share file
      await Sharing.shareAsync(fileUri);
      
      return { success: true, fileUri };
    } catch (error) {
      console.error('Error sharing QR code:', error);
      throw error;
    }
  };
  
  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    getDataURL,
    saveQrToFile,
    shareQrCode
  }));

  // Handle share button press
  const handleShare = async () => {
    try {
      await shareQrCode();
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  // Debug QR code value
  console.log('QR CODE DISPLAY:', { 
    studentName, 
    studentId, 
    token: token ? `${token.substring(0, 8)}...${token.substring(token.length - 8)}` : 'NO TOKEN',
    tokenFull: token 
  });

  return (
    <View style={styles.container}>
      {/* Student Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.studentName}>{studentName || 'Student'}</Text>
        <Text style={styles.studentId}>ID: {studentId}</Text>
      </View>
      
      {/* QR Code */}
      <View style={styles.qrContainer}>
        <QRCode
          value={token}
          size={size}
          backgroundColor={backgroundColor}
          color={color}
          getRef={(c) => (qrRef.current = c)}
        />
      </View>
      
      {/* Export Buttons */}
      {showExportButtons && (
        <View style={styles.exportContainer}>
          <TouchableOpacity 
            style={styles.exportButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={16} color="#fff" />
            <Text style={styles.exportButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Token Preview */}
      <View style={styles.tokenContainer}>
        <Text style={styles.tokenLabel}>Token</Text>
        <Text style={styles.tokenText}>{token.substring(0, 8)}...{token.substring(token.length - 8)}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  studentId: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  qrContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  exportContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
    marginLeft: 4,
  },
  tokenContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  tokenText: {
    fontSize: 10,
    color: '#95a5a6',
    marginTop: 2,
  }
});

export default QrCodeDisplay;