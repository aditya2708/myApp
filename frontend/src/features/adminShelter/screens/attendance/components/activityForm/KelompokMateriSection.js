import React, { useMemo } from 'react';
import {
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import SmartMateriSelector from '../../../../components/kelola/SmartMateriSelector';
import styles from '../../styles/activityFormStyles';
import PickerSection from './PickerSection';

const KelompokMateriSection = ({
  formData,
  kelompokList,
  loadingStates,
  errors,
  onRetryKelompok,
  onKelompokChange,
  onFieldChange,
  onToggleManualMateri,
  materiCache,
  materiCacheLoading,
  selectedMateri,
  onMateriSelect,
}) => {
  const pickerOptions = useMemo(() => {
    if (!Array.isArray(kelompokList)) {
      return [];
    }

    return kelompokList.filter(item => item && item.id_kelompok);
  }, [kelompokList]);

  return (
    <>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        Kelompok
        <Text style={styles.required}>*</Text>
      </Text>
      <PickerSection
        data={pickerOptions}
        loading={loadingStates.kelompok}
        error={errors.kelompok}
        onRetry={onRetryKelompok}
        placeholder="Pilih kelompok"
        selectedValue={formData.selectedKelompokId}
        onValueChange={onKelompokChange}
        labelKey="nama_kelompok"
        valueKey="id_kelompok"
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Tingkat</Text>
      <TextInput
        style={[styles.input, styles.disabledInput]}
        value={formData.level}
        editable={false}
        placeholder="Tingkat akan terisi otomatis"
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        Materi
        <Text style={styles.required}>*</Text>
      </Text>
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Input materi secara manual</Text>
        <Switch
          value={formData.pakai_materi_manual}
          onValueChange={onToggleManualMateri}
          trackColor={{ false: '#bdc3c7', true: '#2ecc71' }}
          thumbColor={formData.pakai_materi_manual ? '#27ae60' : '#ecf0f1'}
        />
      </View>

      {formData.pakai_materi_manual ? (
        <View style={styles.nestedInput}>
          <Text style={styles.nestedLabel}>
            Mata Pelajaran Manual
            <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.mata_pelajaran_manual}
            onChangeText={value => onFieldChange('mata_pelajaran_manual', value)}
            placeholder="Contoh: Matematika"
          />
          <Text style={[styles.helperText, { marginTop: 6 }]}>
            Gunakan nama mata pelajaran sesuai kebutuhan cabang.
          </Text>

          <Text style={[styles.nestedLabel, { marginTop: 12 }]}>
            Materi Manual
            <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.materi_manual}
            onChangeText={value => onFieldChange('materi_manual', value)}
            placeholder="Contoh: Pecahan campuran"
            multiline
          />
        </View>
      ) : (
        <SmartMateriSelector
          allMateri={materiCache}
          selectedKelompok={formData.selectedKelompokObject}
          selectedMateri={selectedMateri}
          onMateriSelect={onMateriSelect}
          loading={materiCacheLoading}
          placeholder="Pilih materi dari daftar"
          showPreview
        />
      )}
    </View>
  </>
  );
};

export default KelompokMateriSection;
