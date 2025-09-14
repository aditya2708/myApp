import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';

const HistoriSummaryCard = ({ summary }) => {
  if (!summary) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ringkasan</Text>
      
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.value}>{summary.total_histori || 0}</Text>
          <Text style={styles.label}>Total Histori</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.value}>{summary.affected_children_count || 0}</Text>
          <Text style={styles.label}>Anak Terdampak</Text>
        </View>
        <View style={styles.item}>
          <Text style={[styles.value, { color: '#e74c3c' }]}>
            {summary.opname_count || 0}
          </Text>
          <Text style={styles.label}>Opname</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={[styles.value, { color: '#f39c12' }]}>
            {summary.unread_count || 0}
          </Text>
          <Text style={styles.label}>Belum Dibaca</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.valueText}>
            {summary.most_common_jenis || '-'}
          </Text>
          <Text style={styles.label}>Terbanyak</Text>
        </View>
        <View style={styles.item}>
          <Text style={[styles.value, { color: '#27ae60' }]}>
            {summary.non_opname_count || 0}
          </Text>
          <Text style={styles.label}>Non-Opname</Text>
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
    justifyContent: 'space-around',
    marginBottom: 8
  },
  item: {
    alignItems: 'center',
    flex: 1
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9b59b6',
    textAlign: 'center'
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  }
});

export default HistoriSummaryCard;