import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { adminCabangReportApi } from '../../../api/adminCabangReportApi';
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

const SELECT_ALL_VALUE = '__ALL__';

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
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  } catch (err) {
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    const monthName = monthNames[parsed.getMonth()];
    if (monthName) {
      return `${parsed.getDate()} ${monthName} ${parsed.getFullYear()}`;
    }

    return formatDateToLocalISO(parsed);
  }
};

const initializeFilters = (filters = {}, defaults = {}) => {
  const sanitize = (value) => {
    if (value === undefined || value === null) return '';
    if (typeof value === 'string') {
      if (value === SELECT_ALL_VALUE) return SELECT_ALL_VALUE;
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
      if (value === SELECT_ALL_VALUE) return fallback;
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
  const [wilayahOptions, setWilayahOptions] = useState(() => options.wilbins ?? []);
  const [wilayahLoading, setWilayahLoading] = useState(false);
  const [wilayahError, setWilayahError] = useState(null);
  const [wilayahLoadedFromApi, setWilayahLoadedFromApi] = useState(false);

  const [shelterOptions, setShelterOptions] = useState([]);
  const [shelterLoading, setShelterLoading] = useState(false);
  const [shelterError, setShelterError] = useState(null);
  const [shelterSourceWilayah, setShelterSourceWilayah] = useState(null);

  const selectedWilayah = localFilters.wilbin_id;
  const isWilayahSelectAll = selectedWilayah === SELECT_ALL_VALUE;
  const selectedWilayahId = !isWilayahSelectAll && selectedWilayah
    ? Number(selectedWilayah)
    : null;
  const isShelterEnabled = Number.isInteger(selectedWilayahId);
  const wilayahPickerValue = isWilayahSelectAll ? '' : (selectedWilayah || '');
  const selectAllShelterActive = localFilters.shelter_id === SELECT_ALL_VALUE;
  const shelterPickerValue = selectAllShelterActive ? '' : (localFilters.shelter_id || '');
  const hasWilayahOptions = wilayahOptions.length > 0;
  const hasShelterOptions = shelterOptions.length > 0;

  const fetchWilayahOptions = useCallback(async () => {
    setWilayahLoading(true);
    try {
      const response = await adminCabangReportApi.getTutorWilayahFilters();
      const payload = response?.data?.data ?? response?.data ?? [];
      const normalized = normalizeOptionList(payload);
      setWilayahOptions(normalized);
      setWilayahError(null);
      setWilayahLoadedFromApi(true);
    } catch (err) {
      setWilayahError(err);
    } finally {
      setWilayahLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (wilayahLoading || wilayahLoadedFromApi) return;
    fetchWilayahOptions();
  }, [visible, wilayahLoading, wilayahLoadedFromApi, fetchWilayahOptions]);

  useEffect(() => {
    if (options.wilbins?.length && !wilayahOptions.length && !wilayahLoading) {
      setWilayahOptions(options.wilbins);
    }
  }, [options.wilbins, wilayahOptions.length, wilayahLoading]);

  const fetchSheltersByWilayah = useCallback(async (wilbinId) => {
    setShelterLoading(true);
    setShelterError(null);
    try {
      const response = await adminCabangReportApi.getTutorShelterFilters(wilbinId);
      const payload = response?.data?.data ?? response?.data ?? [];
      const normalized = normalizeOptionList(payload);
      setShelterOptions(normalized);
      setShelterSourceWilayah(wilbinId);
    } catch (err) {
      setShelterError(err);
      setShelterOptions([]);
      setShelterSourceWilayah(null);
    } finally {
      setShelterLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (!isShelterEnabled) {
      setShelterOptions([]);
      setShelterSourceWilayah(null);
      setShelterError(null);
      return;
    }

    if (shelterSourceWilayah === selectedWilayahId && shelterOptions.length) {
      return;
    }

    fetchSheltersByWilayah(selectedWilayahId);
  }, [
    visible,
    isShelterEnabled,
    selectedWilayahId,
    shelterOptions.length,
    shelterSourceWilayah,
    fetchSheltersByWilayah,
  ]);

  useEffect(() => {
    if (visible) {
      setLocalFilters(initializeFilters(filters, defaultFilters));
      setShelterOptions([]);
      setShelterSourceWilayah(null);
      setShelterError(null);
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
    const nextValue =
      value === undefined || value === null ? '' : String(value);

    setLocalFilters((prev) => ({
      ...prev,
      wilbin_id: nextValue,
      shelter_id: '',
    }));
    setShelterOptions([]);
    setShelterSourceWilayah(null);
    setShelterError(null);
  };

  const handleSelectAllWilayah = () => {
    setLocalFilters((prev) => {
      const nextValue = prev.wilbin_id === SELECT_ALL_VALUE ? '' : SELECT_ALL_VALUE;
      return {
        ...prev,
        wilbin_id: nextValue,
        shelter_id: '',
      };
    });
    setShelterOptions([]);
    setShelterSourceWilayah(null);
    setShelterError(null);
  };

  const handleSelectAllShelter = () => {
    if (!isShelterEnabled) {
      return;
    }

    setLocalFilters((prev) => ({
      ...prev,
      shelter_id: prev.shelter_id === SELECT_ALL_VALUE ? '' : SELECT_ALL_VALUE,
    }));
  };

  const handleApply = () => {
    const payload = prepareFiltersForSubmit(localFilters, defaultFilters);
    onApply?.(payload);
  };

  const handleClear = () => {
    setLocalFilters(initializeFilters(defaultFilters, defaultFilters));
    setShelterOptions([]);
    setShelterSourceWilayah(null);
    setShelterError(null);
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
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.sectionLabel}>Wilayah Binaan</Text>
                <TouchableOpacity
                  style={[
                    styles.selectAllButton,
                    isWilayahSelectAll && styles.selectAllButtonActive,
                    (!hasWilayahOptions || wilayahLoading) && styles.selectAllButtonDisabled,
                  ]}
                  onPress={handleSelectAllWilayah}
                  disabled={!hasWilayahOptions || wilayahLoading}
                >
                  <Text
                    style={[
                      styles.selectAllButtonText,
                      isWilayahSelectAll && styles.selectAllButtonTextActive,
                      (!hasWilayahOptions || wilayahLoading) && styles.selectAllButtonTextDisabled,
                    ]}
                  >
                    {isWilayahSelectAll ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                  </Text>
                </TouchableOpacity>
              </View>
              <PickerInput
                value={wilayahPickerValue}
                onValueChange={handleWilbinChange}
                items={wilayahOptions}
                placeholder={hasWilayahOptions ? 'Pilih wilayah binaan' : 'Wilayah belum tersedia'}
                pickerProps={{ enabled: hasWilayahOptions && !wilayahLoading }}
                style={!hasWilayahOptions || wilayahLoading ? styles.disabledField : undefined}
              />
              {isWilayahSelectAll ? (
                <Text style={styles.helperText}>Menggunakan semua wilayah binaan.</Text>
              ) : null}
              {localFilters.wilbin_id && !isWilayahSelectAll ? (
                <TouchableOpacity
                  onPress={() => handleWilbinChange('')}
                  style={styles.clearSelectionButton}
                >
                  <Text style={styles.clearSelectionText}>Hapus pilihan</Text>
                </TouchableOpacity>
              ) : null}
              {wilayahLoading ? (
                <View style={styles.inlineStatusRow}>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text style={[styles.inlineStatusText, styles.inlineStatusTextSpacing]}>
                    Memuat wilayah binaan...
                  </Text>
                </View>
              ) : null}
              {wilayahError ? (
                <TouchableOpacity
                  style={styles.inlineStatusRow}
                  onPress={fetchWilayahOptions}
                >
                  <Ionicons
                    name="refresh"
                    size={16}
                    color="#ef4444"
                    style={styles.inlineStatusIcon}
                  />
                  <Text
                    style={[
                      styles.inlineStatusText,
                      styles.inlineStatusTextError,
                    ]}
                  >
                    Gagal memuat wilayah. Ketuk untuk mencoba lagi.
                  </Text>
                </TouchableOpacity>
              ) : null}
              {!wilayahLoading && !wilayahError && !hasWilayahOptions ? (
                <Text style={styles.helperText}>Belum ada wilayah binaan terdaftar.</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.sectionLabel}>Shelter</Text>
                {isShelterEnabled ? (
                  <TouchableOpacity
                    style={[
                      styles.selectAllButton,
                      selectAllShelterActive && styles.selectAllButtonActive,
                      (!hasShelterOptions || shelterLoading) && styles.selectAllButtonDisabled,
                    ]}
                    onPress={handleSelectAllShelter}
                    disabled={!hasShelterOptions || shelterLoading}
                  >
                    <Text
                      style={[
                        styles.selectAllButtonText,
                        selectAllShelterActive && styles.selectAllButtonTextActive,
                        (!hasShelterOptions || shelterLoading) && styles.selectAllButtonTextDisabled,
                      ]}
                    >
                      {selectAllShelterActive ? 'Batalkan Pilih Semua' : 'Pilih Semua'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <PickerInput
                value={shelterPickerValue}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    shelter_id: value ?? '',
                  }))
                }
                items={shelterOptions}
                placeholder={
                  isShelterEnabled
                    ? hasShelterOptions
                      ? 'Pilih shelter'
                      : 'Shelter belum tersedia'
                    : 'Pilih wilayah binaan terlebih dahulu'
                }
                pickerProps={{
                  enabled: isShelterEnabled && hasShelterOptions && !shelterLoading,
                }}
                style={!isShelterEnabled ? styles.disabledField : undefined}
              />
              {!isShelterEnabled ? (
                <Text style={styles.helperText}>
                  {isWilayahSelectAll
                    ? 'Filter shelter tidak tersedia ketika memilih semua wilayah.'
                    : 'Pilih wilayah binaan terlebih dahulu untuk memuat shelter.'}
                </Text>
              ) : null}
              {selectAllShelterActive ? (
                <Text style={styles.helperText}>
                  Menggunakan semua shelter pada wilayah yang dipilih.
                </Text>
              ) : null}
              {localFilters.shelter_id && !selectAllShelterActive ? (
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
              {shelterLoading ? (
                <View style={styles.inlineStatusRow}>
                  <ActivityIndicator size="small" color="#2563eb" />
                  <Text style={[styles.inlineStatusText, styles.inlineStatusTextSpacing]}>
                    Memuat shelter...
                  </Text>
                </View>
              ) : null}
              {shelterError && isShelterEnabled ? (
                <TouchableOpacity
                  style={styles.inlineStatusRow}
                  onPress={() => selectedWilayahId && fetchSheltersByWilayah(selectedWilayahId)}
                >
                  <Ionicons
                    name="refresh"
                    size={16}
                    color="#ef4444"
                    style={styles.inlineStatusIcon}
                  />
                  <Text
                    style={[
                      styles.inlineStatusText,
                      styles.inlineStatusTextError,
                    ]}
                  >
                    Gagal memuat shelter. Ketuk untuk mencoba lagi.
                  </Text>
                </TouchableOpacity>
              ) : null}
              {isShelterEnabled && !shelterLoading && !shelterError && !hasShelterOptions ? (
                <Text style={styles.helperText}>Belum ada shelter untuk wilayah ini.</Text>
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
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    backgroundColor: '#f8fbff',
  },
  selectAllButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  selectAllButtonDisabled: {
    opacity: 0.4,
  },
  selectAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  selectAllButtonTextActive: {
    color: '#1d4ed8',
  },
  selectAllButtonTextDisabled: {
    color: '#94a3b8',
  },
  inlineStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  inlineStatusText: {
    fontSize: 12,
    color: '#475569',
  },
  inlineStatusTextError: {
    color: '#ef4444',
  },
  inlineStatusTextSpacing: {
    marginLeft: 8,
  },
  inlineStatusIcon: {
    marginRight: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  disabledField: {
    opacity: 0.7,
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
