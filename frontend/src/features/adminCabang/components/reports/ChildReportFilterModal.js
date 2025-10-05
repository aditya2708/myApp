import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../../common/components/Button';

const DEFAULT_ACTIVITY = 'Bimbel';
const DEFAULT_CHART_TYPE = 'bar';
const DEFAULT_SHELTER = null;

const buildInitialLocalFilters = (filters, defaultPeriodValue) => {
  const incomingFilters = filters ? { ...filters } : {};

  if (typeof incomingFilters.wilayahBinaan === 'undefined') {
    incomingFilters.wilayahBinaan = null;
  }

  return {
    ...incomingFilters,
    period:
      typeof incomingFilters.period === 'undefined' || incomingFilters.period === null
        ? defaultPeriodValue ?? null
        : incomingFilters.period,
    jenisKegiatan:
      typeof incomingFilters.jenisKegiatan === 'undefined'
        ? DEFAULT_ACTIVITY
        : incomingFilters.jenisKegiatan,
    shelter:
      typeof incomingFilters.shelter === 'undefined' ? DEFAULT_SHELTER : incomingFilters.shelter,
    chartType:
      typeof incomingFilters.chartType === 'undefined' || incomingFilters.chartType === null
        ? DEFAULT_CHART_TYPE
        : incomingFilters.chartType,
    start_date: null,
    end_date: null,
  };
};

const prepareFiltersForSubmit = (filters, defaultPeriodValue) => {
  const nextFilters = filters ? { ...filters } : {};

  if (typeof nextFilters.period === 'undefined' || nextFilters.period === null) {
    nextFilters.period = defaultPeriodValue ?? null;
  }

  if (typeof nextFilters.jenisKegiatan === 'undefined') {
    nextFilters.jenisKegiatan = DEFAULT_ACTIVITY;
  }

  if (typeof nextFilters.shelter === 'undefined') {
    nextFilters.shelter = DEFAULT_SHELTER;
  }

  if (typeof nextFilters.chartType === 'undefined' || nextFilters.chartType === null) {
    nextFilters.chartType = DEFAULT_CHART_TYPE;
  }

  if (typeof nextFilters.wilayahBinaan === 'undefined') {
    nextFilters.wilayahBinaan = null;
  }

  nextFilters.start_date = null;
  nextFilters.end_date = null;

  return nextFilters;
};

const OptionRow = ({ label, selected, onPress, icon, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.optionRow,
      selected && styles.optionRowSelected,
      disabled && styles.optionRowDisabled,
    ]}
    disabled={disabled}
    activeOpacity={disabled ? 1 : 0.7}
  >
    <View style={styles.optionLabelWrapper}>
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? '#2c3e50' : '#7f8c8d'}
          style={styles.optionIcon}
        />
      )}
      <Text
        style={[
          styles.optionLabel,
          selected && styles.optionLabelSelected,
          disabled && styles.optionLabelDisabled,
        ]}
      >
        {label}
      </Text>
    </View>
    {selected && <Ionicons name="checkmark" size={18} color="#2ecc71" />}
  </TouchableOpacity>
);

const ChildReportFilterModal = ({
  visible,
  onClose,
  filters,
  periodOptions = [],
  jenisOptions = [],
  wilayahOptions = [],
  shelterOptions = [],
  shelterLoading = false,
  shelterError = null,
  onApply,
  onClear,
  onWilayahFetch,
}) => {
  const normalizedPeriodOptions = useMemo(() => {
    if (!Array.isArray(periodOptions) || periodOptions.length === 0) {
      return [];
    }

    return periodOptions
      .map((option) => {
        if (!option) {
          return null;
        }

        const value = option.value ?? option.id ?? option.slug ?? option;
        const label = option.label ?? option.name ?? option;

        if (!value || !label) {
          return null;
        }

        return {
          value: String(value),
          label: String(label),
        };
      })
      .filter(Boolean);
  }, [periodOptions]);

  const defaultPeriodValue = useMemo(() => {
    if (normalizedPeriodOptions.length === 0) {
      return null;
    }

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const matchingOption = normalizedPeriodOptions.find((option) => option.value === currentPeriod);

    return matchingOption?.value ?? normalizedPeriodOptions[0]?.value ?? null;
  }, [normalizedPeriodOptions]);

  const [localFilters, setLocalFilters] = useState(() =>
    buildInitialLocalFilters(filters, defaultPeriodValue),
  );

  useEffect(() => {
    if (visible) {
      setLocalFilters(buildInitialLocalFilters(filters, defaultPeriodValue));
    }
  }, [visible, filters, defaultPeriodValue]);

  const jenisItems = useMemo(() => {
    const normalized = (Array.isArray(jenisOptions) ? jenisOptions : [])
      .map((option) => ({
        key: option.value ?? option.id ?? option.slug ?? option,
        label: option.label ?? option.name ?? option,
      }))
      .filter((option) => option.key && option.label);

    const hasDefaultActivity = normalized.some((option) => option.key === DEFAULT_ACTIVITY);
    if (!hasDefaultActivity) {
      normalized.unshift({ key: DEFAULT_ACTIVITY, label: DEFAULT_ACTIVITY });
    }

    return normalized;
  }, [jenisOptions]);

  const wilayahItems = useMemo(() => {
    if (!wilayahOptions || wilayahOptions.length === 0) {
      return [];
    }

    return wilayahOptions.map((option) => ({
      key: option.value ?? option.id ?? option.slug ?? option,
      label: option.label ?? option.name ?? option.nama ?? option,
    }));
  }, [wilayahOptions]);

  const shelterItems = useMemo(() => {
    if (!shelterOptions || shelterOptions.length === 0) {
      return [];
    }

    return shelterOptions.map((option) => ({
      key: option.value ?? option.id ?? option.slug ?? option,
      label: option.label ?? option.name ?? option.nama ?? option,
    }));
  }, [shelterOptions]);

  const handleWilayahSelect = (wilayahId) => {
    setLocalFilters((prev) => ({
      ...prev,
      wilayahBinaan: wilayahId,
      shelter: DEFAULT_SHELTER,
    }));
    onWilayahFetch?.(wilayahId);
  };

  const handleApply = () => {
    const nextFilters = prepareFiltersForSubmit(localFilters, defaultPeriodValue);
    onApply?.(nextFilters);
    onClose?.();
  };

  const handleClear = () => {
    const resetValues = prepareFiltersForSubmit(
      {
        ...filters,
        period: defaultPeriodValue ?? null,
        jenisKegiatan: DEFAULT_ACTIVITY,
        wilayahBinaan: null,
        shelter: DEFAULT_SHELTER,
        chartType: DEFAULT_CHART_TYPE,
      },
      defaultPeriodValue,
    );

    onClear?.(resetValues);
    setLocalFilters(resetValues);
  };

  const handleRetryShelterFetch = () => {
    if (!localFilters.wilayahBinaan) {
      return;
    }

    onWilayahFetch?.(localFilters.wilayahBinaan);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Laporan</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Periode</Text>
              {normalizedPeriodOptions.length === 0 ? (
                <Text style={styles.helperText}>Belum ada periode yang tersedia.</Text>
              ) : (
                <View style={styles.optionList}>
                  {normalizedPeriodOptions.map((option) => (
                    <OptionRow
                      key={option.value}
                      label={option.label}
                      selected={localFilters.period === option.value}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          period: option.value,
                        }))
                      }
                      icon="calendar-outline"
                    />
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Jenis Kegiatan</Text>
              <View style={styles.optionList}>
                <OptionRow
                  label="Semua"
                  selected={!localFilters.jenisKegiatan}
                  onPress={() =>
                    setLocalFilters((prev) => ({ ...prev, jenisKegiatan: null }))
                  }
                  icon="ellipse-outline"
                />
                {jenisItems.map((option) => (
                  <OptionRow
                    key={option.key}
                    label={option.label}
                    selected={localFilters.jenisKegiatan === option.key}
                    onPress={() => setLocalFilters((prev) => ({ ...prev, jenisKegiatan: option.key }))}
                    icon="layers"
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Wilayah Binaan</Text>
              <View style={styles.optionList}>
                <OptionRow
                  label="Semua"
                  selected={!localFilters.wilayahBinaan}
                  onPress={() => handleWilayahSelect(null)}
                  icon="globe"
                />
                {wilayahItems.map((option) => (
                  <OptionRow
                    key={option.key}
                    label={option.label}
                    selected={localFilters.wilayahBinaan === option.key}
                    onPress={() => handleWilayahSelect(option.key)}
                    icon="navigate"
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shelter</Text>
              {shelterLoading && (
                <Text style={styles.helperText}>Memuat shelter...</Text>
              )}
              {shelterError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{shelterError}</Text>
                  <Button
                    title="Coba lagi"
                    type="outline"
                    onPress={handleRetryShelterFetch}
                    disabled={!localFilters.wilayahBinaan || shelterLoading}
                    style={styles.retryButton}
                  />
                </View>
              )}
              <View style={styles.optionList}>
                <OptionRow
                  label="Semua"
                  selected={!localFilters.shelter}
                  onPress={() => setLocalFilters((prev) => ({ ...prev, shelter: null }))}
                  disabled={Boolean(shelterError)}
                  icon="home"
                />
                {shelterItems.map((option) => (
                  <OptionRow
                    key={option.key}
                    label={option.label}
                    selected={localFilters.shelter === option.key}
                    onPress={() =>
                      setLocalFilters((prev) => ({ ...prev, shelter: option.key }))
                    }
                    disabled={Boolean(shelterError)}
                    icon="business"
                  />
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tampilkan Sebagai</Text>
              <View style={styles.chartTypeRow}>
                {['bar', 'line'].map((type, index) => {
                  const isSelected = localFilters.chartType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chartTypeButton,
                        isSelected && styles.chartTypeButtonSelected,
                        index === 1 && styles.chartTypeButtonLast,
                      ]}
                      onPress={() =>
                        setLocalFilters((prev) => ({
                          ...prev,
                          chartType: type,
                        }))
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={type === 'bar' ? 'bar-chart' : 'analytics'}
                        size={18}
                        color={isSelected ? '#ffffff' : '#7f8c8d'}
                        style={styles.chartTypeIcon}
                      />
                      <Text style={[styles.chartTypeLabel, isSelected && styles.chartTypeLabelSelected]}>
                        {type === 'bar' ? 'Bar' : 'Line'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Hapus"
              type="outline"
              onPress={handleClear}
              style={[styles.footerButton, styles.footerButtonSpacing]}
            />
            <Button
              title="Terapkan"
              onPress={handleApply}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  section: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  optionList: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f6f8',
    backgroundColor: '#ffffff',
  },
  optionRowSelected: {
    backgroundColor: '#f0f7ff',
  },
  optionRowDisabled: {
    opacity: 0.5,
  },
  optionLabelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 14,
    color: '#2c3e50',
    flexShrink: 1,
  },
  optionLabelSelected: {
    fontWeight: '600',
  },
  optionLabelDisabled: {
    color: '#95a5a6',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerButton: {
    flex: 1,
  },
  footerButtonSpacing: {
    marginRight: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
  },
  chartTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    backgroundColor: '#ffffff',
    marginRight: 12,
  },
  chartTypeButtonSelected: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  chartTypeLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  chartTypeLabelSelected: {
    color: '#ffffff',
  },
  chartTypeIcon: {
    marginRight: 8,
  },
  chartTypeButtonLast: {
    marginRight: 0,
  },
  errorContainer: {
    backgroundColor: '#fdecea',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f5b7b1',
    marginBottom: 10,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 10,
  },
  retryButton: {
    alignSelf: 'flex-start',
  },
});

export default ChildReportFilterModal;
