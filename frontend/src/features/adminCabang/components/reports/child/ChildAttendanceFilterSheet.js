import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../../../../common/components/Button';
import DatePicker from '../../../../../common/components/DatePicker';
import PickerInput from '../../../../../common/components/PickerInput';
import SearchBar from '../../../../../common/components/SearchBar';

const mapOptions = (items, placeholderLabel = 'Semua') => {
  if (!Array.isArray(items) || items.length === 0) {
    return [{ label: placeholderLabel, value: null }];
  }

  return [{ label: placeholderLabel, value: null }, ...items.map((item) => ({
    label: item?.label ?? item?.name ?? String(item?.value ?? item?.id ?? ''),
    value: item?.value ?? item?.id ?? null,
  }))];
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const ChildAttendanceFilterSheet = ({
  visible,
  onClose,
  filters,
  availableFilters,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState({
    search: '',
    start_date: null,
    end_date: null,
    shelter_id: null,
    group_id: null,
    attendance_band: null,
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setLocalFilters({
      search: filters?.search ?? '',
      start_date: filters?.start_date ?? filters?.startDate ?? null,
      end_date: filters?.end_date ?? filters?.endDate ?? null,
      shelter_id: filters?.shelter_id ?? filters?.shelterId ?? null,
      group_id: filters?.group_id ?? filters?.groupId ?? null,
      attendance_band:
        filters?.attendance_band ?? filters?.attendanceBand ?? filters?.band ?? null,
    });
  }, [filters, visible]);

  const shelterOptions = useMemo(
    () => mapOptions(availableFilters?.shelters, 'Semua Shelter'),
    [availableFilters?.shelters],
  );
  const groupOptions = useMemo(
    () => mapOptions(availableFilters?.groups, 'Semua Kelompok'),
    [availableFilters?.groups],
  );
  const bandOptions = useMemo(
    () => mapOptions(availableFilters?.attendance_bands, 'Semua Status'),
    [availableFilters?.attendance_bands],
  );

  const handleApply = () => {
    onApply?.({
      ...localFilters,
      search: localFilters.search?.trim() || '',
    });
    onClose?.();
  };

  const handleReset = () => {
    setLocalFilters({
      search: '',
      start_date: null,
      end_date: null,
      shelter_id: null,
      group_id: null,
      attendance_band: null,
    });
    onReset?.();
    onClose?.();
  };

  const startDateValue = useMemo(() => parseDate(localFilters.start_date) || new Date(), [localFilters.start_date]);
  const endDateValue = useMemo(() => parseDate(localFilters.end_date) || new Date(), [localFilters.end_date]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Filter Laporan Anak</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#2d3436" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Pencarian</Text>
          <SearchBar
            value={localFilters.search}
            onChangeText={(text) => setLocalFilters((prev) => ({ ...prev, search: text }))}
            placeholder="Cari nama anak"
          />

          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Periode</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar" size={18} color="#0984e3" style={styles.dateIcon} />
              <Text style={styles.dateLabel}>
                {localFilters.start_date ? localFilters.start_date : 'Mulai tanggal'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar" size={18} color="#0984e3" style={styles.dateIcon} />
              <Text style={styles.dateLabel}>
                {localFilters.end_date ? localFilters.end_date : 'Sampai tanggal'}
              </Text>
            </TouchableOpacity>
          </View>

          <PickerInput
            label="Shelter"
            value={localFilters.shelter_id ?? ''}
            onValueChange={(value) =>
              setLocalFilters((prev) => ({ ...prev, shelter_id: value === '' ? null : value }))
            }
            items={shelterOptions}
            placeholder="Pilih shelter"
            style={styles.picker}
          />

          <PickerInput
            label="Kelompok"
            value={localFilters.group_id ?? ''}
            onValueChange={(value) =>
              setLocalFilters((prev) => ({ ...prev, group_id: value === '' ? null : value }))
            }
            items={groupOptions}
            placeholder="Pilih kelompok"
            style={styles.picker}
          />

          <PickerInput
            label="Status Kehadiran"
            value={localFilters.attendance_band ?? ''}
            onValueChange={(value) =>
              setLocalFilters((prev) => ({
                ...prev,
                attendance_band: value === '' ? null : value,
              }))
            }
            items={bandOptions}
            placeholder="Pilih status"
            style={styles.picker}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Atur Ulang" type="outline" onPress={handleReset} style={styles.footerButton} />
          <Button title="Terapkan" onPress={handleApply} style={styles.footerButton} />
        </View>
      </View>

      {showStartPicker ? (
        <DatePicker
          value={startDateValue}
          onChange={(date) => {
            setShowStartPicker(false);
            setLocalFilters((prev) => ({
              ...prev,
              start_date: date ? date.toISOString().split('T')[0] : null,
            }));
          }}
          onCancel={() => setShowStartPicker(false)}
        />
      ) : null}

      {showEndPicker ? (
        <DatePicker
          value={endDateValue}
          onChange={(date) => {
            setShowEndPicker(false);
            setLocalFilters((prev) => ({
              ...prev,
              end_date: date ? date.toISOString().split('T')[0] : null,
            }));
          }}
          onCancel={() => setShowEndPicker(false)}
        />
      ) : null}
    </Modal>
  );
};

ChildAttendanceFilterSheet.defaultProps = {
  filters: {},
  availableFilters: {},
  onApply: undefined,
  onReset: undefined,
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    maxHeight: '88%',
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dfe6e9',
    alignSelf: 'center',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
  },
  sectionSpacing: {
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  dateIcon: {
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#2d3436',
  },
  picker: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  footerButton: {
    flex: 1,
  },
});

export default ChildAttendanceFilterSheet;
