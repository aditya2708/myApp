import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ActivitySummaryCard = ({ summary }) => {
  if (!summary) return null;

  const summaryItems = [
    {
      label: 'Total Aktivitas',
      value: summary.total_activities,
      icon: 'calendar-outline',
      color: '#3498db'
    },
    {
      label: 'Rata-rata Kehadiran',
      value: `${summary.average_attendance}%`,
      icon: 'people-outline',
      color: '#2ecc71'
    },
    {
      label: 'Aktivitas Bulan Ini',
      value: summary.activities_this_month,
      icon: 'today-outline',
      color: '#e74c3c'
    },
    {
      label: 'Total Peserta',
      value: summary.total_participants,
      icon: 'person-outline',
      color: '#9b59b6'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ringkasan Aktivitas</Text>
      
      <View style={styles.summaryGrid}>
        {summaryItems.map((item, index) => (
          <View key={index} style={styles.summaryItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <Text style={styles.summaryValue}>{item.value}</Text>
            <Text style={styles.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {summary.most_active_type && (
        <View style={styles.extraInfo}>
          <Text style={styles.extraInfoText}>
            Jenis kegiatan terbanyak: <Text style={styles.highlight}>{summary.most_active_type}</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  extraInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  extraInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  highlight: {
    fontWeight: '600',
    color: '#9b59b6'
  }
});

export default ActivitySummaryCard;