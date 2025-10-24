import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../../../common/components/Button';
import PickerInput from '../../../../../common/components/PickerInput';

const DEFAULT_FILTER_VALUES = {
  date_from: null,
  date_to: null,
  jenis_kegiatan: 'all',
  shelter_id: 'all',
};

const formatDateLabel = (value) => {
  if (!value) {
    return 'Pilih tanggal';
  }

  try {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch (error) {
    // ignore parsing error and fallback to raw value
  }

  return value;
};

const mergeFilters = (filters = {}, defaults = DEFAULT_FILTER_VALUES) => ({
  date_from: filters?.date_from ?? defaults?.date_from ?? DEFAULT_FILTER_VALUES.date_from,
  date_to: filters?.date_to ?? defaults?.date_to ?? DEFAULT_FILTER_VALUES.date_to,
  jenis_kegiatan: filters?.jenis_kegiatan ?? defaults?.jenis_kegiatan ?? DEFAULT_FILTER_VALUES.jenis_kegiatan,
  shelter_id: filters?.shelter_id ?? defaults?.shelter_id ?? DEFAULT_FILTER_VALUES.shelter_id,
});

const ensureAllOption = (options, fallbackLabel) => {
  if (!Array.isArray(options) || options.length === 0) {
    return [{ key: 'all', label: fallbackLabel }];
  }

  const sanitized = options.filter(Boolean);
  const allOption = sanitized.find((option) => option.key === 'all')
    ?? { key: 'all', label: fallbackLabel };
  const rest = sanitized.filter((option) => option.key !== 'all');

  return [allOption, ...rest];
};

const TutorAttendanceFilters = ({
  visible,
  filters,
  defaultFilters,
  onClose,
  onApply,
  onClear,
  jenisOptions,
  shelterOptions,
}) => {
  const resolvedDefaultFilters = useMemo(
    () => mergeFilters(defaultFilters, DEFAULT_FILTER_VALUES),
    [defaultFilters],
  );

  const [localFilters, setLocalFilters] = useState(() => mergeFilters(filters, resolvedDefaultFilters));
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  useEffect(() => {
    if (visible) {
      setLocalFilters(mergeFilters(filters, resolvedDefaultFilters));
      setActiveDatePicker(null);
    }
  }, [visible, filters, resolvedDefaultFilters]);

  const activityOptions = useMemo(() => ensureAllOption(jenisOptions, 'Semua Jenis'), [jenisOptions]);
  const shelterDropdownItems = useMemo(
    () => ensureAllOption(shelterOptions, 'Semua Shelter').map((option) => ({
      label: option.label,
      value: option.key,
    })),
    [shelterOptions],
  );

  const handleDateChange = (event, selectedDate, key) => {
    if (event.type === 'dismissed') {
      setActiveDatePicker(null);
      return;
    }

    setActiveDatePicker(null);

    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split('T')[0];
      setLocalFilters((prev) => ({
        ...prev,
        [key]: isoDate,
      }));
    }
  };

  const handleApply = () => {
    onApply?.(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = mergeFilters(undefined, resolvedDefaultFilters);
    setLocalFilters(clearedFilters);
    setActiveDatePicker(null);
    onClear?.(clearedFilters);
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Laporan Tutor</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tanggal Mulai</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setActiveDatePicker('date_from')}
            >
              <Text style={styles.dateText}>{formatDateLabel(localFilters.date_from)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tanggal Selesai</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setActiveDatePicker('date_to')}
            >
              <Text style={styles.dateText}>{formatDateLabel(localFilters.date_to)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Jenis Kegiatan</Text>
            <View style={styles.optionGrid}>
              {activityOptions.map((option) => {
                const isActive = localFilters.jenis_kegiatan === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.optionButton, isActive && styles.optionButtonActive]}
                    onPress={() => setLocalFilters((prev) => ({
                      ...prev,
                      jenis_kegiatan: option.key,
                    }))}
                  >
                    <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {shelterDropdownItems.length > 0 ? (
            <View style={styles.section}>
              <PickerInput
                label="Shelter"
                value={localFilters.shelter_id}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }
                  setLocalFilters((prev) => ({
                    ...prev,
                    shelter_id: value,
                  }));
                }}
                items={shelterDropdownItems}
                placeholder="Pilih Shelter"
                style={styles.pickerInput}
                pickerProps={{ enabled: true }}
              />
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              title="Reset"
              type="outline"
              onPress={handleClear}
              style={styles.actionButton}
            />
            <Button
              title="Terapkan"
              onPress={handleApply}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>

      {activeDatePicker ? (
        <DateTimePicker
          value={localFilters[activeDatePicker] ? new Date(localFilters[activeDatePicker]) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => handleDateChange(event, selectedDate, activeDatePicker)}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 14,
    color: '#0f172a',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionButtonActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  optionLabel: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '600',
  },
  optionLabelActive: {
    color: '#ffffff',
  },
  pickerInput: {
    marginBottom: 0,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default TutorAttendanceFilters;
