import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert
} from 'react-native';

import Button from '../../../common/components/Button';
import TextInput from '../../../common/components/TextInput';
import ErrorMessage from '../../../common/components/ErrorMessage';
import { useAuth } from '../../../common/hooks/useAuth';
import { authApi } from '../../auth/api/authApi';
import {
  extractErrorMessage,
  extractValidationErrors
} from '../../../common/utils/errorHandler';

const MIN_PASSWORD_LENGTH = 8;
const FORCE_LOGOUT_AFTER_PASSWORD_CHANGE = false;

const AdminShelterSettingsScreen = () => {
  const { user, logout } = useAuth();
  const [formValues, setFormValues] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    currentPassword: null,
    newPassword: null,
    confirmPassword: null
  });
  const [serverError, setServerError] = useState(null);
  const [loading, setLoading] = useState(false);

  const emailDisplay = useMemo(() => user?.email || '-', [user]);

  const handleChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
    setServerError(null);
  };

  const validate = () => {
    const newErrors = {};

    if (!formValues.currentPassword.trim()) {
      newErrors.currentPassword = 'Password saat ini wajib diisi.';
    } else if (formValues.currentPassword.length < MIN_PASSWORD_LENGTH) {
      newErrors.currentPassword = `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    }

    if (!formValues.newPassword.trim()) {
      newErrors.newPassword = 'Password baru wajib diisi.';
    } else if (formValues.newPassword.length < MIN_PASSWORD_LENGTH) {
      newErrors.newPassword = `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    }

    if (!formValues.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Konfirmasi password wajib diisi.';
    } else if (formValues.confirmPassword !== formValues.newPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak cocok.';
    }

    setErrors({
      currentPassword: null,
      newPassword: null,
      confirmPassword: null,
      ...newErrors
    });

    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormValues({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setErrors({
      currentPassword: null,
      newPassword: null,
      confirmPassword: null
    });
    setServerError(null);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);
    setServerError(null);

    try {
      await authApi.changePassword({
        current_password: formValues.currentPassword,
        new_password: formValues.newPassword,
        new_password_confirmation: formValues.confirmPassword
      });

      Alert.alert('Berhasil', 'Password berhasil diperbarui.');
      resetForm();

      if (FORCE_LOGOUT_AFTER_PASSWORD_CHANGE) {
        await logout();
      }
    } catch (error) {
      const validationErrors = extractValidationErrors(error);

      if (validationErrors) {
        setErrors(prevErrors => {
          const updatedErrors = { ...prevErrors };

          if (validationErrors.current_password) {
            updatedErrors.currentPassword = Array.isArray(validationErrors.current_password)
              ? validationErrors.current_password[0]
              : validationErrors.current_password;
          }

          if (validationErrors.new_password) {
            updatedErrors.newPassword = Array.isArray(validationErrors.new_password)
              ? validationErrors.new_password[0]
              : validationErrors.new_password;
          }

          if (validationErrors.new_password_confirmation) {
            updatedErrors.confirmPassword = Array.isArray(validationErrors.new_password_confirmation)
              ? validationErrors.new_password_confirmation[0]
              : validationErrors.new_password_confirmation;
          }

          return updatedErrors;
        });
      }

      const message = extractErrorMessage(error);
      setServerError(message);

      if (!validationErrors) {
        Alert.alert('Gagal', message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerSection}>
        <Text style={styles.title}>Pengaturan Akun</Text>
        <Text style={styles.subtitle}>Kelola informasi akun dan ubah password Anda.</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Email</Text>
        <Text style={styles.infoValue}>{emailDisplay}</Text>
      </View>

      {serverError && (
        <ErrorMessage
          message={serverError}
          onRetry={() => setServerError(null)}
          style={styles.errorMessage}
        />
      )}

      <View style={styles.formSection}>
        <TextInput
          label="Password Saat Ini"
          value={formValues.currentPassword}
          onChangeText={(value) => handleChange('currentPassword', value)}
          placeholder="Masukkan password saat ini"
          secureTextEntry
          error={errors.currentPassword}
          helperText={!errors.currentPassword ? 'Gunakan password yang sedang aktif.' : undefined}
        />

        <TextInput
          label="Password Baru"
          value={formValues.newPassword}
          onChangeText={(value) => handleChange('newPassword', value)}
          placeholder="Masukkan password baru"
          secureTextEntry
          error={errors.newPassword}
          helperText={!errors.newPassword ? `Minimal ${MIN_PASSWORD_LENGTH} karakter.` : undefined}
        />

        <TextInput
          label="Konfirmasi Password Baru"
          value={formValues.confirmPassword}
          onChangeText={(value) => handleChange('confirmPassword', value)}
          placeholder="Konfirmasi password baru"
          secureTextEntry
          error={errors.confirmPassword}
          helperText={!errors.confirmPassword ? 'Ulangi password baru Anda.' : undefined}
        />

        <Button
          title="Simpan Password"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          fullWidth
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f7f9fc'
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e6ed',
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: '#95a5a6',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  formSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  submitButton: {
    marginTop: 8,
  },
  errorMessage: {
    marginBottom: 16,
  }
});

export default AdminShelterSettingsScreen;
