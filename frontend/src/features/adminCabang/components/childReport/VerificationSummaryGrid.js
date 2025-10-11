import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ReportSection from './ReportSection';

const VerificationSummaryGrid = ({ items = [] }) => {
  if (!items.length) {
    return null;
  }

  return (
    <ReportSection title="Ringkasan Verifikasi">
      <View style={styles.grid}>
        {items.map((item) => (
          <View key={item.id} style={styles.card} testID={`verification-${item.id}`}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={[styles.value, item.accent ? { color: item.accent } : null]}>
              {item.value ?? 0}
            </Text>
            {item.unit ? <Text style={styles.subtext}>{item.unit}</Text> : null}
          </View>
        ))}
      </View>
    </ReportSection>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  card: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: '#636e72',
    marginBottom: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d3436',
  },
  subtext: {
    marginTop: 4,
    fontSize: 11,
    color: '#95a5a6',
  },
});

export default VerificationSummaryGrid;
