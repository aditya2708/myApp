import React, { useEffect, useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../common/components/Button';

const DEFAULT_FILTERS = {
  start_date: null,
  end_date: null,
  jenis_kegiatan_id: null
};

const normalizeFilters = (filters = {}, defaults = DEFAULT_FILTERS) => ({
  start_date: filters.start_date ?? defaults.start_date ?? DEFAULT_FILTERS.start_date,
  end_date: filters.end_date ?? defaults.end_date ?? DEFAULT_FILTERS.end_date,
  jenis_kegiatan_id:
    filters.jenis_kegiatan_id ?? defaults.jenis_kegiatan_id ?? DEFAULT_FILTERS.jenis_kegiatan_id
});

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
        year: 'numeric'
      });
    }
  } catch (error) {
    // ignore parsing issues and fallback to raw
  }

  return value;
};

const ActivityReportFilters = ({
  visible,
  filters,
  defaultFilters,
  onClose,
  onApply,
  onClear,
  jenisOptions
}) => {
  const resolvedDefaults = useMemo(
    () => normalizeFilters(defaultFilters),
    [defaultFilters]
  );

  const [localFilters, setLocalFilters] = useState(() => normalizeFilters(filters, resolvedDefaults));
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  useEffect(() => {
    if (visible) {
      setLocalFilters(normalizeFilters(filters, resolvedDefaults));
      setActiveDatePicker(null);
    }
  }, [visible, filters, resolvedDefaults]);

  const jenisChoices = useMemo(() => {
    if (!Array.isArray(jenisOptions) || jenisOptions.length === 0) {
      return [{ id: null, label: 'Semua Jenis' }];
    }

    const hasAll = jenisOptions.some(option => option.id === null);
    if (hasAll) {
      return jenisOptions;
    }

    return [{ id: null, label: 'Semua Jenis' }, ...jenisOptions];
  }, [jenisOptions]);

  const openDatePicker = (key) => {
    setActiveDatePicker(key);
  };

  const handleDateChange = (event, selectedDate, key) => {
    if (event?.type === 'dismissed') {
      setActiveDatePicker(null);
      return;
    }

    setActiveDatePicker(null);

    if (!selectedDate) {
      return;
    }

    const isoDate = selectedDate.toISOString().split('T')[0];
    setLocalFilters(prev => {
      const next = {
        ...prev,
        [key]: isoDate
      };

      if (key === 'start_date' && next.end_date && next.end_date < isoDate) {
        next.end_date = isoDate;
      }

      if (key === 'end_date' && next.start_date && next.start_date > isoDate) {
        next.start_date = isoDate;
      }

      return next;
    });
  };

  const handleApply = () => {
    onApply?.(normalizeFilters(localFilters, resolvedDefaults));
  };

  const handleClear = () => {
    const cleared = normalizeFilters(undefined, resolvedDefaults);
    setLocalFilters(cleared);
    setActiveDatePicker(null);
    onClear?.(cleared);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Laporan</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Ionicons name="close" size={22} color="#34495e" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tanggal Mulai</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('start_date')}
              activeOpacity={0.85}
            >
              <Text style={styles.dateText}>{formatDateLabel(localFilters.start_date)}</Text>
              <Ionicons name="calendar-outline" size={18} color="#3498db" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tanggal Selesai</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('end_date')}
              activeOpacity={0.85}
            >
              <Text style={styles.dateText}>{formatDateLabel(localFilters.end_date)}</Text>
              <Ionicons name="calendar-number-outline" size={18} color="#3498db" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Jenis Kegiatan</Text>
            <View style={styles.optionGrid}>
              {jenisChoices.map(option => {
                const isActive = option.id === localFilters.jenis_kegiatan_id;
                return (
                  <TouchableOpacity
                    key={option.id ?? 'all'}
                    style={[styles.optionButton, isActive && styles.optionButtonActive]}
                    onPress={() => setLocalFilters(prev => ({
                      ...prev,
                      jenis_kegiatan_id: option.id
                    }))}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              title="Hapus"
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
          value={
            localFilters[activeDatePicker]
              ? new Date(localFilters[activeDatePicker])
              : new Date()
          }
          mode="date"
          display="default"
          onChange={(event, date) => handleDateChange(event, date, activeDatePicker)}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 20
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50'
  },
  section: {
    gap: 8
  },
  label: {
    fontSize: 14,
    color: '#34495e',
    fontWeight: '600'
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  dateText: {
    fontSize: 14,
    color: '#2c3e50'
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dfe6e9'
  },
  optionButtonActive: {
    backgroundColor: '#2980b9',
    borderColor: '#2980b9'
  },
  optionLabel: {
    fontSize: 13,
    color: '#34495e',
    fontWeight: '600'
  },
  optionLabelActive: {
    color: '#ffffff'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  actionButton: {
    flex: 1
  }
});

export default ActivityReportFilters;

