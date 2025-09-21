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
  nama_wilbin: '',
  id_kacab: '',
};

const WilbinFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const mode = route.params?.mode ?? 'create';
  const idWilbin = route.params?.idWilbin ?? null;

  const [form, setForm] = useState(initialForm);
  const [kacabOptions, setKacabOptions] = useState([]);
  const [loading, setLoading] = useState(mode === 'edit');
  const [loadingKacab, setLoadingKacab] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dropdownError, setDropdownError] = useState('');

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const loadKacabOptions = useCallback(async () => {
    try {
      setDropdownError('');
      setLoadingKacab(true);
      const response = await adminPusatApi.getKacab();
      const payload = response?.data ?? null;
      const { items } = normalizeListResponse(payload);
      setKacabOptions(Array.isArray(items) ? items : []);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Gagal memuat daftar cabang';
      setDropdownError(String(message));
    } finally {
      setLoadingKacab(false);
    }
  }, []);

  useEffect(() => {
    loadKacabOptions();
  }, [loadKacabOptions]);

  const fetchDetail = useCallback(async () => {
    if (mode !== 'edit' || (!idWilbin && idWilbin !== 0)) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await adminPusatApi.getWilbinDetail(idWilbin);
      const payload = response?.data ?? null;
      const data = payload?.data ?? payload ?? {};
      const kacabId =
        data?.id_kacab ??
        data?.kacab_id ??
        data?.kacab?.id_kacab ??
        data?.kacab?.id ??
        null;
      const parsedId =
        kacabId !== null && kacabId !== undefined ? String(kacabId) : '';

      setForm({
        nama_wilbin: data?.nama_wilbin ?? '',
        id_kacab: parsedId,
      });
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Gagal memuat data wilayah binaan';
      setError(String(message));
      Alert.alert('Error', String(message));
    } finally {
      setLoading(false);
    }
  }, [idWilbin, mode]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSubmit = async () => {
    const trimmedName = form.nama_wilbin.trim();
    if (!trimmedName) {
      Alert.alert('Validasi', 'Nama wilayah binaan wajib diisi.');
      return;
    }

    if (!form.id_kacab) {
      Alert.alert('Validasi', 'Pilih kantor cabang terlebih dahulu.');
      return;
    }

    const numericId = Number(form.id_kacab);
    const payload = {
      nama_wilbin: trimmedName,
      id_kacab: Number.isNaN(numericId) ? form.id_kacab : numericId,
    };

    try {
      setSubmitting(true);
      setError('');
      if (mode === 'edit' && (idWilbin || idWilbin === 0)) {
        await adminPusatApi.updateWilbin(idWilbin, payload);
        Alert.alert('Berhasil', 'Wilayah binaan berhasil diperbarui.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await adminPusatApi.createWilbin(payload);
        Alert.alert('Berhasil', 'Wilayah binaan berhasil dibuat.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Gagal menyimpan wilayah binaan';
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
              {mode === 'edit' ? 'Edit Wilayah Binaan' : 'Tambah Wilayah Binaan'}
            </Text>
            <Text style={styles.subtitle}>
              Isi informasi wilayah binaan secara lengkap.
            </Text>
          </View>
          <Ionicons name="map" size={28} color="#27ae60" />
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
          </View>
        ) : (
          <View style={styles.formCard}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.sectionTitle}>Informasi Wilayah</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nama Wilayah Binaan *</Text>
              <TextInput
                style={styles.input}
                value={form.nama_wilbin}
                onChangeText={(text) => updateField('nama_wilbin', text)}
                placeholder="Contoh: Wilayah Binaan Jakarta Timur"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Kantor Cabang *</Text>
              <View style={styles.pickerWrapper}>
                {loadingKacab ? (
                  <ActivityIndicator size="small" color="#3498db" />
                ) : (
                  <Picker
                    selectedValue={form.id_kacab}
                    onValueChange={(value) => updateField('id_kacab', value)}
                  >
                    <Picker.Item label="-- Pilih Kantor Cabang --" value="" />
                    {kacabOptions.map((option) => {
                      const optionId = option?.id_kacab ?? option?.id;
                      const optionLabel =
                        option?.nama_kacab || option?.nama_cabang || option?.name || 'Tanpa nama';
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
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fdfdfd',
    color: '#2c3e50',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 10,
    backgroundColor: '#fdfdfd',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    borderRadius: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    color: '#e74c3c',
    fontWeight: '500',
  },
  helperError: {
    marginTop: 6,
    color: '#e74c3c',
    fontSize: 12,
  },
});

export default WilbinFormScreen;
