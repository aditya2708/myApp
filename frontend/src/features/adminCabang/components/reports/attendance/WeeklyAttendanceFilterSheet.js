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
}) => {
  const safeBands = Array.isArray(bands) ? bands : [];
  const selectedSet = new Set(selectedBands || []);

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
