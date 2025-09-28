import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import LoadingSpinner from '../../../../common/components/LoadingSpinner';
import ErrorMessage from '../../../../common/components/ErrorMessage';
import ReportSummaryCard from '../../components/reports/ReportSummaryCard';
import {
  clearDetail,
  selectReportAnakDetail,
} from '../../redux/reportAnakSlice';
import { fetchReportAnakChildDetail } from '../../redux/reportAnakThunks';

const FALLBACK_PHOTO = require('../../../../assets/images/logo.png');

const AdminCabangChildDetailScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName } = route.params || {};

  const detail = useSelector(selectReportAnakDetail);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (childName) {
      navigation.setOptions({ headerTitle: childName });
    }
  }, [childName, navigation]);

  const loadDetail = useCallback(async () => {
    if (!childId) return;
    await dispatch(fetchReportAnakChildDetail({ childId }));
  }, [childId, dispatch]);

  useEffect(() => {
    loadDetail();
    return () => {
      dispatch(clearDetail());
    };
  }, [dispatch, loadDetail]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDetail();
    setRefreshing(false);
  };

  const profile = useMemo(() => {
    const child = detail.child || {};
    return {
      name: child.full_name || child.name || child.nama || childName || 'Anak Binaan',
      nickname: child.nick_name || child.nickname || null,
      shelter: child.shelter_name || child.shelter || child.nama_shelter || null,
      wilayah: child.wilayah_name || child.wilbin_name || child.nama_wilayah || null,
      joinedAt: child.joined_at || child.created_at || null,
      grade: child.class_name || child.kelas || null,
      photo: child.photo_url || child.foto_url || child.avatar_url || null,
    };
  }, [detail.child, childName]);

  const summaryCards = useMemo(() => {
    const summary = detail.summary || {};
    const cards = [];

    if (summary.total_activities ?? summary.activities_count) {
      cards.push({
        key: 'activities',
        label: 'Total Aktivitas',
        value: summary.total_activities ?? summary.activities_count,
        icon: 'calendar-number',
        color: '#2980b9',
        description: summary.activity_description,
      });
    }

    if (summary.attendance_percentage ?? summary.kehadiran) {
      cards.push({
        key: 'attendance',
        label: 'Kehadiran',
        value: `${summary.attendance_percentage ?? summary.kehadiran}%`,
        icon: 'stats-chart',
        color: '#27ae60',
        description: summary.attendance_description,
      });
    }

    if (summary.average_score ?? summary.nilai_rata_rata) {
      cards.push({
        key: 'score',
        label: 'Nilai Rata-rata',
        value: summary.average_score ?? summary.nilai_rata_rata,
        icon: 'school',
        color: '#9b59b6',
        description: summary.score_description,
      });
    }

    if (summary.total_programs ?? summary.programs_count) {
      cards.push({
        key: 'programs',
        label: 'Program Diikuti',
        value: summary.total_programs ?? summary.programs_count,
        icon: 'layers',
        color: '#e67e22',
        description: summary.program_description,
      });
    }

    return cards;
  }, [detail.summary]);

  const activities = detail.activities || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={(
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      )}
    >
      {detail.loading && !refreshing ? (
        <View style={styles.loadingWrapper}>
          <LoadingSpinner />
        </View>
      ) : null}

      {detail.error && (
        <View style={styles.errorWrapper}>
          <ErrorMessage
            message={detail.error}
            onRetry={loadDetail}
          />
        </View>
      )}

      <View style={styles.profileCard}>
        <Image
          source={profile.photo ? { uri: profile.photo } : FALLBACK_PHOTO}
          style={styles.profilePhoto}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.name}</Text>
          {profile.nickname && (
            <Text style={styles.profileNickname}>({profile.nickname})</Text>
          )}
          <View style={styles.profileMeta}>
            {profile.shelter && (
              <View style={styles.metaRow}>
                <Ionicons name="home" size={16} color="#7f8c8d" style={styles.metaIcon} />
                <Text style={styles.metaText}>{profile.shelter}</Text>
              </View>
            )}
            {profile.wilayah && (
              <View style={styles.metaRow}>
                <Ionicons name="map" size={16} color="#7f8c8d" style={styles.metaIcon} />
                <Text style={styles.metaText}>{profile.wilayah}</Text>
              </View>
            )}
            {profile.grade && (
              <View style={styles.metaRow}>
                <Ionicons name="school" size={16} color="#7f8c8d" style={styles.metaIcon} />
                <Text style={styles.metaText}>{profile.grade}</Text>
              </View>
            )}
            {profile.joinedAt && (
              <View style={styles.metaRow}>
                <Ionicons name="calendar" size={16} color="#7f8c8d" style={styles.metaIcon} />
                <Text style={styles.metaText}>Bergabung {profile.joinedAt}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {summaryCards.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Ringkasan Aktivitas</Text>
          {summaryCards.map((card) => (
            <View key={card.key} style={styles.summaryCardWrapper}>
              <ReportSummaryCard
                label={card.label}
                value={card.value}
                icon={card.icon}
                color={card.color}
                description={card.description}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.activitiesSection}>
        <Text style={styles.sectionTitle}>Aktivitas Terakhir</Text>
        {activities.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada catatan aktivitas untuk ditampilkan.</Text>
        ) : (
          activities.map((activity, index) => (
            <View key={activity.id || activity.activity_id || index} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle} numberOfLines={2}>
                  {activity.title || activity.nama_kegiatan || activity.name || 'Aktivitas'}
                </Text>
                {activity.status && (
                  <View style={styles.activityStatus}>
                    <Text style={styles.activityStatusText}>{activity.status}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.activityMeta}>
                {activity.date || activity.tanggal || activity.periode || '-'}
              </Text>
              {activity.description || activity.deskripsi ? (
                <Text style={styles.activityDescription}>
                  {activity.description || activity.deskripsi}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  loadingWrapper: {
    marginVertical: 40,
    alignItems: 'center',
  },
  errorWrapper: {
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  profilePhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 16,
    backgroundColor: '#ecf0f1',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  profileNickname: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  profileMeta: {
    marginTop: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metaIcon: {
    marginRight: 8,
  },
  metaText: {
    fontSize: 13,
    color: '#7f8c8d',
    flexShrink: 1,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  summaryCardWrapper: {
    marginBottom: 12,
  },
  activitiesSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  activityItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  activityTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2c3e50',
    marginRight: 10,
  },
  activityStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ecf9f1',
  },
  activityStatusText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  activityMeta: {
    fontSize: 12,
    color: '#95a5a6',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 13,
    color: '#7f8c8d',
  },
});

export default AdminCabangChildDetailScreen;
