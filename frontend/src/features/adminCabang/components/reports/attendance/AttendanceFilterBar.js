import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const MONTH_OPTIONS = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
];

const VERIFICATION_OPTIONS = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Terverifikasi', value: 'verified' },
  { label: 'Menunggu', value: 'pending' },
  { label: 'Ditolak', value: 'rejected' },
];

const AttendanceFilterBar = ({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  weekOptions = [],
  wilbinOptions = [],
  shelterOptions = [],
  isLoading = false,
}) => {
  const effectiveFilters = filters ?? {};

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const availableYears = [];

    for (let offset = 0; offset < 5; offset += 1) {
      availableYears.push(currentYear - offset);
    }

    const normalized = availableYears
      .sort((a, b) => b - a)
      .map((year) => ({
        label: `${year}`,
        value: year,
      }));

    if (
      effectiveFilters.year &&
      !normalized.some((option) => option.value === effectiveFilters.year)
    ) {
      normalized.push({ label: `${effectiveFilters.year}`, value: effectiveFilters.year });
    }

    return normalized.sort((a, b) => b.value - a.value);
  }, [effectiveFilters.year]);

  const handleUpdateFilters = (updater) => {
    if (typeof onFiltersChange !== 'function') {
      return;
    }

    if (typeof updater === 'function') {
      onFiltersChange((prev) => updater(prev ?? {}));
      return;
    }

    onFiltersChange((prev) => ({ ...(prev ?? {}), ...(updater ?? {}) }));
  };

  const handleMonthChange = (value) => {
    const numericValue = Number(value);

    handleUpdateFilters((prev) => ({
      ...(prev ?? {}),
      month: numericValue,
      week: 'all',
    }));
  };

  const handleYearChange = (value) => {
    const numericValue = Number(value);

    handleUpdateFilters((prev) => ({
      ...(prev ?? {}),
      year: numericValue,
      week: 'all',
    }));
  };

  const handleWeekChange = (value) => {
    if (value === 'all') {
      handleUpdateFilters({ week: 'all' });
      return;
    }

    const numericValue = Number(value);

    handleUpdateFilters({ week: Number.isNaN(numericValue) ? 'all' : numericValue });
  };

  const handleWilbinChange = (value) => {
    handleUpdateFilters((prev) => ({
      ...(prev ?? {}),
      wilbinId: value ?? null,
      shelterId: null,
    }));
  };

  const handleShelterChange = (value) => {
    handleUpdateFilters({ shelterId: value ?? null });
  };

  const handleVerificationChange = (value) => {
    handleUpdateFilters({ verificationStatus: value ?? 'all' });
  };

  const renderPicker = (props) => {
    const { label, selectedValue, onValueChange, items = [], enabled = true, placeholder } = props;

    if (items.length === 0 && !placeholder) {
      return null;
    }

    return (
      <View style={styles.pickerGroup}>
        <Text style={styles.pickerLabel}>{label}</Text>
        <View style={[styles.pickerWrapper, !enabled && styles.pickerDisabled]}>
          <Picker
            enabled={enabled}
            selectedValue={selectedValue}
            onValueChange={onValueChange}
            style={styles.picker}
            dropdownIconColor="#0984e3"
          >
            {placeholder ? (
              <Picker.Item label={placeholder} value={null} />
            ) : null}
            {items.map((item) => (
              <Picker.Item key={`${label}-${item.value}`} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
      </View>
    );
  };

  const normalizedWeekOptions = useMemo(() => {
    if (!Array.isArray(weekOptions) || weekOptions.length === 0) {
      return [];
    }

    return weekOptions.map((option) => ({
      label: `Minggu ${option}`,
      value: option,
    }));
  }, [weekOptions]);

  const normalizedWilbinOptions = useMemo(() => {
    if (!Array.isArray(wilbinOptions) || wilbinOptions.length === 0) {
      return [];
    }

    return [
      { label: 'Semua Wilayah', value: null },
      ...wilbinOptions.map((option) => ({
        label: option.label ?? `${option.value}`,
        value: option.value,
      })),
    ];
  }, [wilbinOptions]);

  const normalizedShelterOptions = useMemo(() => {
    if (!Array.isArray(shelterOptions) || shelterOptions.length === 0) {
      return [];
    }

    return [
      { label: 'Semua Shelter', value: null },
      ...shelterOptions.map((option) => ({
        label: option.label ?? `${option.value}`,
        value: option.value,
      })),
    ];
  }, [shelterOptions]);

  const shouldShowWilbin = normalizedWilbinOptions.length > 0;
  const shouldShowShelter = normalizedShelterOptions.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Filter Kehadiran</Text>
        {isLoading ? <ActivityIndicator size="small" color="#0984e3" /> : null}
      </View>

      <View style={styles.row}>
        {renderPicker({
          label: 'Bulan',
          selectedValue: effectiveFilters.month ?? null,
          onValueChange: handleMonthChange,
          items: MONTH_OPTIONS,
        })}

        {renderPicker({
          label: 'Tahun',
          selectedValue: effectiveFilters.year ?? null,
          onValueChange: handleYearChange,
          items: yearOptions,
        })}
      </View>

      <View style={styles.row}>
        {renderPicker({
          label: 'Minggu',
          selectedValue: effectiveFilters.week ?? 'all',
          onValueChange: handleWeekChange,
          items: [
            { label: 'Semua Minggu', value: 'all' },
            ...normalizedWeekOptions,
          ],
        })}

        {renderPicker({
          label: 'Status Verifikasi',
          selectedValue: effectiveFilters.verificationStatus ?? 'all',
          onValueChange: handleVerificationChange,
          items: VERIFICATION_OPTIONS,
        })}
      </View>

      {shouldShowWilbin || shouldShowShelter ? (
        <View style={styles.row}>
          {shouldShowWilbin
            ? renderPicker({
                label: 'Wilayah Binaan',
                selectedValue: effectiveFilters.wilbinId ?? null,
                onValueChange: handleWilbinChange,
                items: normalizedWilbinOptions,
              })
            : null}

          {shouldShowShelter
            ? renderPicker({
                label: 'Shelter',
                selectedValue: effectiveFilters.shelterId ?? null,
                onValueChange: handleShelterChange,
                items: normalizedShelterOptions,
                enabled: !shouldShowWilbin || !!effectiveFilters.wilbinId || normalizedWilbinOptions.length === 0,
              })
            : null}
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.resetButton} onPress={onReset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.applyButton} onPress={onApply}>
          <Text style={styles.applyButtonText}>Terapkan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f1f2f6',
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  pickerGroup: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 13,
    color: '#636e72',
    marginBottom: 6,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  pickerDisabled: {
    opacity: 0.6,
  },
  picker: {
    width: '100%',
    height: 44,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#dfe6e9',
  },
  resetButtonText: {
    color: '#2d3436',
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#0984e3',
  },
  applyButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default AttendanceFilterBar;
