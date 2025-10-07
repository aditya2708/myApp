import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ShelterAttendanceTable = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Belum ada data shelter</Text>
        <Text style={styles.emptyDescription}>
          Data per shelter akan muncul di sini setelah integrasi selesai.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.headerCell, styles.flex2]}>Shelter</Text>
        <Text style={[styles.cell, styles.headerCell]}>Hadir</Text>
        <Text style={[styles.cell, styles.headerCell]}>Total</Text>
        <Text style={[styles.cell, styles.headerCell]}>%</Text>
      </View>

      {data.map((item, index) => {
        const present = item.presentCount ?? item.present ?? '-';
        const total = item.totalSessions ?? item.total ?? '-';
        const rateValue =
          typeof item.attendanceRate === 'number'
            ? `${item.attendanceRate.toFixed(0)}%`
            : item.rate ?? '-';

        return (
          <View key={item.id || index} style={styles.row}>
            <View style={[styles.cell, styles.flex2]}>
              <Text style={styles.shelterName}>{item.name || 'Nama Shelter'}</Text>
              {item.wilbin ? <Text style={styles.shelterWilbin}>{item.wilbin}</Text> : null}
            </View>
            <Text style={[styles.cell, styles.boldText]}>{present}</Text>
            <Text style={styles.cell}>{total}</Text>
            <Text style={[styles.cell, styles.rate]}>{rateValue}</Text>
          </View>
        );
      })}
    </View>
  );
};

ShelterAttendanceTable.defaultProps = {
  data: [],
};

const styles = StyleSheet.create({
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ecf0f1',
  },
  headerRow: {
    backgroundColor: '#f1f2f6',
  },
  cell: {
    flex: 1,
    fontSize: 14,
    color: '#2d3436',
  },
  boldText: {
    fontWeight: '600',
  },
  headerCell: {
    fontWeight: '600',
  },
  flex2: {
    flex: 2,
  },
  shelterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3436',
  },
  shelterWilbin: {
    fontSize: 12,
    color: '#636e72',
    marginTop: 4,
  },
  rate: {
    fontWeight: '600',
    color: '#00b894',
  },
  emptyState: {
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#636e72',
  },
});

export default ShelterAttendanceTable;
