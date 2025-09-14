import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RaportSummaryCards = ({ summary }) => {
  if (!summary) return null;

  const getGradeColor = (grade) => {
    if (grade >= 85) return '#4caf50';
    if (grade >= 75) return '#ff9800';
    if (grade >= 65) return '#ff5722';
    return '#f44336';
  };

  const getPassingColor = (percentage) => {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#ff9800';
    if (percentage >= 40) return '#ff5722';
    return '#f44336';
  };

  const summaryData = [
    {
      title: 'Total Anak',
      value: summary.total_children || 0,
      icon: 'people',
      color: '#2196f3',
      subtitle: 'dengan raport'
    },
    {
      title: 'Total Raport',
      value: summary.total_raport || 0,
      icon: 'document-text',
      color: '#9c27b0',
      subtitle: 'keseluruhan'
    },
    {
      title: 'Raport Terbit',
      value: summary.published_raport || 0,
      icon: 'checkmark-circle',
      color: '#4caf50',
      subtitle: `${summary.draft_raport || 0} draft`
    },
    {
      title: 'Rata-rata Nilai',
      value: summary.average_grade ? summary.average_grade.toFixed(1) : '0.0',
      icon: 'trophy',
      color: getGradeColor(summary.average_grade || 0),
      subtitle: 'keseluruhan'
    },
    {
      title: 'Ketuntasan',
      value: `${summary.passing_percentage || 0}%`,
      icon: 'analytics',
      color: getPassingColor(summary.passing_percentage || 0),
      subtitle: 'mata pelajaran'
    }
  ];
  const renderCard = (item, index) => (
    <View key={index} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={[styles.cardValue, { color: item.color }]}>
          {item.value}
        </Text>
        <Text style={styles.cardSubtitle}>
          {item.subtitle}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Ringkasan Laporan</Text>
      
      <View style={styles.cardsContainer}>
        <View style={styles.row}>
          {summaryData.slice(0, 2).map((item, index) => renderCard(item, index))}
        </View>
        <View style={styles.row}>
          {summaryData.slice(2, 4).map((item, index) => renderCard(item, index + 2))}
        </View>
        <View style={styles.singleCardRow}>
          {summaryData.slice(4, 5).map((item, index) => renderCard(item, index + 4))}
        </View>
      </View>

      {/* Additional Info */}
      {summary && (
        <View style={styles.additionalInfo}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status Raport</Text>
              <View style={styles.statusBreakdown}>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: '#4caf50' }]} />
                  <Text style={styles.statusText}>
                    {summary.published_raport || 0} Terbit
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <View style={[styles.statusDot, { backgroundColor: '#ff9800' }]} />
                  <Text style={styles.statusText}>
                    {summary.draft_raport || 0} Draft
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12
  },
  singleCardRow: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  card: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    flex: 1
  },
  cardContent: {
    alignItems: 'flex-start'
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic'
  },
  additionalInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fafafa'
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  infoItem: {
    flex: 1
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8
  },
  statusBreakdown: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  }
});

export default RaportSummaryCards;