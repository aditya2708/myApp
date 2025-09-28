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
import DateTimePicker from '@react-native-community/datetimepicker';

import Button from '../../../../common/components/Button';

const formatDate = (date) => {
  if (!date) return null;
  const instance = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(instance.getTime())) return null;
  return instance.toISOString().split('T')[0];
};

const OptionRow = ({ label, selected, onPress, icon }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.optionRow, selected && styles.optionRowSelected]}
  >
    <View style={styles.optionLabelWrapper}>
      {icon && (
        <Ionicons name={icon} size={16} color={selected ? '#2c3e50' : '#7f8c8d'} style={styles.optionIcon} />
      )}
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
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
  jenisOptions = [],
  wilayahOptions = [],
  shelterOptions = [],
  shelterLoading = false,
  onApply,
  onClear,
  onWilayahFetch,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [activeDatePicker, setActiveDatePicker] = useState(null);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const jenisItems = useMemo(() => {
    if (!jenisOptions || jenisOptions.length === 0) {
      return [];
    }

    return jenisOptions.map((option) => ({
      key: option.value ?? option.id ?? option.slug ?? option,
      label: option.label ?? option.name ?? option,
    }));
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

  const handleDateChange = (_, selectedDate) => {
    if (selectedDate) {
      setLocalFilters((prev) => ({
        ...prev,
        [activeDatePicker]: formatDate(selectedDate),
      }));
    }
    setActiveDatePicker(null);
  };

  const handleWilayahSelect = (wilayahId) => {
    setLocalFilters((prev) => ({
      ...prev,
      wilayahBinaan: wilayahId,
      shelter: null,
    }));
    onWilayahFetch?.(wilayahId);
  };

  const handleApply = () => {
    onApply?.(localFilters);
    onClose?.();
  };

  const handleClear = () => {
    onClear?.();
    setLocalFilters({ ...filters, ...{ start_date: null, end_date: null, jenisKegiatan: null, wilayahBinaan: null, shelter: null } });
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
              <Text style={styles.sectionTitle}>Rentang Tanggal</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.dateButton, styles.dateButtonSpacing]}
                  onPress={() => setActiveDatePicker('start_date')}
                >
                  <Ionicons name="calendar-outline" size={18} color="#7f8c8d" />
                  <Text style={styles.dateText}>
                    {localFilters.start_date || 'Tanggal Mulai'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setActiveDatePicker('end_date')}
                >
                  <Ionicons name="calendar-outline" size={18} color="#7f8c8d" />
                  <Text style={styles.dateText}>
                    {localFilters.end_date || 'Tanggal Selesai'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Jenis Kegiatan</Text>
              <View style={styles.optionList}>
                <OptionRow
                  label="Semua"
                  selected={!localFilters.jenisKegiatan}
                  onPress={() => setLocalFilters((prev) => ({ ...prev, jenisKegiatan: null }))}
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
              <View style={styles.optionList}>
                <OptionRow
                  label="Semua"
                  selected={!localFilters.shelter}
                  onPress={() => setLocalFilters((prev) => ({ ...prev, shelter: null }))}
                  icon="home"
                />
                {shelterItems.map((option) => (
                  <OptionRow
                    key={option.key}
                    label={option.label}
                    selected={localFilters.shelter === option.key}
                    onPress={() => setLocalFilters((prev) => ({ ...prev, shelter: option.key }))}
                    icon="business"
                  />
                ))}
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

      {activeDatePicker && (
        <DateTimePicker
          value={localFilters[activeDatePicker] ? new Date(localFilters[activeDatePicker]) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButtonSpacing: {
    marginRight: 12,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    backgroundColor: '#f8f9fa',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2c3e50',
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
});

export default ChildReportFilterModal;
