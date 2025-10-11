import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ReportSection from './ReportSection';

const ContextList = ({ entries = [] }) => {
  if (!entries.length) {
    return null;
  }

  return (
    <ReportSection title="Konteks Laporan">
      <View style={styles.list}>
        {entries.map((entry, index) => (
          <View
            key={entry.id}
            style={[styles.item, index === entries.length - 1 ? styles.itemLast : null]}
          >
            <Text style={styles.label}>{entry.label}</Text>
            <Text style={styles.value}>{entry.value}</Text>
          </View>
        ))}
      </View>
    </ReportSection>
  );
};

const styles = StyleSheet.create({
  list: {
    borderWidth: 1,
    borderColor: '#ecf0f1',
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  itemLast: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#95a5a6',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    color: '#2d3436',
  },
});

export default ContextList;
