import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminPusatApi } from '../../api/adminPusatApi';

const statusOptions = [
  { key: 'aktif', label: 'Aktif' },
  { key: 'nonaktif', label: 'Nonaktif' },
];

const initialForm = {
  nama_kacab: '',
  no_telp: '',
  alamat: '',
  email: '',
  status: 'aktif',
};

const KacabFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode ?? 'create';
  const idKacab = route.params?.idKacab ?? null;

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(mode === 'edit');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchDetail = useCallback(async () => {
    if (mode !== 'edit' || !idKacab) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await adminPusatApi.getKacabDetail(idKacab);
      const payload = response?.data ?? null;
      const data = payload?.data ?? payload ?? {};

      setForm({
        nama_kacab: data?.nama_kacab ?? '',
        no_telp: data?.no_telp ?? data?.no_telpon ?? '',
        alamat: data?.alamat ?? '',
        email: data?.email ?? '',
        status: data?.status ?? 'aktif',
      });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Gagal memuat data kantor cabang';
      setError(String(message));
      Alert.alert('Error', String(message));
    } finally {
      setLoading(false);
    }
  }, [idKacab, mode]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSubmit = async () => {
    const phonePrimary = form.no_telp.trim();

    if (!phonePrimary) {
      Alert.alert('Validasi', 'No. telepon wajib diisi.');
      return;
    }

    const payload = {
      nama_kacab: form.nama_kacab.trim(),
      alamat: form.alamat.trim(),
      email: form.email.trim() || null,
      status: form.status || 'aktif',
      no_telp: phonePrimary,
    };

    try {
      setSubmitting(true);
      setError('');
      if (mode === 'edit' && idKacab) {
        await adminPusatApi.updateKacab(idKacab, payload);
        Alert.alert('Berhasil', 'Kantor cabang berhasil diperbarui.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await adminPusatApi.createKacab(payload);
        Alert.alert('Berhasil', 'Kantor cabang berhasil dibuat.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Gagal menyimpan kantor cabang';
      setError(String(message));
      Alert.alert('Error', String(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>
              {mode === 'edit' ? 'Edit Kantor Cabang' : 'Tambah Kantor Cabang'}
            </Text>
            <Text style={styles.subtitle}>
              Isi informasi kantor cabang secara lengkap.
            </Text>
          </View>
          <Ionicons name="business" size={28} color="#2980b9" />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : (
          <View style={styles.formCard}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.sectionTitle}>Informasi Utama</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Kantor Cabang *</Text>
              <TextInput
                style={styles.input}
                value={form.nama_kacab}
                onChangeText={(text) => updateField('nama_kacab', text)}
                placeholder="Contoh: Kantor Cabang Jakarta"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Alamat *</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={form.alamat}
                onChangeText={(text) => updateField('alamat', text)}
                placeholder="Alamat lengkap kantor cabang"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>No. Telepon *</Text>
              <TextInput
                style={styles.input}
                value={form.no_telp}
                onChangeText={(text) => updateField('no_telp', text)}
                placeholder="Contoh: 021123456"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder="email@kantorcabang.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.sectionTitle}>Status</Text>
            <View style={styles.statusRow}>
              {statusOptions.map((option) => {
                const active = form.status === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.statusPill, active && styles.statusPillActive]}
                    onPress={() => updateField('status', option.key)}
                  >
                    <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>


            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {mode === 'edit' ? 'Simpan Perubahan' : 'Simpan'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subtitle: {
    marginTop: 4,
    color: '#7f8c8d',
  },
  loadingContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 8,
  },
  formGroup: {
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    color: '#34495e',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#2c3e50',
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  statusPillActive: {
    backgroundColor: '#eafaf1',
    borderColor: '#27ae60',
  },
  statusPillText: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  statusPillTextActive: {
    color: '#27ae60',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 24,
    backgroundColor: '#27ae60',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 4,
  },
});

export default KacabFormScreen;
