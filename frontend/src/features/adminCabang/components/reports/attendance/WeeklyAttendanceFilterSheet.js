import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WeeklyAttendanceFilterSheet = ({
  visible,
  onClose,
  bands,
  selectedBands,
  onBandsChange,
  searchQuery,
  onSearchChange,
  onReset,
  periodOptions,
  selectedYear,
  selectedMonth,
  selectedWeekId,
  onYearChange,
  onMonthChange,
  onWeekChange,
}) => {
  const safeBands = Array.isArray(bands) ? bands : [];
  const selectedSet = new Set(selectedBands || []);
  const safePeriods = Array.isArray(periodOptions) ? periodOptions : [];

  const activeYear = safePeriods.find((item) => item.year === selectedYear) || safePeriods[0];
  const monthList = Array.isArray(activeYear?.months) ? activeYear.months : [];
  const activeMonth =
    monthList.find((month) => month.id === selectedMonth) || monthList[0] || null;
  const weekList = Array.isArray(activeMonth?.weeks) ? activeMonth.weeks : [];

  const toggleBand = (bandId) => {
    if (!onBandsChange) {
      return;
    }

    const next = new Set(selectedSet);

    if (next.has(bandId)) {
      next.delete(bandId);
    } else {
      next.add(bandId);
    }

    onBandsChange(Array.from(next));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title}>Filter Shelter</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#2d3436" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#636e72" style={styles.searchIcon} />
          <TextInput
            placeholder="Cari nama shelter"
            placeholderTextColor="#b2bec3"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => onSearchChange?.('')}>
              <Ionicons name="close-circle" size={20} color="#b2bec3" />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>Periode Laporan</Text>
        {safePeriods.length ? (
          <View style={styles.periodWrapper}>
            <Text style={styles.subSectionLabel}>Tahun</Text>
            <View style={styles.yearList}>
              {safePeriods.map((period) => {
                const isActive = period.year === (selectedYear || activeYear?.year);

                return (
                  <TouchableOpacity
                    key={period.year}
                    style={[styles.yearItem, isActive ? styles.yearItemActive : null]}
                    onPress={() => onYearChange?.(period.year)}
                  >
                    <Text style={[styles.yearLabel, isActive ? styles.yearLabelActive : null]}>
                      {period.year}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.subSectionLabel}>Bulan</Text>
            <View style={styles.monthList}>
              {monthList.length ? (
                monthList.map((month) => {
                  const isActive = month.id === (selectedMonth || activeMonth?.id);

                  return (
                    <TouchableOpacity
                      key={month.id}
                      style={[styles.monthItem, isActive ? styles.monthItemActive : null]}
                      onPress={() => onMonthChange?.(month.id)}
                    >
                      <Text
                        style={[styles.monthLabel, isActive ? styles.monthLabelActive : null]}
                      >
                        {month.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyPeriodText}>Tidak ada bulan tersedia.</Text>
              )}
            </View>

            <Text style={styles.subSectionLabel}>Minggu</Text>
            {weekList.length ? (
              <View style={styles.weekList}>
                {weekList.map((week) => {
                  const isActive = week.id === selectedWeekId;

                  return (
                    <TouchableOpacity
                      key={week.id}
                      style={[styles.weekItem, isActive ? styles.weekItemActive : null]}
                      onPress={() => onWeekChange?.(week.id)}
                    >
                      <View style={styles.weekTextWrapper}>
                        <Text style={[styles.weekName, isActive ? styles.weekNameActive : null]}>
                          {week.name}
                        </Text>
                        {week.rangeLabel ? (
                          <Text
                            style={[styles.weekRange, isActive ? styles.weekRangeActive : null]}
                          >
                            {week.rangeLabel}
                          </Text>
                        ) : null}
                      </View>
                      {isActive ? (
                        <Ionicons name="checkmark-circle" size={22} color="#0984e3" />
                      ) : (
                        <Ionicons name="ellipse-outline" size={22} color="#dfe6e9" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyPeriodText}>Tidak ada minggu pada bulan ini.</Text>
            )}
          </View>
        ) : (
          <Text style={styles.emptyPeriodText}>Belum ada periode laporan tersedia.</Text>
        )}

        <Text style={styles.sectionLabel}>Kelompok Persentase Kehadiran</Text>
        <View style={styles.bandList}>
          {safeBands.map((band) => {
            const isSelected = selectedSet.has(band.id);

            return (
              <TouchableOpacity
                key={band.id}
                style={[styles.bandItem, isSelected ? styles.bandItemActive : null]}
                onPress={() => toggleBand(band.id)}
              >
                <View
                  style={[styles.bandColorDot, { backgroundColor: band.color || '#0984e3' }]}
                />
                <View style={styles.bandTextWrapper}>
                  <Text style={styles.bandLabel}>{band.label}</Text>
                  {band.description ? (
                    <Text style={styles.bandDescription}>{band.description}</Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={22} color="#0984e3" />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color="#dfe6e9" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.resetButton} onPress={onReset}>
            <Ionicons name="refresh" size={18} color="#0984e3" />
            <Text style={styles.resetLabel}>Atur Ulang</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={onClose}>
            <Text style={styles.applyLabel}>Selesai</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

WeeklyAttendanceFilterSheet.defaultProps = {
  visible: false,
  onClose: undefined,
  bands: [],
  selectedBands: [],
  onBandsChange: undefined,
  searchQuery: '',
  onSearchChange: undefined,
  onReset: undefined,
  periodOptions: [],
  selectedYear: null,
  selectedMonth: null,
  selectedWeekId: null,
  onYearChange: undefined,
  onMonthChange: undefined,
  onWeekChange: undefined,
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 56,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#dfe6e9',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d3436',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(223, 230, 233, 0.5)',
  },
  searchContainer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(223, 230, 233, 0.4)',
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2d3436',
  },
  sectionLabel: {
    marginTop: 24,
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  subSectionLabel: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
  },
  periodWrapper: {
    marginTop: 12,
    backgroundColor: '#f7f9fb',
    borderRadius: 16,
    padding: 16,
  },
  yearList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  yearItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  yearItemActive: {
    borderColor: '#0984e3',
    backgroundColor: 'rgba(9, 132, 227, 0.12)',
  },
  yearLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3436',
  },
  yearLabelActive: {
    color: '#0984e3',
  },
  monthList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  monthItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  monthItemActive: {
    borderColor: '#0984e3',
    backgroundColor: 'rgba(9, 132, 227, 0.12)',
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2d3436',
  },
  monthLabelActive: {
    color: '#0984e3',
    fontWeight: '700',
  },
  weekList: {
    marginTop: 8,
  },
  weekItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dfe6e9',
  },
  weekItemActive: {
    borderColor: '#0984e3',
    backgroundColor: 'rgba(9, 132, 227, 0.12)',
  },
  weekTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  weekName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  weekNameActive: {
    color: '#0984e3',
  },
  weekRange: {
    marginTop: 4,
    fontSize: 12,
    color: '#636e72',
  },
  weekRangeActive: {
    color: '#0984e3',
  },
  emptyPeriodText: {
    marginTop: 8,
    fontSize: 12,
    color: '#636e72',
  },
  bandList: {
    marginTop: 12,
  },
  bandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f7f9fb',
    marginBottom: 12,
  },
  bandItemActive: {
    borderWidth: 1,
    borderColor: '#0984e3',
    backgroundColor: 'rgba(9, 132, 227, 0.12)',
  },
  bandColorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  bandTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  bandLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  bandDescription: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  footerRow: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0984e3',
  },
  resetLabel: {
    fontWeight: '600',
    color: '#0984e3',
    marginLeft: 8,
  },
  applyButton: {
    backgroundColor: '#0984e3',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  applyLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default WeeklyAttendanceFilterSheet;
