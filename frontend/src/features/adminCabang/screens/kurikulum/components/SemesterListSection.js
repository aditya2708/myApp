import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return '#28a745';
    case 'draft':
      return '#ffc107';
    case 'completed':
      return '#6c757d';
    case 'archived':
      return '#dc3545';
    default:
      return '#6c757d';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'active':
      return 'Aktif';
    case 'draft':
      return 'Draft';
    case 'completed':
      return 'Selesai';
    case 'archived':
      return 'Arsip';
    default:
      return 'Unknown';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const SemesterListSection = ({
  tabs,
  selectedTab,
  onTabChange,
  data,
  isRefreshing,
  onRefresh,
  onEdit,
  onDelete,
  onSetActive,
}) => {
  return (
    <>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => onTabChange(tab.key)}
          >
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label} ({tab.count})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#28a745']}
            tintColor="#28a745"
          />
        }
      >
        {data.map((semester) => (
          <View key={semester.id_semester} style={styles.semesterCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitle}>
                <Text style={styles.semesterName}>{semester.nama_semester}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(semester.status) }
                  ]}
                >
                  <Text style={styles.statusText}>
                    {getStatusText(semester.status)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color="#6c757d" />
                <Text style={styles.infoText}>
                  {formatDate(semester.tanggal_mulai)} - {formatDate(semester.tanggal_selesai)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="school-outline" size={14} color="#6c757d" />
                <Text style={styles.infoText}>
                  Tahun Ajaran {semester.tahun_ajaran}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={14} color="#6c757d" />
                <Text style={styles.infoText}>
                  Periode {semester.periode === 'ganjil' ? 'Ganjil' : 'Genap'}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              {semester.status === 'draft' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.activateButton]}
                  onPress={() => onSetActive(semester)}
                >
                  <Ionicons name="play-circle" size={16} color="#28a745" />
                  <Text style={[styles.actionText, { color: '#28a745' }]}>Aktifkan</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(semester)}
              >
                <Ionicons name="pencil" size={16} color="#007bff" />
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete(semester)}
              >
                <Ionicons name="trash" size={16} color="#dc3545" />
                <Text style={[styles.actionText, styles.deleteText]}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {data.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyTitle}>Belum Ada Semester</Text>
            <Text style={styles.emptySubtitle}>
              Tap tombol + untuk menambah semester baru
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#17a2b8" />
          <Text style={styles.infoCardText}>
            Semester management terintegrasi dengan API.
            Gunakan tombol + untuk menambah semester baru.
          </Text>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#6c757d',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  semesterCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  semesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  activateButton: {
    backgroundColor: '#e8f5e8',
  },
  deleteButton: {
    backgroundColor: '#f8f9fa',
  },
  actionText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#007bff',
  },
  deleteText: {
    color: '#dc3545',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
    marginTop: 5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9f7fb',
    borderRadius: 8,
    padding: 15,
    marginTop: 10,
  },
  infoCardText: {
    fontSize: 12,
    color: '#0c5460',
    marginLeft: 10,
    flex: 1,
  },
});

export default SemesterListSection;
