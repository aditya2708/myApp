import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  AppState
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const SCANNER_SIZE = width * 0.7;

const QrScanner = ({ onScan, onClose, isLoading = false, disabled = false }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const isFocused = useIsFocused();
  const appState = useRef(AppState.currentState);
  const scanTimeout = useRef(null);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setCameraActive(isFocused);
      } else if (nextAppState.match(/inactive|background/)) {
        setCameraActive(false);
      }
      appState.current = nextAppState;
    });

    return () => subscription?.remove();
  }, [isFocused]);

  // Camera lifecycle management
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const setupCamera = async () => {
        if (isActive && !disabled) {
          await requestPermission();
          setCameraActive(true);
          setScanned(false);
        }
      };

      setupCamera();

      return () => {
        isActive = false;
        setCameraActive(false);
        setScanned(false);
        if (scanTimeout.current) {
          clearTimeout(scanTimeout.current);
          scanTimeout.current = null;
        }
      };
    }, [requestPermission, disabled])
  );

  const handleBarCodeScanned = useCallback(({ type, data }) => {
    console.log('QR DETECTED:', { type, data, scanned, isLoading, disabled });
    
    if (scanned || isLoading || disabled) {
      console.log('QR SCAN BLOCKED:', { scanned, isLoading, disabled });
      return;
    }
    
    console.log('QR SCAN PROCESSING...');
    setScanned(true);
    
    try {
      const qrData = JSON.parse(data);
      onScan(qrData);
    } catch (error) {
      if (data.includes('token')) {
        try {
          const tokenMatch = data.match(/"token":"([^"]+)"/);
          if (tokenMatch?.[1]) {
            onScan({ token: tokenMatch[1] });
            return;
          }
        } catch (err) {
          console.error('Error extracting token:', err);
        }
      }
      onScan({ token: data });
    }
    
    // Reset with timeout ref
    console.log('Setting timeout to reset scanned state in 2s');
    scanTimeout.current = setTimeout(() => {
      if (cameraActive) {
        console.log('Resetting scanned state');
        setScanned(false);
      } else {
        console.log('Camera inactive, not resetting scanned state');
      }
      scanTimeout.current = null;
    }, 2000);
  }, [scanned, isLoading, disabled, onScan, cameraActive]);

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Meminta izin kamera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Tidak ada akses kamera</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Berikan Izin</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (disabled) {
    return (
      <View style={styles.container}>
        <View style={styles.disabledContainer}>
          <Ionicons name="qr-code-outline" size={80} color="rgba(255,255,255,0.3)" />
          <Text style={styles.disabledText}>Scanner tidak aktif</Text>
        </View>
      </View>
    );
  }

  // Debug log camera states
  console.log('CAMERA STATES:', { 
    cameraActive, 
    isFocused, 
    scanned, 
    disabled, 
    permission: permission?.granted,
    showCamera: cameraActive && isFocused,
    scannerEnabled: !scanned
  });

  return (
    <View style={styles.container}>
      {cameraActive && isFocused ? (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr']
          }}
          facing="back"
        />
      ) : (
        <View style={styles.inactiveCamera}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.inactiveCameraText}>Mengaktifkan kamera...</Text>
        </View>
      )}
      
      <View style={styles.overlay}>
        <View style={styles.unfocusedContainer}></View>
        <View style={styles.middleContainer}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.focusedContainer}>
            <View style={[styles.cornerTopLeft, styles.corner]} />
            <View style={[styles.cornerTopRight, styles.corner]} />
            <View style={[styles.cornerBottomLeft, styles.corner]} />
            <View style={[styles.cornerBottomRight, styles.corner]} />
          </View>
          <View style={styles.unfocusedContainer}></View>
        </View>
        <View style={styles.unfocusedContainer}>
          <Text style={styles.scanText}>Posisikan kode QR dalam bingkai</Text>
        </View>
      </View>
      
      {onClose && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      )}
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Memproses...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 1.5,
  },
  focusedContainer: {
    flex: 6,
    height: SCANNER_SIZE,
  },
  scanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#fff',
    borderWidth: 3,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  inactiveCamera: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveCameraText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginTop: 10,
  }
});

export default QrScanner;