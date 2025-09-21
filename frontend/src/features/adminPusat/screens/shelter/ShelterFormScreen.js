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
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { adminPusatApi } from '../../api/adminPusatApi';

const normalizeListResponse = (payload) => {
  if (!payload) {
    return { items: [], meta: null };
  }

  if (Array.isArray(payload)) {
    return { items: payload, meta: null };
  }

  if (Array.isArray(payload.data)) {
    return { items: payload.data, meta: payload.meta ?? null };
  }

  return { items: [], meta: payload.meta ?? null };
};

const initialForm = {
  nama_shelter: '',
  id_wilbin: '',
};

const ShelterFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode ?? 'create';
  const idShelter = route.params?.idShelter ?? null;

  const [form, setForm] = useState(initialForm);
  const [wilbinOptions, setWilbinOptions] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadingWilbin, setLoadingWilbin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dropdownError, setDropdownError] = useState('');

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadWilbinOptions = useCallback(async () => {
    try {
      setDropdownError('');
      setLoadingWilbin(true);
      const response = await adminPusatApi.getWilbin({ per_page: 100 });
      const payload = response?.data ?? null;
      const { items } = normalizeListResponse(payload);
      setWilbinOptions(Array.isArray(items) ? items : []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal memuat daftar wilayah binaan';
      setDropdownError(String(message));
    } finally {
      setLoadingWilbin(false);
    }
  }, []);

  useEffect(() => {
    loadWilbinOptions();
  }, [loadWilbinOptions]);

  const fetchDetail = useCallback(async () => {
    if (mode !== 'edit' || (!idShelter && idShelter !== 0)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await adminPusatApi.getShelterDetail(idShelter);
      const payload = response?.data ?? null;
      const data = payload?.data ?? payload ?? {};
      const wilbinId =
        data?.id_wilbin ??
        data?.wilbin_id ??
        data?.wilbin?.id_wilbin ??
        data?.wilbin?.id ??
        null;
      const parsedWilbinId =
        wilbinId !== null && wilbinId !== undefined ? String(wilbinId) : '';

      setForm({
        nama_shelter: data?.nama_shelter ?? data?.nama ?? '',
        id_wilbin: parsedWilbinId,
      });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal memuat data shelter';
      setError(String(message));
      Alert.alert('Error', String(message));
    } finally {
      setLoading(false);
    }
  }, [idShelter, mode]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSubmit = async () => {
    const trimmedName = form.nama_shelter.trim();
    if (!trimmedName) {
      Alert.alert('Validasi', 'Nama shelter wajib diisi.');
      return;
    }

    if (!form.id_wilbin) {
      Alert.alert('Validasi', 'Pilih wilayah binaan terlebih dahulu.');
      return;
    }

    const numericWilbinId = Number(form.id_wilbin);
    const payload = {
      nama_shelter: trimmedName,
      id_wilbin: Number.isNaN(numericWilbinId) ? form.id_wilbin : numericWilbinId,
    };

    try {
      setSubmitting(true);
      setError('');
      if (mode === 'edit' && (idShelter || idShelter === 0)) {
        await adminPusatApi.updateShelter(idShelter, payload);
        Alert.alert('Berhasil', 'Shelter berhasil diperbarui.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await adminPusatApi.createShelter(payload);
        Alert.alert('Berhasil', 'Shelter berhasil dibuat.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal menyimpan shelter';
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
              {mode === 'edit' ? 'Edit Shelter' : 'Tambah Shelter'}
            </Text>
            <Text style={styles.subtitle}>
              Isi informasi shelter secara lengkap.
            </Text>
          </View>
          <Ionicons name="home" size={28} color="#e67e22" />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : (
          <View style={styles.formCard}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.sectionTitle}>Informasi Shelter</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Shelter *</Text>
              <TextInput
                style={styles.input}
                value={form.nama_shelter}
                onChangeText={(text) => updateField('nama_shelter', text)}
                placeholder="Contoh: Shelter A"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Wilayah Binaan *</Text>
              <View style={styles.pickerWrapper}>
                {loadingWilbin ? (
                  <ActivityIndicator size="small" color="#3498db" />
                ) : (
                  <Picker
                    selectedValue={form.id_wilbin}
                    onValueChange={(value) => updateField('id_wilbin', value)}
                  >
                    <Picker.Item label="-- Pilih Wilayah Binaan --" value="" />
                    {wilbinOptions.map((option) => {
                      const optionId = option?.id_wilbin ?? option?.id;
                      const optionLabel =
                        option?.nama_wilbin || option?.nama || 'Tanpa nama';
                      if (optionId === undefined || optionId === null) {
                        return null;
                      }
                      return (
                        <Picker.Item
                          key={String(optionId)}
                          label={optionLabel}
                          value={String(optionId)}
                        />
                      );
                    })}
                  </Picker>
                )}
              </View>
              {dropdownError ? <Text style={styles.helperError}>{dropdownError}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save" size={18} color="#fff" />
                  <Text style={styles.submitButtonText}>Simpan</Text>
                </>
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
    fontSize: 14,
    color: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  },
  errorText: {
    color: '#e74c3c',
    fontWeight: '500',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    backgroundColor: '#fdfdfd',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    backgroundColor: '#fdfdfd',
  },
  helperError: {
    marginTop: 6,
    color: '#e74c3c',
    fontSize: 12,
  },
  submitButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#27ae60',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default ShelterFormScreen;
