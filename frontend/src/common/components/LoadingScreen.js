import React from 'react';
import { 
  View, 
  ActivityIndicator, 
  StyleSheet, 
  Text, 
  Image, 
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { APP_NAME } from '../../constants/config';

const { width } = Dimensions.get('window');

/**
 * Full-screen loading component with logo and message
 * 
 * @param {Object} props - Component props
 * @param {string} [props.message='Loading...'] - Message to display
 * @param {string} [props.size='large'] - Size of the loading indicator
 * @param {string} [props.color='#3498db'] - Color of the loading indicator
 * @param {boolean} [props.showLogo=true] - Whether to show logo
 * @param {Object} [props.style] - Additional styles for the container
 */
const LoadingScreen = ({ 
  message = 'Loading...', 
  size = 'large', 
  color = '#3498db',
  showLogo = true,
  style 
}) => {
  return (
    <SafeAreaView style={[styles.container, style]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.contentContainer}>
        {/* Logo */}
        {showLogo && (
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>{APP_NAME}</Text>
          </View>
        )}
        
        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={size} color={color} />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    maxWidth: 150,
    maxHeight: 150,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
});

export default LoadingScreen;