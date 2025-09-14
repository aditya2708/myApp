import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SemesterStatistics = ({ 
  statistics, 
  layout = 'grid', // 'grid', 'list', 'cards'
  showTitle = true,
  title = 'Statistik Semester'
}) => {
  if (!statistics) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="bar-chart-outline" size={48} color="#bdc3c7" />
        <Text style={styles.emptyText}>Data statistik tidak tersedia</Text>
      </View>
    );
  }

  const statisticsData = [
    {
      key: 'total_anak_with_raport',
      label: 'Total Rapor',
      value: statistics.total_anak_with_raport || 0,
      icon: 'document-text-outline',
      color: '#3498db',
      description: 'Jumlah anak yang memiliki raport'
    },
    {
      key: 'published_raport',
      label: 'Rapor Terbitkan',
      value: statistics.published_raport || 0,
      icon: 'checkmark-circle-outline',
      color: '#2ecc71',
      description: 'Rapor yang sudah dipublikasi'
    },
    {
      key: 'draft_raport',
      label: 'Draft Rapor',
      value: statistics.draft_raport || 0,
      icon: 'document-outline',
      color: '#f39c12',
      description: 'Rapor yang masih draft'
    },
    {
      key: 'total_anak_with_nilai_sikap',
      label: 'Nilai Sikap',
      value: statistics.total_anak_with_nilai_sikap || 0,
      icon: 'heart-outline',
      color: '#e74c3c',
      description: 'Anak dengan nilai sikap'
    },
    {
      key: 'total_penilaian',
      label: 'Total Penilaian',
      value: statistics.total_penilaian || 0,
      icon: 'star-outline',
      color: '#9b59b6',
      description: 'Jumlah penilaian yang diinput'
    },
    {
      key: 'average_attendance',
      label: 'Rata-rata Kehadiran',
      value: statistics.average_attendance ? `${statistics.average_attendance.toFixed(1)}%` : '0%',
      icon: 'calendar-outline',
      color: '#1abc9c',
      description: 'Persentase kehadiran rata-rata'
    }
  ];

  const renderGridLayout = () => (
    <View style={styles.gridContainer}>
      {statisticsData.map((stat, index) => (
        <View key={stat.key} style={styles.gridItem}>
          <View style={[styles.iconContainer, { backgroundColor: stat.color }]}>
            <Ionicons name={stat.icon} size={24} color="#ffffff" />
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statLabel}>{stat.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderListLayout = () => (
    <View style={styles.listContainer}>
      {statisticsData.map((stat, index) => (
        <View key={stat.key} style={styles.listItem}>
          <View style={styles.listItemLeft}>
            <View style={[styles.listIcon, { backgroundColor: stat.color }]}>
              <Ionicons name={stat.icon} size={20} color="#ffffff" />
            </View>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemLabel}>{stat.label}</Text>
              <Text style={styles.listItemDescription}>{stat.description}</Text>
            </View>
          </View>
          <Text style={styles.listItemValue}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );

  const renderCardsLayout = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.cardsContainer}
    >
      {statisticsData.map((stat, index) => (
        <View key={stat.key} style={[styles.card, { borderLeftColor: stat.color }]}>
          <View style={styles.cardHeader}>
            <Ionicons name={stat.icon} size={32} color={stat.color} />
            <Text style={[styles.cardValue, { color: stat.color }]}>{stat.value}</Text>
          </View>
          <Text style={styles.cardLabel}>{stat.label}</Text>
          <Text style={styles.cardDescription}>{stat.description}</Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderLayout = () => {
    switch (layout) {
      case 'list':
        return renderListLayout();
      case 'cards':
        return renderCardsLayout();
      default:
        return renderGridLayout();
    }
  };

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text style={styles.title}>{title}</Text>
      )}
      {renderLayout()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 12,
  },
  // Grid Layout
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 16,
  },
  // List Layout
  listContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  listItemDescription: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  listItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  // Cards Layout
  cardsContainer: {
    paddingRight: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginRight: 12,
    width: 180,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    lineHeight: 16,
  },
});

export default SemesterStatistics;