import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../../../../common/components/SearchBar';
import DatePicker from '../../../../../common/components/DatePicker';

const formatDateLabel = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const toISODate = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().split('T')[0];
};

const getInitialFilters = (filters) => ({
  search: filters?.search ?? '',
  shelterId: filters?.shelterId ?? filters?.shelter_id ?? null,
  groupId: filters?.groupId ?? filters?.group_id ?? null,
  band: filters?.band ?? filters?.attendanceBand ?? filters?.attendance_band ?? null,
  startDate: filters?.startDate ?? filters?.start_date ?? null,
  endDate: filters?.endDate ?? filters?.end_date ?? null,
});

const ChildAttendanceFilterSheet = ({
  visible,
  onClose,
  filters = {},
  shelters = [],
  groups = [],
  bands = [],
  loading = false,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = useState(() => getInitialFilters(filters));
  const [activeDatePicker, setActiveDatePicker] = useState(null);
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  useEffect(() => {
    if (visible) setLocalFilters(getInitialFilters(filters));
  }, [filters, visible]);

  const groupedShelters = Array.isArray(shelters) ? shelters : [];
  const groupedBands = Array.isArray(bands) ? bands : [];

  const filteredGroups = useMemo(() => {
    const list = Array.isArray(groups) ? groups : [];
    if (!localFilters.shelterId) return list;
    return list.filter((item) => {
      const shelterId = item?.shelterId ?? item?.shelter_id ?? item?.parent_id ?? null;
      return shelterId === localFilters.shelterId;
    });
  }, [groups, localFilters.shelterId]);

  const openDatePicker = (type) => {
    const current = type === 'start' ? localFilters.startDate : localFilters.endDate;
    const parsed = current ? new Date(current) : new Date();
    setDatePickerValue(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
    setActiveDatePicker(type);
  };

  const handleDateChange = (date) => {
    if (!date) return setActiveDatePicker(null);
    const iso = toISODate(date);
    setLocalFilters((prev) => ({
      ...prev,
      startDate: activeDatePicker === 'start' ? iso : prev.startDate,
      endDate: activeDatePicker === 'end' ? iso : prev.endDate,
    }));
    setDatePickerValue(date instanceof Date ? date : new Date(date));
    setActiveDatePicker(null);
  };

  const handleDateCancel = () => setActiveDatePicker(null);

  const toggleBand = (bandId) => {
    setLocalFilters((prev) => ({
      ...prev,
      band: prev.band === bandId ? null : bandId,
    }));
  };

  const handleSelectShelter = (shelterId) => {
    setLocalFilters((prev) => ({
      ...prev,
      shelterId: prev.shelterId === shelterId ? null : shelterId,
      groupId: null,
    }));
  };

  const handleSelectGroup = (groupId) => {
    setLocalFilters((prev) => ({
      ...prev,
      groupId: prev.groupId === groupId ? null : groupId,
    }));
  };

  const handleApply = () => {
    onApply?.(localFilters);
    onClose?.();
  };

  const handleReset = () => {
    setLocalFilters(getInitialFilters({}));
    onReset?.();
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[0, 1, 2].map((index) => (
        <View key={index} style={[styles.skeletonRow, index > 0 && styles.skeletonRowSpacing]}>
          <View style={styles.skeletonLabel} />
          <View style={styles.skeletonInput} />
        </View>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.sheetTitle}>Filter Kehadiran Anak</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#2d3436" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#0984e3" />
            {renderSkeleton()}
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Cari Anak</Text>
            <SearchBar
              value={localFilters.search}
              onChangeText={(text) => setLocalFilters((prev) => ({ ...prev, search: text }))}
              placeholder="Cari nama anak"
              style={styles.searchBar}
            />

            <Text style={styles.sectionTitle}>Rentang Tanggal</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateInput, styles.dateInputSpacing]}
                onPress={() => openDatePicker('start')}
              >
                <Ionicons name="calendar-outline" size={18} color="#636e72" />
                <View style={styles.dateLabelWrapper}>
                  <Text style={styles.dateLabelTitle}>Mulai</Text>
                  <Text style={styles.dateLabelValue}>
                    {formatDateLabel(localFilters.startDate) || 'Pilih tanggal'}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('end')}>
                <Ionicons name="calendar-outline" size={18} color="#636e72" />
                <View style={styles.dateLabelWrapper}>
                  <Text style={styles.dateLabelTitle}>Selesai</Text>
                  <Text style={styles.dateLabelValue}>
                    {formatDateLabel(localFilters.endDate) || 'Pilih tanggal'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Shelter</Text>
            <View style={styles.chipContainer}>
              {groupedShelters.length ? (
                groupedShelters.map((shelter) => {
                  const id = shelter?.id ?? shelter?.value ?? shelter?.shelter_id ?? null;
                  const isActive = localFilters.shelterId === id;
                  return (
                    <TouchableOpacity
                      key={id || shelter?.name}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => handleSelectShelter(id)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {shelter?.name ?? 'Tanpa nama'}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Tidak ada shelter tersedia.</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Kelompok</Text>
            <View style={styles.chipContainer}>
              {filteredGroups.length ? (
                filteredGroups.map((group) => {
                  const id = group?.id ?? group?.value ?? group?.group_id ?? null;
                  const isActive = localFilters.groupId === id;
                  return (
                    <TouchableOpacity
                      key={id || group?.name}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => handleSelectGroup(id)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {group?.name ?? 'Tanpa nama'}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Tidak ada kelompok untuk shelter ini.</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Band Kehadiran</Text>
            <View style={styles.chipContainer}>
              {groupedBands.length ? (
                groupedBands.map((band) => {
                  const id = band?.id ?? band?.band ?? band?.value ?? null;
                  const label = band?.label ?? band?.name ?? band?.title ?? String(id ?? 'Band');
                  const isActive = localFilters.band === id;
                  return (
                    <TouchableOpacity
                      key={id || label}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() => toggleBand(id)}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Band kehadiran belum tersedia.</Text>
              )}
            </View>
          </ScrollView>
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Atur Ulang</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Terapkan</Text>
            <Ionicons name="filter" size={18} color="#ffffff" style={styles.applyIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {activeDatePicker ? (
        <DatePicker value={datePickerValue} onChange={handleDateChange} onCancel={handleDateCancel} />
      ) : null}
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dfe6e9',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d3436',
  },
  closeButton: {
    padding: 4,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 8,
    marginTop: 12,
  },
  searchBar: {
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  dateInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  dateInputSpacing: {
    marginRight: 12,
  },
  dateLabelWrapper: {
    marginLeft: 10,
  },
  dateLabelTitle: {
    fontSize: 12,
    color: '#95a5a6',
  },
  dateLabelValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
    marginTop: 2,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f6fa',
    borderWidth: 1,
    borderColor: '#ecf0f1',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  chipActive: {
    backgroundColor: 'rgba(9, 132, 227, 0.15)',
    borderColor: '#0984e3',
  },
  chipText: {
    fontSize: 13,
    color: '#636e72',
  },
  chipTextActive: {
    color: '#0984e3',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    color: '#b2bec3',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#b2bec3',
  },
  resetButtonText: {
    color: '#636e72',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0984e3',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  applyIcon: {
    marginLeft: 2,
  },
  loadingState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  skeletonContainer: {
    marginTop: 16,
    width: '100%',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonRowSpacing: {
    marginTop: 12,
  },
  skeletonLabel: {
    width: '35%',
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  skeletonInput: {
    width: '55%',
    height: 32,
    backgroundColor: '#f5f6f7',
    borderRadius: 8,
  },
});

export default ChildAttendanceFilterSheet;
