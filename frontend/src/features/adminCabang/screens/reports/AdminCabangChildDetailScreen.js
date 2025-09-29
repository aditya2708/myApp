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
  calculateAttendancePercentage,
  formatPercentage,
} from '../../../adminShelter/utils/reportUtils';
import {
  clearDetail,
  selectReportAnakDetail,
} from '../../redux/reportAnakSlice';
import { fetchReportAnakChildDetail } from '../../redux/reportAnakThunks';

const FALLBACK_PHOTO = require('../../../../assets/images/logo.png');

const extractFirstAvailable = (source, keys = []) => {
  if (!source || typeof source !== 'object') {
    return null;
  }

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return null;
};

const normalizeTextValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => normalizeTextValue(item))
      .filter((item) => item !== null && item !== '');

    return joined.length > 0 ? joined.join(', ') : null;
  }

  const nestedValue = extractFirstAvailable(value, [
    'full_name',
    'name',
    'nama',
    'title',
    'label',
    'text',
    'display',
    'display_name',
    'displayName',
    'description',
    'wilayah',
    'wilayah_name',
    'wilbin',
    'wilbin_name',
    'value',
  ]);

  return nestedValue !== null ? normalizeTextValue(nestedValue) : null;
};

const pickTextValue = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeTextValue(candidate);
    if (normalized !== null && normalized !== undefined) {
      return normalized;
    }
  }

  return null;
};

const normalizeNumberValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const numericString = trimmed
      .replace(/%/g, '')
      .replace(/[^0-9.,-]/g, '')
      .replace(',', '.');
    const parsed = Number(numericString);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeNumberValue(item);
      if (normalized !== null) {
        return normalized;
      }
    }
    return null;
  }

  const nestedValue = extractFirstAvailable(value, [
    'value',
    'total',
    'count',
    'jumlah',
    'amount',
    'score',
    'percentage',
    'percent',
  ]);

  return nestedValue !== null ? normalizeNumberValue(nestedValue) : null;
};

const pickNumberValue = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeNumberValue(candidate);
    if (normalized !== null && normalized !== undefined) {
      return normalized;
    }
  }

  return null;
};

const normalizeUrlValue = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeUrlValue(item);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  const nestedValue = extractFirstAvailable(value, [
    'url',
    'uri',
    'path',
    'photo',
    'photo_url',
    'foto',
    'foto_url',
    'image',
    'image_url',
    'link',
  ]);

  return nestedValue ? normalizeUrlValue(nestedValue) : null;
};

const pickUrlValue = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeUrlValue(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

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
      name:
        pickTextValue(
          child.full_name,
          child.name,
          child.nama,
          detail.metadata?.child_name,
          childName,
        ) || 'Anak Binaan',
      nickname: pickTextValue(child.nick_name, child.nickname),
      shelter: pickTextValue(child.shelter_name, child.shelter, child.nama_shelter),
      wilayah: pickTextValue(
        child.wilayah_name,
        child.wilbin_name,
        child.nama_wilayah,
        child.wilayah,
        child.wilbin,
      ),
      joinedAt: pickTextValue(child.joined_at, child.created_at, child.registration_date),
      grade: pickTextValue(child.class_name, child.kelas, child.grade, child.grade_name),
      photo: pickUrlValue(
        child.photo_url,
        child.foto_url,
        child.avatar_url,
        child.photo,
        child.profile_photo,
      ),
    };
  }, [detail.child, childName, detail.metadata]);

  const summaryCards = useMemo(() => {
    const summary = detail.summary || {};
    const cards = [];

    const totalActivitiesNumber = pickNumberValue(
      summary.total_activities,
      summary.activities_count,
      summary.totalActivities,
      summary.activitiesCount,
      summary.total_activity,
      summary.activity_total,
    );
    const totalActivitiesValue =
      totalActivitiesNumber ??
      pickTextValue(
        summary.total_activities,
        summary.activities_count,
        summary.totalActivities,
        summary.activitiesCount,
        summary.total_activity,
        summary.activity_total,
      );

    const totalAttendedNumber = pickNumberValue(
      summary.total_attended,
      summary.attended_count,
      summary.totalAttended,
      summary.attendedCount,
      summary.attended_total,
    );
    const totalAttendedValue =
      totalAttendedNumber ??
      pickTextValue(
        summary.total_attended,
        summary.attended_count,
        summary.totalAttended,
        summary.attendedCount,
        summary.attended_total,
      );

    if (totalActivitiesValue !== null && totalActivitiesValue !== undefined) {
      cards.push({
        key: 'activities',
        label: 'Total Aktivitas',
        value: totalActivitiesNumber ?? totalActivitiesValue,
        icon: 'calendar-number',
        color: '#2980b9',
        description: pickTextValue(summary.activity_description, summary.activities_description),
      });
    }

    const attendanceNumber = pickNumberValue(
      summary.attendance_percentage,
      summary.kehadiran,
      summary.average_attendance,
      summary.attendance_rate,
      summary.average,
      summary.averageAttendance,
      summary.attendanceRate,
    );
    const attendanceValue = pickTextValue(
      summary.attendance_percentage,
      summary.kehadiran,
      summary.average_attendance,
      summary.attendance_rate,
      summary.average,
      summary.averageAttendance,
      summary.attendanceRate,
    );

    const derivedAttendancePercentage =
      totalAttendedNumber !== null &&
      totalActivitiesNumber !== null &&
      totalActivitiesNumber !== 0
        ? calculateAttendancePercentage(totalAttendedNumber, totalActivitiesNumber)
        : null;

    if (attendanceNumber !== null || attendanceValue !== null || derivedAttendancePercentage !== null) {
      const ratioAttendedDisplay =
        totalAttendedValue !== null && totalAttendedValue !== undefined
          ? totalAttendedValue
          : totalAttendedNumber;
      const ratioActivitiesDisplay =
        totalActivitiesValue !== null && totalActivitiesValue !== undefined
          ? totalActivitiesValue
          : totalActivitiesNumber;

      const ratioText =
        ratioAttendedDisplay !== null &&
        ratioAttendedDisplay !== undefined &&
        ratioActivitiesDisplay !== null &&
        ratioActivitiesDisplay !== undefined
          ? `${ratioAttendedDisplay}/${ratioActivitiesDisplay} aktivitas dihadiri`
          : null;
      const attendanceDescription =
        pickTextValue(summary.attendance_description, summary.kehadiran_description) || ratioText;

      const attendanceLabelValue = (() => {
        if (derivedAttendancePercentage !== null) {
          return `${formatPercentage(derivedAttendancePercentage)}%`;
        }

        if (attendanceNumber !== null && attendanceNumber !== undefined) {
          return `${attendanceNumber}%`;
        }

        return attendanceValue;
      })();

      cards.push({
        key: 'attendance',
        label: 'Kehadiran',
        value: attendanceLabelValue,
        icon: 'stats-chart',
        color: '#27ae60',
        description: attendanceDescription,
      });
    }

    const averageScoreNumber = pickNumberValue(summary.average_score, summary.nilai_rata_rata);
    const averageScoreValue =
      averageScoreNumber ?? pickTextValue(summary.average_score, summary.nilai_rata_rata);

    if (averageScoreValue !== null && averageScoreValue !== undefined) {
      cards.push({
        key: 'score',
        label: 'Nilai Rata-rata',
        value: averageScoreNumber ?? averageScoreValue,
        icon: 'school',
        color: '#9b59b6',
        description: pickTextValue(summary.score_description, summary.score_details),
      });
    }

    const totalProgramsNumber = pickNumberValue(summary.total_programs, summary.programs_count);
    const totalProgramsValue =
      totalProgramsNumber ?? pickTextValue(summary.total_programs, summary.programs_count);

    if (totalProgramsValue !== null && totalProgramsValue !== undefined) {
      cards.push({
        key: 'programs',
        label: 'Program Diikuti',
        value: totalProgramsNumber ?? totalProgramsValue,
        icon: 'layers',
        color: '#e67e22',
        description: pickTextValue(summary.program_description, summary.programs_description),
      });
    }

    return cards;
  }, [detail.summary]);

  const activities = (detail.activities || []).map((activity) => {
    const attendedCount = pickNumberValue(
      activity.attended_count,
      activity.total_attended,
      activity.attended,
    );
    const activitiesCount = pickNumberValue(
      activity.activities_count,
      activity.total_activities,
      activity.activities,
    );
    const percentageNumber = pickNumberValue(
      activity.percentage,
      activity.attendance_percentage,
      activity.overall_percentage,
      activity.kehadiran,
    );
    const percentageValue =
      percentageNumber ??
      pickTextValue(
        activity.percentage,
        activity.attendance_percentage,
        activity.overall_percentage,
        activity.kehadiran,
      );

    const ratioText =
      attendedCount !== null && activitiesCount !== null
        ? `${attendedCount}/${activitiesCount} aktivitas dihadiri`
        : null;

    const percentageText =
      percentageNumber !== null && percentageNumber !== undefined
        ? `${percentageNumber}%`
        : percentageValue;

    const baseDescription = pickTextValue(activity.description, activity.deskripsi);
    const metricsDescription = [ratioText, percentageText]
      .filter((item) => item)
      .join(' · ');

    return {
      id: activity.id || activity.activity_id,
      title:
        pickTextValue(
          activity.title,
          activity.nama_kegiatan,
          activity.name,
          activity.periode,
          activity.month_name,
        ) || 'Aktivitas',
      status: pickTextValue(activity.status, activity.state) || percentageText || null,
      date:
        pickTextValue(
          activity.date,
          activity.tanggal,
          activity.periode,
          activity.month_name,
        ) || '-',
      description:
        baseDescription || (metricsDescription ? metricsDescription : undefined),
    };
  });

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
            <View key={activity.id || index} style={styles.activityItem}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle} numberOfLines={2}>
                  {activity.title}
                </Text>
                {activity.status ? (
                  <View style={styles.activityStatus}>
                    <Text style={styles.activityStatusText}>{activity.status}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.activityMeta}>
                {activity.date}
              </Text>
              {activity.description ? (
                <Text style={styles.activityDescription}>
                  {activity.description}
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
