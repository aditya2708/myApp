import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { formatPercentage } from '../utils/reportUtils';

const ChildSummaryCard = ({ summary }) => {
  if (!summary) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ringkasan</Text>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.value}>{summary.total_children}</Text>
          <Text style={styles.label}>Total Anak</Text>
        </View>
        <View style={styles.item}>
          <Text style={[styles.value, { color: '#9b59b6' }]}>
            {formatPercentage(summary.average_attendance)}%
          </Text>
          <Text style={styles.label}>Rata-rata</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.value}>{summary.total_activities}</Text>
          <Text style={styles.label}>Aktivitas</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  item: {
    alignItems: 'center'
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  }
});

export default ChildSummaryCard;