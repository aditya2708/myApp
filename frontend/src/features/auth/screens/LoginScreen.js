import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableOpacity,
  Text,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import components
import AuthHeader from '../components/AuthHeader';
import LoginForm from '../components/LoginForm';
import LoadingSpinner from '../../../common/components/LoadingSpinner';

// Import constants and hooks
import { APP_NAME } from '../../../constants/config';
import { useAuth } from '../../../common/hooks/useAuth';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation();
  const { loading } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Handle successful login
  const handleLoginSuccess = () => {
    setLoginSuccess(true);
  };

  // Handle forgot password navigation
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo and App Name */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.appName}>{APP_NAME}</Text>
          </View>
          
          {/* Welcome message and login form */}
          <View style={styles.formContainer}>
            {/* <AuthHeader 
              title="Welcome Back!"
              subtitle="Please sign in to continue"
              showLogo={false}
            /> */}
            
            <LoginForm onLoginSuccess={handleLoginSuccess} />
            
            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
            </TouchableOpacity>
          </View>
          
          {/* Loading overlay */}
          {loginSuccess && (
            <View style={styles.loadingOverlay}>
              <LoadingSpinner 
                message="Logging you in..." 
                size="large"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
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
  formContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#3498db',
    fontSize: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default LoginScreen;