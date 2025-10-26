import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import DatePicker from '../../../../../common/components/DatePicker';
import PickerInput from '../../../../../common/components/PickerInput';
import { formatDateToLocalISO } from '../../../../../common/utils/dateUtils';

const toOptionArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'object') {
    const arrayLikeKeys = ['items', 'data', 'options', 'list', 'values', 'choices', 'results'];
    for (const key of arrayLikeKeys) {
      if (Array.isArray(value?.[key])) {
        return value[key];
      }
    }

    const entries = Object.entries(value);
    return entries.map(([entryKey, entryValue]) => {
      if (entryValue && typeof entryValue === 'object') {
        return {
          value:
            entryValue.value ??
            entryValue.id ??
            entryValue.code ??
            entryValue.slug ??
            entryValue.uuid ??
            entryValue.key ??
            entryKey,
          label:
            entryValue.label ??
            entryValue.name ??
            entryValue.title ??
            entryValue.text ??
            entryValue.display ??
            entryValue.description ??
            entryValue.nama ??
            entryKey,
        };
      }

      return { value: entryKey, label: entryValue ?? entryKey };
    });
  }

  return [];
};

const normalizeOptionList = (list) => {
  return toOptionArray(list)
    .map((item, index) => {
      if (item === null || item === undefined) return null;

      if (typeof item === 'string' || typeof item === 'number') {
        const value = String(item);
        return { label: String(item), value };
      }

      if (typeof item === 'object') {
        const value =
          item.value ??
          item.id ??
          item.code ??
          item.slug ??
          item.uuid ??
          item.key ??
          item.identifier ??
          item.kode ??
          null;

        if (value === null || value === undefined) {
          const fallback = typeof index === 'number' ? String(index) : null;
          const fallbackLabel =
            item.label ??
            item.name ??
            item.title ??
            item.text ??
            item.display ??
            item.description ??
            item.nama ??
            fallback;

          if (!fallback) return null;

          return {
            label: String(fallbackLabel ?? fallback),
            value: String(fallback),
          };
        }

        const label =
          item.label ??
          item.name ??
          item.title ??
          item.text ??
          item.display ??
          item.description ??
          item.nama ??
          String(value);

        return { label: String(label), value: String(value) };
      }

      return null;
    })
    .filter(Boolean);
};

export const mapTutorFilterOptions = (available = {}) => {
  const source = available && Object.keys(available || {}).length ? available : {};

  const activityOptions =
    source.jenis_kegiatan ??
    source.jenisKegiatan ??
    source.activity_types ??
    source.activityTypes ??
    source.activities;

  const wilbinOptions =
    source.wilbin ??
    source.wilbins ??
    source.wilayah_binaan ??
    source.wilayahBinaan ??
    source.regions ??
    source.region;

  const shelterOptions =
    source.shelter ??
    source.shelters ??
    source.shelterOptions ??
    source.shelter_options ??
    source.availableShelters ??
    source.available_shelters;

  return {
    activities: normalizeOptionList(activityOptions),
    wilbins: normalizeOptionList(wilbinOptions),
    shelters: normalizeOptionList(shelterOptions),
  };
};

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const isoDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const matches = trimmed.match(isoDatePattern);

    if (matches) {
      const [, year, month, day] = matches;
      const parsed = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateLabel = (value) => {
  const parsed = parseDate(value);
  if (!parsed) return null;

  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  } catch (err) {
    return formatDateToLocalISO(parsed);
  }
};

const initializeFilters = (filters = {}, defaults = {}) => {
  const sanitize = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === 'all') return '';
      return trimmed;
    }
    if (typeof value === 'number') return String(value);
    if (typeof value === 'object') {
      return sanitize(
        value.value ??
          value.id ??
          value.code ??
          value.slug ??
          value.uuid ??
          value.key ??
          value.identifier ??
          null,
      );
    }
    return '';
  };

  const getDate = (value, fallback) => {
    const formatted = formatDateToLocalISO(value);
    if (formatted) return formatted;
    return fallback ?? '';
  };

  const defaultStart = defaults.start_date ?? defaults.startDate ?? '';
  const defaultEnd = defaults.end_date ?? defaults.endDate ?? '';

  return {
    start_date: getDate(filters.start_date ?? filters.startDate, defaultStart),
    end_date: getDate(filters.end_date ?? filters.endDate, defaultEnd),
    jenis_kegiatan: sanitize(filters.jenis_kegiatan ?? filters.jenisKegiatan),
    wilbin_id: sanitize(filters.wilbin_id ?? filters.wilbinId ?? filters.wilayah_binaan),
    shelter_id: sanitize(filters.shelter_id ?? filters.shelterId ?? filters.shelter),
  };
};

const prepareFiltersForSubmit = (filters = {}, defaults = {}) => {
  const toNullable = (value, fallback = null) => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === 'all') return fallback;
      return trimmed;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return fallback;
  };

  return {
    start_date: toNullable(filters.start_date, defaults.start_date ?? defaults.startDate ?? null),
    end_date: toNullable(filters.end_date, defaults.end_date ?? defaults.endDate ?? null),
    jenis_kegiatan: toNullable(filters.jenis_kegiatan),
    wilbin_id: toNullable(filters.wilbin_id),
    shelter_id: toNullable(filters.shelter_id),
  };
};

const TutorAttendanceFilters = ({
  visible = false,
  filters = {},
  availableFilters = {},
  defaultFilters = {},
  onApply,
  onClear,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState(() => initializeFilters(filters, defaultFilters));
  const [activeDatePicker, setActiveDatePicker] = useState(null);
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  const options = useMemo(() => mapTutorFilterOptions(availableFilters), [availableFilters]);

  useEffect(() => {
    if (visible) {
      setLocalFilters(initializeFilters(filters, defaultFilters));
    }
  }, [visible, filters, defaultFilters]);

  const startDate = useMemo(() => parseDate(localFilters.start_date), [localFilters.start_date]);
  const endDate = useMemo(() => parseDate(localFilters.end_date), [localFilters.end_date]);

  const openDatePicker = (type) => {
    const currentValue = type === 'start' ? startDate : endDate;
    setDatePickerValue(currentValue ?? new Date());
    setActiveDatePicker(type);
  };

  const handleDateChange = (nextDate) => {
    if (!nextDate || !(nextDate instanceof Date)) {
      setActiveDatePicker(null);
      return;
    }

    const iso = formatDateToLocalISO(nextDate);
    if (!iso) {
      setActiveDatePicker(null);
      return;
    }
    setLocalFilters((prev) => ({
      ...prev,
      start_date: activeDatePicker === 'start' ? iso : prev.start_date,
      end_date: activeDatePicker === 'end' ? iso : prev.end_date,
    }));
    setDatePickerValue(nextDate);
    setActiveDatePicker(null);
  };

  const handleDateCancel = () => {
    setActiveDatePicker(null);
  };

  const handleWilbinChange = (value) => {
    const nextValue = value ?? '';
    setLocalFilters((prev) => ({
      ...prev,
      wilbin_id: nextValue,
      shelter_id: nextValue ? '' : prev.shelter_id,
    }));
  };

  const handleApply = () => {
    const payload = prepareFiltersForSubmit(localFilters, defaultFilters);
    onApply?.(payload);
  };

  const handleClear = () => {
    setLocalFilters(initializeFilters(defaultFilters, defaultFilters));
    onClear?.();
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter Laporan Tutor</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Periode</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => openDatePicker('start')}
                >
                  <Ionicons name="calendar" size={16} color="#2563eb" />
                  <Text style={styles.dateInputText}>
                    {formatDateLabel(localFilters.start_date) || 'Tanggal mulai'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => openDatePicker('end')}
                >
                  <Ionicons name="calendar" size={16} color="#2563eb" />
                  <Text style={styles.dateInputText}>
                    {formatDateLabel(localFilters.end_date) || 'Tanggal selesai'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.sectionDivider} />

            <View style={styles.fieldGroup}>
              <PickerInput
                label="Jenis Kegiatan"
                value={localFilters.jenis_kegiatan || ''}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    jenis_kegiatan: value ?? '',
                  }))
                }
                items={options.activities}
                placeholder="Pilih jenis kegiatan"
              />
              {localFilters.jenis_kegiatan ? (
                <TouchableOpacity
                  onPress={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      jenis_kegiatan: '',
                    }))
                  }
                  style={styles.clearSelectionButton}
                >
                  <Text style={styles.clearSelectionText}>Hapus pilihan</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <PickerInput
                label="Wilayah Binaan"
                value={localFilters.wilbin_id || ''}
                onValueChange={(value) => handleWilbinChange(value)}
                items={options.wilbins}
                placeholder="Pilih wilayah binaan"
              />
              {localFilters.wilbin_id ? (
                <TouchableOpacity
                  onPress={() => handleWilbinChange('')}
                  style={styles.clearSelectionButton}
                >
                  <Text style={styles.clearSelectionText}>Hapus pilihan</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <PickerInput
                label="Shelter"
                value={localFilters.shelter_id || ''}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    shelter_id: value ?? '',
                  }))
                }
                items={options.shelters}
                placeholder="Pilih shelter"
              />
              {localFilters.shelter_id ? (
                <TouchableOpacity
                  onPress={() =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      shelter_id: '',
                    }))
                  }
                  style={styles.clearSelectionButton}
                >
                  <Text style={styles.clearSelectionText}>Hapus pilihan</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearButtonText}>Atur Ulang</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Terapkan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {activeDatePicker ? (
        <DatePicker
          value={datePickerValue}
          onChange={handleDateChange}
          onCancel={handleDateCancel}
          minimumDate={activeDatePicker === 'end' ? startDate ?? undefined : undefined}
          maximumDate={activeDatePicker === 'start' ? endDate ?? undefined : undefined}
        />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  sheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 6,
  },
  content: {
    maxHeight: 420,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#f8fbff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateInputText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  fieldGroup: {
    marginBottom: 8,
  },
  clearSelectionButton: {
    alignSelf: 'flex-end',
    marginTop: -12,
    marginBottom: 20,
  },
  clearSelectionText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  applyButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default TutorAttendanceFilters;
