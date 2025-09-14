import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const KurikulumSelectionCard = ({ kurikulum, onSelect, isSelected }) => {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={() => onSelect(kurikulum)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {kurikulum.nama_kurikulum}
          </Text>
          <Text style={styles.tahun}>{kurikulum.tahun_berlaku}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
        )}
      </View>

      {kurikulum.deskripsi && (
        <Text style={styles.description} numberOfLines={3}>
          {kurikulum.deskripsi}
        </Text>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="book-outline" size={16} color="#7f8c8d" />
          <Text style={styles.statText}>
            {kurikulum.kurikulum_materi_count || 0} Mata Pelajaran
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="document-text-outline" size={16} color="#7f8c8d" />
          <Text style={styles.statText}>
            {kurikulum.mata_pelajaran_count || 0} Materi
          </Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, styles.aktivBadge]}>
          <Text style={styles.statusText}>Aktif</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedCard: {
    borderColor: '#27ae60',
    borderWidth: 2,
    backgroundColor: '#f8fff8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  tahun: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aktivBadge: {
    backgroundColor: '#e8f5e8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#27ae60',
  },
});

export default KurikulumSelectionCard;