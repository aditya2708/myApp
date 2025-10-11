import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ReportSection from './ReportSection';

const StreakHighlights = ({ items = [] }) => {
  if (!items.length) {
    return null;
  }

  return (
    <ReportSection title="Catatan Streak">
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.card} testID={`streak-${item.id}`}>
            <Text style={styles.value}>{item.value ?? 0}</Text>
            {item.unit ? <Text style={styles.unit}>{item.unit}</Text> : null}
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </ReportSection>
  );
};

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  card: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0984e3',
  },
  unit: {
    fontSize: 12,
    color: '#74b9ff',
    marginTop: 2,
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    color: '#636e72',
  },
});

export default StreakHighlights;
