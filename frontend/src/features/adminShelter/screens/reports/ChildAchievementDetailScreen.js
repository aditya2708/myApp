import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const formatNilai = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
};

const ChildAchievementDetailScreen = ({ route }) => {
  const navigation = useNavigation();
  const { item } = route.params;

  if (!item) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Data tidak ditemukan</Text>
      </View>
    );
  }

  const resolveKelompokName = () => {
    const rawName = item?.kelompok?.nama
      ?? item?.anak?.nama_kelompok
      ?? null;

    if (typeof rawName !== 'string') {
      return null;
    }

    const trimmed = rawName.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const groupName = resolveKelompokName();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.childName}>{item?.anak?.nama ?? 'Tanpa Nama'}</Text>
              {groupName && (
                <View style={styles.groupBadge}>
                  <Ionicons name="people-outline" size={14} color="#1e88e5" />
                  <Text style={styles.groupBadgeText}>{groupName}</Text>
                </View>
              )}
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Nilai</Text>
              <Text style={styles.scoreValue}>{formatNilai(item?.nilai)}</Text>
            </View>
          </View>
          
          <View style={styles.metaRow}>
            <Text style={styles.assessmentType}>{item?.jenis_penilaian || '-'}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.assessmentDate}>{item?.tanggal_penilaian || '-'}</Text>
          </View>
        </View>

        {/* Activity Type Badge */}
        {item?.jenis_kegiatan && (
          <View style={styles.badgeContainer}>
            <View style={styles.activityBadge}>
              <Ionicons name="calendar" size={16} color="#1e88e5" />
              <Text style={styles.badgeText}>{item.jenis_kegiatan}</Text>
            </View>
          </View>
        )}

        {/* Detail Information */}
        <View style={styles.detailsSection}>
          {/* Activity Name */}
          {item?.nama_aktivitas && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nama Aktivitas</Text>
              <Text style={styles.detailValue}>{item.nama_aktivitas}</Text>
            </View>
          )}

          {/* Assessment Type */}
          {item?.jenis_penilaian && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Jenis Penilaian</Text>
              <Text style={styles.detailValue}>{item.jenis_penilaian}</Text>
            </View>
          )}

          {/* Assessment Date */}
          {item?.tanggal_penilaian && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Tanggal Penilaian</Text>
              <Text style={styles.detailValue}>{item.tanggal_penilaian}</Text>
            </View>
          )}

          {/* Score */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nilai</Text>
            <Text style={[styles.detailValue, styles.scoreText]}>{formatNilai(item?.nilai)}</Text>
          </View>

          {/* Task Description */}
          {item?.deskripsi_tugas && (
            <View style={styles.blockSection}>
              <Text style={styles.blockLabel}>Deskripsi Tugas</Text>
              <Text style={styles.blockValue}>{item.deskripsi_tugas}</Text>
            </View>
          )}

          {/* Notes */}
          {item?.catatan && (
            <View style={styles.blockSection}>
              <Text style={styles.blockLabel}>Catatan</Text>
              <Text style={styles.blockValue}>{item.catatan}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7fb'
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7fb'
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center'
  },
  scrollView: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e88e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1f2933',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 1000
  },
  headerSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1f2933',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  headerLeft: {
    flex: 1,
    marginRight: 16
  },
  childName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 8
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    alignSelf: 'flex-start'
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e88e5'
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 80
  },
  scoreLabel: {
    fontSize: 12,
    color: '#7b8794',
    fontWeight: '600',
    marginBottom: 4
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e88e5'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  assessmentType: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600'
  },
  metaDivider: {
    fontSize: 12,
    color: '#9aa5b1'
  },
  assessmentDate: {
    fontSize: 14,
    color: '#52606d'
  },
  badgeContainer: {
    marginBottom: 16
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 136, 229, 0.12)',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    alignSelf: 'flex-start'
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e88e5'
  },
  detailsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1f2933',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  detailLabel: {
    fontSize: 14,
    color: '#52606d',
    fontWeight: '600',
    flex: 1,
    marginRight: 16
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    flex: 2,
    textAlign: 'right'
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e88e5'
  },
  blockSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  blockLabel: {
    fontSize: 14,
    color: '#52606d',
    fontWeight: '600',
    marginBottom: 8
  },
  blockValue: {
    fontSize: 14,
    color: '#2c3e50',
    lineHeight: 20
  }
});

export default ChildAchievementDetailScreen;
