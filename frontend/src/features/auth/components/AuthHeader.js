import React from 'react';
import { View, Text, StyleSheet, Image, StatusBar, SafeAreaView } from 'react-native';
import { APP_NAME } from '../../../constants/config';

/**
 * Authentication Header Component
 * Displays app logo and welcome message for auth screens
 * 
 * @param {Object} props - Component props
 * @param {string} [props.title] - Header title
 * @param {string} [props.subtitle] - Header subtitle
 * @param {string} [props.logoSource] - Logo image source
 * @param {boolean} [props.showLogo=true] - Whether to show logo
 * @param {Object} [props.style] - Additional container styles
 */
const AuthHeader = ({ 
  title = `Welcome to ${APP_NAME}`,
  subtitle = 'Please login to continue',
  logoSource,
  showLogo = true,
  style
}) => {
  // Default logo if not provided
  const defaultLogo = require('../../../assets/images/logo.png');
  const logo = logoSource || defaultLogo;

  return (
    <SafeAreaView style={[styles.container, style]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* App Logo */}
      {showLogo && (
        <View style={styles.logoContainer}>
          <Image 
            source={logo} 
            style={styles.logo} 
            resizeMode="contain"
          />
        </View>
      )}
      
      {/* Welcome Text */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AuthHeader;