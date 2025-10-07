import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../common/hooks/useAuth';
import TextInput from '../../../common/components/TextInput';
import Button from '../../../common/components/Button';
import ErrorMessage from '../../../common/components/ErrorMessage';

/**
 * Login Form Component
 * Handles user authentication with email and password
 * 
 * @param {Object} props - Component props
 * @param {Function} [props.onLoginSuccess] - Callback on successful login
 */
const LoginForm = ({ onLoginSuccess }) => {
  // State for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Get auth related functions and state from useAuth hook
  const { login, loading, error, fieldErrors, clearError } = useAuth();

  useEffect(() => {
    if (!fieldErrors) {
      setValidationErrors(prev => {
        const updatedErrors = { ...prev };
        ['email', 'password'].forEach((field) => {
          if (field in updatedErrors) {
            delete updatedErrors[field];
          }
        });
        return updatedErrors;
      });
      return;
    }

    setValidationErrors(prev => {
      const updatedErrors = { ...prev };

      Object.entries(fieldErrors).forEach(([field, value]) => {
        if (['email', 'password'].includes(field)) {
          updatedErrors[field] = Array.isArray(value) ? value.join(' ') : value;
        }
      });

      ['email', 'password'].forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(fieldErrors, field) && field in updatedErrors) {
          delete updatedErrors[field];
        }
      });

      return updatedErrors;
    });
  }, [fieldErrors]);

  // Validate form inputs
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Email validation (allow single @, no spaces; no dot required)
    if (!email) {
      errors.email = 'Email wajib diisi';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
      errors.email = 'Format email tidak valid';
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = 'Password wajib diisi';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'Password minimal 6 karakter';
      isValid = false;
    }

    setValidationErrors(errors);
    setIsFormValid(isValid);
    return isValid;
  };

  // Handle email change
  const handleEmailChange = (text) => {
    setEmail(text);
    clearError();
    // Clear validation error when typing
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: '' }));
    }
  };

  // Handle password change
  const handlePasswordChange = (text) => {
    setPassword(text);
    clearError();
    // Clear validation error when typing
    if (validationErrors.password) {
      setValidationErrors(prev => ({ ...prev, password: '' }));
    }
  };

  // Handle login submission
  const handleLogin = async () => {
    // Hide keyboard
    Keyboard.dismiss();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Attempt login
      const result = await login({ email, password });
      
      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(result);
      }
    } catch (error) {
      console.error('Login error:', error);
      // Error is handled by the auth slice and will be available in the error state
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* Email Input */}
        <TextInput
          label="Email"
          value={email}
          onChangeText={handleEmailChange}
          placeholder="Masukkan email"
          leftIcon={<Ionicons name="mail-outline" size={20} color="#757575" />}
          error={validationErrors.email}
          inputProps={{
            autoCapitalize: 'none',
            keyboardType: 'email-address',
            autoComplete: 'email',
          }}
        />

        {/* Password Input */}
        <TextInput
          label="Password"
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="Masukkan password"
          secureTextEntry
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color="#757575" />}
          error={validationErrors.password}
          inputProps={{
            autoCapitalize: 'none',
            autoComplete: 'password',
          }}
        />

        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error} 
            visible={!!error}
            onRetry={clearError}
            retryText="Clear"
          />
        )}

        {/* Login Button */}
        <Button
          title="Login"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.loginButton}
          size="large"
          fullWidth
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 20,
  },
  loginButton: {
    marginTop: 20,
  },
});

export default LoginForm;
