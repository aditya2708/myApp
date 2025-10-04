import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const MODE_DESCRIPTIONS = {
  level: 'Perbandingan jumlah anak berdasarkan level kehadiran.',
  wilayah: 'Sebaran anak binaan pada masing-masing wilayah binaan.',
  shelter: 'Sebaran anak binaan untuk tiap shelter yang dikelola cabang.',
};

const LEVEL_COLOR_MAP = {
  high: '#27ae60',
  tinggi: '#27ae60',
  medium: '#f39c12',
  sedang: '#f39c12',
  low: '#e74c3c',
  rendah: '#e74c3c',
};

const DEFAULT_PALETTE = ['#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#2ecc71', '#34495e', '#f39c12', '#16a085'];
const MAX_ITEMS = 16;
const MAX_BAR_HEIGHT = 120;

const formatPercentage = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  const normalized = Math.max(0, Math.min(100, numeric));
  const fractionDigits = normalized >= 10 ? 0 : 1;
  return `${normalized.toFixed(fractionDigits)}%`;
};

const normalizePaletteColor = (modeKey, item, index) => {
  if (modeKey === 'level') {
    const normalizedKey = (item?.normalizedKey ?? item?.key ?? '')
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');

    if (LEVEL_COLOR_MAP[normalizedKey]) {
      return LEVEL_COLOR_MAP[normalizedKey];
    }
  }

  if (item?.color) {
    return item.color;
  }

  return DEFAULT_PALETTE[index % DEFAULT_PALETTE.length];
};

const ChildAttendanceDistributionCard = ({ levelData = [], wilayahData = [], shelterData = [] }) => {
  const modes = useMemo(() => {
    const baseModes = [
      { key: 'level', label: 'Level', dataset: Array.isArray(levelData) ? levelData.slice(0, MAX_ITEMS) : [] },
      { key: 'wilayah', label: 'Wilayah', dataset: Array.isArray(wilayahData) ? wilayahData.slice(0, MAX_ITEMS) : [] },
      { key: 'shelter', label: 'Shelter', dataset: Array.isArray(shelterData) ? shelterData.slice(0, MAX_ITEMS) : [] },
    ];

    const available = baseModes.filter((mode) => mode.dataset.length > 0);
    if (available.length === 0) {
      return [baseModes[0]];
    }

    return available;
  }, [levelData, wilayahData, shelterData]);

  const [activeModeKey, setActiveModeKey] = useState(modes[0]?.key ?? 'level');

  useEffect(() => {
    if (!modes.some((mode) => mode.key === activeModeKey)) {
      setActiveModeKey(modes[0]?.key ?? 'level');
    }
  }, [modes, activeModeKey]);

  const activeMode = useMemo(() => modes.find((mode) => mode.key === activeModeKey) ?? modes[0], [activeModeKey, modes]);
  const dataset = activeMode?.dataset ?? [];

  const totalValue = useMemo(
    () => dataset.reduce((sum, item) => sum + (Number.isFinite(item?.value) ? item.value : 0), 0),
    [dataset],
  );

  const normalizedDataset = useMemo(() => {
    if (dataset.length === 0) {
      return [];
    }

    return dataset.map((item, index) => {
      const percentage =
        item?.percentage !== undefined && item?.percentage !== null && Number.isFinite(Number(item.percentage))
          ? Number(item.percentage)
          : totalValue > 0
          ? (item.value / totalValue) * 100
          : null;

      return {
        ...item,
        percentage,
        normalizedKey: item?.normalizedKey ?? item?.key ?? item?.label ?? `item-${index}`,
        color: normalizePaletteColor(activeMode?.key, item, index),
      };
    });
  }, [dataset, totalValue, activeMode?.key]);

  const maxValue = normalizedDataset.reduce((max, item) => Math.max(max, Number(item.value) || 0), 0);
  const isEmpty = normalizedDataset.length === 0 || maxValue <= 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.title}>Sebaran Kehadiran</Text>
          <Text style={styles.subtitle}>{MODE_DESCRIPTIONS[activeMode?.key] ?? MODE_DESCRIPTIONS.level}</Text>
        </View>

        {modes.length > 1 && (
          <View style={styles.modeGroup}>
            {modes.map((mode) => (
              <TouchableOpacity
                key={mode.key}
                style={[styles.modeButton, mode.key === activeMode?.key && styles.modeButtonActive]}
                onPress={() => setActiveModeKey(mode.key)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={`Tampilkan distribusi berdasarkan ${mode.label}`}
              >
                <Text style={[styles.modeButtonText, mode.key === activeMode?.key && styles.modeButtonTextActive]}>
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Belum ada data distribusi yang dapat ditampilkan.</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {normalizedDataset.map((item, index) => {
            const numericValue = Number(item.value);
            const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
            const displayValue = Number.isFinite(numericValue)
              ? numericValue.toLocaleString('id-ID')
              : '-';
            const barHeight = maxValue > 0 ? Math.max(8, (safeValue / maxValue) * MAX_BAR_HEIGHT) : 0;

            return (
              <View key={item.key ?? item.normalizedKey ?? index} style={styles.itemCard}>
                <View style={styles.barArea}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: barHeight, backgroundColor: item.color }]} />
                  </View>
                </View>
                <Text style={styles.itemValue}>{displayValue}</Text>
                {formatPercentage(item.percentage) ? (
                  <Text style={styles.itemPercentage}>{formatPercentage(item.percentage)}</Text>
                ) : null}
                <Text style={styles.itemLabel} numberOfLines={2}>
                  {item.label || item.key}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

export default ChildAttendanceDistributionCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTextGroup: {
    flexShrink: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  modeGroup: {
    flexDirection: 'row',
    backgroundColor: '#ecf0f1',
    borderRadius: 999,
    padding: 4,
  },
  modeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#2c3e50',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 13,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  scrollContent: {
    paddingVertical: 4,
  },
  itemCard: {
    width: 96,
    marginRight: 12,
    alignItems: 'center',
  },
  barArea: {
    height: MAX_BAR_HEIGHT + 12,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  barTrack: {
    height: MAX_BAR_HEIGHT,
    width: 36,
    borderRadius: 18,
    backgroundColor: '#ecf0f1',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 18,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  itemPercentage: {
    fontSize: 12,
    color: '#16a085',
    marginTop: 2,
  },
  itemLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 6,
  },
});
