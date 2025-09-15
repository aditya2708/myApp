import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

// Import components
import RaportForm from '../../../../common/components/Anak/RaportForm';
import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';

// Import API
import { raportApi } from '../../api/raportApi';

const AddRaportScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { anakData, anakId } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Set screen title
  useEffect(() => {
    navigation.setOptions({
      title: `Tambah Raport - ${anakData?.nick_name || anakData?.full_name || 'Anak'}`
    });
  }, [navigation, anakData]);

  // Handle form submission
  const handleSubmit = async (formData) => {
    if (!anakId) {
      Alert.alert('Error', 'ID anak tidak ditemukan');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await raportApi.generateRaport(formData);
      
      if (response.data.success) {
        Alert.alert(
          'Sukses',
          'Raport berhasil ditambahkan',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        setError(response.data.message || 'Gagal menambahkan raport');
      }
    } catch (err) {
      console.error('Error adding raport:', err);
      setError('Gagal menambahkan raport. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle form cancel
  const handleCancel = () => {
    navigation.goBack();
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner fullScreen message="Memuat data..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tambah Raport Baru</Text>
          <Text style={styles.headerSubtitle}>
            Untuk {anakData?.full_name || 'Anak'}
          </Text>
        </View>
        
        {/* Error Message */}
        {error && (
          <ErrorMessage
            message={error}
            onRetry={() => setError(null)}
          />
        )}
        
        {/* Raport Form */}
        <View style={styles.formContainer}>
          <RaportForm
            initialValues={{}}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={submitting}
            error={error}
            isEdit={false}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default AddRaportScreen;