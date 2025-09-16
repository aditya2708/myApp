import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';

import TextInput from '../../../../common/components/TextInput';
import Button from '../../../../common/components/Button';
import { useCreateKurikulumMutation } from '../../api/kurikulumApi';
import { setSelectedKurikulum } from '../../redux/kurikulumSlice';

const statusOptions = [
  {
    label: 'Draft',
    value: 'draft',
    color: '#0d6efd',
    description: 'Rencanakan kurikulum dan lengkapi materi nanti.'
  },
  {
    label: 'Aktif',
    value: 'aktif',
    color: '#198754',
    description: 'Aktifkan kurikulum untuk langsung digunakan.'
  },
  {
    label: 'Nonaktif',
    value: 'nonaktif',
    color: '#6c757d',
    description: 'Simpan sebagai arsip tanpa digunakan.'
  }
];

const getKurikulumId = (item) => item?.id_kurikulum ?? item?.id;

const CreateKurikulumScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [createKurikulum, { isLoading }] = useCreateKurikulumMutation();

  const [formValues, setFormValues] = useState({
    nama: '',
    tahun: '',
    jenis: '',
    deskripsi: '',
    status: 'draft'
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const yearPlaceholder = useMemo(() => `${new Date().getFullYear()}`, []);

  const handleChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validate = () => {
    const newErrors = {};
    const trimmedName = formValues.nama.trim();
    const trimmedYear = formValues.tahun.trim();

    if (!trimmedName) {
      newErrors.nama = 'Nama kurikulum wajib diisi';
    }

    if (!trimmedYear) {
      newErrors.tahun = 'Tahun berlaku wajib diisi';
    } else if (!/^\d{4}$/.test(trimmedYear)) {
      newErrors.tahun = 'Tahun berlaku harus 4 digit';
    } else {
      const numericYear = Number(trimmedYear);
      if (numericYear < 2000 || numericYear > 2100) {
        newErrors.tahun = 'Tahun berlaku harus antara 2000 - 2100';
      }
    }

    if (formValues.jenis && formValues.jenis.length > 100) {
      newErrors.jenis = 'Jenis kurikulum maksimal 100 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError(null);

    if (!validate()) {
      Alert.alert('Validasi Gagal', 'Mohon periksa kembali data kurikulum.');
      return;
    }

    const payload = {
      nama: formValues.nama.trim(),
      tahun: Number(formValues.tahun.trim()),
      jenis: formValues.jenis ? formValues.jenis.trim() : undefined,
      deskripsi: formValues.deskripsi ? formValues.deskripsi.trim() : undefined,
      status: formValues.status || undefined
    };

    try {
      const response = await createKurikulum(payload).unwrap();
      const kurikulumData = response?.data ?? response;

      if (!kurikulumData || !getKurikulumId(kurikulumData)) {
        throw new Error('Kurikulum baru tidak dapat diproses.');
      }

      dispatch(setSelectedKurikulum(kurikulumData));

      navigation.replace('JenjangSelection', {
        kurikulumId: getKurikulumId(kurikulumData),
        kurikulum: kurikulumData
      });
    } catch (error) {
      let message = 'Gagal membuat kurikulum baru.';

      if (error?.data?.message) {
        message = error.data.message;
      } else if (error?.message) {
        message = error.message;
      }

      setApiError(message);
      Alert.alert('Gagal', message);
    }
  };

  const renderStatusOption = (option) => {
    const isSelected = formValues.status === option.value;
    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.statusOption, isSelected && styles.statusOptionSelected]}
        onPress={() => handleChange('status', option.value)}
        activeOpacity={0.85}
      >
        <View style={[styles.statusIcon, { backgroundColor: option.color }]}>
          <Ionicons name={isSelected ? 'checkmark' : 'ellipse-outline'} size={16} color="#fff" />
        </View>
        <View style={styles.statusContent}>
          <Text style={styles.statusLabel}>{option.label}</Text>
          <Text style={styles.statusDescription}>{option.description}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerCard}>
        <View style={styles.headerIconContainer}>
          <Ionicons name="library" size={28} color="#0d6efd" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Buat Kurikulum Cabang</Text>
          <Text style={styles.headerSubtitle}>
            Atur nama kurikulum, tahun berlaku, dan status awal sebelum memilih jenjang dan materi.
          </Text>
        </View>
      </View>

      {apiError && (
        <View style={styles.errorAlert}>
          <Ionicons name="alert-circle" size={20} color="#dc3545" style={{ marginRight: 8 }} />
          <Text style={styles.errorAlertText}>{apiError}</Text>
        </View>
      )}

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Informasi Kurikulum</Text>
        <TextInput
          label="Nama Kurikulum"
          placeholder="Contoh: Kurikulum Literasi 2025"
          value={formValues.nama}
          onChangeText={(value) => handleChange('nama', value)}
          error={errors.nama}
        />

        <TextInput
          label="Tahun Berlaku"
          placeholder={yearPlaceholder}
          value={formValues.tahun}
          onChangeText={(value) => handleChange('tahun', value.replace(/[^0-9]/g, ''))}
          inputProps={{ keyboardType: 'number-pad' }}
          error={errors.tahun}
        />

        <TextInput
          label="Jenis Kurikulum (Opsional)"
          placeholder="Contoh: Kurikulum Nasional"
          value={formValues.jenis}
          onChangeText={(value) => handleChange('jenis', value)}
          error={errors.jenis}
        />

        <TextInput
          label="Deskripsi (Opsional)"
          placeholder="Tuliskan ringkasan kurikulum atau tujuan utamanya"
          value={formValues.deskripsi}
          onChangeText={(value) => handleChange('deskripsi', value)}
          multiline
          inputProps={{ textAlignVertical: 'top', numberOfLines: 4 }}
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Status Awal</Text>
        <Text style={styles.sectionSubtitle}>
          Pilih status awal untuk menentukan bagaimana kurikulum ini digunakan.
        </Text>
        <View style={styles.statusList}>
          {statusOptions.map(renderStatusOption)}
        </View>
      </View>

      <View style={styles.submitSection}>
        <Button
          title="Simpan & Pilih Jenjang"
          onPress={handleSubmit}
          loading={isLoading}
          fullWidth
          leftIcon={<Ionicons name="save" size={18} color="#fff" />}
        />
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={16} color="#6c757d" style={{ marginRight: 6 }} />
          <Text style={styles.cancelButtonText}>Kembali ke daftar kurikulum</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 20,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8f1ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdecea',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorAlertText: {
    flex: 1,
    color: '#c82333',
    fontSize: 14,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6c757d',
    marginBottom: 16,
    lineHeight: 18,
  },
  statusList: {
    marginTop: 4,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  statusOptionSelected: {
    borderColor: '#0d6efd',
    backgroundColor: '#f0f6ff',
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#6c757d',
    lineHeight: 18,
  },
  submitSection: {
    marginBottom: 40,
  },
  cancelButton: {
    marginTop: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6c757d',
    textDecorationLine: 'underline',
  },
});

export default CreateKurikulumScreen;
